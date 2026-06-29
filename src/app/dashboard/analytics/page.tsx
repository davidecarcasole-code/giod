import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserAllowedSedeIds } from "@/lib/user-sede";
import { AnalyticsPanel } from "@/components/analytics-panel";
import { ESITI, OPPORTUNITA_ESITI } from "@/lib/esiti";

export default async function AnalyticsPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const allowedIds = getUserAllowedSedeIds(dbUser || session.user);

  const sedeWhere: any = {};
  if (allowedIds) {
    sedeWhere.id = { in: allowedIds };
  }
  const sedi = await prisma.sede.findMany({ where: sedeWhere, orderBy: { name: "asc" } });

  const medici = await prisma.medico.findMany({
    where: allowedIds ? { sedeId: { in: allowedIds } } : {},
    orderBy: { name: "asc" },
  });

  const provenienze = await prisma.provenienza.findMany({
    where: allowedIds ? { sedeId: { in: allowedIds } } : {},
    orderBy: { name: "asc" },
  });

  const modPagamenti = await prisma.modPagamento.findMany({
    where: allowedIds ? { sedeId: { in: allowedIds } } : {},
    orderBy: { name: "asc" },
  });

  const consulenti = await prisma.user.findMany({
    where: {
      role: { notIn: ["admin", "supervisor"] },
      ...(allowedIds ? { sedeId: { in: allowedIds } } : {}),
    },
    orderBy: { name: "asc" },
  });

  const allEsiti = [...ESITI, ...OPPORTUNITA_ESITI];

  return (
    <AnalyticsPanel
      sedi={JSON.parse(JSON.stringify(sedi))}
      medici={JSON.parse(JSON.stringify(medici))}
      provenienze={JSON.parse(JSON.stringify(provenienze))}
      modPagamenti={JSON.parse(JSON.stringify(modPagamenti))}
      consulenti={JSON.parse(JSON.stringify(consulenti))}
      allEsiti={allEsiti}
    />
  );
}
