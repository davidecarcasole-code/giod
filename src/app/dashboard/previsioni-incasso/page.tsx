import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrevisioniIncassoView } from "@/components/previsioni-incasso-view";

export const dynamic = "force-dynamic";

export default async function PrevisioniIncassoPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/login");

  return (
    <div className="p-6 md:p-8 space-y-6">
      <PrevisioniIncassoView userId={dbUser.id} />
    </div>
  );
}
