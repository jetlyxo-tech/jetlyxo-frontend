"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Menu,
  X,
  User,
  Ticket,
  LogOut,
  ChevronDown,
} from "lucide-react";

import { getToken, getUser, logout } from "@/lib/auth";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  const syncAuth = useCallback(() => {
    setLoggedIn(!!getToken());
    setUser(getUser());
  }, []);

  useEffect(() => {
    syncAuth();
  
    window.addEventListener("storage", syncAuth);
  
    return () => {
      window.removeEventListener("storage", syncAuth);
    };
  }, [pathname, syncAuth]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleOutside
      );
  }, []);

  const navClass = (href: string) => {
    const active =
      href === "/"
        ? pathname === "/"
        : pathname.startsWith(href);

    return active
      ? "text-white font-semibold"
      : "text-white/70 hover:text-white";
  };

  const initials =
    user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 18,
      }}
      className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}

        <Link
          href="/"
          className="text-2xl font-bold text-white"
        >
          JetlyXO
          <span className="text-blue-500">
            ✈️
          </span>
        </Link>

        {/* Desktop Nav */}

        <nav className="hidden items-center gap-8 md:flex">

          <Link
            href="/"
            className={navClass("/")}
          >
            Home
          </Link>

          <Link
            href="/results"
            className={navClass("/results")}
          >
            Search Trips
          </Link>

          {loggedIn && (
            <Link
              href="/my-bookings"
              className={navClass("/my-bookings")}
            >
              My Bookings
            </Link>
          )}

        </nav>

        {/* Right Side */}

        <div className="flex items-center gap-4">

          {!loggedIn ? (
            <>

              <button
                onClick={() =>
                  router.push("/login")
                  
                }
                className="rounded-xl border border-white/20 px-4 py-2 text-white hover:bg-white/10"
              >
                Login
              </button>

              <button
                onClick={() =>
                  router.push("/signup")
                }
                className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Signup
              </button>

            </>
          ) : (

            <div
              ref={profileRef}
              className="relative"
            >

              <button
                onClick={() =>
                  setProfileOpen(
                    !profileOpen
                  )
                }
                className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
              >

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                  {initials}
                </div>

                <div className="hidden text-left md:block">

                  <p className="text-sm font-semibold text-white">
                    {user?.name || "User"}
                  </p>

                  <p className="text-xs text-white/50">
                    View Profile
                  </p>

                </div>

                <ChevronDown
                  size={18}
                  className={`transition ${
                    profileOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />

              </button>

              <AnimatePresence>

                {profileOpen && (

                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -10,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                    className="absolute right-0 mt-3 w-56 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl"
                  >

                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        router.push("/profile");
                      }}
                      className="flex w-full items-center gap-3 px-5 py-4 text-white hover:bg-white/10"
                    >
                      <User size={18} />
                      Profile
                    </button>

                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        router.push(
                          "/my-bookings"
                        );
                      }}
                      className="flex w-full items-center gap-3 px-5 py-4 text-white hover:bg-white/10"
                    >
                      <Ticket size={18} />
                      My Bookings
                    </button>

                    <div className="border-t border-white/10" />

                    <button
                        onClick={() => {
                          logout();
                          syncAuth();
                        
                          setProfileOpen(false);
                          setMobileOpen(false);
                        
                          router.push("/");
                        }}
                      className="flex w-full items-center gap-3 px-5 py-4 text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>

                  </motion.div>

                )}

              </AnimatePresence>

            </div>

          )}

          {/* Mobile Menu */}

          <button
            onClick={() =>
              setMobileOpen(!mobileOpen)
            }
            className="text-white md:hidden"
          >
            {mobileOpen ? (
              <X />
            ) : (
              <Menu />
            )}
          </button>

        </div>

      </div>

      <AnimatePresence>

        {mobileOpen && (

          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            className="border-t border-white/10 bg-slate-950 md:hidden"
          >

            <nav className="flex flex-col p-4">

              <Link
                href="/"
                className="py-3 text-white"
              >
                Home
              </Link>

              <Link
                href="/results"
                className="py-3 text-white"
              >
                Search Trips
              </Link>

              {loggedIn && (

                <Link
                  href="/my-bookings"
                  className="py-3 text-white"
                >
                  My Bookings
                </Link>

              )}

            </nav>

          </motion.div>

        )}

      </AnimatePresence>

    </motion.header>
  );
}