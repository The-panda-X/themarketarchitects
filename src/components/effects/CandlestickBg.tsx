'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CandlestickBgProps {
  className?: string;
  opacity?: number;
  count?: number;
}

interface Candle {
  x: number;
  open: number;
  close: number;
  high: number;
  low: number;
  width: number;
  bullish: boolean;
  speed: number;
}

export default function CandlestickBg({
  className,
  opacity = 0.08,
  count = 30,
}: CandlestickBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const candlesRef = useRef<Candle[]>([]);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
      generateCandles();
    }

    function generateCandles() {
      if (!canvas) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const gap = w / count;

      candlesRef.current = Array.from({ length: count + 5 }, (_, i) => {
        const bullish = Math.random() > 0.45;
        const bodyHeight = 20 + Math.random() * 60;
        const wickExtra = 10 + Math.random() * 30;
        const baseY = h * 0.2 + Math.random() * h * 0.5;

        return {
          x: i * gap,
          open: bullish ? baseY + bodyHeight : baseY,
          close: bullish ? baseY : baseY + bodyHeight,
          high: Math.min(baseY, baseY + bodyHeight) - wickExtra,
          low: Math.max(baseY, baseY + bodyHeight) + wickExtra * 0.7,
          width: gap * 0.5,
          bullish,
          speed: 0.15 + Math.random() * 0.1,
        };
      });
    }

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      ctx.clearRect(0, 0, w, h);

      const totalWidth = (count + 5) * (w / count);

      for (const candle of candlesRef.current) {
        const x = ((candle.x - offsetRef.current) % totalWidth + totalWidth) % totalWidth - w * 0.1;
        const centerX = x + candle.width / 2;

        const green = `rgba(0, 200, 83, ${opacity})`;
        const red = `rgba(230, 57, 70, ${opacity})`;
        const color = candle.bullish ? green : red;
        const wickColor = candle.bullish
          ? `rgba(0, 200, 83, ${opacity * 0.6})`
          : `rgba(230, 57, 70, ${opacity * 0.6})`;

        ctx.strokeStyle = wickColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, candle.high);
        ctx.lineTo(centerX, candle.low);
        ctx.stroke();

        ctx.fillStyle = color;
        const top = Math.min(candle.open, candle.close);
        const bodyH = Math.abs(candle.open - candle.close);
        ctx.fillRect(x, top, candle.width, bodyH);
      }

      offsetRef.current += 0.3;
      animId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [count, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
    />
  );
}
