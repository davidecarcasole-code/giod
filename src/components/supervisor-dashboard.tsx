"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

export function SupervisorDashboard({
  sedeSummary,
  monthlyData,
  mediciStats,
  totalImporto,
  totalPatients,
  totalVendite,
}: {
  sedeSummary: any[];
  monthlyData: any[];
  mediciStats: any[];
  totalImporto: number;
  totalPatients: number;
  totalVendite: number;
}) {
  const monthNames = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];

  const combinedMonths = monthNames.map((mese, i) => {
    const point: any = { mese };
    for (const md of monthlyData) {
      point[md.sede] = md.months[i]?.importo || 0;
    }
    return point;
  });

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-purple-500 to-pink-400 p-6 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative">
          <h1 className="text-2xl font-bold">Panoramica Generale</h1>
          <p className="text-purple-100 text-sm mt-1">Anno 2026 · Tutte le sedi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Fatturato Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">€ {totalImporto.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pazienti Totali</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{totalPatients}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Vendite</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{totalVendite}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">% Accettato</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {totalPatients > 0 ? ((totalVendite / totalPatients) * 100).toFixed(1) : "0"}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {sedeSummary.map((s: any, i: number) => (
          <Card key={s.name} className="shadow-sm" style={{ borderLeftColor: ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"][i % 4], borderLeftWidth: 4 }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{s.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pazienti:</span>
                  <span className="font-medium">{s.totale}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendite:</span>
                  <span className="font-medium text-green-600">{s.vendite}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">%:</span>
                  <span className="font-medium">{s.perc}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fatturato:</span>
                  <span className="font-medium">€ {s.importo.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="fatturato">
        <TabsList>
          <TabsTrigger value="fatturato">Fatturato Mensile</TabsTrigger>
          <TabsTrigger value="medici">Medici</TabsTrigger>
        </TabsList>

        <TabsContent keepMounted value="fatturato">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Fatturato per Sede</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={combinedMonths}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mese" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  {sedeSummary.map((s: any, i: number) => (
                    <Bar key={s.name} dataKey={s.name} fill={colors[i % colors.length]} name={s.name} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent keepMounted value="medici">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Statistiche Medici (Tutte le sedi)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold text-muted-foreground">Medico</th>
                        <th className="text-right p-3 font-semibold text-muted-foreground">Pazienti</th>
                        <th className="text-right p-3 font-semibold text-muted-foreground">Vendite</th>
                        <th className="text-right p-3 font-semibold text-muted-foreground">Fatturato</th>
                        <th className="text-left p-3 font-semibold text-muted-foreground">Sedi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mediciStats.map((m: any, idx: number) => (
                        <tr key={m.name} className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${idx % 2 === 0 ? "bg-background" : "bg-muted/10"}`}>
                          <td className="p-3 font-medium">{m.name}</td>
                          <td className="p-3 text-right">{m.pazienti}</td>
                          <td className="p-3 text-right">{m.vendite}</td>
                          <td className="p-3 text-right font-medium">€ {m.importo.toLocaleString()}</td>
                          <td className="p-3 text-xs text-muted-foreground">{m.sedi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
