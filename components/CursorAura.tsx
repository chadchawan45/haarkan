"use client";

import React, { useEffect, useRef } from "react";

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
}

const SPARKLE_COLORS = [
  "#34d399", // emerald
  "#10b981", // green
  "#6ee7b7", // mint
  "#fbbf24", // warm gold
  "#fef08a", // soft star yellow
  "#60a5fa", // sky cyan
];

export function CursorAura() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // ตรวจสอบว่าใช้อุปกรณ์ที่มีเมาส์จริง (ไม่ทำงานบน touch/mobile เพื่อประหยัดแบตเตอรี่และความลื่นไหล)
    if (typeof window === "undefined") return;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // ตำแหน่งเมาส์เป้าหมาย & ตำแหน่ง aura ปัจจุบัน (lerp)
    let mouseX = -100;
    let mouseY = -100;
    let auraX = -100;
    let auraY = -100;
    let isHoveringInteractive = false;
    let auraRadius = 24;
    let targetAuraRadius = 24;
    let isVisible = false;
    let lastMoveTime = Date.now();

    const sparkles: Sparkle[] = [];

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const prevX = mouseX;
      const prevY = mouseY;
      mouseX = e.clientX;
      mouseY = e.clientY;
      isVisible = true;
      lastMoveTime = Date.now();

      // ตรวจสอบว่าชี้บนปุ่มหรือลิงก์หรือไม่เพื่อขยายออร่า
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.closest("button") ||
          target.closest("a") ||
          target.closest("input") ||
          target.closest("select") ||
          target.closest(".card-clickable") ||
          target.closest(".nav-item") ||
          target.closest("[role='button']"))
      ) {
        isHoveringInteractive = true;
        targetAuraRadius = 42;
      } else {
        isHoveringInteractive = false;
        targetAuraRadius = 24;
      }

      // สร้างประกายระยิบระยับ (Sparkles) เมื่อเมาส์ขยับ
      const dist = Math.hypot(mouseX - prevX, mouseY - prevY);
      if (dist > 3 && prevX > 0) {
        const count = Math.min(3, Math.floor(dist / 14) + 1);
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 1.6 + 0.4;
          const color = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)];
          sparkles.push({
            x: mouseX + (Math.random() - 0.5) * 12,
            y: mouseY + (Math.random() - 0.5) * 12,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.3, // ลอยขึ้นเล็กน้อย
            size: Math.random() * 3.5 + 2,
            color,
            alpha: 1,
            decay: Math.random() * 0.03 + 0.02,
            rotation: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.15,
          });
        }
      }
    };

    const handleMouseLeave = () => {
      isVisible = false;
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    // ฟังก์ชันวาดรูปดาว 4 แฉกสำหรับประกายระยิบระยับ
    const drawStar = (
      context: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      spikes: number,
      outerRadius: number,
      innerRadius: number,
      rot: number
    ) => {
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      context.beginPath();
      context.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        context.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        context.lineTo(x, y);
        rot += step;
      }
      context.lineTo(cx + Math.cos(rot - step * 2) * outerRadius, cy + Math.sin(rot - step * 2) * outerRadius);
      context.closePath();
      context.fill();
    };

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Interpolation ของตำแหน่งออร่า (Smooth Lerp)
      if (auraX === -100) {
        auraX = mouseX;
        auraY = mouseY;
      } else {
        auraX += (mouseX - auraX) * 0.2;
        auraY += (mouseY - auraY) * 0.2;
        auraRadius += (targetAuraRadius - auraRadius) * 0.15;
      }

      // วาดออร่าเรืองแสงรอบเมาส์
      if (isVisible && auraX > 0 && auraY > 0) {
        const timeSinceMove = Date.now() - lastMoveTime;
        const idleFade = Math.max(0.2, 1 - timeSinceMove / 4000);

        ctx.save();
        // วาดชั้นออร่าชั้นนอก (Soft Ambient Glow)
        const outerGrad = ctx.createRadialGradient(
          auraX,
          auraY,
          0,
          auraX,
          auraY,
          auraRadius * 2.4
        );
        if (isHoveringInteractive) {
          outerGrad.addColorStop(0, `rgba(52, 211, 153, ${0.45 * idleFade})`);
          outerGrad.addColorStop(0.5, `rgba(16, 185, 129, ${0.2 * idleFade})`);
          outerGrad.addColorStop(1, "rgba(52, 211, 153, 0)");
        } else {
          outerGrad.addColorStop(0, `rgba(31, 111, 83, ${0.35 * idleFade})`);
          outerGrad.addColorStop(0.5, `rgba(78, 157, 123, ${0.12 * idleFade})`);
          outerGrad.addColorStop(1, "rgba(31, 111, 83, 0)");
        }
        ctx.fillStyle = outerGrad;
        ctx.beginPath();
        ctx.arc(auraX, auraY, auraRadius * 2.4, 0, Math.PI * 2);
        ctx.fill();

        // วงแหวนประกายเส้นขอบรอบออร่า
        ctx.beginPath();
        ctx.arc(auraX, auraY, auraRadius * 0.85, 0, Math.PI * 2);
        ctx.strokeStyle = isHoveringInteractive
          ? `rgba(52, 211, 153, ${0.65 * idleFade})`
          : `rgba(78, 157, 123, ${0.4 * idleFade})`;
        ctx.lineWidth = isHoveringInteractive ? 2 : 1.2;
        ctx.stroke();

        // จุดกึ่งกลางระยิบระยับเบาๆ
        ctx.beginPath();
        ctx.arc(auraX, auraY, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * idleFade})`;
        ctx.fill();

        ctx.restore();
      }

      // วาดและอัปเดตอนุภาคประกายระยิบระยับ (Sparkles)
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.x += s.vx;
        s.y += s.vy;
        s.rotation += s.rotationSpeed;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparkles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 6;

        // สลับวาดประกายแบบดาว 4 แฉกหรือจุดสว่างกลม
        if (s.size > 3.5) {
          drawStar(ctx, s.x, s.y, 4, s.size, s.size * 0.35, s.rotation);
        } else {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 0.75, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 99998,
        width: "100vw",
        height: "100vh",
      }}
      aria-hidden="true"
    />
  );
}
