import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as XLSX from "xlsx";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const esitiValidi = [
  "INZIA IL TRATTAMENTO-VENDITA", "NESSUNA VENDITA",
  "ATTESA DOCUMENTAZIONE", "RICHIAMERA' / RICHIAMARE",
  "NON SI PRESENTA ALL'APPUNTAMENTO", "CONSULTO COMMERCIALE/CLINICO",
  "PAZIENTE SANO", "ESEGUITO", "NON ESEGUITO", "IN ATTESA",
];

function excelDate(serial: number): Date {
  if (!serial || isNaN(serial)) return new Date();
  return new Date((serial - 25569) * 86400 * 1000);
}

async function main() {
  const files: { filename: string; sedeName: string }[] = [
    { filename: "Latina - Foglio Vendite 2026.xlsx", sedeName: "LATINA" },
    { filename: "Villa Betania - Foglio Vendite 2026.xlsx", sedeName: "VILLA BETANIA" },
    { filename: "Firenze - Foglio Vendite 2026.xlsx", sedeName: "FIRENZE" },
    { filename: "_NUOVO Cristo Re - Foglio Vendite 2026.xlsx", sedeName: "CRISTO RE" },
  ];

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const { filename, sedeName } of files) {
    console.log(`\n=== ${sedeName} (${filename}) ===`);
    const sede = await prisma.sede.findUnique({ where: { name: sedeName } });
    if (!sede) { console.log("Sede not found"); continue; }

    const wb = XLSX.readFile(filename);
    let fileUpdated = 0;

    for (const sn of wb.SheetNames) {
      const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1 });
      const hdrIx = rows.findIndex((r) => r[0] === "Esito/Stato" || r[1] === "Esito/Stato");
      if (hdrIx < 0) continue;
      const offset = rows[hdrIx][0] === "Esito/Stato" ? 0 : 1;
      const provenienzaCol = 4 + offset;

      for (let i = hdrIx + 1; i < rows.length; i++) {
        const r = rows[i];
        const esito = r[offset] !== undefined ? String(r[offset]).trim() : "";
        if (!esito || !esitiValidi.includes(esito)) continue;

        const rawData = r[1 + offset];
        const data = typeof rawData === "number" ? excelDate(rawData) : new Date(rawData);
        if (isNaN(data.getTime())) continue;

        const pazienteName = r[3 + offset] ? String(r[3 + offset]).trim() : "";
        if (!pazienteName) continue;

        const provName = r[provenienzaCol] ? String(r[provenienzaCol]).trim() : "";
        if (!provName) continue;

        try {
          const patient = await prisma.patient.findFirst({
            where: { pazienteName, data, sedeId: sede.id },
          });
          if (!patient) { skipped++; continue; }
          if (patient.provenienzaId) continue; // already set

          let prov = await prisma.provenienza.findFirst({
            where: { name: provName, sedeId: sede.id },
          });
          if (!prov) {
            prov = await prisma.provenienza.findFirst({
              where: { name: provName, sedeId: null },
            });
          }
          if (!prov) {
            prov = await prisma.provenienza.create({
              data: { name: provName, sedeId: sede.id },
            });
          }

          await prisma.patient.update({
            where: { id: patient.id },
            data: { provenienzaId: prov.id },
          });
          updated++;
          fileUpdated++;
        } catch (e: any) {
          errors++;
        }
      }
    }
    console.log(`  Updated: ${fileUpdated}`);
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
}
main();
