"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await authClient.signIn.email({
      email,
      password,
    });
    if (error) {
      toast.error(error.message || "Errore di accesso");
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(14,165,233,0.08),transparent_50%)] bg-[radial-gradient(ellipse_at_bottom_right,rgba(20,184,166,0.08),transparent_50%)]" />
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgM2wxNyA5djE2TDIwIDM3IDMgMjhWMTJ6IiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMTQsMTY1LDIzMywwLjA0KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+")`,
        backgroundSize: "60px 60px",
        opacity: 0.5
      }} />
      <div className="flex w-[900px] max-w-[95vw] min-h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-white/80 backdrop-blur-sm border border-sky-100/50">
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-sky-500 via-blue-500 to-cyan-400 p-10 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg">
                <img src="/logo.png" alt="GioDental" className="h-10 w-auto" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white leading-tight">
                Il tuo sorriso,<br />la nostra missione
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed max-w-xs">
                Gestisci pazienti, vendite e opportunità in modo semplice e professionale.
              </p>
            </div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 text-white/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-white/30" />
              <span>Piattaforma di gestione dentale</span>
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="md:hidden flex items-center gap-3 mb-8 justify-center">
            <img src="/logo.png" alt="GioDental" className="h-10 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-slate-800">GioDental</h1>
              <p className="text-slate-500 text-xs">Portale Vendite</p>
            </div>
          </div>
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Bentornato</h2>
              <p className="text-slate-500 text-sm mt-1">Accedi al tuo account</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nome@esempio.it"
                  required
                  className="h-11 rounded-xl border-slate-200 bg-white/50 focus:border-sky-400 focus:ring-sky-400/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 rounded-xl border-slate-200 bg-white/50 focus:border-sky-400 focus:ring-sky-400/20 transition-all"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 text-white font-medium shadow-lg shadow-sky-200/50 border-0 transition-all hover:shadow-xl hover:shadow-sky-200/50 active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? "Accesso in corso..." : "Accedi"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
