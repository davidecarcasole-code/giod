import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ObiettiviView from "@/components/obiettivi-view";

export const dynamic = "force-dynamic";

export default async function ObiettiviPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/login");

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Obiettivi 2026</h1>
          <p className="text-sm text-slate-500 mt-1">Target mensili e consuntivo per sede</p>
        </div>
      </div>
      <ObiettiviView userId={dbUser.id} />
    </div>
  );
}
