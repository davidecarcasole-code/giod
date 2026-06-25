import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const results: string[] = [];

    // Check/create admin
    const adminExists = await prisma.user.findUnique({ where: { email: "admin@giodental.it" } });
    if (!adminExists) {
      const admin = await auth.api.signUpEmail({
        body: {
          email: "admin@giodental.it",
          password: "admin123",
          name: "Amministratore",
        },
      });
      if (admin) {
        await prisma.user.update({
          where: { id: admin.user.id },
          data: { role: "admin" },
        });
        results.push("Admin creato: admin@giodental.it / admin123");
      }
    } else {
      results.push("Admin già esistente");
    }

    // Check/create supervisor
    const supExists = await prisma.user.findUnique({ where: { email: "supervisor@giodental.it" } });
    if (!supExists) {
      const sup = await auth.api.signUpEmail({
        body: {
          email: "supervisor@giodental.it",
          password: "super123",
          name: "Supervisor",
        },
      });
      if (sup) {
        await prisma.user.update({
          where: { id: sup.user.id },
          data: { role: "supervisor" },
        });
        results.push("Supervisor creato: supervisor@giodental.it / super123");
      }
    } else {
      results.push("Supervisor già esistente");
    }

    // Create user accounts for LATINA
    const latina = await prisma.sede.findUnique({ where: { name: "LATINA" } });
    if (latina) {
      const users = [
        { email: "federica@giodental.it", name: "Federica" },
        { email: "giacomo@giodental.it", name: "Giacomo" },
        { email: "clara@giodental.it", name: "Clara" },
      ];
      for (const u of users) {
        const exists = await prisma.user.findUnique({ where: { email: u.email } });
        if (!exists) {
          const user = await auth.api.signUpEmail({
            body: { email: u.email, password: "123456", name: u.name },
          });
          if (user) {
            await prisma.user.update({
              where: { id: user.user.id },
              data: { role: "user", sedeId: latina.id },
            });
            results.push(`Utente creato: ${u.email} / 123456`);
          }
        } else {
          results.push(`Utente già esistente: ${u.email}`);
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
