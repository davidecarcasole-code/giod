const { config } = require("dotenv");
const path = require("path");
config({ path: path.join(__dirname, "..", ".env") });

const Database = require("better-sqlite3");
const { Client } = require("pg");

function validDate(v) {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  if (d.getFullYear() < 1900 || d.getFullYear() > 2100) return null;
  return d.toISOString();
}

async function migrate() {
  const sqlitePath = process.argv[2] || "./prisma/giodental.db";
  const sqlite = new Database(sqlitePath);
  sqlite.pragma("journal_mode = WAL");

  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();

  console.log("Connected to PostgreSQL");
  console.log("Reading data from SQLite...");

  function rows(table) {
    return sqlite.prepare(`SELECT * FROM "${table}"`).all();
  }

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
    await pg.query(
      `INSERT INTO "sede" (id, name, "createdAt") VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = $2`,
      [s.id, s.name, validDate(s.createdAt)]
    );
  }
  console.log("  -> sedi done");

  for (const u of users) {
    const now = validDate(new Date().toISOString());
    await pg.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", image, role, "sedeId", "allowedSedeIds", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
       ON CONFLICT (id) DO UPDATE SET name=$2, email=$3, role=$6, "sedeId"=$7, "allowedSedeIds"=$8`,
      [u.id, u.name, u.email, u.emailVerified ? 1 : 0, u.image, u.role || "user", u.sedeId, u.allowedSedeIds, validDate(u.createdAt) || now]
    );
  }
  console.log("  -> users done");

  for (const s of sessions) {
    await pg.query(
      `INSERT INTO "session" (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId")
       VALUES ($1,$2,$3,$4,$4,$5,$6,$7)
       ON CONFLICT (id) DO UPDATE SET token=$3`,
      [s.id, validDate(s.expiresAt), s.token, validDate(s.createdAt), s.ipAddress, s.userAgent, s.userId]
    );
  }
  console.log("  -> sessions done");

  for (const a of accounts) {
    const password = a.password || null;
    await pg.query(
      `INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$6)
       ON CONFLICT (id) DO UPDATE SET password=$5`,
      [a.id, a.accountId, a.providerId, a.userId, password, validDate(a.createdAt)]
    );
  }
  console.log("  -> accounts done");

  for (const v of verifications) {
    await pg.query(
      `INSERT INTO "verification" (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$5)
       ON CONFLICT (id) DO UPDATE SET value=$3`,
      [v.id, v.identifier, v.value, validDate(v.expiresAt), validDate(v.createdAt)]
    );
  }
  console.log("  -> verifications done");

  for (const m of medici) {
    await pg.query(
      `INSERT INTO "medico" (id, name, "sedeId", "createdAt") VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO UPDATE SET name=$2`,
      [m.id, m.name, m.sedeId, validDate(m.createdAt)]
    );
  }
  console.log("  -> medici done");

  for (const p of provenienze) {
    await pg.query(
      `INSERT INTO "provenienza" (id, name, "sedeId", "createdAt") VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO UPDATE SET name=$2`,
      [p.id, p.name, p.sedeId, validDate(p.createdAt)]
    );
  }
  console.log("  -> provenienze done");

  for (const m of modPagamenti) {
    await pg.query(
      `INSERT INTO "mod_pagamento" (id, name, "sedeId", "createdAt") VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO UPDATE SET name=$2`,
      [m.id, m.name, m.sedeId, validDate(m.createdAt)]
    );
  }
  console.log("  -> modPagamenti done");

  for (const l of listItems) {
    await pg.query(
      `INSERT INTO "list_item" (id, type, value, "sedeId", "createdBy", "createdAt") VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO UPDATE SET value=$3`,
      [l.id, l.type, l.value, l.sedeId, l.createdBy, validDate(l.createdAt)]
    );
  }
  console.log("  -> listItems done");

  let count = 0;
  for (const p of patients) {
    const dataApp = validDate(p.dataApp);
    const data = validDate(p.data) || new Date().toISOString();
    const createdAt = validDate(p.createdAt) || new Date().toISOString();
    await pg.query(
      `INSERT INTO "patient" (id, esito, data, "consulenteId", "pazienteName", "provenienzaId", gender, "medicoId", importo, anticipo, "modPagamentoId", "dataApp", note, "sedeId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15)
       ON CONFLICT (id) DO UPDATE SET
         esito=$2, data=$3, "consulenteId"=$4, "pazienteName"=$5, "provenienzaId"=$6, gender=$7,
         "medicoId"=$8, importo=$9, anticipo=$10, "modPagamentoId"=$11, "dataApp"=$12, note=$13`,
      [
        p.id, p.esito, data, p.consulenteId, p.pazienteName, p.provenienzaId, p.gender,
        p.medicoId, p.importo, p.anticipo, p.modPagamentoId,
        dataApp, p.note, p.sedeId, createdAt
      ]
    );
    count++;
    if (count % 100 === 0) console.log(`  -> patients: ${count}/${patients.length}`);
  }
  console.log(`  -> patients done (${count})`);

  sqlite.close();
  await pg.end();
  console.log("Migration complete!");
}

migrate().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
