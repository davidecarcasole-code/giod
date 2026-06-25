import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserAllowedSedeIds } from "@/lib/user-sede";
import { ESITO_COLORS } from "@/lib/esiti";

export default async function MediciPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const sedi = await prisma.sede.findMany({ orderBy: { name: "asc" } });
  const userSede = session.user.sedeId
    ? sedi.find((s) => s.id === session.user.sedeId)
    : null;
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const allowedIds = getUserAllowedSedeIds(dbUser || session.user);

  const sedeFilter = allowedIds
    ? { sedeId: { in: allowedIds } }
    : {};

  const medici = await prisma.medico.findMany({
    where: sedeFilter,
    include: { sede: true },
    orderBy: session.user.role === "user"
      ? { name: "asc" }
      : [{ sede: { name: "asc" } }, { name: "asc" }],
  });

  const medicoIds = medici.map((m) => m.id);

  const patients = await prisma.patient.findMany({
    where: { medicoId: { in: medicoIds } },
    select: { medicoId: true, esito: true, importo: true },
  });

  const statsMap: Record<string, { pazienti: number; vendite: number; fatturato: number }> = {};
  for (const p of patients) {
    if (!p.medicoId) continue;
    if (!statsMap[p.medicoId]) statsMap[p.medicoId] = { pazienti: 0, vendite: 0, fatturato: 0 };
    statsMap[p.medicoId].pazienti += 1;
    if (p.esito === "INZIA IL TRATTAMENTO-VENDITA" || p.esito === "ESEGUITO") {
      statsMap[p.medicoId].vendite += 1;
      if (p.importo) statsMap[p.medicoId].fatturato += p.importo;
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-600 via-teal-500 to-emerald-400 p-6 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative">
          <h1 className="text-2xl font-bold">Medici</h1>
          <p className="text-teal-100 text-sm mt-1">
            {allowedIds && allowedIds.length === 1 && userSede
              ? `Medici di ${userSede.name}`
              : "Elenco medici delle sedi autorizzate"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold text-muted-foreground">Medico</th>
                {session.user.role !== "user" && (
                  <th className="text-left p-3 font-semibold text-muted-foreground">Sede</th>
                )}
                <th className="text-center p-3 font-semibold text-muted-foreground">Pazienti</th>
                <th className="text-center p-3 font-semibold text-muted-foreground">Vendite</th>
                <th className="text-center p-3 font-semibold text-muted-foreground">% Conv.</th>
                <th className="text-right p-3 font-semibold text-muted-foreground">Fatturato</th>
              </tr>
            </thead>
            <tbody>
              {medici.map((medico: any, idx: number) => {
                const s = statsMap[medico.id] || { pazienti: 0, vendite: 0, fatturato: 0 };
                const perc = s.pazienti > 0 ? ((s.vendite / s.pazienti) * 100).toFixed(1) : "0";
                return (
                  <tr key={medico.id} className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${idx % 2 === 0 ? "bg-background" : "bg-muted/10"}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {medico.name.charAt(0)}
                        </div>
                        <span className="font-medium">{medico.name}</span>
                      </div>
                    </td>
                    {session.user.role !== "user" && (
                      <td className="p-3">
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {medico.sede?.name}
                        </span>
                      </td>
                    )}
                    <td className="p-3 text-center font-medium">{s.pazienti}</td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: s.vendite > 0 ? ESITO_COLORS["INZIA IL TRATTAMENTO-VENDITA"] : "#6b7280" }}>
                        {s.vendite}
                      </span>
                    </td>
                    <td className="p-3 text-center font-medium">{perc}%</td>
                    <td className="p-3 text-right font-medium text-emerald-600">
                      € {s.fatturato.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {medici.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Nessun medico trovato</div>
        )}
      </div>
    </div>
  );
}
