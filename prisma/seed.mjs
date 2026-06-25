import { PrismaClient } from "../src/generated/prisma/index.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create Sedi
  const sediData = [
    "LATINA",
    "VILLA BETANIA",
    "CRISTO RE",
    "FIRENZE",
  ];

  const sedi = {};
  for (const name of sediData) {
    const sede = await prisma.sede.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    sedi[name] = sede;
    console.log(`  Sede: ${name}`);
  }

  // Create Provenienze
  const provenienzeList = [
    "CUP/GIA", "CUP/FEDE", "CUP/CLA", "CUP SOLIDALE",
    "DI PASSAGGIO", "FAMIGLIA", "PASSAPAROLA", "SOCIAL",
    "INTERNET", "GOOGLE", "VICINATO", "ICOT", "DIPENDENTE",
    "ARMONIA",
  ];

  for (const name of provenienzeList) {
    await prisma.provenienza.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`  Provenienze: ${provenienzeList.length}`);

  // Create ModPagamento
  const modPagList = [
    "a PRESTAZIONE", "ACC. + DILAZIONE", "DILAZIONATO",
    "ELYGHT", "UNICO", "PAGODIL", "CARICO ASSIC-NE",
    "2 TRANCHES", "3 TRANCHES", "FINANZIATO BD",
    "FINANZIATO COMPASS",
  ];

  for (const name of modPagList) {
    await prisma.modPagamento.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`  Mod.Pagamento: ${modPagList.length}`);

  // Create Medici per LATINA
  const mediciLatina = [
    "ANNIBALDI", "DEL PRETE", "EMANUELE", "FRACANZANI",
    "FRASCA", "MALTESE", "PLINI", "SALERNO",
    "VANNETTELLI", "VESPASIANO", "D'ASCANIO", "FELLI",
  ];

  for (const name of mediciLatina) {
    await prisma.medico.upsert({
      where: { id: `medico_${name}_LATINA` },
      update: { name },
      create: { id: `medico_${name}_LATINA`, name, sedeId: sedi["LATINA"].id },
    });
  }
  console.log(`  Medici LATINA: ${mediciLatina.length}`);

  // Add some medici to other sedi
  const otherMedici = ["DEL PRETE", "EMANUELE", "FRASCA", "MALTESE", "VANNETTELLI"];
  for (const sedeName of ["VILLA BETANIA", "CRISTO RE", "FIRENZE"]) {
    for (const name of otherMedici) {
      await prisma.medico.upsert({
        where: { id: `medico_${name}_${sedeName.replace(/\s/g, "_")}` },
        update: { name },
        create: {
          id: `medico_${name}_${sedeName.replace(/\s/g, "_")}`,
          name,
          sedeId: sedi[sedeName].id,
        },
      });
    }
    console.log(`  Medici ${sedeName}: ${otherMedici.length}`);
  }

  console.log("✅ Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
