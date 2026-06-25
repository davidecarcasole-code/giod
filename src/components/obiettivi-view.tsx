"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Pencil, Save, X, TrendingUp, AlertTriangle } from "lucide-react";

type MeseData = {
  mese: number;
  nomeMese: string;
  target: number;
  actual: number;
  computed: number;
  effettivo: number | null;
  diff: number;
  pct: number;
};

type SedeData = {
  sedeId: string;
  sedeName: string;
  annualTarget: number;
  annualActual: number;
  mesi: MeseData[];
};

export default function ObiettiviView({ userId }: { userId: string }) {
  const [data, setData] = useState<SedeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/obiettivi?anno=2026");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const startEditing = (sede: SedeData) => {
    const values: Record<string, number> = {};
    sede.mesi.forEach((m) => {
      values[`t_${sede.sedeId}_${m.mese}`] = m.target;
      values[`e_${sede.sedeId}_${m.mese}`] = m.effettivo ?? m.computed;
    });
    setEditValues(values);
    setEditing(sede.sedeId);
  };

  const cancelEditing = () => {
    setEditing(null);
    setEditValues({});
  };

  const saveTargets = async (sede: SedeData) => {
    setSaving(true);
    const targets = sede.mesi.map((m) => ({
      mese: m.mese,
      target: editValues[`t_${sede.sedeId}_${m.mese}`] || 0,
      effettivo: editValues[`e_${sede.sedeId}_${m.mese}`] || 0,
    }));
    const res = await fetch("/api/obiettivi", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sedeId: sede.sedeId, anno: 2026, targets }),
    });
    if (res.ok) {
      toast.success("Dati salvati");
      setEditing(null);
      fetchData();
    } else {
      toast.error("Errore nel salvataggio");
    }
    setSaving(false);
  };

  const euro = (v: number) =>
    v.toLocaleString("it", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Nessun dato disponibile</p>
        </div>
      )}

      {data.map((sede) => {
        const progress = sede.annualTarget > 0 ? (sede.annualActual / sede.annualTarget) * 100 : 0;
        const isEditing = editing === sede.sedeId;

        return (
          <div key={sede.sedeId} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500/90 via-orange-500/80 to-rose-500/80 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{sede.sedeName}</h2>
                  <p className="text-white/80 text-sm mt-1">Obiettivi 2026</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{euro(sede.annualTarget)}</p>
                  <p className="text-white/70 text-xs">Target annuale</p>
                </div>
              </div>
              <div className="mt-4 bg-white/15 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-white/80 font-medium">Progresso annuale</span>
                  <span className="text-sm font-bold">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-white/70">
                  <span>Consuntivo: {euro(sede.annualActual)}</span>
                  <span>Differenza: {euro(sede.annualActual - sede.annualTarget)}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Mese</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Target</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Consuntivo</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Differenza</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">%</th>
                  </tr>
                </thead>
                <tbody>
                  {sede.mesi.map((m, i) => {
                    const pctColor = m.pct >= 0 ? "text-emerald-600" : "text-red-500";
                    const diffColor = m.diff >= 0 ? "text-emerald-600" : "text-red-500";
                    return (
                      <tr key={m.mese} className={`border-b border-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"} hover:bg-sky-50/30 transition-colors`}>
                        <td className="py-3 px-4 font-medium text-slate-700">{m.nomeMese}</td>
                        <td className="py-3 px-4 text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues[`t_${sede.sedeId}_${m.mese}`] || 0}
                              onChange={(e) => setEditValues({ ...editValues, [`t_${sede.sedeId}_${m.mese}`]: parseFloat(e.target.value) || 0 })}
                              className="w-28 h-8 text-right text-sm ml-auto"
                            />
                          ) : (
                            <span className="font-medium text-slate-800">{euro(m.target)}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues[`e_${sede.sedeId}_${m.mese}`] || 0}
                              onChange={(e) => setEditValues({ ...editValues, [`e_${sede.sedeId}_${m.mese}`]: parseFloat(e.target.value) || 0 })}
                              className="w-28 h-8 text-right text-sm ml-auto"
                            />
                          ) : (
                            <span className={`font-medium ${m.actual > 0 ? "text-slate-800" : "text-slate-400"}`}>
                              {euro(m.actual)}{m.effettivo !== null ? "*" : ""}
                            </span>
                          )}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${diffColor}`}>{m.diff >= 0 ? "+" : ""}{euro(m.diff)}</td>
                        <td className={`py-3 px-4 text-right font-medium ${pctColor}`}>
                          {m.target > 0 ? `${m.pct >= 0 ? "+" : ""}${m.pct.toFixed(1)}%` : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100/70 font-bold text-slate-700">
                    <td className="py-3 px-4">TOTALE</td>
                    <td className="py-3 px-4 text-right">{euro(sede.annualTarget)}</td>
                    <td className="py-3 px-4 text-right">{euro(sede.annualActual)}</td>
                    <td className={`py-3 px-4 text-right ${sede.annualActual - sede.annualTarget >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {sede.annualActual - sede.annualTarget >= 0 ? "+" : ""}{euro(sede.annualActual - sede.annualTarget)}
                    </td>
                    <td className={`py-3 px-4 text-right ${progress >= 100 ? "text-emerald-600" : progress >= 50 ? "text-amber-500" : "text-red-500"}`}>
                      {progress.toFixed(1)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
              {!isEditing && sede.mesi.some((m) => m.effettivo !== null) && (
                <div className="px-4 pb-2 text-[11px] text-slate-400 italic text-right">
                  * importo inserito manualmente
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={cancelEditing} className="rounded-xl">
                    <X className="w-4 h-4 mr-1" /> Annulla
                  </Button>
                  <Button size="sm" onClick={() => saveTargets(sede)} disabled={saving} className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
                    <Save className="w-4 h-4 mr-1" /> {saving ? "Salvataggio..." : "Salva"}
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => startEditing(sede)} className="rounded-xl">
                  <Pencil className="w-4 h-4 mr-1" /> Modifica
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {data.length > 0 && data.every((s) => s.annualTarget === 0) && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-xl text-amber-700 text-sm border border-amber-200">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>Inserisci target e consuntivo mensili per ogni sede usando il pulsante "Modifica".</span>
        </div>
      )}
    </div>
  );
}
