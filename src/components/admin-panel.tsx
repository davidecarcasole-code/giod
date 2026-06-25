"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Download, Pencil, X, Check, Stethoscope } from "lucide-react";
import Link from "next/link";

const selectClass = "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function AdminPanel({ userRole, userSedeId, sedi: serverSedi, allowedSedeIds }: { userRole?: string; userSedeId?: string; sedi?: { id: string; name: string }[]; allowedSedeIds?: string[] | null }) {
  const isUser = userRole === "user";
  const [sedi, setSedi] = useState<any[]>([]);
  const [medici, setMedici] = useState<any[]>([]);
  const [provenienze, setProvenienze] = useState<any[]>([]);
  const [modPagamenti, setModPagamenti] = useState<any[]>([]);
  const [userSedeName, setUserSedeName] = useState("");
  const [selectedSede, setSelectedSede] = useState("");
  const [newProvenienza, setNewProvenienza] = useState("");
  const [newMedico, setNewMedico] = useState("");
  const [newModPagamento, setNewModPagamento] = useState("");
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const loadSedi = async () => {
    try {
      const s = serverSedi || await fetch("/api/lists?type=sedi").then(r => { if (!r.ok) throw new Error("Errore"); return r.json(); });
      setSedi(s);
      if (isUser && userSedeId) {
        const mySede = s.find((sede: any) => sede.id === userSedeId);
        if (mySede) {
          setUserSedeName(mySede.name);
          setSelectedSede(mySede.name);
        }
      } else if (!isUser && s.length > 0) {
        setSelectedSede(s[0].name);
      }
    } catch { setSedi([]); }
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const loadProvenienze = async (sedeName: string) => {
    if (!sedeName) { setProvenienze([]); return; }
    try {
      const p = await fetch(`/api/lists?type=provenienze&sede=${encodeURIComponent(sedeName)}`).then(r => { if (!r.ok) throw new Error("Errore"); return r.json(); });
      setProvenienze(p);
    } catch { setProvenienze([]); }
  };

  const loadModPagamenti = async (sedeName: string) => {
    if (!sedeName) { setModPagamenti([]); return; }
    try {
      const mp = await fetch(`/api/lists?type=modPagamento&sede=${encodeURIComponent(sedeName)}`).then(r => { if (!r.ok) throw new Error("Errore"); return r.json(); });
      setModPagamenti(mp);
    } catch { setModPagamenti([]); }
  };

  const loadMedici = async (sedeName: string) => {
    if (!sedeName) { setMedici([]); return; }
    try {
      const m = await fetch(`/api/lists?type=medici&sede=${encodeURIComponent(sedeName)}`).then(r => { if (!r.ok) throw new Error("Errore"); return r.json(); });
      setMedici(m);
    } catch { setMedici([]); }
  };

  useEffect(() => { loadSedi(); }, []);

  useEffect(() => {
    if (selectedSede) {
      loadProvenienze(selectedSede);
      loadModPagamenti(selectedSede);
      loadMedici(selectedSede);
    }
  }, [selectedSede]);

  const handleAdd = async (type: string, sedeName: string, value: string) => {
    if (!value.trim() || !sedeName) return;
    setLoading(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name: value.trim(), sedeName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Errore");
      }
      toast.success(`${type} aggiunto`);
      if (type === "provenienza") setNewProvenienza("");
      else if (type === "medico") setNewMedico("");
      else if (type === "modPagamento") setNewModPagamento("");
      if (selectedSede) {
        await loadProvenienze(selectedSede);
        await loadModPagamenti(selectedSede);
        await loadMedici(selectedSede);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditValue(item.name);
  };

  const handleSave = async (type: string, id: string) => {
    if (!editValue.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/lists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, name: editValue.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Errore");
      }
      toast.success(`${type} aggiornato`);
      setEditingId(null);
      setEditValue("");
      if (userSedeName) {
        await loadProvenienze(selectedSede);
        await loadModPagamenti(selectedSede);
        await loadMedici(selectedSede);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm("Sicuro di voler eliminare?")) return;
    try {
      const res = await fetch(`/api/lists?type=${type}&id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore");
      toast.success("Eliminato");
      if (userSedeName) {
        await loadProvenienze(selectedSede);
        await loadModPagamenti(selectedSede);
        await loadMedici(selectedSede);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setImportLoading(true);
    setImportResult(null);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/pazienti/import", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      setImportResult(result);
      if (res.ok) {
        toast.success(`Importati ${result.imported} pazienti`);
      } else {
        toast.error(result.error || "Errore import");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setImportLoading(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-600 via-pink-500 to-orange-400 p-6 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative">
          <h1 className="text-2xl font-bold">{isUser ? "Gestione Sede" : "Pannello di Controllo"}</h1>
          <p className="text-rose-100 text-sm mt-1">
            {isUser ? `Gestisci medici, provenienze e pagamenti per ${userSedeName}` : `Gestione liste - ${selectedSede}`}
          </p>
        </div>
      </div>

      <Tabs defaultValue="liste">
        <TabsList>
          <TabsTrigger value="liste">Liste</TabsTrigger>
          {!isUser && <TabsTrigger value="import">Import/Export</TabsTrigger>}
        </TabsList>

        <TabsContent value="liste" className="space-y-6">
          {(!isUser || allowedSedeIds) && sedi.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sedi.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSede(s.name)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedSede === s.name
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {!isUser && (
              <Card>
                <CardHeader>
                  <CardTitle>Sedi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {sedi.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between py-1.5 px-3 bg-muted/50 rounded-lg">
                        <span className="font-medium">{s.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Nome nuova sede" value={newProvenienza} onChange={(e) => setNewProvenienza(e.target.value)} />
                    <Button onClick={() => handleAdd("sede", selectedSede || "", newProvenienza)} disabled={loading}><Plus className="w-4 h-4 mr-1" /> Aggiungi</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Provenienze {selectedSede && `- ${selectedSede}`}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {provenienze.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between py-1.5 px-3 bg-muted/50 rounded-lg gap-2">
                      {editingId === p.id ? (
                        <>
                          <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 text-sm" />
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => handleSave("provenienza", p.id)} disabled={loading}><Check className="w-4 h-4 text-green-500" /></Button>
                            <Button variant="ghost" size="sm" onClick={handleCancelEdit}><X className="w-4 h-4" /></Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 min-w-0 truncate">{p.name}</span>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete("provenienza", p.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Nuova provenienza" value={newProvenienza} onChange={(e) => setNewProvenienza(e.target.value)} />
                  <Button onClick={() => handleAdd("provenienza", selectedSede || "", newProvenienza)} disabled={loading || !selectedSede}>
                    <Plus className="w-4 h-4 mr-1" /> Aggiungi
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medici {selectedSede && `- ${selectedSede}`}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {medici.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between py-1.5 px-3 bg-muted/50 rounded-lg gap-2">
                      {editingId === m.id ? (
                        <>
                          <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 text-sm" />
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => handleSave("medico", m.id)} disabled={loading}><Check className="w-4 h-4 text-green-500" /></Button>
                            <Button variant="ghost" size="sm" onClick={handleCancelEdit}><X className="w-4 h-4" /></Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 min-w-0 truncate flex items-center gap-2"><Stethoscope className="w-4 h-4 shrink-0 text-muted-foreground" />{m.name}</span>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(m)}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete("medico", m.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Nome medico" value={newMedico} onChange={(e) => setNewMedico(e.target.value)} />
                  <Button onClick={() => handleAdd("medico", selectedSede || "", newMedico)} disabled={loading || !selectedSede}>
                    <Plus className="w-4 h-4 mr-1" /> Aggiungi
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Modalità di Pagamento {selectedSede && `- ${selectedSede}`}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {modPagamenti.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between py-1.5 px-3 bg-muted/50 rounded-lg gap-2">
                      {editingId === m.id ? (
                        <>
                          <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 text-sm" />
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => handleSave("modPagamento", m.id)} disabled={loading}><Check className="w-4 h-4 text-green-500" /></Button>
                            <Button variant="ghost" size="sm" onClick={handleCancelEdit}><X className="w-4 h-4" /></Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 min-w-0 truncate">{m.name}</span>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(m)}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete("modPagamento", m.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Nuovo metodo pagamento" value={newModPagamento} onChange={(e) => setNewModPagamento(e.target.value)} />
                  <Button onClick={() => handleAdd("modPagamento", selectedSede || "", newModPagamento)} disabled={loading || !selectedSede}>
                    <Plus className="w-4 h-4 mr-1" /> Aggiungi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {!isUser && (
          <TabsContent value="import" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Importa da Excel</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleImport} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Sede</Label>
                      <select name="sede" required className={selectClass}>
                        <option value="">Seleziona sede</option>
                        {sedi.map((s: any) => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>File Excel</Label>
                      <Input type="file" name="file" accept=".xlsx,.xls" required />
                    </div>
                    <Button type="submit" disabled={importLoading}>
                      <Upload className="w-4 h-4 mr-1" />
                      {importLoading ? "Importazione..." : "Importa"}
                    </Button>
                  </form>
                  {importResult && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <p>Importati: <strong>{importResult.imported}</strong> pazienti</p>
                      {importResult.errors?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-destructive text-sm font-medium">Errori:</p>
                          <ul className="text-xs text-destructive/80 list-disc pl-4 space-y-0.5">
                            {importResult.errors.map((e: string, i: number) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Esporta in Excel</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Scarica i dati filtrati per sede e periodo.
                  </p>
                  <Link href="/api/pazienti/export" className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted h-9 gap-1.5 px-3 text-sm font-medium transition-colors"><Download className="w-4 h-4 mr-1" /> Esporta Tutti</Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
