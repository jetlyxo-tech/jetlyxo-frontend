"use client";

import { motion } from "framer-motion";

const DEALS = [
  { from: "Delhi", to: "Dubai", airline: "Emirates", price: "₹24,500", duration: "3h 40m" },
  { from: "Mumbai", to: "Bangkok", airline: "IndiGo", price: "₹12,800", duration: "4h 15m" },
  { from: "Hyderabad", to: "Singapore", airline: "Scoot", price: "₹18,200", duration: "5h 10m" },
];

export default function Deals() {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <motion.h2
          className="text-3xl font-bold text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Today&apos;s Best Flight Deals
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEALS.map((deal, i) => (
            <motion.div
              key={deal.from + deal.to}
              className="glass-card p-6 hover:shadow-glow transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <p className="text-white/70 text-sm mb-1">
                {deal.from} → {deal.to}
              </p>
              <p className="font-semibold text-white mb-2">{deal.airline}</p>
              <p className="text-2xl font-bold text-jetly-accent mb-2">{deal.price}</p>
              <p className="text-white/60 text-sm mb-4">{deal.duration}</p>
              <button type="button" className="w-full py-2.5 rounded-xl bg-jetly-accent hover:bg-jetly-accent/90 text-white font-medium">
                Book
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
