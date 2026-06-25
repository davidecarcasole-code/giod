import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserAllowedSedeIds } from "@/lib/user-sede";

export async function GET(request: Request) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sedeName = searchParams.get("sede");
  const year = parseInt(searchParams.get("year") || "2026");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const allowedIds = getUserAllowedSedeIds(dbUser || session.user);
  const sedeCondition: any = {};
  if (sedeName) {
    const sede = await prisma.sede.findUnique({ where: { name: sedeName } });
    if (sede) sedeCondition.sedeId = sede.id;
  } else if (allowedIds) {
    sedeCondition.sedeId = { in: allowedIds };
  }

  const months = Array.from({ length: 12 }, (_, i) => i);

  const monthlyStats = await Promise.all(
    months.map(async (month) => {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 1);
      const patients = await prisma.patient.findMany({
        where: { ...sedeCondition, data: { gte: start, lt: end } },
      });
      const vendite = patients.filter((p) => p.esito === "INZIA IL TRATTAMENTO-VENDITA" || p.esito === "ESEGUITO");
      const importoTot = vendite.reduce((sum, p) => sum + (p.importo || 0), 0);
      return {
        mese: start.toLocaleString("it", { month: "long" }),
        totale: patients.length,
        vendite: vendite.length,
        nessunaVendita: patients.filter((p) => p.esito === "NESSUNA VENDITA").length,
        importoTot,
      };
    })
  );

  const allPatients = await prisma.patient.findMany({
    where: {
      ...sedeCondition,
      data: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
    },
    include: { medico: true },
  });

  const mediciStats = allPatients.reduce((acc: Record<string, { pazienti: number; vendite: number; importo: number }>, p) => {
    const name = p.medico?.name || "N/D";
    if (!acc[name]) acc[name] = { pazienti: 0, vendite: 0, importo: 0 };
    acc[name].pazienti += 1;
    if (p.esito === "INZIA IL TRATTAMENTO-VENDITA" || p.esito === "ESEGUITO") {
      acc[name].vendite += 1;
      if (p.importo) acc[name].importo += p.importo;
    }
    return acc;
  }, {});

  return NextResponse.json({ monthlyStats, mediciStats });
}
