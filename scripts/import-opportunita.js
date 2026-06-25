const path = require("path");
const { PrismaClient } = require(path.join(process.cwd(), "src/generated/prisma/client"));
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const XLSX = require("xlsx");

const dbPath = path.join(process.cwd(), "prisma", "giodental.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

const esitiValidi = [
  "INZIA IL TRATTAMENTO-VENDITA",
  "NESSUNA VENDITA",
  "ATTESA DOCUMENTAZIONE",
  "RICHIAMERA' / RICHIAMARE",
  "NON SI PRESENTA ALL'APPUNTAMENTO",
  "CONSULTO COMMERCIALE/CLINICO",
  "PAZIENTE SANO",
];

function excelDate(serial) {
  if (!serial || isNaN(serial)) return new Date();
  return new Date((serial - 25569) * 86400 * 1000);
}

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
    if (!sheetName) {
      console.log("  Nessun foglio OPPORTUNITA DI VENDITA trovato");
      continue;
    }

    console.log(`  Foglio: ${sheetName}`);

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const headerRow = rows.find(
      (r) =>
        r[1] === "Esito/Stato" ||
        (typeof r[1] === "string" && r[1].includes("Esito"))
    );
    if (!headerRow) {
      console.log("  Intestazione non trovata");
      continue;
    }

    const sede = await prisma.sede.findUnique({ where: { name: sedeName } });
    if (!sede) {
      console.log(`  Sede ${sedeName} non trovata`);
      continue;
    }

    let imported = 0;
    let errors = 0;

    for (const row of rows) {
      if (row === headerRow) continue;
      const esito = (row[1] || "").trim();
      if (!esitiValidi.includes(esito)) continue;

      const rawData = row[2];
      const data = typeof rawData === "number" ? excelDate(rawData) : new Date(rawData);
      if (isNaN(data.getTime())) continue;

      const pazienteName = row[4] ? String(row[4]).trim() : null;
      if (!pazienteName) continue;

      try {
        const consulenteName = row[3] ? String(row[3]).trim() : null;
        let consulenteId = null;
        if (consulenteName) {
          const c = await prisma.user.findFirst({ where: { name: { contains: consulenteName } } });
          if (c) consulenteId = c.id;
        }

        const provenienzaName = row[5] ? String(row[5]).trim() : null;
        let provenienzaId = null;
        if (provenienzaName) {
          let prov = await prisma.provenienza.findUnique({ where: { name: provenienzaName } });
          if (!prov) prov = await prisma.provenienza.create({ data: { name: provenienzaName } });
          provenienzaId = prov.id;
        }

        const gender = row[6] ? String(row[6]).trim() : null;

        const medicoName = row[7] ? String(row[7]).trim() : null;
        let medicoId = null;
        if (medicoName) {
          let medico = await prisma.medico.findFirst({ where: { name: medicoName, sedeId: sede.id } });
          if (!medico) medico = await prisma.medico.create({ data: { name: medicoName, sedeId: sede.id } });
          medicoId = medico.id;
        }

        const importo = row[9] ? parseFloat(String(row[9]).replace(",", ".")) : null;
        const anticipo = row[15] ? parseFloat(String(row[15]).replace(",", ".")) : null;

        const modPagamentoName = row[16] ? String(row[16]).trim() : null;
        let modPagamentoId = null;
        if (modPagamentoName) {
          let mp = await prisma.modPagamento.findUnique({ where: { name: modPagamentoName } });
          if (!mp) mp = await prisma.modPagamento.create({ data: { name: modPagamentoName } });
          modPagamentoId = mp.id;
        }

        const rawDataApp = row[18];
        const dataApp = rawDataApp
          ? typeof rawDataApp === "number" ? excelDate(rawDataApp) : new Date(rawDataApp)
          : null;

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
            dataApp: dataApp && !isNaN(dataApp.getTime()) ? dataApp : null,
            note,
            sedeId: sede.id,
          },
        });
        imported++;
      } catch (err) {
        errors++;
        if (errors <= 5) console.log(`  Errore riga: ${err.message}`);
      }
    }
    console.log(`  Importati: ${imported}, Errori: ${errors}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
