"use client";

import { motion } from "framer-motion";

const FOOTER_LINKS = [
  { label: "About JetlyXO", href: "#" },
  { label: "Contact", href: "#" },
  { label: "Support", href: "#" },
  { label: "Terms & Conditions", href: "#" },
  { label: "Privacy Policy", href: "#" },
];

const SOCIAL = [
  { name: "Twitter", href: "#", icon: "𝕏" },
  { name: "Facebook", href: "#", icon: "f" },
  { name: "Instagram", href: "#", icon: "📷" },
  { name: "LinkedIn", href: "#", icon: "in" },
];

export default function Footer() {
  return (
    <footer className="bg-navy-900/80 border-t border-white/5 py-12 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-2xl font-bold text-white">JetlyXO</span>
            <span className="text-jetly-accent">✈️</span>
          </motion.div>
          <nav className="flex flex-wrap gap-6">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-white/70 hover:text-white text-sm font-medium transition"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex gap-4">
            {SOCIAL.map((s) => (
              <a
                key={s.name}
                href={s.href}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition"
                aria-label={s.name}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
        <p className="text-center text-white/50 text-sm mt-8">
          © {new Date().getFullYear()} JetlyXO. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
