"use client";

import { motion } from "framer-motion";

const SERVICES = [
  { name: "Flights", icon: "✈️", api: "flights" as const },
  { name: "Hotels", icon: "🏨", api: null },
  { name: "Trains", icon: "🚄", api: "trains" as const },
  { name: "Buses", icon: "🚌", api: "buses" as const },
  { name: "Visa", icon: "📋", api: null },
  { name: "Holidays", icon: "🌴", api: null },
  { name: "JetlyCargo", icon: "📦", api: null, highlight: true, badge: "NEW" },
];

export type ServiceType = "flights" | "buses" | "trains";

export type ServicesSectionProps = {
  onFlightsClick?: () => void;
  onBusesClick?: () => void;
  onTrainsClick?: () => void;
};

export default function Services({
  onFlightsClick,
  onBusesClick,
  onTrainsClick,
}: ServicesSectionProps) {

  const handleClick = (api: typeof SERVICES[0]["api"]) => {
    if (api === "flights") onFlightsClick?.();
    else if (api === "buses") onBusesClick?.();
    else if (api === "trains") onTrainsClick?.();
  };

  return (
    <section className="pt-6 pb-4 px-4">
      <div className="container mx-auto">

        <motion.h2
          className="text-2xl md:text-3xl font-bold text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Travel Services
        </motion.h2>

        <div
  className="
    grid
    grid-cols-2
    sm:grid-cols-3
    lg:grid-cols-7
    gap-4
    max-w-7xl
    mx-auto
  "
>

          {SERVICES.map((service, i) => (
            <motion.div
  key={service.name}
  className="w-full"
>
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <motion.button
                type="button"
                onClick={() => service.api && handleClick(service.api)}
                className={`
  w-full
  h-40
  glass-card
  p-5
  flex
  flex-col
  items-center
  justify-center
  text-center
  relative
  transition-all
  ${
    service.highlight
      ? "shadow-glow-orange border-jetly-highlight/30"
      : "hover:shadow-glow hover:border-jetly-accent/20"
  }
`}}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                {service.badge && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-jetly-highlight text-white">
                    {service.badge}
                  </span>
                )}

                <span className="text-3xl mb-2">
                  {service.icon}
                </span>

                <span
                  className={`font-semibold text-sm ${
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