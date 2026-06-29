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
  const type = searchParams.get("type");

  if (type === "sedi") {
    const sedi = await prisma.sede.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(sedi);
  }
  if (type === "medici") {
    const sedeName = searchParams.get("sede");
    const where: any = {};
    if (sedeName) {
      const sede = await prisma.sede.findUnique({ where: { name: sedeName } });
      if (sede) where.sedeId = sede.id;
    }
    const medici = await prisma.medico.findMany({ where, orderBy: { name: "asc" } });
    return NextResponse.json(medici);
  }
  if (type === "provenienze") {
    const sedeName = searchParams.get("sede");
    const where: any = {};
    if (sedeName) {
      const sede = await prisma.sede.findUnique({ where: { name: sedeName } });
      if (sede) where.sedeId = sede.id;
    }
    const items = await prisma.provenienza.findMany({ where, orderBy: { name: "asc" } });
    return NextResponse.json(items);
  }
  if (type === "modPagamento") {
    const sedeName = searchParams.get("sede");
    const where: any = {};
    if (sedeName) {
      const sede = await prisma.sede.findUnique({ where: { name: sedeName } });
      if (sede) where.sedeId = sede.id;
    }
    const items = await prisma.modPagamento.findMany({ where, orderBy: { name: "asc" } });
    return NextResponse.json(items);
  }
  if (type === "provenienzeGlobal") {
    const sedeName = searchParams.get("sede");
    const where: any = {};
    if (sedeName) {
      const sede = await prisma.sede.findUnique({ where: { name: sedeName } });
      if (sede) where.OR = [{ sedeId: null }, { sedeId: sede.id }];
    } else {
      where.sedeId = null;
    }
    const items = await prisma.provenienza.findMany({ where, orderBy: { name: "asc" } });
    return NextResponse.json(items);
  }
  if (type === "modPagamentoGlobal") {
    const sedeName = searchParams.get("sede");
    const where: any = {};
    if (sedeName) {
      const sede = await prisma.sede.findUnique({ where: { name: sedeName } });
      if (sede) where.OR = [{ sedeId: null }, { sedeId: sede.id }];
    } else {
      where.sedeId = null;
    }
    const items = await prisma.modPagamento.findMany({ where, orderBy: { name: "asc" } });
    return NextResponse.json(items);
  }
  if (type === "consulenti") {
    const sedeName = searchParams.get("sede");
    const where: any = {
      role: { notIn: ["admin", "supervisor"] },
    };
    if (sedeName) {
      const sede = await prisma.sede.findUnique({ where: { name: sedeName } });
      if (sede) where.sedeId = sede.id;
    }
    const users = await prisma.user.findMany({ where, orderBy: { name: "asc" } });
    return NextResponse.json(users);
  }

  return NextResponse.json({ error: "Type richiesto" }, { status: 400 });
}

function hasSedeAccess(session: any, sedeName: string): boolean {
  if (!sedeName) return session.user.role === "admin" || session.user.role === "supervisor";
  if (session.user.role === "admin" || session.user.role === "supervisor") return true;
  if (session.user.role === "user") {
    const allowed = getUserAllowedSedeIds(session.user);
    return allowed !== null && allowed.length > 0;
  }
  return false;
}

