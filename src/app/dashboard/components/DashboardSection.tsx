"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

type DashboardSectionProps = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
};

export default function DashboardSection({
  title,
  subtitle,
  right,
  children,
}: DashboardSectionProps) {
  return (
    <motion.section
      className="glass-card p-5 md:p-6"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-white/70 mt-1">{subtitle}</p>}
        </div>
        {right ? <div className="sm:pt-0.5">{right}</div> : null}
      </div>
      {children}
    </motion.section>
  );
}

