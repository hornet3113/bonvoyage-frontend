"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

interface ParallaxSectionProps {
  children: React.ReactNode;
  className?: string;
  variant?: "light" | "dark";
}

export default function ParallaxSection({
  children,
  className = "",
  variant = "light",
}: ParallaxSectionProps) {
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], ["-22%", "22%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["22%", "-22%"]);
  const y3 = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  const light = variant === "light";

  return (
    <section ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* Shape 1 — top-right, drifts down */}
      <motion.div
        style={{ y: y1 }}
        className={`pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full blur-3xl ${
          light ? "bg-cyan-100/60" : "bg-cyan-800/30"
        }`}
      />
      {/* Shape 2 — bottom-left, drifts up */}
      <motion.div
        style={{ y: y2 }}
        className={`pointer-events-none absolute -bottom-24 -left-28 h-80 w-80 rounded-full blur-3xl ${
          light ? "bg-slate-200/70" : "bg-slate-700/40"
        }`}
      />
      {/* Shape 3 — center, subtle pulse */}
      <motion.div
        style={{ y: y3 }}
        className={`pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl ${
          light ? "bg-cyan-50/50" : "bg-cyan-500/10"
        }`}
      />

      <div className="relative z-10">{children}</div>
    </section>
  );
}
