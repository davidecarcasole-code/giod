import { prisma } from "../src/lib/prisma";
import * as XLSX from "xlsx";
import * as path from "path";

function excelDate(serial: number): Date {
  if (!serial || isNaN(serial)) return new Date();
  return new Date((serial - 25569) * 86400 * 1000);
}

function parseDate(v: any): Date | null {
  if (v == null) return null;
  if (typeof v === "number") return excelDate(v);
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

const OPPORTUNITA_ESITI = ["ESEGUITO", "NON ESEGUITO", "IN ATTESA"];

const files = [
  { path: "Latina - Foglio Vendite 2026.xlsx", sede: "LATINA" },
  { path: "Villa Betania - Foglio Vendite 2026.xlsx", sede: "VILLA BETANIA" },
  { path: "_NUOVO Cristo Re - Foglio Vendite 2026.xlsx", sede: "CRISTO RE" },
  { path: "Firenze - Foglio Vendite 2026.xlsx", sede: "FIRENZE" },
];

async function main() {
  for (const { path: f, sede: sedeName } of files) {
    console.log(`\n=== ${sedeName} ===`);
    const fullPath = path.join(process.cwd(), f);
    const workbook = XLSX.readFile(fullPath);

    const sheetName = workbook.SheetNames.find((n) =>
      n.toUpperCase().includes("OPPORTUNITA")
    );
    if (!sheetName) { console.log("  Nessun foglio OPPORTUNITA"); continue; }

    const rows: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

    const sede = await prisma.sede.findUnique({ where: { name: sedeName } });
    if (!sede) { console.log(`  Sede ${sedeName} non trovata`); continue; }

    // Find data rows: esito in column [1] matches OPPORTUNITA_ESITI
    const dataRows = rows.filter((r) => {
      if (!r || !r[1]) return false;
      return OPPORTUNITA_ESITI.includes(String(r[1]).trim());
    });

    console.log(`  Rows trovate: ${dataRows.length}`);

    let imported = 0;
    let errors = 0;

    for (const row of dataRows) {
      try {
        const esito = String(row[1]).trim();
        const data = parseDate(row[2]);
        if (!data) continue;

        const pazienteName = row[4] ? String(row[4]).trim() : null;
        if (!pazienteName) continue;

        const consulenteName = row[3] ? String(row[3]).trim() : null;
        let consulenteId = null;
        if (consulenteName) {
          const c = await prisma.user.findFirst({
            where: { name: { contains: consulenteName } },
          });
          if (c) consulenteId = c.id;
        }
        // Fallback: use first user for this sede, or first user globally
        if (!consulenteId) {
          const fallback = await prisma.user.findFirst({
            where: { sedeId: sede.id },
            orderBy: { name: "asc" },
          });
          if (fallback) consulenteId = fallback.id;
        }

        const provenienzaName = row[5] ? String(row[5]).trim() : null;
        let provenienzaId = null;
        if (provenienzaName) {
          let prov = await prisma.provenienza.findFirst({ where: { name: provenienzaName, sedeId: sede.id } });
          if (!prov) prov = await prisma.provenienza.findFirst({ where: { name: provenienzaName, sedeId: null } });
          if (!prov) prov = await prisma.provenienza.create({ data: { name: provenienzaName, sedeId: sede.id } });
          provenienzaId = prov.id;
        }

        const gender = row[6] ? String(row[6]).trim() : null;

        const medicoName = row[7] ? String(row[7]).trim() : null;
        let medicoId = null;
        if (medicoName) {
          let medico = await prisma.medico.findFirst({
            where: { name: medicoName, sedeId: sede.id },
          });
          if (!medico) medico = await prisma.medico.create({ data: { name: medicoName, sedeId: sede.id } });
          medicoId = medico.id;
        }

        const importo = row[9] ? parseFloat(String(row[9]).replace(",", ".")) : null;
        const anticipo = row[15] ? parseFloat(String(row[15]).replace(",", ".")) : null;
        const modPagamentoName = row[17] ? String(row[17]).trim() : null;

        let modPagamentoId = null;
        if (modPagamentoName) {
          let mp = await prisma.modPagamento.findFirst({ where: { name: modPagamentoName, sedeId: sede.id } });
          if (!mp) mp = await prisma.modPagamento.findFirst({ where: { name: modPagamentoName, sedeId: null } });
          if (!mp) mp = await prisma.modPagamento.create({ data: { name: modPagamentoName, sedeId: sede.id } });
          modPagamentoId = mp.id;
        }

        const dataApp = parseDate(row[18]);
        const note = row[19] ? String(row[19]).trim() : null;

        await prisma.patient.create({
          data: {
            esito,
            data,
            consulenteId,
            pazienteName,
            provenienzaId,
            gender,
            medicoId,
            importo,
            anticipo,
            modPagamentoId,
            dataApp: dataApp ?? null,
            note,
            sedeId: sede.id,
          },
        });
        imported++;
      } catch (err: any) {
        errors++;
        if (errors <= 5) console.log(`  Errore: ${err.message}`);
      }
    }
    console.log(`  Importati: ${imported}, Errori: ${errors}, Saltati (duplicati): ${dataRows.length - imported - errors}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
