import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

const esitiValidi = [
  "INZIA IL TRATTAMENTO-VENDITA",
  "NESSUNA VENDITA",
  "ATTESA DOCUMENTAZIONE",
  "RICHIAMERA' / RICHIAMARE",
  "NON SI PRESENTA ALL'APPUNTAMENTO",
  "CONSULTO COMMERCIALE/CLINICO",
  "PAZIENTE SANO",
  "ESEGUITO",
  "NON ESEGUITO",
  "IN ATTESA",
];

function excelDate(serial: number): Date {
  if (!serial || isNaN(serial)) return new Date();
  return new Date((serial - 25569) * 86400 * 1000);
}

function findModPagamentoCol(headerRow: any[], fallback: number): number {
  const idx = (headerRow as any[]).findIndex((c: any) => String(c || "").trim() === "Mod.Pagamento");
  return idx >= 0 ? idx + 1 : fallback;
}

function parseRow(row: any[], offset: number, modPagamentoAbsCol: number) {
  const esito = (row[0 + offset] || "").trim();
  if (!esitiValidi.includes(esito)) return null;

  const rawData = row[1 + offset];
  const data = typeof rawData === "number" ? excelDate(rawData) : new Date(rawData);
  if (isNaN(data.getTime())) return null;

  const pazienteName = row[3 + offset] ? String(row[3 + offset]).trim() : null;
  if (!pazienteName) return null;

  return {
    esito,
    data,
    pazienteName,
    consulenteName: row[2 + offset] ? String(row[2 + offset]).trim() : null,
    provenienzaName: row[4 + offset] ? String(row[4 + offset]).trim() : null,
    gender: row[5 + offset] ? String(row[5 + offset]).trim() : null,
    medicoName: row[6 + offset] ? String(row[6 + offset]).trim() : null,
    importo: row[8 + offset] ? parseFloat(String(row[8 + offset]).replace(",", ".")) : null,
    anticipo: row[13 + offset] ? parseFloat(String(row[13 + offset]).replace(",", ".")) : null,
    modPagamentoName: row[modPagamentoAbsCol] ? String(row[modPagamentoAbsCol]).trim() : null,
    rawDataApp: row[16 + offset],
    note: row[17 + offset] ? String(row[17 + offset]).trim() : null,
  };
}

export async function POST(request: Request) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "user") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const sedeName = formData.get("sede") as string;
    const onlySheet = formData.get("sheet") as string | null;

    if (!file) return NextResponse.json({ error: "File richiesto" }, { status: 400 });

    const sede = await prisma.sede.findUnique({ where: { name: sedeName } });
    if (!sede) return NextResponse.json({ error: "Sede non trovata" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });

    let imported = 0;
    let errors: string[] = [];

    const sheetsToProcess = onlySheet
      ? workbook.SheetNames.filter((n) => n === onlySheet)
      : workbook.SheetNames;

    const monthNames = [
      "GENNAIO", "FEBBRAIO", "MARZO", "APRILE", "MAGGIO", "GIUGNO",
      "LUGLIO", "AGOSTO", "SETTEMBRE", "OTTOBRE", "NOVEMBRE", "DICEMBRE",
    ];

    for (const sheetName of sheetsToProcess) {
      const sheet = workbook.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (rows.length < 10) continue;

      // Detect offset: monthly sheets have "Esito/Stato" at col 0,
      // OPPORTUNITA DI VENDITA has "ANNO RIF." at col 0 and "Esito/Stato" at col 1
      let offset = 0;
      const headerRow = rows.find((r) => {
        if (r[0] === "Esito/Stato" || (typeof r[0] === "string" && r[0].includes("Esito"))) {
          offset = 0;
          return true;
        }
        if (r[1] === "Esito/Stato" || (typeof r[1] === "string" && r[1].includes("Esito"))) {
          offset = 1;
          return true;
        }
        return false;
      });

      if (!headerRow) continue;

      const modPagamentoAbsCol = findModPagamentoCol(headerRow, 15 + offset);
      const monthIndex = monthNames.indexOf(sheetName.toUpperCase());
      const year = 2026;

      for (const row of rows) {
        if (row === headerRow) continue;
        const parsed = parseRow(row, offset, modPagamentoAbsCol);
        if (!parsed) continue;

        try {
          let consulenteId = session.user.id;
          if (parsed.consulenteName) {
            const consulente = await prisma.user.findFirst({
              where: { name: { contains: parsed.consulenteName }, role: { notIn: ["admin", "supervisor"] } },
            });
            if (consulente) consulenteId = consulente.id;
          }

          let provenienzaId = null;
          if (parsed.provenienzaName) {
            let prov = await prisma.provenienza.findFirst({
              where: { name: parsed.provenienzaName, sedeId: sede.id },
            });
            if (!prov) {
              prov = await prisma.provenienza.findFirst({
                where: { name: parsed.provenienzaName, sedeId: null },
              });
            }
            if (!prov) {
              prov = await prisma.provenienza.create({ data: { name: parsed.provenienzaName, sedeId: sede.id } });
            }
            provenienzaId = prov.id;
          }

          let medicoId = null;
          if (parsed.medicoName) {
            let medico = await prisma.medico.findFirst({
              where: { name: parsed.medicoName, sedeId: sede.id },
            });
            if (!medico) {
              medico = await prisma.medico.create({
                data: { name: parsed.medicoName, sedeId: sede.id },
              });
            }
            medicoId = medico.id;
          }

          let modPagamentoId = null;
          if (parsed.modPagamentoName) {
            let mp = await prisma.modPagamento.findFirst({
              where: { name: parsed.modPagamentoName, sedeId: sede.id },
            });
            if (!mp) {
              mp = await prisma.modPagamento.findFirst({
                where: { name: parsed.modPagamentoName, sedeId: null },
              });
            }
            if (!mp) {
              mp = await prisma.modPagamento.create({ data: { name: parsed.modPagamentoName, sedeId: sede.id } });
            }
            modPagamentoId = mp.id;
          }

          const dataApp = parsed.rawDataApp
            ? typeof parsed.rawDataApp === "number"
              ? excelDate(parsed.rawDataApp)
              : new Date(parsed.rawDataApp)
            : null;

          const existing = await prisma.patient.findFirst({
            where: {
              pazienteName: parsed.pazienteName,
              data: parsed.data,
              sedeId: sede.id,
            },
          });
          if (existing) continue;

          await prisma.patient.create({
            data: {
              esito: parsed.esito,
              data: parsed.data,
              consulenteId,
              pazienteName: parsed.pazienteName,
              provenienzaId,
              gender: parsed.gender,
              medicoId,
              importo: parsed.importo,
              anticipo: parsed.anticipo,
              modPagamentoId,
              dataApp: dataApp && !isNaN(dataApp.getTime()) ? dataApp : null,
              note: parsed.note,
              sedeId: sede.id,
            },
          });
          imported++;
        } catch (err: any) {
          errors.push(`Errore: ${err.message}`);
        }
      }
    }

    return NextResponse.json({ imported, errors: errors.slice(0, 10) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
