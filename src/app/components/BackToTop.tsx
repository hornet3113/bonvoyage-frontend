"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IoArrowUpOutline } from "react-icons/io5";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={scrollToTop}
          aria-label="Volver al inicio"
          className="fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          whileHover={{ scale: 1.1, backgroundColor: "#0891b2" }}
          whileTap={{ scale: 0.93 }}
        >
          <IoArrowUpOutline className="text-xl" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
