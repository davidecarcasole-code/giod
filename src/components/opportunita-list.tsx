"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { ESITO_COLORS as esitoColors } from "@/lib/esiti";
import { Trash2, Target, Search } from "lucide-react";

const selectClass = "flex h-9 w-full max-w-[180px] rounded-xl border border-input bg-white/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function OpportunitaList({
  records,
  sedi,
  userRole,
}: {
  records: any[];
  sedi: { id: string; name: string }[];
  userRole: string;
}) {
  const [search, setSearch] = useState("");
  const [sedeFilter, setSedeFilter] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questo paziente?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/pazienti?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore");
      window.location.reload();
    } catch { window.location.reload(); }
  };

  const filtered = records.filter((r) => {
    const matchSearch =
      !search ||
      r.pazienteName.toLowerCase().includes(search.toLowerCase()) ||
      r.consulente?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.medico?.name?.toLowerCase().includes(search.toLowerCase());
    const matchSede = sedeFilter === "all" || r.sede?.name === sedeFilter;
    return matchSearch && matchSede;
  });

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-400 p-6 lg:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Opportunità di Vendita</h1>
              <p className="text-amber-100 text-sm mt-0.5">{filtered.length} opportunità trovate</p>
            </div>
          </div>
          <Link href="/dashboard/opportunita/new" className="inline-flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white border border-white/20 h-9 gap-1.5 px-4 text-sm font-medium transition-all shadow-lg">+ Nuovo</Link>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Cerca paziente, consulente, medico..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl border-slate-200 bg-white/50 focus:border-sky-400 focus:ring-sky-400/20" />
        </div>
        {userRole !== "user" && (
          <select value={sedeFilter} onChange={(e) => setSedeFilter(e.target.value)} className={selectClass}>
            <option value="all">Tutte le sedi</option>
            {sedi.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gradient-to-r from-slate-50 to-white">
                <th className="text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Data</th>
                <th className="text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Paziente</th>
                <th className="text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Consulente</th>
                <th className="text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Medico</th>
                <th className="text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Sede</th>
                <th className="text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Esito</th>
                <th className="text-right p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Importo</th>
                <th className="text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <tr key={r.id} className={`border-b last:border-0 transition-colors hover:bg-amber-50/50 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                  <td className="p-3.5 text-slate-500 text-sm">{new Date(r.data).toLocaleDateString()}</td>
                  <td className="p-3.5 font-medium text-slate-800">{r.pazienteName}</td>
                  <td className="p-3.5 text-slate-600">{r.consulente?.name || "-"}</td>
                  <td className="p-3.5 text-slate-600">{r.medico?.name || "-"}</td>
                  <td className="p-3.5 text-slate-600">{r.sede?.name || "-"}</td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: esitoColors[r.esito] || "#6b7280" }}>
                      {r.esito}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-medium text-slate-800">{r.importo ? `€ ${r.importo.toLocaleString()}` : "-"}</td>
                  <td className="p-3.5">
                    <div className="flex gap-1">
                      <Link href={`/dashboard/pazienti/${r.id}/edit`} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 h-8 px-3 text-xs font-medium transition-all shadow-sm">
                        Modifica
                      </Link>
                      <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 h-8 w-8 transition-all shadow-sm">
                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-medium">Nessuna opportunità trovata</p>
            <p className="text-sm mt-1">Prova a modificare i criteri di ricerca</p>
          </div>
        )}
      </div>
    </div>
  );
}