export async function POST(request: Request) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const enhancedUser = dbUser || session.user;

  const body = await request.json();
  const { type, name, sedeName } = body;

  try {
    if (type === "sede" || type === "consulente") {
      if (session.user.role !== "admin") {
        return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
      }
      if (type === "sede") {
        const item = await prisma.sede.create({ data: { name } });
        return NextResponse.json(item);
      }
      const sede = await prisma.sede.findUnique({ where: { name: sedeName } });
      if (!sede) return NextResponse.json({ error: "Sede non trovata" }, { status: 400 });
      const item = await prisma.user.create({
        data: { email: body.email, name, role: "user", sedeId: sede.id },
      });
      return NextResponse.json(item);
    }

    if (type === "medico" || type === "provenienza" || type === "modPagamento") {
      if (session.user.role === "user") {
        const sede = await prisma.sede.findUnique({ where: { name: sedeName } });
        if (!sede || !canAccessSede(enhancedUser, sede.id)) {
          return NextResponse.json({ error: "Non autorizzato per questa sede" }, { status: 403 });
        }
      } else if (session.user.role !== "admin" && session.user.role !== "supervisor") {
        return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
      }

      if (type === "medico") {
        const sede = await prisma.sede.findUnique({ where: { name: sedeName } });
        if (!sede) return NextResponse.json({ error: "Sede non trovata" }, { status: 400 });
        const item = await prisma.medico.create({ data: { name, sedeId: sede.id } });
        return NextResponse.json(item);
      }

      const data: any = { name };
      if (sedeName) {
        const sede = await prisma.sede.findUnique({ where: { name: sedeName } });
        if (sede) data.sedeId = sede.id;
      }
      if (type === "provenienza") {
        const item = await prisma.provenienza.create({ data });
        return NextResponse.json(item);
      }
      if (type === "modPagamento") {
        const item = await prisma.modPagamento.create({ data });
        return NextResponse.json(item);
      }
    }

    return NextResponse.json({ error: "Type non valido" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const enhancedUser = dbUser || session.user;

  const body = await request.json();
  const { type, id, name } = body;

  if (!type || !id || !name) {
    return NextResponse.json({ error: "Parametri richiesti" }, { status: 400 });
  }

  try {
    if (type === "sede" || type === "consulente") {
      if (session.user.role !== "admin") {
        return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
      }
    } else if (type === "medico" || type === "provenienza" || type === "modPagamento") {
      if (session.user.role === "user") {
        let record: any = null;
        if (type === "medico") record = await prisma.medico.findUnique({ where: { id } });
        else if (type === "provenienza") record = await prisma.provenienza.findUnique({ where: { id } });
        else if (type === "modPagamento") record = await prisma.modPagamento.findUnique({ where: { id } });
        if (!record || !canAccessSede(enhancedUser, record.sedeId)) {
          return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
        }
      } else if (session.user.role !== "admin" && session.user.role !== "supervisor") {
        return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Type non valido" }, { status: 400 });
    }

    if (type === "sede") {
      await prisma.sede.update({ where: { id }, data: { name } });
    } else if (type === "medico") {
      await prisma.medico.update({ where: { id }, data: { name } });
    } else if (type === "provenienza") {
      await prisma.provenienza.update({ where: { id }, data: { name } });
    } else if (type === "modPagamento") {
      await prisma.modPagamento.update({ where: { id }, data: { name } });
    } else if (type === "consulente") {
      await prisma.user.update({ where: { id }, data: { name } });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

async function checkDeleteAccess(session: any, enhancedUser: any, type: string, id: string): Promise<boolean> {
  if (session.user.role === "admin") return true;
  if (session.user.role === "supervisor" && type !== "consulente" && type !== "sede") return true;
  if (session.user.role === "user" && (type === "medico" || type === "provenienza" || type === "modPagamento")) {
    let record: any = null;
    if (type === "medico") record = await prisma.medico.findUnique({ where: { id } });
    else if (type === "provenienza") record = await prisma.provenienza.findUnique({ where: { id } });
    else if (type === "modPagamento") record = await prisma.modPagamento.findUnique({ where: { id } });
    return record !== null && canAccessSede(enhancedUser, record.sedeId);
  }
  return false;
}

export async function DELETE(request: Request) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const enhancedUser = dbUser || session.user;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) return NextResponse.json({ error: "Parametri richiesti" }, { status: 400 });

  const allowed = await checkDeleteAccess(session, enhancedUser, type, id);
  if (!allowed) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  try {
    if (type === "sede") {
      await prisma.sede.delete({ where: { id } });
    } else if (type === "medico") {
      await prisma.medico.delete({ where: { id } });
    } else if (type === "provenienza") {
      await prisma.provenienza.delete({ where: { id } });
    } else if (type === "modPagamento") {
      await prisma.modPagamento.delete({ where: { id } });
    } else if (type === "consulente") {
      await prisma.user.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: "Type non valido" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
