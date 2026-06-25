import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessSede } from "@/lib/user-sede";
import { SedeDashboard } from "@/components/sede-dashboard";

const sedeMap: Record<string, string> = {
  latina: "LATINA",
  "villa-betania": "VILLA BETANIA",
  "cristo-re": "CRISTO RE",
  firenze: "FIRENZE",
};

const monthNames = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

export default async function SedePage({
  params,
  searchParams,
}: {
  params: Promise<{ sede: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { sede: slug } = await params;
  const sedeName = sedeMap[slug];
  if (!sedeName) redirect("/dashboard");

  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const sede = await prisma.sede.findUnique({ where: { name: sedeName } });
  if (!sede) redirect("/dashboard");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!canAccessSede(dbUser || session.user, sede.id)) {
    const userSede = await prisma.sede.findUnique({ where: { id: session.user.sedeId || sede.id } });
    if (userSede) {
      const entry = Object.entries(sedeMap).find(([, n]) => n === userSede.name);
      if (entry) redirect(`/dashboard/${entry[0]}`);
    }
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const now = new Date();
  const currentMonth = parseInt(sp.month ?? String(now.getMonth()));
  const currentYear = parseInt(sp.year ?? String(now.getFullYear()));

  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const startOfNextMonth = new Date(currentYear, currentMonth + 1, 1);

  const patients = await prisma.patient.findMany({
    where: {
      sedeId: sede.id,
      data: { gte: startOfMonth, lt: startOfNextMonth },
    },
    include: { medico: true, consulente: true, provenienza: true, modPagamento: true },
    orderBy: { data: "desc" },
  });

  const totali = patients.reduce(
    (acc, p) => {
      if ((p.esito === "INZIA IL TRATTAMENTO-VENDITA" || p.esito === "ESEGUITO") && p.importo) acc.importoTot += p.importo;
      if (p.anticipo) acc.anticipo += p.anticipo;
      acc[p.esito] = (acc[p.esito] || 0) + 1;
      return acc;
    },
    { importoTot: 0, anticipo: 0 } as Record<string, number>
  );

  const mediciStats = patients.reduce((acc: Record<string, { count: number; importo: number; vendite: number }>, p) => {
    const medico = p.medico?.name || "N/D";
    if (!acc[medico]) acc[medico] = { count: 0, importo: 0, vendite: 0 };
    acc[medico].count += 1;
    if (p.esito === "INZIA IL TRATTAMENTO-VENDITA" || p.esito === "ESEGUITO") {
      acc[medico].vendite += 1;
      if (p.importo) acc[medico].importo += p.importo;
    }
    return acc;
  }, {});

  return (
    <SedeDashboard
      sedeName={sedeName}
      sedeSlug={slug}
      patients={JSON.parse(JSON.stringify(patients))}
      totali={totali}
      mediciStats={mediciStats}
      month={currentMonth}
      year={currentYear}
      monthName={monthNames[currentMonth]}
    />
  );
}
