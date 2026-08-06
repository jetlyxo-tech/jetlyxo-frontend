"use client";

import { motion } from "framer-motion";

const SERVICES = [
  { name: "Flights", icon: "✈️", api: "flights" as const },
  { name: "Hotels", icon: "🏨", api: null },
  { name: "Trains", icon: "🚄", api: "trains" as const },
  { name: "Buses", icon: "🚌", api: "buses" as const },
  { name: "Visa", icon: "📋", api: null },
  { name: "Holidays", icon: "🌴", api: null },
  {
    name: "JetlyCargo",
    icon: "📦",
    api: null,
    highlight: true,
    badge: "NEW",
  },
];

export type ServiceType = "flights" | "buses" | "trains";

type ServicesSectionProps = {
  onFlightsClick?: () => void;
  onBusesClick?: () => void;
  onTrainsClick?: () => void;
};

export default function Services({
  onFlightsClick,
  onBusesClick,
  onTrainsClick,
}: ServicesSectionProps) {
  const handleClick = (api: typeof SERVICES[number]["api"]) => {
    if (api === "flights") onFlightsClick?.();
    if (api === "buses") onBusesClick?.();
    if (api === "trains") onTrainsClick?.();
  };

  return (
    <section className="px-4">
      <div className="max-w-7xl mx-auto">
        <div
          className="
            grid
            grid-cols-2
            sm:grid-cols-3
            md:grid-cols-4
            xl:grid-cols-7
            gap-4
          "
        >
          {SERVICES.map((service, index) => (
            <motion.div
              key={service.name}
              className="w-full"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <motion.button
                type="button"
                onClick={() => service.api && handleClick(service.api)}
                whileHover={{ y: -5, scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative
                  w-full
                  h-32
                  rounded-2xl
                  glass-card
                  flex
                  flex-col
                  items-center
                  justify-center
                  text-center
                  transition-all
                  ${
                    service.highlight
                      ? "shadow-glow-orange border-jetly-highlight/30"
                      : "hover:shadow-glow hover:border-jetly-accent/30"
                  }
                `}
              >
                {service.badge && (
                  <span className="absolute top-2 right-2 rounded-full bg-jetly-highlight px-2 py-0.5 text-[10px] font-bold text-white">
                    {service.badge}
                  </span>
                )}

                <span className="text-3xl mb-2">{service.icon}</span>

                <span
                  className={`font-semibold ${
                    service.highlight
                      ? "text-jetly-highlight"
                      : "text-white"
                  }`}
                >
                  {service.name}
                </span>
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}