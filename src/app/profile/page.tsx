"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit,
  Ticket,
  LogOut,
} from "lucide-react";

import { getUser, logout } from "@/lib/auth";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getUser();

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    setUser(currentUser);
  }, [router]);

  if (!user) return null;

  const initials =
    user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <div className="mx-auto max-w-6xl px-6 py-10">

        <h1 className="mb-8 text-3xl font-bold">
          My Profile
        </h1>

        <div className="grid gap-8 lg:grid-cols-3">

          {/* LEFT CARD */}

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-8">

            <div className="flex flex-col items-center">

              <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-4xl font-bold">
                {initials}
              </div>

              <h2 className="text-xl font-semibold">
                {user.name}
              </h2>

              <p className="mt-1 text-white/60">
                {user.email}
              </p>

            </div>

            <button
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 hover:bg-blue-700"
            >
              <Edit size={18} />
              Edit Profile
            </button>

          </div>

          {/* RIGHT */}

          <div className="space-y-6 lg:col-span-2">

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

              <h2 className="mb-6 text-xl font-semibold">
                Personal Information
              </h2>

              <div className="space-y-5">

                <InfoRow
                  icon={<User size={18} />}
                  label="Full Name"
                  value={user.name}
                />

                <InfoRow
                  icon={<Mail size={18} />}
                  label="Email"
                  value={user.email}
                />

                <InfoRow
                  icon={<Phone size={18} />}
                  label="Phone"
                  value={user.phone || "Not Added"}
                />

                <InfoRow
                  icon={<Calendar size={18} />}
                  label="Date of Birth"
                  value={user.dob || "Not Added"}
                />

                <InfoRow
                  icon={<MapPin size={18} />}
                  label="Address"
                  value={user.address || "Not Added"}
                />

              </div>

            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <button
                onClick={() => router.push("/my-bookings")}
                className="rounded-xl border border-white/10 bg-slate-900 p-6 text-left hover:border-blue-500"
              >
                <Ticket className="mb-3 text-blue-500" />
                <h3 className="font-semibold">
                  My Bookings
                </h3>
                <p className="mt-2 text-sm text-white/60">
                  View all flight bookings.
                </p>
              </button>

              <button
                onClick={() => {
                  logout();
                  router.replace("/");
                }}
                className="rounded-xl border border-red-500/30 bg-slate-900 p-6 text-left hover:bg-red-500/10"
              >
                <LogOut className="mb-3 text-red-400" />
                <h3 className="font-semibold text-red-400">
                  Logout
                </h3>
                <p className="mt-2 text-sm text-white/60">
                  Sign out of your account.
                </p>
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 p-4">

      <div className="text-blue-500">
        {icon}
      </div>

      <div>

        <p className="text-sm text-white/50">
          {label}
        </p>

        <p className="font-medium">
          {value}
        </p>

      </div>

    </div>
  );
}