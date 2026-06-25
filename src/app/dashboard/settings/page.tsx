"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { toast } from "sonner";
import { Save, KeyRound, User, Image } from "lucide-react";

export default function SettingsPage() {
  const session = authClient.useSession();
  const user = session.data?.user;
  const [name, setName] = useState(user?.name || "");
  const [image, setImage] = useState(user?.image || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const { error } = await authClient.updateUser({ name, image: image || undefined });
      if (error) throw new Error(error.message || "Errore");
      toast.success("Profilo aggiornato");
    } catch (err: any) {
      toast.error(err.message);
    }
    setProfileLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Le password non coincidono"); return; }
    if (newPassword.length < 6) { toast.error("Password troppo corta (min 6 caratteri)"); return; }
    setPasswordLoading(true);
    try {
      const { error } = await authClient.changePassword({ currentPassword, newPassword });
      if (error) throw new Error(error.message || "Errore");
      toast.success("Password cambiata");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message);
    }
    setPasswordLoading(false);
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-500 via-blue-500 to-cyan-400 p-6 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative flex items-center gap-4">
          <Avatar src={user.image} name={user.name} size="xl" className="ring-4 ring-white/30" />
          <div>
            <h1 className="text-2xl font-bold">{user.name || "Il mio profilo"}</h1>
            <p className="text-sky-100 text-sm">{user.email}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="w-4 h-4" /> Dati Personali</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label>Avatar (URL immagine)</Label>
              <div className="flex gap-3">
                <div className="shrink-0">
                  <Avatar src={image || user.image} name={name || user.name} size="lg" />
                </div>
                <div className="flex-1">
                  <Input
                    value={image}
                    onChange={e => setImage(e.target.value)}
                    placeholder="https://esempio.it/avatar.jpg"
                    className="h-10"
                  />
                </div>
              </div>
            </div>
            <Button type="submit" disabled={profileLoading}>
              <Save className="w-4 h-4 mr-1" /> Salva
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="w-4 h-4" /> Cambia Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Password Attuale</Label>
              <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="h-10" />
            </div>
            <div className="space-y-2">
              <Label>Nuova Password</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="h-10" />
            </div>
            <div className="space-y-2">
              <Label>Conferma Nuova Password</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="h-10" />
            </div>
            <Button type="submit" disabled={passwordLoading}>
              <KeyRound className="w-4 h-4 mr-1" /> Cambia Password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Image className="w-4 h-4" /> Personalizzazione Tema</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher />
        </CardContent>
      </Card>
    </div>
  );
}
