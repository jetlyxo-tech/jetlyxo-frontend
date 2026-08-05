"use client";

import { motion } from "framer-motion";

export default function Trust() {
  return (
    <section className="py-16 px-4 border-t border-white/5">
      <div className="container mx-auto">
        <motion.div
          className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">✈️</span>
            <div>
              <p className="font-semibold text-white">Trusted by travelers</p>
              <p className="text-white/60 text-sm">1M+ bookings</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔐</span>
            <div>
              <p className="font-semibold text-white">Secure payment gateway</p>
              <p className="text-white/60 text-sm">PCI DSS compliant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <p className="font-semibold text-white">Real-time booking</p>
              <p className="text-white/60 text-sm">Instant confirmation</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
