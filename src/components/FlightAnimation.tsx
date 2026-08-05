"use client";

import { motion } from "framer-motion";

export default function FlightAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* Clouds */}
      <motion.div
        className="absolute top-20 text-6xl opacity-40"
        initial={{ x: -200 }}
        animate={{ x: "110vw" }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        ☁️
      </motion.div>

      <motion.div
        className="absolute top-40 text-5xl opacity-30"
        initial={{ x: "-20vw" }}
        animate={{ x: "110vw" }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        ☁️
      </motion.div>

      <motion.div
        className="absolute top-60 text-6xl opacity-30"
        initial={{ x: "-30vw" }}
        animate={{ x: "110vw" }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      >
        ☁️
      </motion.div>

      {/* Plane */}
      <motion.div
        className="absolute top-32 text-5xl"
        initial={{ x: "-10vw", y: 0 }}
        animate={{ x: "110vw", y: -20 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        ✈️
      </motion.div>

    </div>
  );
}