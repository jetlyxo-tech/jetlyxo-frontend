"use client";

import { motion } from "framer-motion";

const FEATURES = [
  {
    title: "Best Prices",
    description: "Guaranteed lowest fares on all bookings.",
    icon: "💰",
  },
  {
    title: "Secure Payments",
    description: "100% safe and protected transactions.",
    icon: "🔒",
  },
  {
    title: "24/7 Support",
    description: "Always here to help with your travel.",
    icon: "🛟",
  },
];

export default function Features() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="glass-card p-8 text-center relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                opacity: { delay: i * 0.1 },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut", repeatDelay: i * 0.3 },
              }}
              animate={{ y: [0, -6, 0] }}
            >
              <motion.span
                className="text-4xl mb-4 block"
                whileHover={{ scale: 1.2 }}
              >
                {feature.icon}
              </motion.span>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/70">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
