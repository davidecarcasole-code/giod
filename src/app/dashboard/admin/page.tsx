import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserAllowedSedeIds } from "@/lib/user-sede";
import { prisma } from "@/lib/prisma";
import { AdminPanel } from "@/components/admin-panel";

export default async function AdminPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");
  if (session.user.role === "user" && !session.user.sedeId) redirect("/dashboard");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const allowedIds = getUserAllowedSedeIds(dbUser || session.user);
  const sedi = await prisma.sede.findMany({ orderBy: { name: "asc" } });
  const allowedSedi = allowedIds
    ? sedi.filter((s) => allowedIds.includes(s.id))
    : sedi;

  return (
    <AdminPanel
      userRole={session.user.role || undefined}
      userSedeId={session.user.sedeId || undefined}
      sedi={JSON.parse(JSON.stringify(allowedSedi))}
      allowedSedeIds={allowedIds}
    />
  );
}
