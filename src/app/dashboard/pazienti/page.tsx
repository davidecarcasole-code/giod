import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserAllowedSedeIds } from "@/lib/user-sede";
import { PazientiList } from "@/components/pazienti-list";

export default async function PazientiPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const allowedIds = getUserAllowedSedeIds(dbUser || session.user);
  const where: any = {};
  if (allowedIds) {
    where.sedeId = { in: allowedIds };
  }

  const patients = await prisma.patient.findMany({
    where,
    include: { medico: true, consulente: true, provenienza: true, modPagamento: true, sede: true },
    orderBy: { data: "desc" },
  });

  const sedi = await prisma.sede.findMany({ orderBy: { name: "asc" } });

  return (
    <PazientiList
      patients={JSON.parse(JSON.stringify(patients))}
      sedi={JSON.parse(JSON.stringify(sedi))}
      userRole={session.user.role || "user"}
    />
  );
}
