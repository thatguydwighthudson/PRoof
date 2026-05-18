"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Avoid transform on workout — it creates a containing block so fixed
  // modals/overlays trap clicks and may not cover the full viewport.
  if (pathname.startsWith("/workout")) {
    return <>{children}</>;
  }

  const depth =
    pathname.startsWith("/settings") || pathname.startsWith("/body");

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, x: depth ? 24 : 0 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
