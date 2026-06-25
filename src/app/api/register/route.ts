import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, password, role, sedeName } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email e password richieste" }, { status: 400 });
  }

  try {
    const sede = sedeName
      ? await prisma.sede.findUnique({ where: { name: sedeName } })
      : null;

    const user = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: name || email.split("@")[0],
      },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.user.id },
        data: {
          role: role || "user",
          sedeId: sede?.id || null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Errore registrazione" }, { status: 400 });
  }
}
