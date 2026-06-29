"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { ESITO_COLORS as esitoColors } from "@/lib/esiti";
import { Trash2, Users, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

const selectClass = "flex h-9 w-full max-w-[180px] rounded-xl border border-input bg-white/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const thClass = "text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider";
const thSortClass = "text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider cursor-pointer select-none hover:text-slate-700 transition-colors";

type SortField = "data" | "pazienteName" | "modPagamento" | "provenienza" | "esito" | "importo";

export function PazientiList({
  patients,
  sedi,
  userRole,
}: {
  patients: any[];
  sedi: { id: string; name: string }[];
  userRole: string;
}) {
  const [search, setSearch] = useState("");
  const [sedeFilter, setSedeFilter] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="inline w-3 h-3 ml-1 opacity-30" />;
    return sortDir === "asc"
      ? <ArrowUp className="inline w-3 h-3 ml-1" />
      : <ArrowDown className="inline w-3 h-3 ml-1" />;
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questo paziente?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/pazienti?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore");
      window.location.reload();
    } catch { window.location.reload(); }
  };

  const filtered = useMemo(() => {
    let list = patients.filter((p) => {
      const matchSearch =
        !search ||
        p.pazienteName.toLowerCase().includes(search.toLowerCase()) ||
        p.consulente?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.medico?.name?.toLowerCase().includes(search.toLowerCase());
      const matchSede = sedeFilter === "all" || p.sede?.name === sedeFilter;
      return matchSearch && matchSede;
    });
    if (sortField) {
      list = [...list].sort((a, b) => {
        let va: any, vb: any;
        switch (sortField) {
          case "data":
            va = new Date(a.data).getTime();
            vb = new Date(b.data).getTime();
            break;
          case "pazienteName":
            va = (a.pazienteName || "").toLowerCase();
            vb = (b.pazienteName || "").toLowerCase();
            break;
          case "modPagamento":
            va = (a.modPagamento?.name || "").toLowerCase();
            vb = (b.modPagamento?.name || "").toLowerCase();
            break;
          case "provenienza":
            va = (a.provenienza?.name || "").toLowerCase();
            vb = (b.provenienza?.name || "").toLowerCase();
            break;
          case "esito":
            va = (a.esito || "").toLowerCase();
            vb = (b.esito || "").toLowerCase();
            break;
          case "importo":
            va = a.importo ?? 0;
            vb = b.importo ?? 0;
            break;
        }
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [patients, search, sedeFilter, sortField, sortDir]);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-6 lg:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Tutti i Pazienti</h1>
              <p className="text-blue-200 text-sm mt-0.5">{filtered.length} pazienti trovati</p>
            </div>
          </div>
          <Link href="/dashboard/pazienti/new" className="inline-flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white border border-white/20 h-9 gap-1.5 px-4 text-sm font-medium transition-all shadow-lg">+ Nuovo Paziente</Link>
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
                <th className={thSortClass} onClick={() => handleSort("data")}>Data <SortIcon field="data" /></th>
                <th className={thSortClass} onClick={() => handleSort("pazienteName")}>Paziente <SortIcon field="pazienteName" /></th>
                <th className={thClass}>Consulente</th>
                <th className={thClass}>Medico</th>
                <th className={thSortClass} onClick={() => handleSort("provenienza")}>Provenienza <SortIcon field="provenienza" /></th>
                <th className={thClass}>Sede</th>
                <th className={thSortClass} onClick={() => handleSort("esito")}>Esito <SortIcon field="esito" /></th>
                <th className={thSortClass} onClick={() => handleSort("modPagamento")}>Mod. Pagamento <SortIcon field="modPagamento" /></th>
                <th className={`text-right p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider cursor-pointer select-none hover:text-slate-700 transition-colors`} onClick={() => handleSort("importo")}>Importo <SortIcon field="importo" /></th>
                <th className={thClass}>Note</th>
                <th className={thClass}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr key={p.id} className={`border-b last:border-0 transition-colors hover:bg-sky-50/50 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                  <td className="p-3.5 text-slate-500 text-sm">{new Date(p.data).toLocaleDateString()}</td>
                  <td className="p-3.5 font-medium text-slate-800">{p.pazienteName}</td>
                  <td className="p-3.5 text-slate-600">{p.consulente?.name || "-"}</td>
                  <td className="p-3.5 text-slate-600">{p.medico?.name || "-"}</td>
                  <td className="p-3.5 text-slate-600">{p.provenienza?.name || "—"}</td>
                  <td className="p-3.5 text-slate-600">{p.sede?.name || "-"}</td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: esitoColors[p.esito] || "#6b7280" }}>
                      {p.esito}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600">{p.modPagamento?.name || "-"}</td>
                  <td className="p-3.5 text-right font-medium text-slate-800">{p.importo ? `€ ${p.importo.toLocaleString()}` : "-"}</td>
                  <td className="p-3.5 max-w-[150px] truncate text-slate-500 text-sm" title={p.note || ""}>{p.note || "-"}</td>
                  <td className="p-3.5">
                    <div className="flex gap-1">
                      <Link href={`/dashboard/pazienti/${p.id}/edit`} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-sky-50 hover:border-sky-200 hover:text-sky-700 h-8 px-3 text-xs font-medium transition-all shadow-sm">
                        Modifica
                      </Link>
                      <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 h-8 w-8 transition-all shadow-sm">
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
            <p className="font-medium">Nessun paziente trovato</p>
            <p className="text-sm mt-1">Prova a modificare i criteri di ricerca</p>
          </div>
        )}
      </div>
    </div>
  );
}
