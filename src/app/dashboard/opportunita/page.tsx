import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserAllowedSedeIds } from "@/lib/user-sede";
import { OpportunitaList } from "@/components/opportunita-list";

const OPPORTUNITA_ESITI = ["ESEGUITO", "NON ESEGUITO", "IN ATTESA"];

export default async function OpportunitaPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const allowedIds = getUserAllowedSedeIds(dbUser || session.user);
  const where: any = {
    esito: { in: OPPORTUNITA_ESITI },
  };
  if (allowedIds) {
    where.sedeId = { in: allowedIds };
  }

  const records = await prisma.patient.findMany({
    where,
    include: { medico: true, consulente: true, provenienza: true, modPagamento: true, sede: true },
    orderBy: { data: "desc" },
    take: 200,
  });

  const sedi = await prisma.sede.findMany({ orderBy: { name: "asc" } });

  return (
    <OpportunitaList
      records={JSON.parse(JSON.stringify(records))}
      sedi={JSON.parse(JSON.stringify(sedi))}
      userRole={session.user.role || "user"}
    />
  );
}
