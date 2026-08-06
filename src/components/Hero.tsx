"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type HeroProps = {
  children?: ReactNode;
};

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
        className="absolute top-[15%] left-0 text-jetly-accent/30"
        animate={{ x: ["-10%", "110%"] }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <PlaneIcon className="w-8 h-8 rotate-[-15deg]" />
      </motion.div>

      <motion.div
        className="absolute top-[35%] left-0 text-jetly-accent/25"
        animate={{ x: ["-10%", "110%"] }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
          delay: 2,
        }}
      >
        <PlaneIcon className="w-6 h-6 rotate-[10deg]" />
      </motion.div>

      <motion.div
        className="absolute top-[55%] left-0 text-jetly-accent/20"
        animate={{ x: ["-10%", "110%"] }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
          delay: 5,
        }}
      >
        <PlaneIcon className="w-7 h-7 rotate-[-5deg]" />
      </motion.div>

      <motion.div
        className="absolute top-[75%] left-0 text-jetly-accent/20"
        animate={{ x: ["-10%", "110%"] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
          delay: 1,
        }}
      >
        <PlaneIcon className="w-5 h-5 rotate-[12deg]" />
      </motion.div>
    </div>
  );
}

export default function Hero({ children }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-navy-900">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-30 bg-cover bg-center"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%234f9cff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM36 4V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <AnimatedPlanes />

      <div className="absolute inset-0 bg-hero-gradient" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10">

        <motion.h1
          className="text-center text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Plan Your Perfect Journey
        </motion.h1>

        <motion.p
          className="mt-4 text-center text-lg md:text-xl text-jetly-accent/90 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.15,
          }}
        >
          Book flights, hotels and trains instantly with AI
        </motion.p>

        {/* Travel Services */}
        {children && (
          <motion.div
            className="mt-14"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.3,
            }}
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}