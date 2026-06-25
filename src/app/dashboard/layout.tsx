import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserAllowedSedeIds } from "@/lib/user-sede";
import { Sidebar } from "@/components/sidebar";

const greetings = [
  "Cosa facciamo di bello?",
  "Pronti a vendere?",
  "Nuova giornata, nuovi traguardi!",
  "Forza, si lavora!",
  "Sorrisi e vendite oggi?",
  "Inizia con il piede giusto!",
  "Obiettivo: superarsi ogni giorno.",
  "Ogni cliente è un'opportunità.",
  "Oggi si fa sul serio!",
  "Carichi e motivati?",
  "Un nuovo giorno di successi.",
  "Vendite da record oggi?",
  "Determinazione e risultati!",
  "Pronti a stupire?",
  "Energia positiva per iniziare!",
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const sedi = await prisma.sede.findMany({ orderBy: { name: "asc" } });
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const allowedIds = getUserAllowedSedeIds(dbUser || session.user);
  const userSede = session.user.sedeId
    ? sedi.find((s) => s.id === session.user.sedeId)
    : null;
  const allowedSedi = allowedIds
    ? sedi.filter((s) => allowedIds.includes(s.id))
    : sedi;

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        user={session.user}
        sedi={JSON.parse(JSON.stringify(allowedSedi))}
        userSedeName={userSede?.name || null}
        allowedSedeIds={allowedIds}
        greeting={greeting}
      />
      <main className="flex-1 overflow-auto bg-gradient-to-br from-sky-50/50 via-white to-cyan-50/30">
        <div className="h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-teal-400" />
        <div className="px-6 lg:px-8 pt-5 pb-2">
          <p className="text-sm text-slate-500">{greeting}</p>
        </div>
        <div className="p-6 lg:p-8 pt-2">{children}</div>
      </main>
    </div>
  );
}
