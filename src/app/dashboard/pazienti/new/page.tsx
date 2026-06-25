import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserAllowedSedeIds } from "@/lib/user-sede";
import { PazienteForm } from "@/components/paziente-form";

const sedeSlugMap: Record<string, string> = {
  latina: "LATINA", "villa-betania": "VILLA BETANIA", "cristo-re": "CRISTO RE", firenze: "FIRENZE",
};

export default async function NewPazientePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; sede?: string }>;
}) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const sp = await searchParams;
  const month = sp.month ? parseInt(sp.month) : undefined;
  const year = sp.year ? parseInt(sp.year) : undefined;
  let defaultSedeName = sp.sede ? sedeSlugMap[sp.sede] || "" : "";
  if (!defaultSedeName && session.user.sedeId) {
    const found = await prisma.sede.findUnique({ where: { id: session.user.sedeId } });
    if (found) defaultSedeName = found.name;
  }

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const allowedIds = getUserAllowedSedeIds(dbUser || session.user);
  const allSedi = await prisma.sede.findMany({ orderBy: { name: "asc" } });
  const filteredSedi = allowedIds
    ? allSedi.filter((s) => allowedIds.includes(s.id))
    : allSedi;
  const formSedi = filteredSedi.map((s) => ({
    name: s.name,
    slug: Object.entries(sedeSlugMap).find(([, n]) => n === s.name)?.[0] || s.name.toLowerCase().replace(/\s+/g, "-"),
  }));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nuovo Paziente</h1>
      <PazienteForm
        userSedeId={session.user.sedeId || undefined}
        userRole={session.user.role || "user"}
        defaultMonth={month}
        defaultYear={year}
        defaultSedeName={defaultSedeName}
        sedi={formSedi}
      />
    </div>
  );
}
