"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const defaultEsiti = [
  "INZIA IL TRATTAMENTO-VENDITA",
  "NESSUNA VENDITA",
  "ATTESA DOCUMENTAZIONE",
  "RICHIAMERA' / RICHIAMARE",
  "NON SI PRESENTA ALL'APPUNTAMENTO",
  "CONSULTO COMMERCIALE/CLINICO",
  "PAZIENTE SANO",
];

const defaultSedi = [
  { name: "LATINA", slug: "latina" },
  { name: "VILLA BETANIA", slug: "villa-betania" },
  { name: "CRISTO RE", slug: "cristo-re" },
  { name: "FIRENZE", slug: "firenze" },
];

const inputClass = "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/20 disabled:cursor-not-allowed disabled:opacity-50";

const selectClass = "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/20 disabled:cursor-not-allowed disabled:opacity-50";

interface PazienteFormProps {
  initialData?: any;
  userSedeId?: string;
  userRole?: string;
  defaultMonth?: number;
  defaultYear?: number;
  defaultSedeSlug?: string;
  defaultSedeName?: string;
  customEsiti?: readonly string[];
  sedi?: { name: string; slug: string }[];
}

export function PazienteForm({ initialData, userSedeId, userRole, defaultMonth, defaultYear, defaultSedeSlug, defaultSedeName, customEsiti, sedi }: PazienteFormProps) {
  const router = useRouter();

  const availableSedi = sedi ?? defaultSedi;

  const defaultDate = (() => {
    if (initialData?.data) return new Date(initialData.data).toISOString().split("T")[0];
    if (defaultMonth !== undefined && defaultYear !== undefined) {
      const d = new Date(defaultYear, defaultMonth, 1);
      return d.toISOString().split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
  })();

  const defaultSede = initialData?.sede?.name || defaultSedeName || (defaultSedeSlug ? availableSedi.find(s => s.slug === defaultSedeSlug)?.name || "" : "");

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    sede: defaultSede,
    esito: initialData?.esito || "",
    data: defaultDate,
    pazienteName: initialData?.pazienteName || "",
    provenienzaId: initialData?.provenienzaId || "",
    gender: initialData?.gender || "",
    medicoId: initialData?.medicoId || "",
    importo: initialData?.importo || "",
    anticipo: initialData?.anticipo || "",
    modPagamentoId: initialData?.modPagamentoId || "",
    dataApp: initialData?.dataApp ? new Date(initialData.dataApp).toISOString().split("T")[0] : "",
    note: initialData?.note || "",
  });

  const [medici, setMedici] = useState<any[]>([]);
  const [provenienze, setProvenienze] = useState<any[]>([]);
  const [modPagamenti, setModPagamenti] = useState<any[]>([]);

  const loadSedeLists = (sedeName: string) => {
    if (!sedeName) { setMedici([]); setProvenienze([]); setModPagamenti([]); return; }
    Promise.all([
      fetch(`/api/lists?type=medici&sede=${encodeURIComponent(sedeName)}`).then(r => r.json()),
      fetch(`/api/lists?type=provenienzeGlobal&sede=${encodeURIComponent(sedeName)}`).then(r => r.json()),
      fetch(`/api/lists?type=modPagamentoGlobal&sede=${encodeURIComponent(sedeName)}`).then(r => r.json()),
    ]).then(([m, p, mp]) => {
      setMedici(m);
      setProvenienze(p);
      setModPagamenti(mp);
    });
  };

  useEffect(() => {
    if (form.sede) loadSedeLists(form.sede);
  }, [form.sede]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const method = initialData ? "PUT" : "POST";

    try {
      const res = await fetch("/api/pazienti", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(initialData ? { id: initialData.id } : {}),
          ...form,
          importo: form.importo ? parseFloat(form.importo) : null,
          anticipo: form.anticipo ? parseFloat(form.anticipo) : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Errore");
      }

      toast.success(initialData ? "Paziente aggiornato" : "Paziente creato");
      const sedeSlug = availableSedi.find(s => s.name === form.sede)?.slug || "latina";
      const savedDate = new Date(form.data);
      const m = savedDate.getMonth();
      const y = savedDate.getFullYear();
      router.push(`/dashboard/${sedeSlug}?month=${m}&year=${y}`);
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Card className="max-w-3xl mx-auto shadow-md border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 text-white p-6">
        <CardTitle className="text-xl font-bold">{initialData ? "Modifica Paziente" : "Nuovo Paziente"}</CardTitle>
        <p className="text-blue-200 text-sm mt-0.5">Compila i campi per {initialData ? "aggiornare" : "creare"} un paziente</p>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Sede <span className="text-red-400">*</span></Label>
              <select
                value={form.sede}
                onChange={(e) => setForm({ ...form, sede: e.target.value, medicoId: "" })}
                disabled={!!initialData || (userRole === "user" && availableSedi.length === 1)}
                className={selectClass}
              >
                <option value="">Seleziona sede</option>
                {availableSedi.map((s) => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Esito/Stato <span className="text-red-400">*</span></Label>
              <select
                value={form.esito}
                onChange={(e) => setForm({ ...form, esito: e.target.value })}
                className={selectClass}
              >
                <option value="">Seleziona esito</option>
                {((customEsiti ?? defaultEsiti) as string[]).map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Data <span className="text-red-400">*</span></Label>
              <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Paziente <span className="text-red-400">*</span></Label>
              <Input value={form.pazienteName} onChange={(e) => setForm({ ...form, pazienteName: e.target.value })} required className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Proveniente</Label>
              <select
                value={form.provenienzaId}
                onChange={(e) => setForm({ ...form, provenienzaId: e.target.value })}
                className={selectClass}
              >
                <option value="">Seleziona</option>
                {provenienze.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Gender</Label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className={selectClass}
              >
                <option value="">Seleziona</option>
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Medico</Label>
              <select
                value={form.medicoId}
                onChange={(e) => setForm({ ...form, medicoId: e.target.value })}
                className={selectClass}
              >
                <option value="">Seleziona medico</option>
                {medici.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Mod. Pagamento</Label>
              <select
                value={form.modPagamentoId}
                onChange={(e) => setForm({ ...form, modPagamentoId: e.target.value })}
                className={selectClass}
              >
                <option value="">Seleziona</option>
                {modPagamenti.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Importo (€)</Label>
              <Input type="number" step="0.01" value={form.importo} onChange={(e) => setForm({ ...form, importo: e.target.value })} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Anticipo (€)</Label>
              <Input type="number" step="0.01" value={form.anticipo} onChange={(e) => setForm({ ...form, anticipo: e.target.value })} className={inputClass} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-700">Data Appuntamento</Label>
            <Input type="date" value={form.dataApp} onChange={(e) => setForm({ ...form, dataApp: e.target.value })} className={inputClass + " max-w-sm"} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-700">Note</Label>
            <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} className="rounded-xl border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20" />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button type="submit" disabled={loading} className="h-10 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-lg shadow-blue-200 px-6 font-medium">
              {loading ? "Salvataggio..." : initialData ? "Aggiorna" : "Crea Paziente"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} className="h-10 rounded-xl border-slate-200 shadow-sm px-6">
              Annulla
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
