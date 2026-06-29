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

async function findUser(name: string): Promise<string | null> {
  if (!name) return null;
  const upper = name.toUpperCase();
  // Try exact match by name
  let user = await prisma.user.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  if (user) return user.id;
  // Try email prefix match (e.g. "FEDERICA" -> federica@)
  user = await prisma.user.findFirst({ where: { email: { startsWith: name.toLowerCase(), mode: "insensitive" } } });
  if (user) return user.id;
  // Try name starts with (e.g. "FEDE" -> "Fede💕")
  user = await prisma.user.findFirst({ where: { name: { startsWith: upper, mode: "insensitive" } } });
  if (user) return user.id;
  return null;
}

async function processSede(filename: string, sedeName: string) {
  console.log(`\n=== ${sedeName} (${filename}) ===`);
  const sede = await prisma.sede.findUnique({ where: { name: sedeName } });
  if (!sede) { console.log("Sede not found"); return; }

  const wb = XLSX.readFile(filename);
  let updated = 0;

  for (const sn of wb.SheetNames) {
    const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1 });
    const hdrIx = rows.findIndex((r) => r[0] === "Esito/Stato" || r[1] === "Esito/Stato");
    if (hdrIx < 0) continue;
    const offset = rows[hdrIx][0] === "Esito/Stato" ? 0 : 1;

    for (let i = hdrIx + 1; i < rows.length; i++) {
      const r = rows[i];
      const esito = r[offset] !== undefined ? String(r[offset]).trim() : "";
      if (!esito || !esitiValidi.includes(esito)) continue;

      const rawData = r[1 + offset];
      const data = typeof rawData === "number" ? excelDate(rawData) : new Date(rawData);
      if (isNaN(data.getTime())) continue;

      const pazienteName = r[3 + offset] ? String(r[3 + offset]).trim() : "";
      if (!pazienteName) continue;

      const consName = r[2 + offset] ? String(r[2 + offset]).trim() : "";
      if (!consName) continue;

      try {
        const patient = await prisma.patient.findFirst({
          where: { pazienteName, data, sedeId: sede.id },
        });
        if (!patient) continue;

        const consId = await findUser(consName);
        if (!consId) continue;
        if (patient.consulenteId === consId) continue;

        await prisma.patient.update({
          where: { id: patient.id },
          data: { consulenteId: consId },
        });
        updated++;
      } catch (e: any) {
        console.error(`  Error for ${pazienteName}: ${e.message}`);
      }
    }
  }
  console.log(`  Updated: ${updated}`);
}

async function main() {
  const files: { filename: string; sedeName: string }[] = [
    { filename: "Latina - Foglio Vendite 2026.xlsx", sedeName: "LATINA" },
    { filename: "Villa Betania - Foglio Vendite 2026.xlsx", sedeName: "VILLA BETANIA" },
    { filename: "Firenze - Foglio Vendite 2026.xlsx", sedeName: "FIRENZE" },
    { filename: "_NUOVO Cristo Re - Foglio Vendite 2026.xlsx", sedeName: "CRISTO RE" },
  ];

  for (const f of files) {
    await processSede(f.filename, f.sedeName);
  }

  console.log("\nDone.");
}
main();
