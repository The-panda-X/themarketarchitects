'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function FloatingAboutLogo() {
  return (
    <div className="flex justify-center mb-10">
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-28 h-28 sm:w-36 sm:h-36"
        style={{ filter: 'drop-shadow(0 0 24px rgba(230, 57, 70, 0.55))' }}
      >
        <Image
          src="/assets/logos/logo.png"
          alt="The Market Architects"
          fill
          className="object-contain"
          priority
        />
      </motion.div>
    </div>
  );
}
