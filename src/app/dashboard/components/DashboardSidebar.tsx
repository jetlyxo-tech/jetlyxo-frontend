"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "🏠" },
  { label: "My Bookings", href: "/my-bookings", icon: "🎫" },
  { label: "Payments", href: "/payment", icon: "💳" },
  { label: "Profile", href: "#", icon: "👤" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const activeHref = useMemo(() => {
    // treat /dashboard as active for itself
    return pathname ?? "";
  }, [pathname]);

  const SidebarContent = (
    <div className="h-full flex flex-col">
      <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="font-bold text-white tracking-tight">
          JetlyXO <span className="text-jetly-accent">Dashboard</span>
        </div>
        <button
          type="button"
          className="md:hidden p-2 rounded-lg hover:bg-white/10 text-white/80"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="p-3 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href !== "#" && activeHref === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition",
                isActive
                  ? "bg-jetly-accent/15 border-jetly-accent/30 text-white shadow-glow"
                  : "bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10",
              ].join(" ")}
              onClick={() => setOpen(false)}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4">
        <div className="glass-card p-4">
          <p className="text-sm font-semibold text-white">AI Tip</p>
          <p className="text-xs text-white/70 mt-1">
            Use the Search section to compare flights, trains, and buses—then book at the best time.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="md:hidden px-4 pt-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full glass-card px-4 py-3 flex items-center justify-between"
        >
          <span className="font-semibold text-white">Menu</span>
          <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:block md:w-72 md:sticky md:top-16 md:h-[calc(100vh-4rem)]">
        <div className="glass-card h-full overflow-hidden">{SidebarContent}</div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed top-0 bottom-0 left-0 w-[86%] max-w-xs z-50 md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              <div className="h-full glass-card overflow-hidden">{SidebarContent}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

