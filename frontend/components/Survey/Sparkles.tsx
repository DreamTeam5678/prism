'use client';

import React, { useEffect, useRef } from 'react';

interface SparklesProps {
  background?: string;
  particleColor?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  className?: string;
}

export const Sparkles: React.FC<SparklesProps> = ({
  background = 'transparent',
  particleColor = '#ffffff',
  minSize = 1,
  maxSize = 2.5,
  particleDensity = 40,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: { x: number; y: number; size: number; alpha: number; velocity: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles.length = 0;
      for (let i = 0; i < particleDensity; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: minSize + Math.random() * (maxSize - minSize),
          alpha: Math.random() * 0.5 + 0.2,
          velocity: Math.random() * 0.2 + 0.1,
        });
      }
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.fillStyle = background;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(${hexToRgb(particleColor)}, ${p.alpha})`;
        ctx.fill();

        p.y -= p.velocity;
        if (p.y < -p.size) {
          p.y = canvas.height + p.size;
          p.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const hexToRgb = (hex: string) => {
      const bigint = parseInt(hex.replace('#', ''), 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `${r}, ${g}, ${b}`;
    };

    resize();
    window.addEventListener('resize', resize);
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [background, particleColor, minSize, maxSize, particleDensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed top-0 left-0 z-0 w-full h-full ${className}`}
    />
  );
};
export default Sparkles;
