import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "..", "prisma", "giodental.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  // Sedi
  const sediData = ["LATINA", "VILLA BETANIA", "CRISTO RE", "FIRENZE"];
  const sedi = {};
  for (const name of sediData) {
    const s = await prisma.sede.upsert({ where: { name }, update: {}, create: { name } });
    sedi[name] = s;
    console.log(`  ✅ Sede: ${name}`);
  }

  // Provenienze
  const provenienzeList = [
    "CUP/GIA", "CUP/FEDE", "CUP/CLA", "CUP SOLIDALE",
    "DI PASSAGGIO", "FAMIGLIA", "PASSAPAROLA", "SOCIAL",
    "INTERNET", "GOOGLE", "VICINATO", "ICOT", "DIPENDENTE", "ARMONIA",
  ];
  for (const name of provenienzeList) {
    await prisma.provenienza.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`  ✅ Provenienze: ${provenienzeList.length}`);

  // ModPagamento
  const modPagList = [
    "a PRESTAZIONE", "ACC. + DILAZIONE", "DILAZIONATO",
    "ELYGHT", "UNICO", "PAGODIL", "CARICO ASSIC-NE",
    "2 TRANCHES", "3 TRANCHES", "FINANZIATO BD", "FINANZIATO COMPASS",
  ];
  for (const name of modPagList) {
    await prisma.modPagamento.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`  ✅ Modalità Pagamento: ${modPagList.length}`);

  // Medici LATINA
  const mediciLatina = [
    "ANNIBALDI", "DEL PRETE", "EMANUELE", "FRACANZANI",
    "FRASCA", "MALTESE", "PLINI", "SALERNO",
    "VANNETTELLI", "VESPASIANO", "D'ASCANIO", "FELLI",
  ];
  for (const name of mediciLatina) {
    const exists = await prisma.medico.findFirst({ where: { name, sedeId: sedi["LATINA"].id } });
    if (!exists) await prisma.medico.create({ data: { name, sedeId: sedi["LATINA"].id } });
  }
  console.log(`  ✅ Medici LATINA: ${mediciLatina.length}`);

  // Medici altre sedi
  const otherMedici = ["DEL PRETE", "EMANUELE", "FRASCA", "MALTESE", "VANNETTELLI"];
  for (const sedeName of ["VILLA BETANIA", "CRISTO RE", "FIRENZE"]) {
    for (const name of otherMedici) {
      const exists = await prisma.medico.findFirst({ where: { name, sedeId: sedi[sedeName].id } });
      if (!exists) await prisma.medico.create({ data: { name, sedeId: sedi[sedeName].id } });
    }
    console.log(`  ✅ Medici ${sedeName}: ${otherMedici.length}`);
  }

  console.log("\n🎉 Seed completato!");
  console.log("\n📌 Ora esegui:");
  console.log("   npm run dev");
  console.log("   Poi registra gli utenti dal browser all'avvio.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
