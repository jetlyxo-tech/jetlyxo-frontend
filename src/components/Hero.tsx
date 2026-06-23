"use client";

import { motion } from "framer-motion";

export function PlaneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

export function AnimatedPlanes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-[15%] left-0 text-jetly-accent/30 w-8 h-8"
        animate={{ x: ["-10%", "110%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        <PlaneIcon className="w-8 h-8 rotate-[-15deg]" />
      </motion.div>
      <motion.div
        className="absolute top-[35%] left-0 text-jetly-accent/25 w-6 h-6"
        animate={{ x: ["-10%", "110%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 2 }}
      >
        <PlaneIcon className="w-6 h-6 rotate-[10deg]" />
      </motion.div>
      <motion.div
        className="absolute top-[55%] left-0 text-jetly-accent/20 w-7 h-7"
        animate={{ x: ["-10%", "110%"] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 5 }}
      >
        <PlaneIcon className="w-7 h-7 rotate-[-5deg]" />
      </motion.div>
      <motion.div
        className="absolute top-[75%] left-0 text-jetly-accent/20 w-5 h-5"
        animate={{ x: ["-10%", "110%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 1 }}
      >
        <PlaneIcon className="w-5 h-5 rotate-[12deg]" />
      </motion.div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-navy-900">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234f9cff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <AnimatedPlanes />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-hero-gradient" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-4 md:mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Plan Your Perfect Journey
        </motion.h1>
        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-jetly-accent/90 max-w-2xl mx-auto mb-8 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Book flights, hotels and trains instantly with AI
        </motion.p>
        <motion.a
          href="#search"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-jetly-accent hover:bg-jetly-accent/90 text-white font-semibold text-lg shadow-glow hover:shadow-[0_0_50px_-5px_rgba(79,156,255,0.6)] transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          Search Flights
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </motion.a>
      </div>
    </section>
  );
}
