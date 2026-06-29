"use client";

import { useState, useCallback } from "react";
import { Search, BarChart3, PieChart, Filter, X, RefreshCw, Users, Euro, TrendingUp, Target, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ESITO_COLORS as esitoColors } from "@/lib/esiti";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend,
} from "recharts";

const selectBase = "flex h-9 w-full rounded-xl border border-input bg-white/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function MultiSelect({ label, options, selected, onChange }: { label: string; options: { value: string; label: string }[]; selected: string[]; onChange: (vals: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val));
    } else {
      onChange([...selected, val]);
    }
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${selectBase} w-full text-left flex items-center gap-2 ${selected.length === 0 ? "text-slate-400" : "text-slate-800"}`}
      >
        <Database className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 truncate">
          {selected.length === 0 ? label : `${selected.length} selezionati`}
        </span>
        <Filter className="w-3 h-3 shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 w-64 bg-white rounded-xl border shadow-lg p-2 max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                {opt.label}
              </label>
            ))}
            {options.length === 0 && <p className="text-xs text-slate-400 p-2">Nessuna opzione</p>}
          </div>
        </>
      )}
    </div>
  );
}

const RING_COLORS = ["#0ea5e9", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#ec4899", "#f97316", "#14b8a6", "#d946ef", "#3b82f6"];

export function AnalyticsPanel({
  sedi,
  medici,
  provenienze,
  modPagamenti,
  consulenti,
  allEsiti,
}: {
  sedi: { id: string; name: string }[];
  medici: { id: string; name: string }[];
  provenienze: { id: string; name: string }[];
  modPagamenti: { id: string; name: string }[];
  consulenti: { id: string; name: string }[];
  allEsiti: readonly string[];
}) {
  const [sedeIds, setSedeIds] = useState<string[]>([]);
  const [esiti, setEsiti] = useState<string[]>([]);
  const [modPagamentoIds, setModPagamentoIds] = useState<string[]>([]);
  const [medicoIds, setMedicoIds] = useState<string[]>([]);
  const [provenienzaIds, setProvenienzaIds] = useState<string[]>([]);
  const [consulenteId, setConsulenteId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [importoMin, setImportoMin] = useState("");
  const [importoMax, setImportoMax] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    patients: any[];
    stats: { totale: number; importoTotale: number; mediaImporto: number; venditeCount: number; nessunaVenditaCount: number };
    esitoCounts: Record<string, number>;
    monthlyTrend: { mese: string; totale: number; vendite: number; importo: number }[];
  } | null>(null);

  const [resultFilterEsito, setResultFilterEsito] = useState("");

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (sedeIds.length > 0) params.set("sedeIds", sedeIds.join(","));
    if (esiti.length > 0) params.set("esiti", esiti.join(","));
    if (modPagamentoIds.length > 0) params.set("modPagamentoIds", modPagamentoIds.join(","));
    if (medicoIds.length > 0) params.set("medicoIds", medicoIds.join(","));
    if (provenienzaIds.length > 0) params.set("provenienzaIds", provenienzaIds.join(","));
    if (consulenteId) params.set("consulenteId", consulenteId);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (importoMin) params.set("importoMin", importoMin);
    if (importoMax) params.set("importoMax", importoMax);
    if (search) params.set("search", search);
    return params.toString();
  }, [sedeIds, esiti, modPagamentoIds, medicoIds, provenienzaIds, consulenteId, dateFrom, dateTo, importoMin, importoMax, search]);

  const handleSearch = async () => {
    setLoading(true);
    setResultFilterEsito("");
    try {
      const res = await fetch(`/api/analytics?${buildQuery()}`);
      if (!res.ok) throw new Error("Errore");
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setSedeIds([]);
    setEsiti([]);
    setModPagamentoIds([]);
    setMedicoIds([]);
    setProvenienzaIds([]);
    setConsulenteId("");
    setDateFrom("");
    setDateTo("");
    setImportoMin("");
    setImportoMax("");
    setSearch("");
    setData(null);
    setResultFilterEsito("");
  };

  const patientsList = data?.patients || [];
  const esitoCounts = data?.esitoCounts || {};
  const esitoPieData = Object.entries(esitoCounts).map(([name, value]) => ({ name, value }));
  const monthlyTrend = data?.monthlyTrend || [];

  const filteredPatients = resultFilterEsito
    ? patientsList.filter((p: any) => p.esito === resultFilterEsito)
    : patientsList;

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 lg:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Analisi e Ricerca</h1>
            <p className="text-violet-200 text-sm mt-0.5">Incrocia i dati per statistiche avanzate</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 px-5 py-3 border-b flex items-center gap-2">
          <Filter className="w-4 h-4 text-violet-600" />
          <span className="font-semibold text-sm text-slate-700">Filtri di ricerca</span>
        </div>
        <div className="p-4 lg:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <MultiSelect label="Sede" options={sedi.map((s) => ({ value: s.id, label: s.name }))} selected={sedeIds} onChange={setSedeIds} />
            <MultiSelect label="Esito" options={allEsiti.map((e) => ({ value: e, label: e }))} selected={esiti} onChange={setEsiti} />
            <MultiSelect label="Mod. Pagamento" options={modPagamenti.map((m) => ({ value: m.id, label: m.name }))} selected={modPagamentoIds} onChange={setModPagamentoIds} />
            <MultiSelect label="Medico" options={medici.map((m) => ({ value: m.id, label: m.name }))} selected={medicoIds} onChange={setMedicoIds} />
            <MultiSelect label="Provenienza" options={provenienze.map((p) => ({ value: p.id, label: p.name }))} selected={provenienzaIds} onChange={setProvenienzaIds} />
            <select value={consulenteId} onChange={(e) => setConsulenteId(e.target.value)} className={selectBase}>
              <option value="">Consulente</option>
              {consulenti.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectBase} placeholder="Da data" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectBase} placeholder="A data" />
            <div className="flex gap-2">
              <input type="number" value={importoMin} onChange={(e) => setImportoMin(e.target.value)} className={selectBase} placeholder="Importo min" />
              <input type="number" value={importoMax} onChange={(e) => setImportoMax(e.target.value)} className={selectBase} placeholder="Importo max" />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Cerca nome paziente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl border-slate-200" />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white h-9 px-5 text-sm font-medium transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Cerca
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 h-9 px-4 text-sm font-medium transition-all"
            >
              <X className="w-4 h-4" />
              Resetta
            </button>
            {data && (
              <span className="inline-flex items-center text-sm text-slate-500 ml-auto">
                {filteredPatients.length} risultati
              </span>
            )}
          </div>
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl border bg-card shadow-sm p-4 lg:p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Totale Pazienti</p>
                <p className="text-2xl font-bold text-slate-800">{data.stats.totale}</p>
              </div>
            </div>
            <div className="rounded-2xl border bg-card shadow-sm p-4 lg:p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md shrink-0">
                <Euro className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Importo Totale</p>
                <p className="text-2xl font-bold text-slate-800">€ {data.stats.importoTotale.toLocaleString()}</p>
              </div>
            </div>
            <div className="rounded-2xl border bg-card shadow-sm p-4 lg:p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Media Importo</p>
                <p className="text-2xl font-bold text-slate-800">€ {data.stats.mediaImporto.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
            <div className="rounded-2xl border bg-card shadow-sm p-4 lg:p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shrink-0">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Vendite</p>
                <p className="text-2xl font-bold text-slate-800">{data.stats.venditeCount}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 px-5 py-3 border-b flex items-center gap-2">
                <PieChart className="w-4 h-4 text-violet-600" />
                <span className="font-semibold text-sm text-slate-700">Distribuzione Esiti</span>
              </div>
              <div className="p-4 flex justify-center">
                {esitoPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <RePieChart>
                      <Pie
                        data={esitoPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        onClick={(entry) => setResultFilterEsito(resultFilterEsito === entry.name ? "" : entry.name || "")}
                        style={{ cursor: "pointer" }}
                      >
                        {esitoPieData.map((_, i) => (
                          <Cell key={i} fill={RING_COLORS[i % RING_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 py-8">Nessun dato</p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 px-5 py-3 border-b flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-600" />
                <span className="font-semibold text-sm text-slate-700">Andamento Mensile</span>
              </div>
              <div className="p-4">
                {monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyTrend}>
                      <XAxis dataKey="mese" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="totale" name="Pazienti" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="vendite" name="Vendite" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 py-8">Nessun dato</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 px-5 py-3 border-b flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-600" />
              <span className="font-semibold text-sm text-slate-700">
                Risultati {resultFilterEsito && <span className="text-xs font-normal text-slate-500">— filtrati per: {resultFilterEsito} <button onClick={() => setResultFilterEsito("")} className="text-violet-600 hover:text-violet-800 ml-1">✕</button></span>}
              </span>
              <span className="ml-auto text-xs text-slate-400">{filteredPatients.length} pazienti</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gradient-to-r from-slate-50 to-white">
                    <th className="text-left p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Data</th>
                    <th className="text-left p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Paziente</th>
                    <th className="text-left p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Sede</th>
                    <th className="text-left p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Esito</th>
                    <th className="text-left p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Mod. Pagamento</th>
                    <th className="text-left p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Medico</th>
                    <th className="text-left p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Consulente</th>
                    <th className="text-right p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Importo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p: any, idx: number) => (
                    <tr key={p.id} className={`border-b last:border-0 transition-colors hover:bg-violet-50/50 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                      <td className="p-3 text-slate-500 text-xs">{new Date(p.data).toLocaleDateString()}</td>
                      <td className="p-3 font-medium text-slate-800">{p.pazienteName}</td>
                      <td className="p-3 text-slate-600 text-xs">{p.sede?.name || "-"}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: esitoColors[p.esito] || "#6b7280" }}>
                          {p.esito}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 text-xs">{p.modPagamento?.name || "-"}</td>
                      <td className="p-3 text-slate-600 text-xs">{p.medico?.name || "-"}</td>
                      <td className="p-3 text-slate-600 text-xs">{p.consulente?.name || "-"}</td>
                      <td className="p-3 text-right font-medium text-slate-800">{p.importo ? `€ ${p.importo.toLocaleString()}` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredPatients.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">Nessun risultato</p>
              </div>
            )}
          </div>
        </>
      )}

      {!data && (
        <div className="rounded-2xl border bg-card shadow-sm p-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Seleziona i filtri e clicca <strong>Cerca</strong></p>
          <p className="text-slate-400 text-sm mt-1">Incrocia dati per sede, esito, pagamento, medico e altro</p>
        </div>
      )}
    </div>
  );
}
