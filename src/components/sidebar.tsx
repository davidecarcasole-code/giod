"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  LayoutDashboard,
  UserPlus,
  Settings,
  LogOut,
  Users,
  FileSpreadsheet,
  Stethoscope,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const sedeSlugMap: Record<string, string> = {
  LATINA: "latina",
  "VILLA BETANIA": "villa-betania",
  "CRISTO RE": "cristo-re",
  FIRENZE: "firenze",
};

function NavLink({
  href,
  icon: Icon,
  children,
  isActive: activeCheck,
}: {
  href: string;
  icon: any;
  children: React.ReactNode;
  isActive?: boolean;
}) {
  const pathname = usePathname();
  const active = activeCheck !== undefined ? activeCheck : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
        active
          ? "bg-sky-500/10 text-sky-300 font-medium"
          : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-sky-400" />
      )}
      <Icon className={`w-4 h-4 shrink-0 ${active ? "text-sky-400" : "text-slate-500"}`} />
      {children}
    </Link>
  );
}

export function Sidebar({
  user,
  sedi,
  userSedeName,
  allowedSedeIds,
  greeting,
}: {
  user: any;
  sedi: { id: string; name: string }[];
  userSedeName: string | null;
  allowedSedeIds?: string[] | null;
  greeting?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const visibleSedi =
    user.role === "user" && userSedeName && !allowedSedeIds
      ? sedi.filter((s) => s.name === userSedeName)
      : sedi;

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white flex flex-col shadow-2xl border-r border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="GioDental" className="h-9 w-auto" />
          <div>
            <h1 className="text-base font-bold text-white">GioDental</h1>
            <p className="text-[10px] text-slate-500 tracking-wider uppercase">Portale Vendite</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-0.5">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 py-2">
          {user.role === "user" && !allowedSedeIds ? "La tua sede" : "Sedi"}
        </p>
        {visibleSedi.map((sede) => {
          const slug = sedeSlugMap[sede.name];
          if (!slug) return null;
          return (
            <NavLink key={sede.id} href={`/dashboard/${slug}`} icon={LayoutDashboard}>
              {sede.name}
            </NavLink>
          );
        })}

        {(user.role === "supervisor" || user.role === "admin") && (
          <>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pt-5 pb-2">
              Supervisor
            </p>
            <NavLink href="/dashboard/supervisor" icon={Users}>
              Panoramica Generale
            </NavLink>
          </>
        )}

        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pt-5 pb-2">
          Azioni
        </p>
        <NavLink href="/dashboard/pazienti/new" icon={UserPlus}>
          Nuovo Paziente
        </NavLink>
        <NavLink
          href="/dashboard/pazienti"
          isActive={pathname.startsWith("/dashboard/pazienti") && !pathname.startsWith("/dashboard/pazienti/new")}
          icon={FileSpreadsheet}
        >
          Tutti i Pazienti
        </NavLink>
        <NavLink href="/dashboard/medici" icon={Stethoscope}>
          Medici
        </NavLink>
        <NavLink href="/dashboard/opportunita" icon={TrendingUp}>
          Opportunit&agrave;
        </NavLink>

        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pt-5 pb-2">
          Gestione
        </p>
        <NavLink href="/dashboard/admin" icon={Settings}>
          Pannello Controllo
        </NavLink>
      </div>

      <div className="p-3 border-t border-slate-800">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <div className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer hover:bg-slate-800/50 transition-colors group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="truncate text-left flex-1">
                <p className="truncate text-slate-200 text-sm font-medium">
                  {user.name || user.email}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{greeting || "Cosa facciamo di bello?"}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-slate-700 bg-slate-900 text-slate-200">
            <DropdownMenuItem className="text-xs text-slate-400 focus:bg-slate-800 focus:text-slate-200">
              {user.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-400 cursor-pointer focus:bg-slate-800 focus:text-red-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Esci
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
