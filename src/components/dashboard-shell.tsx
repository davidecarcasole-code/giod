"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Menu, X } from "lucide-react";

export function DashboardShell({
  children,
  user,
  sedi,
  userSedeName,
  allowedSedeIds,
  greeting,
}: {
  children: React.ReactNode;
  user: any;
  sedi: { id: string; name: string }[];
  userSedeName: string | null;
  allowedSedeIds?: string[] | null;
  greeting?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 relative">
      <Sidebar
        user={user}
        sedi={sedi}
        userSedeName={userSedeName}
        allowedSedeIds={allowedSedeIds}
        greeting={greeting}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 overflow-auto bg-gradient-to-br from-sky-50/50 via-white to-cyan-50/30 min-w-0">
        <div className="h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-teal-400" />
        <div className="flex items-center gap-3 px-4 lg:px-8 pt-4 pb-1">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <p className="text-sm text-slate-500">{greeting}</p>
        </div>
        <div className="p-4 lg:p-8 pt-2">{children}</div>
      </main>
    </div>
  );
}
