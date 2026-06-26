import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

const MONTH_NAMES = [
  "GENNAIO", "FEBBRAIO", "MARZO", "APRILE", "MAGGIO", "GIUGNO",
  "LUGLIO", "AGOSTO", "SETTEMBRE", "OTTOBRE", "NOVEMBRE", "DICEMBRE",
];

function excelDate(serial: number): Date | null {
  if (!serial || isNaN(serial)) return null;
  return new Date((serial - 25569) * 86400 * 1000);
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
    if (!file) return NextResponse.json({ error: "File richiesto" }, { status: 400 });

    const sedeName = file.name.replace(/^~?\$?/, "").replace(/ - .+/, "").trim();
    const sedeMap: Record<string, string> = {
      LATINA: "LATINA",
      "VILLA BETANIA": "VILLA BETANIA",
      "CRISTO RE": "CRISTO RE",
      FIRENZE: "FIRENZE",
    };

    const mappedName = Object.entries(sedeMap).find(([k]) => sedeName.toUpperCase().includes(k))?.[1];
    if (!mappedName) {
      return NextResponse.json({ error: `Sede non riconosciuta dal filename: ${sedeName}` }, { status: 400 });
    }

    const sede = await prisma.sede.findUnique({ where: { name: mappedName } });
    if (!sede) return NextResponse.json({ error: "Sede non trovata" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });

    const sheetName = workbook.SheetNames.find((n) => n.toUpperCase() === "PREVISIONI INCASSO");
    if (!sheetName) {
      return NextResponse.json({ error: "Foglio PREVISIONI INCASSO non trovato" }, { status: 400 });
    }

    const sheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let imported = 0;
    let errors: string[] = [];
    let currentMonth = 0;

    for (const row of rows) {
      if (!row || row.length === 0) continue;

      const col0 = row[0] ? String(row[0]).trim() : "";
      const col2 = row[2] ? String(row[2]).trim() : "";

      // Check for month header
      const monthIdx = MONTH_NAMES.indexOf(col0.toUpperCase());
      if (monthIdx !== -1) {
        currentMonth = monthIdx + 1;
        continue;
      }

      // Skip header row, empty rows, total rows
      if (
        col0 === "DATA VISITA" ||
        col2 === "PAZIENTE" ||
        !col2 ||
        col2 === " " ||
        (row[3] && String(row[3]).includes("Totale"))
      ) continue;

      // Check if it's a total row
      if (row[5] === 0 && row[3] === 0 && (!row[2] || row[2] === null)) continue;
      if (row[5] === false && (!row[2] || row[2] === null)) continue;
      if (row[3] === 0 && (row[5] === false || row[5] === 0) && !row[2]) continue;
      if (row[3] === "Totale Mese") continue;

      // Parse data row
      const pazienteName = col2;
      const rawTotale = row[3];
      const totale = typeof rawTotale === "number" ? rawTotale : parseFloat(String(rawTotale || "0").replace(",", "."));
      const modPagamento = row[4] ? String(row[4]).trim() : "";
      const confermato = row[5] === true || row[5] === "TRUE" || row[5] === "Vero" || row[5] === "true";
      const data = typeof row[0] === "number" ? excelDate(row[0]) : row[0] ? new Date(row[0]) : null;

      if (!pazienteName || isNaN(totale) || totale <= 0) continue;

      try {
        const existing = await prisma.previsioneIncasso.findFirst({
          where: {
            pazienteName,
            mese: currentMonth,
            anno: 2026,
            sedeId: sede.id,
            totale,
          },
        });
        if (existing) continue;

        await prisma.previsioneIncasso.create({
          data: {
            sedeId: sede.id,
            pazienteName,
            totale,
            modPagamento,
            confermato,
            mese: currentMonth,
            anno: 2026,
            data: data && !isNaN(data.getTime()) ? data : null,
          },
        });
        imported++;
      } catch (err: any) {
        errors.push(`Errore su "${pazienteName}": ${err.message}`);
      }
    }

    return NextResponse.json({ imported, errors: errors.slice(0, 10), sede: mappedName });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
