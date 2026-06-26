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
  const sedeName = searchParams.get("sede");
  const month = searchParams.get("month");
  const year = searchParams.get("year") || "2026";

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const allowedIds = getUserAllowedSedeIds(dbUser || session.user);

  const where: any = {};
  if (sedeName) {
    const sedeRec = await prisma.sede.findUnique({ where: { name: sedeName } });
    if (sedeRec) where.sedeId = sedeRec.id;
  }
  if (allowedIds) where.sedeId = { in: allowedIds };
  if (month) where.mese = parseInt(month);
  where.anno = parseInt(year);

  const records = await prisma.previsioneIncasso.findMany({
    where,
    include: { sede: true },
    orderBy: [{ mese: "asc" }, { pazienteName: "asc" }],
  });

  return NextResponse.json(records);
}

export async function POST(request: Request) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const sede = await prisma.sede.findUnique({ where: { name: body.sedeName || body.sede } });
  if (!sede) return NextResponse.json({ error: "Sede non trovata" }, { status: 400 });

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!canAccessSede(dbUser || session.user, sede.id)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const record = await prisma.previsioneIncasso.create({
    data: {
      sedeId: sede.id,
      pazienteName: body.pazienteName,
      totale: parseFloat(body.totale),
      modPagamento: body.modPagamento || "",
      confermato: body.confermato === true,
      mese: parseInt(body.mese),
      anno: parseInt(body.anno || "2026"),
      data: body.data ? new Date(body.data) : null,
      note: body.note || null,
    },
    include: { sede: true },
  });

  return NextResponse.json(record);
}

export async function PUT(request: Request) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "ID richiesto" }, { status: 400 });

  const existing = await prisma.previsioneIncasso.findUnique({ where: { id: body.id } });
  if (!existing) return NextResponse.json({ error: "Record non trovato" }, { status: 404 });

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!canAccessSede(dbUser || session.user, existing.sedeId)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const updated = await prisma.previsioneIncasso.update({
    where: { id: body.id },
    data: {
      pazienteName: body.pazienteName ?? existing.pazienteName,
      totale: body.totale !== undefined ? parseFloat(body.totale) : existing.totale,
      modPagamento: body.modPagamento ?? existing.modPagamento,
      confermato: body.confermato !== undefined ? body.confermato === true : existing.confermato,
      mese: body.mese !== undefined ? parseInt(body.mese) : existing.mese,
      anno: body.anno !== undefined ? parseInt(body.anno) : existing.anno,
      data: body.data !== undefined ? (body.data ? new Date(body.data) : null) : existing.data,
      note: body.note !== undefined ? body.note : existing.note,
    },
    include: { sede: true },
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

  const existing = await prisma.previsioneIncasso.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Record non trovato" }, { status: 404 });

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!canAccessSede(dbUser || session.user, existing.sedeId)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  await prisma.previsioneIncasso.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
