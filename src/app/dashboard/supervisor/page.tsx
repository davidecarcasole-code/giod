import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SupervisorDashboard } from "@/components/supervisor-dashboard";
import { prisma } from "@/lib/prisma";

export default async function SupervisorPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");
  if (session.user.role === "user") redirect("/dashboard");

  const sedi = await prisma.sede.findMany({ orderBy: { name: "asc" } });
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1);

  const patients = await prisma.patient.findMany({
    where: {
      data: { gte: startOfYear, lt: startOfNextYear },
    },
    include: { sede: true, medico: true, consulente: true },
    orderBy: { data: "desc" },
  });

  // Monthly stats per sede
  const monthlyData = sedi.map((sede) => {
    const sedePatients = patients.filter((p) => p.sedeId === sede.id);
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthPatients = sedePatients.filter((p) => {
        const d = new Date(p.data);
        return d.getMonth() === i;
      });
      const vendite = monthPatients.filter((p) => (p.esito === "INZIA IL TRATTAMENTO-VENDITA" || p.esito === "ESEGUITO"));
      return {
        mese: new Date(2026, i).toLocaleString("it", { month: "short" }),
        totale: monthPatients.length,
        vendite: vendite.length,
        importo: vendite.reduce((sum, p) => sum + (p.importo || 0), 0),
      };
    });
    return { sede: sede.name, months };
  });

  // Sede summary
  const sedeSummary = sedi.map((sede) => {
    const sedePatients = patients.filter((p) => p.sedeId === sede.id);
    const vendite = sedePatients.filter((p) => (p.esito === "INZIA IL TRATTAMENTO-VENDITA" || p.esito === "ESEGUITO"));
    const importoTot = vendite.reduce((sum, p) => sum + (p.importo || 0), 0);
    return {
      name: sede.name,
      totale: sedePatients.length,
      vendite: vendite.length,
      importo: importoTot,
      perc: sedePatients.length > 0 ? ((vendite.length / sedePatients.length) * 100).toFixed(1) : "0",
    };
  });

  // Medici stats across all sedi
  const mediciAll = patients.reduce((acc: Record<string, { pazienti: number; vendite: number; importo: number; sedi: Set<string> }>, p) => {
    const name = p.medico?.name || "N/D";
    if (!acc[name]) acc[name] = { pazienti: 0, vendite: 0, importo: 0, sedi: new Set() };
    acc[name].pazienti += 1;
    if (p.sede) acc[name].sedi.add(p.sede.name);
    if ((p.esito === "INZIA IL TRATTAMENTO-VENDITA" || p.esito === "ESEGUITO")) {
      acc[name].vendite += 1;
      if (p.importo) acc[name].importo += p.importo;
    }
    return acc;
  }, {});

  return (
    <SupervisorDashboard
      sedeSummary={JSON.parse(JSON.stringify(sedeSummary))}
      monthlyData={JSON.parse(JSON.stringify(monthlyData))}
      mediciStats={Object.entries(mediciAll).map(([name, data]) => ({
        name,
        pazienti: data.pazienti,
        vendite: data.vendite,
        importo: data.importo,
        sedi: Array.from(data.sedi).join(", "),
      }))}
      totalImporto={patients.filter((p) => (p.esito === "INZIA IL TRATTAMENTO-VENDITA" || p.esito === "ESEGUITO")).reduce((sum, p) => sum + (p.importo || 0), 0)}
      totalPatients={patients.length}
      totalVendite={patients.filter((p) => (p.esito === "INZIA IL TRATTAMENTO-VENDITA" || p.esito === "ESEGUITO")).length}
    />
  );
}
