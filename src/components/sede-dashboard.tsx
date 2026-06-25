"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Euro, TrendingUp, TrendingDown, Banknote, Sparkles } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ESITI as esitiLista, ESITO_COLORS as esitoColors } from "@/lib/esiti";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  const colors: Record<string, { bg: string; text: string; iconBg: string }> = {
    emerald: { bg: "from-emerald-500/10 to-emerald-500/5", text: "text-emerald-600", iconBg: "bg-emerald-100 text-emerald-600" },
    green: { bg: "from-green-500/10 to-green-500/5", text: "text-green-600", iconBg: "bg-green-100 text-green-600" },
    red: { bg: "from-red-500/10 to-red-500/5", text: "text-red-600", iconBg: "bg-red-100 text-red-600" },
    violet: { bg: "from-violet-500/10 to-violet-500/5", text: "text-violet-600", iconBg: "bg-violet-100 text-violet-600" },
    sky: { bg: "from-sky-500/10 to-sky-500/5", text: "text-sky-600", iconBg: "bg-sky-100 text-sky-600" },
  };
  const c = colors[color] || colors.emerald;

  return (
    <Card className="shadow-sm border-0 bg-gradient-to-br ${c.bg} overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full -translate-y-1/2 translate-x-1/4" />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SedeDashboard({
  sedeName,
  sedeSlug,
  patients,
  totali,
  mediciStats,
  month,
  year,
  monthName,
}: {
  sedeName: string;
  sedeSlug: string;
  patients: any[];
  totali: Record<string, number>;
  mediciStats: Record<string, { count: number; importo: number; vendite: number }>;
  month: number;
  year: number;
  monthName: string;
}) {
  const [search, setSearch] = useState("");

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  const filteredPatients = search
    ? patients.filter((p) =>
        p.pazienteName.toLowerCase().includes(search.toLowerCase()) ||
        p.consulente?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.medico?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : patients;

  const pieData = esitiLista
    .map((esito) => ({ name: esito, value: totali[esito] || 0 }))
    .filter((d) => d.value > 0);

  const mediciChartData = Object.entries(mediciStats).map(([name, data]) => ({
    name,
    fatturato: data.importo,
    pazienti: data.count,
  }));

  const totalPatients = patients.length;
  const vendite = (totali["INZIA IL TRATTAMENTO-VENDITA"] || 0) + (totali["ESEGUITO"] || 0);
  const noVendite = totali["NESSUNA VENDITA"] || 0;
  const percAccettato = totalPatients > 0 ? ((vendite / totalPatients) * 100).toFixed(1) : "0";
  const percNoAccettato = totalPatients > 0 ? ((noVendite / totalPatients) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-6 lg:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/${sedeSlug}?month=${prevMonth}&year=${prevYear}`}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold capitalize">{monthName} {year}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-medium text-blue-100">{sedeName}</span>
              </div>
              <Link
                href={`/dashboard/${sedeSlug}?month=${nextMonth}&year=${nextYear}`}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/dashboard/pazienti/new?month=${month}&year=${year}&sede=${sedeSlug}`}
                className="inline-flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white border border-white/20 h-9 gap-1.5 px-4 text-sm font-medium transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Nuovo Paziente
              </Link>
              <Link
                href={`/api/pazienti/export?sede=${encodeURIComponent(sedeName)}`}
                className="inline-flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white border border-white/20 h-9 gap-1.5 px-4 text-sm font-medium transition-all"
              >
                Esporta Excel
              </Link>
            </div>
          </div>
          <p className="text-blue-200 text-sm ml-12">
            {patients.length} pazienti nel mese
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Fatturato" value={`€ ${(totali.importoTot || 0).toLocaleString()}`} icon={Euro} color="emerald" />
        <StatCard label="Accettato" value={`${percAccettato}%`} icon={TrendingUp} color="green" />
        <StatCard label="Non Accettato" value={`${percNoAccettato}%`} icon={TrendingDown} color="red" />
        <StatCard label="Anticipi" value={`€ ${(totali.anticipo || 0).toLocaleString()}`} icon={Banknote} color="violet" />
      </div>

      <Tabs defaultValue="tabella">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="tabella" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Tabella</TabsTrigger>
          <TabsTrigger value="esiti" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Esiti</TabsTrigger>
          <TabsTrigger value="medici" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Medici</TabsTrigger>
        </TabsList>

        <TabsContent value="tabella" className="space-y-4">
          <Input placeholder="Cerca paziente, consulente, medico..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm rounded-xl border-slate-200 bg-white/50 focus:border-sky-400 focus:ring-sky-400/20" />
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gradient-to-r from-slate-50 to-white">
                    <th className="text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Data</th>
                    <th className="text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Paziente</th>
                    <th className="text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Consulente</th>
                    <th className="text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Medico</th>
                    <th className="text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Esito</th>
                    <th className="text-right p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Importo</th>
                    <th className="text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Note</th>
                    <th className="text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p, idx) => (
                    <tr key={p.id} className={`border-b last:border-0 transition-colors hover:bg-sky-50/50 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                      <td className="p-3.5 text-slate-500 text-sm">{new Date(p.data).toLocaleDateString()}</td>
                      <td className="p-3.5 font-medium text-slate-800">{p.pazienteName}</td>
                      <td className="p-3.5 text-slate-600">{p.consulente?.name || "-"}</td>
                      <td className="p-3.5 text-slate-600">{p.medico?.name || "-"}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: esitoColors[p.esito] || "#6b7280" }}>
                          {p.esito}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-medium text-slate-800">{p.importo ? `€ ${p.importo.toLocaleString()}` : "-"}</td>
                      <td className="p-3.5 max-w-[160px] truncate text-slate-500 text-sm" title={p.note || ""}>{p.note || "-"}</td>
                      <td className="p-3.5">
                        <Link href={`/dashboard/pazienti/${p.id}/edit`} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-sky-50 hover:border-sky-200 hover:text-sky-700 h-8 px-3 text-xs font-medium transition-all shadow-sm">
                          Modifica
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredPatients.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-medium">Nessun paziente trovato</p>
                <p className="text-sm mt-1">Prova a modificare i criteri di ricerca</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="esiti">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-slate-800">Distribuzione Esiti</CardTitle>
                <p className="text-sm text-slate-500">Ripartizione mensile degli esiti</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      innerRadius={40}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={esitoColors[entry.name] || "#6b7280"} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-slate-800">Riepilogo Esiti</CardTitle>
                <p className="text-sm text-slate-500">Conteggio per tipologia</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-[360px] overflow-y-auto pr-2">
                  {esitiLista.map((esito) => {
                    const count = totali[esito] || 0;
                    const maxCount = Math.max(...esitiLista.map(e => totali[e] || 0), 1);
                    const barWidth = (count / maxCount) * 100;
                    return (
                      <div key={esito} className="flex items-center gap-3 py-1.5">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: esitoColors[esito] }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-sm text-slate-700 truncate">{esito}</span>
                            <span className="text-sm font-semibold text-slate-800 ml-2">{count}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: esitoColors[esito] }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="medici" className="space-y-6">
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-800">Fatturato per Medico</CardTitle>
              <p className="text-sm text-slate-500">Confronto fatturato mensile</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={mediciChartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" vertical={false} />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis className="text-xs" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="fatturato" fill="#0ea5e9" name="Fatturato" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gradient-to-r from-slate-50 to-white">
                    <th className="text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Medico</th>
                    <th className="text-right p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Pazienti</th>
                    <th className="text-right p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Vendite</th>
                    <th className="text-right p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Fatturato</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(mediciStats).map(([name, data], idx) => (
                    <tr key={name} className={`border-b last:border-0 transition-colors hover:bg-sky-50/50 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                      <td className="p-3.5 font-medium text-slate-800">{name}</td>
                      <td className="p-3.5 text-right text-slate-600">{data.count}</td>
                      <td className="p-3.5 text-right text-slate-600">{data.vendite}</td>
                      <td className="p-3.5 text-right font-medium text-slate-800">€ {data.importo.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
