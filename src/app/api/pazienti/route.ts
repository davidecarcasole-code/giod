import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserAllowedSedeIds, canAccessSede } from "@/lib/user-sede";

export async function GET(request: Request) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sede = searchParams.get("sede");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const allowedIds = getUserAllowedSedeIds(dbUser || session.user);
  const where: any = {};
  if (sede) {
    const sedeRecord = await prisma.sede.findUnique({ where: { name: sede } });
    if (sedeRecord) where.sedeId = sedeRecord.id;
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

  return NextResponse.json(patients);
}

export async function POST(request: Request) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const sede = await prisma.sede.findUnique({ where: { name: body.sede } });
  if (!sede) return NextResponse.json({ error: "Sede non trovata" }, { status: 400 });

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!canAccessSede(dbUser || session.user, sede.id)) {
    return NextResponse.json({ error: "Non autorizzato per questa sede" }, { status: 403 });
  }

  const patient = await prisma.patient.create({
    data: {
      esito: body.esito,
      data: new Date(body.data),
      consulenteId: session.user.id,
      pazienteName: body.pazienteName,
      provenienzaId: body.provenienzaId || null,
      gender: body.gender || null,
      medicoId: body.medicoId || null,
      importo: body.importo ? parseFloat(body.importo) : null,
      anticipo: body.anticipo ? parseFloat(body.anticipo) : null,
      modPagamentoId: body.modPagamentoId || null,
      dataApp: body.dataApp ? new Date(body.dataApp) : null,
      note: body.note || null,
      sedeId: sede.id,
    },
    include: { medico: true, consulente: true, provenienza: true, modPagamento: true, sede: true },
  });

  return NextResponse.json(patient);
}

export async function PUT(request: Request) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const existing = await prisma.patient.findUnique({ where: { id: body.id }, include: { sede: true } });
  if (!existing) return NextResponse.json({ error: "Paziente non trovato" }, { status: 404 });

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!canAccessSede(dbUser || session.user, existing.sedeId)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const updated = await prisma.patient.update({
    where: { id: body.id },
    data: {
      esito: body.esito,
      data: new Date(body.data),
      pazienteName: body.pazienteName,
      provenienzaId: body.provenienzaId || null,
      gender: body.gender || null,
      medicoId: body.medicoId || null,
      importo: body.importo ? parseFloat(body.importo) : null,
      anticipo: body.anticipo ? parseFloat(body.anticipo) : null,
      modPagamentoId: body.modPagamentoId || null,
      dataApp: body.dataApp ? new Date(body.dataApp) : null,
      note: body.note || null,
    },
    include: { medico: true, consulente: true, provenienza: true, modPagamento: true, sede: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID richiesto" }, { status: 400 });

  const existing = await prisma.patient.findUnique({ where: { id }, include: { sede: true } });
  if (!existing) return NextResponse.json({ error: "Paziente non trovato" }, { status: 404 });

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!canAccessSede(dbUser || session.user, existing.sedeId)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  await prisma.patient.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
