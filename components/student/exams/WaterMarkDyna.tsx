'use client';

import { motion } from 'framer-motion';

import { WatermarkResolution } from '@/src/lib/watermark-from-features';

export default function ExamWatermark({
  text,
  watermarkConfig,
}: {
  text: string;
  watermarkConfig?: WatermarkResolution | null;
}) {

const randomPatterns = [
  {
    x: ['5%', '70%', '40%', '10%', '60%'],
    y: ['10%', '60%', '30%', '70%', '20%'],
  },
  {
    x: ['60%', '10%', '40%', '70%', '5%'],
    y: ['20%', '70%', '30%', '60%', '10%'],
  },
];

  return (
 <>
  {randomPatterns.map((pattern, index) => (
    <motion.div
      key={index}
      initial={{
        x: pattern.x[0],
        y: pattern.y[0],
      }}
      animate={{
        x: pattern.x,
        y: pattern.y,
      }}
      transition={{
        duration: 14,
        repeat: Infinity,
        ease: 'linear',
      }}
      className="pointer-events-none absolute inset-0 z-[9999] overflow-hidden"
    >
      <div className="absolute">
        <span
          className={`select-none text-sm font-black lg:text-base ${
            index === 0 ? 'rotate-[-20deg]' : 'rotate-[20deg]'
          }`}
          style={{
            color: watermarkConfig?.config.color ?? '#666666',
            opacity: watermarkConfig
              ? watermarkConfig.config.opacity / 100
              : 0.5,
          }}
        >
          {text}
        </span>
      </div>
    </motion.div>
  ))}
</>
  );
}