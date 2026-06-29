import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session || (session.user.role !== "admin" && session.user.role !== "supervisor")) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      sedeId: true,
      allowedSedeIds: true,
      sede: { select: { name: true } },
    },
  });

  return NextResponse.json(users);
}

export async function PUT(request: Request) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, name, role, sedeId, allowedSedeIds, image } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId richiesto" }, { status: 400 });
  }

  try {
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = role;
    if (sedeId !== undefined) data.sedeId = sedeId || null;
    if (allowedSedeIds !== undefined) data.allowedSedeIds = allowedSedeIds;
    if (image !== undefined) data.image = image || null;

    await prisma.user.update({ where: { id: userId }, data });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, newPassword } = body;

  if (!userId || !newPassword) {
    return NextResponse.json({ error: "userId e newPassword richiesti" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Password troppo corta (min 6 caratteri)" }, { status: 400 });
  }

  try {
    const { hashPassword } = await import("@better-auth/utils/password");
    const passwordHash = await hashPassword(newPassword);

    const account = await prisma.account.findFirst({
      where: { userId, providerId: "credential" },
    });

    if (account) {
      await prisma.account.update({
        where: { id: account.id },
        data: { password: passwordHash },
      });
    } else {
      await prisma.account.create({
        data: {
          userId,
          providerId: "credential",
          accountId: userId,
          password: passwordHash,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
