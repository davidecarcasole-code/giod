"use client";

import { useState, useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/bing-wallpapers")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setImages(data.map((i: any) => i.url));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (images.length < 2) return;
    intervalRef.current = setInterval(() => {
      setPrev(prev => {
        setCurrent(c => (c + 1) % images.length);
        return prev !== null ? (prev + 1) % images.length : 0;
      });
    }, 15000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [images.length]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });
      if (error) {
        toast.error(error.message || "Errore di accesso");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {images.length > 0 && (
        <div className="absolute inset-0">
          {images.map((url, i) => (
            <div
              key={url}
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
              style={{
                backgroundImage: `url(${url})`,
                opacity: i === current ? 1 : 0,
                filter: "blur(4px) brightness(0.6)",
                transform: "scale(1.05)",
              }}
            />
          ))}
        </div>
      )}
      {images.length === 0 && (
        <div className="absolute inset-0 bg-gradient-to-br from-sky-900 via-blue-900 to-cyan-900" />
      )}
      <div className="absolute inset-0 bg-black/30" />
      <div className="flex w-[900px] max-w-[95vw] min-h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-white/90 backdrop-blur-md border border-white/20 relative z-10">
        <div className="hidden md:flex w-1/2 p-10 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/90 via-blue-500/80 to-cyan-400/90" />
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
