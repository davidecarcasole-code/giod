import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";

async function main() {
  console.log("🚀 Setup GioDental...\n");

  // Check if admin exists
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
      console.log("✅ Admin creato: admin@giodental.it / admin123");
    }
  } else {
    console.log("ℹ️  Admin già esistente");
  }

  // Check if supervisor exists
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
      console.log("✅ Supervisor creato: supervisor@giodental.it / super123");
    }
  } else {
    console.log("ℹ️  Supervisor già esistente");
  }

  // Create some users for LATINA
  const latinaSede = await prisma.sede.findUnique({ where: { name: "LATINA" } });
  if (latinaSede) {
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
            data: { role: "user", sedeId: latinaSede.id },
          });
          console.log(`✅ Utente creato: ${u.email} / 123456 (${u.name})`);
        }
      }
    }
  }

  console.log("\n🎉 Setup completato!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
