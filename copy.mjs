import pkg from "./src/generated/prisma/client/index.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { join } from "path";
const { PrismaClient } = pkg;
const dbPath = join(process.cwd(), "prisma", "giodental.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

const sedi = await prisma.sede.findMany();

// Copy global provenienze to each sede
const globalProv = await prisma.provenienza.findMany({ where: { sedeId: null } });
console.log(`Global provenienze: ${globalProv.length}`);
for (const s of sedi) {
  for (const p of globalProv) {
    const existing = await prisma.provenienza.findFirst({ where: { name: p.name, sedeId: s.id } });
    if (!existing) {
      await prisma.provenienza.create({ data: { name: p.name, sedeId: s.id } });
    }
  }
}
console.log("Provenienze copiate per ogni sede");

// Copy global modPagamento to each sede
const globalMP = await prisma.modPagamento.findMany({ where: { sedeId: null } });
console.log(`Global modPagamento: ${globalMP.length}`);
for (const s of sedi) {
  for (const m of globalMP) {
    const existing = await prisma.modPagamento.findFirst({ where: { name: m.name, sedeId: s.id } });
    if (!existing) {
      await prisma.modPagamento.create({ data: { name: m.name, sedeId: s.id } });
    }
  }
}
console.log("ModPagamento copiati per ogni sede");

await prisma.$disconnect();
