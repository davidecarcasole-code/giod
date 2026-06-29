"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Download, Pencil, X, Check, Stethoscope, KeyRound, UserPlus, Shield, Building2 } from "lucide-react";
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

  const [users, setUsers] = useState<any[]>([]);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [newUserSede, setNewUserSede] = useState("");
  const [resetPwTarget, setResetPwTarget] = useState<any>(null);
  const [resetPwPassword, setResetPwPassword] = useState("");

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
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Errore");
      }
      toast.success("Eliminato");
      if (type === "sede") {
        await loadSedi();
        setSelectedSede("");
      } else if (selectedSede) {
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

  const loadUsers = async () => {
    try {
      const u = await fetch("/api/users").then(r => { if (!r.ok) throw new Error("Errore"); return r.json(); });
      setUsers(u);
    } catch { setUsers([]); }
  };

  useEffect(() => { if (!isUser) loadUsers(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) { toast.error("Email e password richieste"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName || newUserEmail.split("@")[0],
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          sedeName: newUserSede || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Errore");
      }
      toast.success("Utente creato");
      setNewUserName(""); setNewUserEmail(""); setNewUserPassword(""); setNewUserRole("user"); setNewUserSede("");
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...updates }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Errore");
      }
      toast.success("Utente aggiornato");
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPwTarget || !resetPwPassword) return;
    if (resetPwPassword.length < 6) { toast.error("Password troppo corta (min 6 caratteri)"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: resetPwTarget.id, newPassword: resetPwPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Errore");
      }
      toast.success("Password reimpostata");
      setResetPwTarget(null);
      setResetPwPassword("");
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
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
          {!isUser && <TabsTrigger value="utenti"><UserPlus className="w-4 h-4 mr-1" />Utenti</TabsTrigger>}
          {!isUser && <TabsTrigger value="import">Import/Export</TabsTrigger>}
        </TabsList>

        <TabsContent keepMounted value="liste" className="space-y-6">
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
                        <Button variant="ghost" size="sm" onClick={() => handleDelete("sede", s.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
          <TabsContent keepMounted value="utenti" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Crea Nuovo Utente</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nome</Label>
                    <Input placeholder="Nome" value={newUserName} onChange={e => setNewUserName(e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email *</Label>
                    <Input placeholder="email@esempio.it" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Password *</Label>
                    <Input type="password" placeholder="Password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Ruolo</Label>
                    <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className={selectClass}>
                      <option value="user">User</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sede</Label>
                    <select value={newUserSede} onChange={e => setNewUserSede(e.target.value)} className={selectClass}>
                      <option value="">Nessuna</option>
                      {sedi.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 lg:col-span-5 flex justify-end mt-1">
                    <Button type="submit" disabled={loading}>
                      <UserPlus className="w-4 h-4 mr-1" /> Crea Utente
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gestione Utenti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Nome</th>
                        <th className="pb-2 font-medium">Email</th>
                        <th className="pb-2 font-medium">Ruolo</th>
                        <th className="pb-2 font-medium">Sede</th>
                        <th className="pb-2 font-medium text-right">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u: any) => (
                        <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="py-2 pr-3">{u.name || "—"}</td>
                          <td className="py-2 pr-3 text-muted-foreground">{u.email}</td>
                          <td className="py-2 pr-3">
                            <select
                              value={u.role}
                              onChange={e => handleUpdateUser(u.id, { role: e.target.value })}
                              className="h-8 text-xs rounded-lg border border-input bg-transparent px-2"
                            >
                              <option value="user">User</option>
                              <option value="supervisor">Supervisor</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="py-2 pr-3">
                            <select
                              value={u.sedeId || ""}
                              onChange={e => handleUpdateUser(u.id, { sedeId: e.target.value || null })}
                              className="h-8 text-xs rounded-lg border border-input bg-transparent px-2 max-w-[140px]"
                            >
                              <option value="">—</option>
                              {sedi.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          </td>
                          <td className="py-2 text-right">
                            <Dialog open={resetPwTarget?.id === u.id} onOpenChange={open => { if (!open) setResetPwTarget(null); }}>
                              <DialogTrigger render={<Button variant="ghost" size="sm" onClick={() => { setResetPwTarget(u); setResetPwPassword(""); }} />}>
                                <KeyRound className="w-4 h-4" />
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reset Password - {resetPwTarget?.name || resetPwTarget?.email}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-2">
                                  <div className="space-y-2">
                                    <Label>Nuova Password</Label>
                                    <Input
                                      type="password"
                                      value={resetPwPassword}
                                      onChange={e => setResetPwPassword(e.target.value)}
                                      placeholder="Minimo 6 caratteri"
                                    />
                                  </div>
                                  <Button onClick={handleResetPassword} disabled={loading} className="w-full">
                                    <KeyRound className="w-4 h-4 mr-1" /> Reimposta Password
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground">Nessun utente trovato</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {!isUser && (
          <TabsContent keepMounted value="import" className="space-y-6">
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
