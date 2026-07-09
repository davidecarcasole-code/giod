"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building2, Activity, Calendar, User, MapPin, Users, Stethoscope, CreditCard, Euro, Clock, FileText, ArrowLeft, Save, Sparkles } from "lucide-react";

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

const inputClass = "flex h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm shadow-sm transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-cyan-400 focus-visible:ring-[3px] focus-visible:ring-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-50 hover:border-slate-300";

const selectClass = "flex h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm shadow-sm transition-all duration-300 focus-visible:outline-none focus-visible:border-cyan-400 focus-visible:ring-[3px] focus-visible:ring-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-50 hover:border-slate-300";

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

const SectionBox = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-[0_0_24px_-4px_rgba(6,182,212,0.15)]">
    <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-sky-50 to-blue-50 border-b border-slate-100 transition-all duration-500 group-hover:from-cyan-50 group-hover:to-sky-50">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm shadow-cyan-200/50 transition-all duration-500 group-hover:shadow-[0_0_16px_-2px_rgba(6,182,212,0.5)] group-hover:scale-110">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700 transition-colors duration-500 group-hover:text-cyan-700">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const FieldRow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4${className ? " " + className : ""}`}>{children}</div>
);

const FieldGroup = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {label} {required && <span className="text-red-400">*</span>}
    </Label>
    {children}
  </div>
);

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
    <>
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.08; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 0.15; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px -2px rgba(6,182,212,0.3); }
          50% { box-shadow: 0 0 20px -2px rgba(6,182,212,0.6), 0 0 40px -4px rgba(6,182,212,0.2); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 6s ease infinite;
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 7s ease-in-out infinite 2s;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .btn-shimmer {
          overflow: hidden;
        }
        .btn-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: translateX(-100%);
          animation: shimmer 2.5s ease-in-out infinite;
        }
      `}</style>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="relative overflow-hidden rounded-2xl animate-gradient-shift bg-gradient-to-br from-cyan-600 via-blue-600 to-violet-700 p-6 lg:p-8 text-white shadow-xl shadow-cyan-200/20">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 animate-float" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 animate-float-delayed" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-cyan-300/10 rounded-full blur-xl animate-float" style={{ animationDelay: "1s" }} />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm ring-2 ring-white/20 animate-pulse-glow">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{initialData ? "Modifica Paziente" : "Nuovo Paziente"}</h1>
              <p className="text-cyan-200 text-sm mt-0.5">Compila i campi per {initialData ? "aggiornare" : "creare"} un paziente</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <SectionBox icon={User} title="Dati Anagrafici">
            <FieldRow>
              <FieldGroup label="Nome Paziente" required>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors duration-300 peer-focus-within:text-cyan-500" />
                  <Input value={form.pazienteName} onChange={(e) => setForm({ ...form, pazienteName: e.target.value })} required className={inputClass + " pl-10"} placeholder="Mario Rossi" />
                </div>
              </FieldGroup>
              <FieldGroup label="Genere">
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className={selectClass}
                >
                  <option value="">Seleziona</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
              </FieldGroup>
            </FieldRow>
            <FieldRow className="mt-4">
              <FieldGroup label="Data">
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required className={inputClass + " pl-10"} />
                </div>
              </FieldGroup>
              <FieldGroup label="Provenienza">
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={form.provenienzaId}
                    onChange={(e) => setForm({ ...form, provenienzaId: e.target.value })}
                    className={selectClass + " pl-10"}
                  >
                    <option value="">Seleziona</option>
                    {provenienze.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </FieldGroup>
            </FieldRow>
          </SectionBox>

          <SectionBox icon={Stethoscope} title="Medico e Pagamento">
            <FieldRow>
              <FieldGroup label="Medico">
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={form.medicoId}
                    onChange={(e) => setForm({ ...form, medicoId: e.target.value })}
                    className={selectClass + " pl-10"}
                  >
                    <option value="">Seleziona medico</option>
                    {medici.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </FieldGroup>
              <FieldGroup label="Mod. Pagamento">
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={form.modPagamentoId}
                    onChange={(e) => setForm({ ...form, modPagamentoId: e.target.value })}
                    className={selectClass + " pl-10"}
                  >
                    <option value="">Seleziona</option>
                    {modPagamenti.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </FieldGroup>
            </FieldRow>
            <FieldRow className="mt-4">
              <FieldGroup label="Importo (€)">
                <div className="relative">
                  <Euro className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input type="number" step="0.01" value={form.importo} onChange={(e) => setForm({ ...form, importo: e.target.value })} className={inputClass + " pl-10"} placeholder="0.00" />
                </div>
              </FieldGroup>
              <FieldGroup label="Anticipo (€)">
                <div className="relative">
                  <Euro className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input type="number" step="0.01" value={form.anticipo} onChange={(e) => setForm({ ...form, anticipo: e.target.value })} className={inputClass + " pl-10"} placeholder="0.00" />
                </div>
              </FieldGroup>
            </FieldRow>
          </SectionBox>

          <SectionBox icon={Clock} title="Appuntamento e Note">
            <FieldGroup label="Data Appuntamento">
              <div className="relative max-w-sm">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input type="date" value={form.dataApp} onChange={(e) => setForm({ ...form, dataApp: e.target.value })} className={inputClass + " pl-10"} />
              </div>
            </FieldGroup>
            <div className="mt-4">
              <FieldGroup label="Note">
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} className="rounded-xl border-slate-200 bg-white/80 focus:border-cyan-400 focus:ring-[3px] focus:ring-cyan-400/30 pl-10 hover:border-slate-300 transition-all duration-300" placeholder="Eventuali note..." />
                </div>
              </FieldGroup>
            </div>
          </SectionBox>

          <SectionBox icon={Building2} title="Sede e Stato">
            <FieldRow>
              <FieldGroup label="Sede" required>
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
              </FieldGroup>
              <FieldGroup label="Esito / Stato" required>
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
              </FieldGroup>
            </FieldRow>
          </SectionBox>

          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()} className="h-11 rounded-xl border-slate-200 shadow-sm px-5 gap-2 hover:bg-slate-50 transition-all duration-300">
              <ArrowLeft className="w-4 h-4" /> Indietro
            </Button>
            <Button type="submit" disabled={loading} className="relative btn-shimmer h-11 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-200/50 px-6 gap-2 font-medium transition-all duration-300 hover:shadow-[0_0_24px_-2px_rgba(6,182,212,0.5)] disabled:opacity-70">
              <Save className="w-4 h-4" />
              {loading ? "Salvataggio..." : initialData ? "Aggiorna" : "Crea Paziente"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
