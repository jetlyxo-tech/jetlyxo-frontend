"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, getUser, logout } from "@/lib/auth";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();
      const currentUser = getUser();

      setLoggedIn(!!token);
      setUser(currentUser);
    };

    checkAuth();

    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, [pathname]);

  const handleLogin = () => {
    router.push("/login");
  };

  const handleBookings = () => {
    if (!getToken()) {
      localStorage.setItem(
        "redirectAfterLogin",
        "/my-bookings"
      );
      router.push("/login");
      return;
    }

    router.push("/my-bookings");
  };

  const handleProfile = () => {
    router.push("/profile");
  };

  const handleLogout = () => {
    logout();

    setLoggedIn(false);
    setUser(null);

    router.push("/");
    router.refresh();
  };

  const navClass = (active: boolean) =>
    `text-sm transition ${
      active
        ? "text-white"
        : "text-white/70 hover:text-white"
    }`;

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 18,
      }}
      className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur"
    >
      <div className="max-w-7xl mx-auto h-16 px-5 flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-2xl font-bold text-white"
          >
            JetlyXO <span className="text-blue-500">✈️</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={navClass(pathname === "/")}
            >
              Home
            </Link>

            <Link
              href="/results"
              className={navClass(
                pathname.startsWith("/results")
              )}
            >
              Search Trips
            </Link>

            {loggedIn && (
              <button
                onClick={handleBookings}
                className={navClass(
                  pathname.startsWith("/my-bookings")
                )}
              >
                My Bookings
              </button>
            )}
          </nav>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">

          {!loggedIn ? (
            <>
              <button
                onClick={handleLogin}
                className="px-4 py-2 rounded-xl border border-white/15 text-sm text-white hover:bg-white/10"
              >
                Login
              </button>

              <Link
                href="/signup"
                className="px-4 py-2 rounded-xl bg-blue-600 text-sm text-white hover:bg-blue-700"
              >
                Signup
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={handleProfile}
                className="hidden md:block text-sm text-white/80 hover:text-white"
              >
                Hi, {user?.name || "User"}
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-red-600 text-sm text-white hover:bg-red-700"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}