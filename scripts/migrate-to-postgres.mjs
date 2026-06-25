import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";

const sqlitePath = process.argv[2] || "./prisma/giodental.db";

const sqlite = new Database(sqlitePath);
sqlite.pragma("journal_mode = WAL");

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

function rows(table) {
  return sqlite.prepare(`SELECT * FROM "${table}"`).all();
}

async function migrate() {
  console.log("Reading data from SQLite...");

  const sedi = rows("sede");
  const users = rows("user");
  const sessions = rows("session");
  const accounts = rows("account");
  const verifications = rows("verification");
  const medici = rows("medico");
  const provenienze = rows("provenienza");
  const modPagamenti = rows("mod_pagamento");
  const listItems = rows("list_item");
  const patients = rows("patient");

  console.log(`  sedi: ${sedi.length}`);
  console.log(`  users: ${users.length}`);
  console.log(`  sessions: ${sessions.length}`);
  console.log(`  accounts: ${accounts.length}`);
  console.log(`  verifications: ${verifications.length}`);
  console.log(`  medici: ${medici.length}`);
  console.log(`  provenienze: ${provenienze.length}`);
  console.log(`  modPagamenti: ${modPagamenti.length}`);
  console.log(`  listItems: ${listItems.length}`);
  console.log(`  patients: ${patients.length}`);

  for (const s of sedi) {
    await prisma.sede.upsert({
      where: { id: s.id },
      update: { name: s.name },
      create: { id: s.id, name: s.name, createdAt: new Date(s.createdAt) },
    });
  }
  console.log("  -> sedi done");

  for (const u of users) {
    const data = {
      name: u.name,
      email: u.email,
      emailVerified: Boolean(u.emailVerified),
      image: u.image,
      role: u.role || "user",
      sedeId: u.sedeId,
      allowedSedeIds: u.allowedSedeIds,
    };
    await prisma.user.upsert({
      where: { id: u.id },
      update: data,
      create: { id: u.id, ...data, createdAt: new Date(u.createdAt) },
    });
  }
  console.log("  -> users done");

  for (const s of sessions) {
    await prisma.session.upsert({
      where: { id: s.id },
      update: {
        expiresAt: new Date(s.expiresAt),
        token: s.token,
        userId: s.userId,
      },
      create: {
        id: s.id,
        expiresAt: new Date(s.expiresAt),
        token: s.token,
        userId: s.userId,
        createdAt: new Date(s.createdAt),
      },
    });
  }
  console.log("  -> sessions done");

  for (const a of accounts) {
    await prisma.account.upsert({
      where: { id: a.id },
      update: {
        accountId: a.accountId,
        providerId: a.providerId,
        userId: a.userId,
        password: a.password,
      },
      create: {
        id: a.id,
        accountId: a.accountId,
        providerId: a.providerId,
        userId: a.userId,
        password: a.password,
        createdAt: new Date(a.createdAt),
      },
    });
  }
  console.log("  -> accounts done");

  for (const v of verifications) {
    await prisma.verification.upsert({
      where: { id: v.id },
      update: {
        identifier: v.identifier,
        value: v.value,
        expiresAt: new Date(v.expiresAt),
      },
      create: {
        id: v.id,
        identifier: v.identifier,
        value: v.value,
        expiresAt: new Date(v.expiresAt),
        createdAt: new Date(v.createdAt),
      },
    });
  }
  console.log("  -> verifications done");

  for (const m of medici) {
    await prisma.medico.upsert({
      where: { id: m.id },
      update: { name: m.name, sedeId: m.sedeId },
      create: {
        id: m.id, name: m.name, sedeId: m.sedeId,
        createdAt: new Date(m.createdAt),
      },
    });
  }
  console.log("  -> medici done");

  for (const p of provenienze) {
    await prisma.provenienza.upsert({
      where: { id: p.id },
      update: { name: p.name, sedeId: p.sedeId },
      create: {
        id: p.id, name: p.name, sedeId: p.sedeId,
        createdAt: new Date(p.createdAt),
      },
    });
  }
  console.log("  -> provenienze done");

  for (const m of modPagamenti) {
    await prisma.modPagamento.upsert({
      where: { id: m.id },
      update: { name: m.name, sedeId: m.sedeId },
      create: {
        id: m.id, name: m.name, sedeId: m.sedeId,
        createdAt: new Date(m.createdAt),
      },
    });
  }
  console.log("  -> modPagamenti done");

  for (const l of listItems) {
    await prisma.listItem.upsert({
      where: { id: l.id },
      update: { type: l.type, value: l.value, sedeId: l.sedeId, createdBy: l.createdBy },
      create: {
        id: l.id, type: l.type, value: l.value,
        sedeId: l.sedeId, createdBy: l.createdBy,
        createdAt: new Date(l.createdAt),
      },
    });
  }
  console.log("  -> listItems done");

  const BATCH = 100;
  let count = 0;
  for (let i = 0; i < patients.length; i += BATCH) {
    const batch = patients.slice(i, i + BATCH);
    await prisma.$transaction(
      batch.map((p) =>
        prisma.patient.upsert({
          where: { id: p.id },
          update: {
            esito: p.esito,
            data: new Date(p.data),
            consulenteId: p.consulenteId,
            pazienteName: p.pazienteName,
            provenienzaId: p.provenienzaId,
            gender: p.gender,
            medicoId: p.medicoId,
            importo: p.importo,
            anticipo: p.anticipo,
            modPagamentoId: p.modPagamentoId,
            dataApp: p.dataApp ? new Date(p.dataApp) : null,
            note: p.note,
            sedeId: p.sedeId,
          },
          create: {
            id: p.id,
            esito: p.esito,
            data: new Date(p.data),
            consulenteId: p.consulenteId,
            pazienteName: p.pazienteName,
            provenienzaId: p.provenienzaId,
            gender: p.gender,
            medicoId: p.medicoId,
            importo: p.importo,
            anticipo: p.anticipo,
            modPagamentoId: p.modPagamentoId,
            dataApp: p.dataApp ? new Date(p.dataApp) : null,
            note: p.note,
            sedeId: p.sedeId,
            createdAt: new Date(p.createdAt),
          },
        })
      )
    );
    count += batch.length;
    console.log(`  -> patients: ${count}/${patients.length}`);
  }
  console.log("  -> patients done");

  sqlite.close();
  await prisma.$disconnect();
  console.log("Migration complete!");
}

migrate().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
