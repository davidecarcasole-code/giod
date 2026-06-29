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

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const allowedIds = getUserAllowedSedeIds(dbUser || session.user);

  const where: any = {};

  if (allowedIds) {
    where.sedeId = { in: allowedIds };
  }

  const sedeIds = searchParams.get("sedeIds");
  if (sedeIds) {
    const ids = sedeIds.split(",").filter(Boolean);
    if (ids.length > 0) {
      where.sedeId = { in: ids };
    }
  }

  const esiti = searchParams.get("esiti");
  if (esiti) {
    const list = esiti.split(",").filter(Boolean);
    if (list.length > 0) {
      where.esito = { in: list };
    }
  }

  const modPagamentoIds = searchParams.get("modPagamentoIds");
  if (modPagamentoIds) {
    const ids = modPagamentoIds.split(",").filter(Boolean);
    if (ids.length > 0) {
      where.modPagamentoId = { in: ids };
    }
  }

  const medicoIds = searchParams.get("medicoIds");
  if (medicoIds) {
    const ids = medicoIds.split(",").filter(Boolean);
    if (ids.length > 0) {
      where.medicoId = { in: ids };
    }
  }

  const provenienzaIds = searchParams.get("provenienzaIds");
  if (provenienzaIds) {
    const ids = provenienzaIds.split(",").filter(Boolean);
    if (ids.length > 0) {
      where.provenienzaId = { in: ids };
    }
  }

  const consulenteId = searchParams.get("consulenteId");
  if (consulenteId) {
    where.consulenteId = consulenteId;
  }

  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  if (dateFrom || dateTo) {
    where.data = {};
    if (dateFrom) where.data.gte = new Date(dateFrom);
    if (dateTo) where.data.lte = new Date(dateTo);
  }

  const importoMin = searchParams.get("importoMin");
  const importoMax = searchParams.get("importoMax");
  if (importoMin || importoMax) {
    where.importo = {};
    if (importoMin) where.importo.gte = parseFloat(importoMin);
    if (importoMax) where.importo.lte = parseFloat(importoMax);
  }

  const search = searchParams.get("search");
  if (search) {
    where.pazienteName = { contains: search, mode: "insensitive" };
  }

  const patients = await prisma.patient.findMany({
    where,
    include: { medico: true, consulente: true, provenienza: true, modPagamento: true, sede: true },
    orderBy: { data: "desc" },
  });

  const venditaEsiti = ["INIZIA IL TRATTAMENTO-VENDITA", "ESEGUITO"];
  const vendite = patients.filter((p) => venditaEsiti.includes(p.esito));
  const importoTotale = vendite.reduce((sum, p) => sum + (p.importo || 0), 0);

  const esitoCounts: Record<string, number> = {};
  for (const p of patients) {
    esitoCounts[p.esito] = (esitoCounts[p.esito] || 0) + 1;
  }

  const monthlyTrend: Record<string, { mese: string; totale: number; vendite: number; importo: number }> = {};
  for (const p of patients) {
    const d = new Date(p.data);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("it", { month: "short", year: "numeric" });
    if (!monthlyTrend[key]) monthlyTrend[key] = { mese: label, totale: 0, vendite: 0, importo: 0 };
    monthlyTrend[key].totale += 1;
    if (venditaEsiti.includes(p.esito)) {
      monthlyTrend[key].vendite += 1;
      monthlyTrend[key].importo += p.importo || 0;
    }
  }

  return NextResponse.json({
    patients,
    stats: {
      totale: patients.length,
      importoTotale,
      mediaImporto: vendite.length > 0 ? importoTotale / vendite.length : 0,
      venditeCount: vendite.length,
      nessunaVenditaCount: patients.filter((p) => p.esito === "NESSUNA VENDITA").length,
    },
    esitoCounts,
    monthlyTrend: Object.entries(monthlyTrend)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, v]) => v),
  });
}
