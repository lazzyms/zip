"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export function LiquidGlassBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.005;

      // Clear canvas with semi-transparent background
      ctx.fillStyle = "rgba(250, 250, 249, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw animated gradient blobs - Orange, Purple, Sky (light pastel theme)
      const blobs = [
        {
          x: Math.sin(time * 0.3) * 200 + canvas.width * 0.25,
          y: Math.cos(time * 0.25) * 150 + canvas.height * 0.2,
          size: 200,
          color: "rgba(249, 115, 22, 0.15)", // Orange
        },
        {
          x: Math.sin(time * 0.4 + 2) * 200 + canvas.width * 0.75,
          y: Math.cos(time * 0.35 + 2) * 150 + canvas.height * 0.3,
          size: 250,
          color: "rgba(139, 92, 246, 0.12)", // Purple
        },
        {
          x: Math.sin(time * 0.25 + 4) * 200 + canvas.width * 0.5,
          y: Math.cos(time * 0.3 + 4) * 150 + canvas.height * 0.8,
          size: 280,
          color: "rgba(96, 165, 250, 0.1)", // Sky Blue
        },
      ];

      blobs.forEach((blob) => {
        const gradient = ctx.createRadialGradient(
          blob.x,
          blob.y,
          0,
          blob.x,
          blob.y,
          blob.size
        );
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(
          blob.x - blob.size,
          blob.y - blob.size,
          blob.size * 2,
          blob.size * 2
        );
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-orange-50 via-purple-50 to-blue-50">
      {/* Canvas for animated blobs */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ mixBlendMode: "multiply" }}
      />

      {/* Light pastel grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='%23f97316' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%' height='100%' fill='url(%23grid)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial gradient focus - Orange center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-radial-gradient from-orange-400/5 to-transparent rounded-full blur-3xl" />

      {/* Animated accent lines - Orange and Purple */}
      <motion.div
        className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-orange-300/20 to-transparent blur-sm"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-0 right-1/4 w-1 h-full bg-gradient-to-b from-purple-300/20 to-transparent blur-sm"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
      />
    </div>
  );
}
