"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  KanbanSquare,
  Target,
  Map,
  MessageSquare,
  BookOpen,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/chat", label: "Agents", icon: MessageSquare },
  { href: "/memory", label: "Memory", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="px-5 py-5">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          BORG <span className="text-emerald-400">OS</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
