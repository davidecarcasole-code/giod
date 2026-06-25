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
  const anno = parseInt(searchParams.get("anno") || "2026");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const allowedIds = getUserAllowedSedeIds(dbUser || session.user);

  const sedi = await prisma.sede.findMany({
    where: sedeName ? { name: sedeName } : allowedIds ? { id: { in: allowedIds } } : {},
    include: {
      obiettivi: { where: { anno } },
    },
  });

  const monthNames = ["GENNAIO", "FEBBRAIO", "MARZO", "APRILE", "MAGGIO", "GIUGNO", "LUGLIO", "AGOSTO", "SETTEMBRE", "OTTOBRE", "NOVEMBRE", "DICEMBRE"];

  const computedByMonth: Record<string, Record<number, number>> = {};
  for (const sede of sedi) {
    const monthMap: Record<number, number> = {};
    for (let m = 0; m < 12; m++) {
      const start = new Date(anno, m, 1);
      const end = new Date(anno, m + 1, 1);
      const patients = await prisma.patient.findMany({
        where: {
          sedeId: sede.id,
          data: { gte: start, lt: end },
          esito: { in: ["INZIA IL TRATTAMENTO-VENDITA", "ESEGUITO"] },
        },
      });
      monthMap[m + 1] = patients.reduce((sum, p) => sum + (p.importo || 0), 0);
    }
    computedByMonth[sede.id] = monthMap;
  }

  const result = sedi.map((sede) => {
    const obiettivoMap: Record<number, { target: number; effettivo: number | null }> = {};
    sede.obiettivi.forEach((o) => { obiettivoMap[o.mese] = { target: o.target, effettivo: o.effettivo }; });

    const mesi = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const target = obiettivoMap[m]?.target || 0;
      const manualEff = obiettivoMap[m]?.effettivo;
      const computed = computedByMonth[sede.id]?.[m] || 0;
      const actual = manualEff !== null && manualEff !== undefined ? manualEff : computed;
      const diff = actual - target;
      const pct = target > 0 ? ((actual / target) - 1) * 100 : 0;
      return {
        mese: m,
        nomeMese: monthNames[i],
        target,
        actual,
        computed,
        effettivo: manualEff,
        diff,
        pct: Math.round(pct * 100) / 100,
      };
    });

    const annualTarget = mesi.reduce((s, m) => s + m.target, 0);
    const annualActual = mesi.reduce((s, m) => s + m.actual, 0);

    return {
      sedeId: sede.id,
      sedeName: sede.name,
      annualTarget,
      annualActual,
      mesi,
    };
  });

  return NextResponse.json(result);
}

export async function PUT(request: Request) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { sedeId, anno, targets } = body;

  if (!sedeId || !anno || !Array.isArray(targets)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  for (const t of targets) {
    await prisma.obiettivo.upsert({
      where: { sedeId_anno_mese: { sedeId, anno, mese: t.mese } },
      update: {
        target: t.target,
        ...(t.effettivo !== undefined ? { effettivo: t.effettivo } : {}),
      },
      create: {
        sedeId,
        anno,
        mese: t.mese,
        target: t.target,
        ...(t.effettivo !== undefined ? { effettivo: t.effettivo } : {}),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
