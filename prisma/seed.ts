import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Seeding database...");

  const sediData = ["LATINA", "VILLA BETANIA", "CRISTO RE", "FIRENZE"];
  const sedi: Record<string, any> = {};

  for (const name of sediData) {
    const existing = await prisma.sede.findUnique({ where: { name } });
    if (existing) {
      sedi[name] = existing;
    } else {
      sedi[name] = await prisma.sede.create({ data: { name } });
    }
    console.log(`  Sede: ${name}`);
  }

  const provenienzeList = [
    "CUP/GIA", "CUP/FEDE", "CUP/CLA", "CUP SOLIDALE",
    "DI PASSAGGIO", "FAMIGLIA", "PASSAPAROLA", "SOCIAL",
    "INTERNET", "GOOGLE", "VICINATO", "ICOT", "DIPENDENTE",
    "ARMONIA",
  ];

  for (const name of provenienzeList) {
    const existing = await prisma.provenienza.findFirst({ where: { name, sedeId: null } });
    if (!existing) {
      await prisma.provenienza.create({ data: { name, sedeId: null } });
    }
  }

  const modPagList = [
    "a PRESTAZIONE", "ACC. + DILAZIONE", "DILAZIONATO",
    "ELYGHT", "UNICO", "PAGODIL", "CARICO ASSIC-NE",
    "2 TRANCHES", "3 TRANCHES", "FINANZIATO BD",
    "FINANZIATO COMPASS",
  ];

  for (const name of modPagList) {
    const existing = await prisma.modPagamento.findFirst({ where: { name, sedeId: null } });
    if (!existing) {
      await prisma.modPagamento.create({ data: { name, sedeId: null } });
    }
  }

  const mediciLatina = [
    "ANNIBALDI", "DEL PRETE", "EMANUELE", "FRACANZANI",
    "FRASCA", "MALTESE", "PLINI", "SALERNO",
    "VANNETTELLI", "VESPASIANO", "D'ASCANIO", "FELLI",
  ];

  for (const name of mediciLatina) {
    const existing = await prisma.medico.findFirst({
      where: { name, sedeId: sedi["LATINA"].id },
    });
    if (!existing) {
      await prisma.medico.create({ data: { name, sedeId: sedi["LATINA"].id } });
    }
  }

  const otherMedici = ["DEL PRETE", "EMANUELE", "FRASCA", "MALTESE", "VANNETTELLI"];
  for (const sedeName of ["VILLA BETANIA", "CRISTO RE", "FIRENZE"]) {
    for (const name of otherMedici) {
      const existing = await prisma.medico.findFirst({
        where: { name, sedeId: sedi[sedeName].id },
      });
      if (!existing) {
        await prisma.medico.create({ data: { name, sedeId: sedi[sedeName].id } });
      }
    }
  }

  console.log("✅ Seed completato!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
