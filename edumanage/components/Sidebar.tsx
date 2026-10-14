"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export interface NavItem {
  href: string;
  label: string;
}

export default function Sidebar({
  role,
  userName,
  items,
}: {
  role: string;
  userName: string;
  items: NavItem[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();

  const nav = (
    <div className="flex h-full flex-col">
      <Link href={`/${role.toLowerCase()}`} className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-gold-soft font-display text-lg font-bold text-forest-deep shadow-ledger">
          E
        </div>
        <div>
          <p className="font-display text-xl font-semibold text-paper">EduManage</p>
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold-soft/80">{roleLabel} desk</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== `/${role.toLowerCase()}` && pathname.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              onClick={() => setOpen(false)}
              className={`block rounded-sm px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-gold-soft/15 text-gold-soft shadow-[inset_2px_0_0_0_#d9b25f]"
                  : "text-paper/70 hover:bg-white/5 hover:text-paper"
              }`}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <p className="truncate px-1 text-sm font-semibold text-paper">{userName}</p>
        <p className="px-1 text-xs text-paper/50">Signed in as {roleLabel}</p>
        <button
          onClick={logout}
          className="mt-3 w-full rounded-sm border border-white/15 px-3 py-2 text-sm font-semibold text-paper/80 transition hover:bg-white/5 hover:text-paper"
        >
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="no-print sticky top-0 z-40 flex items-center justify-between bg-forest-deep px-4 py-3 lg:hidden">
        <span className="font-display text-lg font-semibold text-paper">EduManage</span>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-sm border border-white/20 px-3 py-1.5 text-sm font-semibold text-paper"
          aria-label="Toggle navigation"
        >
          {open ? "Close ✕" : "Menu ☰"}
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 bg-forest-deep lg:block">
        {nav}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-forest-deep">{nav}</aside>
        </div>
      )}
    </>
  );
}
