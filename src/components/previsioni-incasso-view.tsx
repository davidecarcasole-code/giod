"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, DollarSign, CheckCircle2, Circle,
  Plus, Trash2, FileSpreadsheet,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function getUserAllowedSedeIds(user: { role?: string | null; sedeId?: string | null; allowedSedeIds?: string | null }): string[] | null {
  if (user.allowedSedeIds) {
    try {
      const ids = JSON.parse(user.allowedSedeIds);
      if (Array.isArray(ids) && ids.length > 0) return ids;
    } catch {}
  }
  if (user.sedeId) return [user.sedeId];
  return null;
}

export function PrevisioniIncassoView({
  user,
  allSedi,
}: {
  user: { role: string | null; sedeId: string | null; allowedSedeIds: string | null };
  allSedi: { id: string; name: string }[];
}) {
  const [records, setRecords] = useState<any[]>([]);
  const [selectedSede, setSelectedSede] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ pazienteName: "", totale: "", modPagamento: "" });
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const allowedIds = useMemo(() => getUserAllowedSedeIds(user), [user]);
  const sedi = useMemo(() => {
    if (user.role === "admin" || user.role === "supervisor") return allSedi;
    if (allowedIds) return allSedi.filter((s) => allowedIds.includes(s.id));
    return allSedi;
  }, [allSedi, user, allowedIds]);

  useEffect(() => {
    if (sedi.length > 0 && (!selectedSede || !sedi.find((s) => s.name === selectedSede))) {
      setSelectedSede(sedi[0].name);
    }
  }, [sedi, selectedSede]);

  useEffect(() => {
    if (!selectedSede) return;
    setLoading(true);
    const params = new URLSearchParams({ sede: selectedSede, month: String(currentMonth) });
    fetch(`/api/previsioni-incasso?${params}`)
      .then((r) => r.json())
      .then(setRecords)
      .finally(() => setLoading(false));
  }, [selectedSede, currentMonth]);

  const sedeInfo = allSedi.find((s) => s.name === selectedSede);

  const totalIncasso = records.reduce((sum, r) => sum + r.totale, 0);
  const totalConfermato = records.filter((r) => r.confermato).reduce((sum, r) => sum + r.totale, 0);

  const handleToggleConfirm = async (record: any) => {
    await fetch("/api/previsioni-incasso", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: record.id, confermato: !record.confermato }),
    });
    setRecords((prev) => prev.map((r) => (r.id === record.id ? { ...r, confermato: !r.confermato } : r)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questa previsione?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/previsioni-incasso?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore");
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch { window.location.reload(); }
    setDeleting(null);
  };

  const handleCreate = async () => {
    if (!form.pazienteName || !form.totale) return;
    const res = await fetch("/api/previsioni-incasso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sedeName: selectedSede,
        pazienteName: form.pazienteName,
        totale: form.totale,
        modPagamento: form.modPagamento,
        mese: currentMonth,
      }),
    });
    if (res.ok) {
      setForm({ pazienteName: "", totale: "", modPagamento: "" });
      setShowForm(false);
      const params = new URLSearchParams({ sede: selectedSede, month: String(currentMonth) });
      const data = await fetch(`/api/previsioni-incasso?${params}`).then((r) => r.json());
      setRecords(data);
    }
  };

  const handleImport = async (file: File) => {
    setImportLoading(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sede", selectedSede);
    try {
      const res = await fetch("/api/previsioni-incasso/import", { method: "POST", body: formData });
      const result = await res.json();
      setImportResult(result);
      if (res.ok) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      setImportResult({ error: "Errore durante l'import" });
    }
    setImportLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 lg:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Previsioni Incasso</h1>
              <p className="text-teal-200 text-sm mt-0.5">{selectedSede}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <label className="inline-flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white border border-white/20 h-9 gap-1.5 px-4 text-sm font-medium transition-all shadow-lg cursor-pointer">
              <FileSpreadsheet className="w-4 h-4" />
              Importa Excel
              <input type="file" accept=".xlsx" className="hidden" onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])} disabled={importLoading} />
            </label>
            <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white border border-white/20 h-9 gap-1.5 px-4 text-sm font-medium transition-all shadow-lg">
              <Plus className="w-4 h-4" />
              Nuovo
            </button>
          </div>
        </div>
      </div>

      {importResult && (
        <div className={`rounded-2xl p-4 text-sm ${importResult.error ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {importResult.error ? `Errore: ${importResult.error}` : `Importati ${importResult.imported} record per ${importResult.sede}.`}
          {importResult.errors?.length > 0 && (
            <ul className="mt-2 list-disc pl-4 text-xs text-red-500"><li>{importResult.errors.join("</li><li>")}</li></ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-center justify-between">
        {sedi.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {sedi.map((s: any) => (
              <button key={s.id} onClick={() => setSelectedSede(s.name)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  selectedSede === s.name
                    ? "bg-emerald-500 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth((m) => (m === 1 ? 12 : m - 1))} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>
          <span className="text-lg font-semibold text-slate-700 min-w-[120px] text-center">{MONTHS[currentMonth - 1]}</span>
          <button onClick={() => setCurrentMonth((m) => (m === 12 ? 1 : m + 1))} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 border border-emerald-200">
          <p className="text-sm text-emerald-600 font-medium">Pazienti</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">{records.length}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-5 border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Totale Incasso</p>
          <p className="text-2xl font-bold text-blue-800 mt-1">€ {totalIncasso.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 p-5 border border-teal-200">
          <p className="text-sm text-teal-600 font-medium">Confermato</p>
          <p className="text-2xl font-bold text-teal-800 mt-1">€ {totalConfermato.toLocaleString()}</p>
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-700">Nuova Previsione</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Paziente</label>
              <Input value={form.pazienteName} onChange={(e) => setForm({ ...form, pazienteName: e.target.value })} placeholder="Nome paziente" className="rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Totale Incasso</label>
              <Input value={form.totale} onChange={(e) => setForm({ ...form, totale: e.target.value })} placeholder="0.00" type="number" className="rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Mod. Pagamento</label>
              <Input value={form.modPagamento} onChange={(e) => setForm({ ...form, modPagamento: e.target.value })} placeholder="UNICO / DILAZIONATO..." className="rounded-xl" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Annulla</button>
            <button onClick={handleCreate} className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm">Salva</button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gradient-to-r from-emerald-50 to-teal-50">
                <th className="text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Paziente</th>
                <th className="text-right p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Totale Incasso</th>
                <th className="text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Mod. Pagamento</th>
                <th className="text-center p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Confermato</th>
                <th className="text-left p-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Caricamento...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nessuna previsione per questo mese</td></tr>
              ) : (
                records.map((r, idx) => (
                  <tr key={r.id} className={`border-b last:border-0 transition-colors hover:bg-emerald-50/50 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                    <td className="p-3.5 font-medium text-slate-800">{r.pazienteName}</td>
                    <td className="p-3.5 text-right font-semibold text-emerald-700">€ {(r.totale || 0).toLocaleString()}</td>
                    <td className="p-3.5 text-slate-600">{r.modPagamento || "-"}</td>
                    <td className="p-3.5 text-center">
                      <button onClick={() => handleToggleConfirm(r)} className="transition-all hover:scale-110">
                        {r.confermato
                          ? <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          : <Circle className="w-6 h-6 text-slate-300 hover:text-slate-400" />
                        }
                      </button>
                    </td>
                    <td className="p-3.5">
                      <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 h-8 w-8 transition-all shadow-sm">
                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
