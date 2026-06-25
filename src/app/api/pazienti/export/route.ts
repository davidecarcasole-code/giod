import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserAllowedSedeIds } from "@/lib/user-sede";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sedeName = searchParams.get("sede") || "";
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const allowedIds = getUserAllowedSedeIds(dbUser || session.user);
  const where: any = {};
  if (sedeName) {
    const sede = await prisma.sede.findUnique({ where: { name: sedeName } });
    if (sede) where.sedeId = sede.id;
  }
  if (allowedIds) {
    where.sedeId = { in: allowedIds };
  }
  if (month && year) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 1);
    where.data = { gte: start, lt: end };
  }

  const patients = await prisma.patient.findMany({
    where,
    include: { medico: true, consulente: true, provenienza: true, modPagamento: true, sede: true },
    orderBy: { data: "desc" },
  });

  const data = patients.map((p) => ({
    "Esito/Stato": p.esito,
    Data: p.data.toISOString().split("T")[0],
    Consulente: p.consulente?.name || "",
    Paziente: p.pazienteName,
    Proveniente: p.provenienza?.name || "",
    Gender: p.gender || "",
    "Assegnazione/Medico": p.medico?.name || "",
    Importo: p.importo || "",
    Anticipo: p.anticipo || "",
    "Mod.Pagamento": p.modPagamento?.name || "",
    "Data App.": p.dataApp ? p.dataApp.toISOString().split("T")[0] : "",
    NOTE: p.note || "",
    Sede: p.sede.name,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Esportazione");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Giodental_${sedeName || "Tutti"}_${month || ""}_${year || ""}.xlsx"`,
    },
  });
}
