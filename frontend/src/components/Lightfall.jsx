/**
 * Lightfall Component — Interactive glowing particle & streak background animation.
 */
import { useEffect, useRef } from 'react';
import './Lightfall.css';

export default function Lightfall({
  colors = ["#A6C8FF", "#5227FF", "#FF9FFC"],
  backgroundColor = "#0A29FF",
  speed = 0.3,
  streakCount = 4,
  streakWidth = 0.7,
  streakLength = 0.8,
  density = 0.7,
  twinkle = 0.65,
  glow = 1,
  backgroundGlow = 1.1,
  zoom = 3,
  opacity = 1,
  mouseInteraction = true,
  mouseStrength = 0.2,
  mouseRadius = 0.2,
}) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Track window resize
    const handleResize = () => {
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    // Track mouse
    const handleMouseMove = (e) => {
      if (!mouseInteraction) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = -1000;
      mouseRef.current.targetY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Generate streak columns & particles
    let particles = [];
    let streaks = [];

    const initParticles = () => {
      particles = [];
      streaks = [];

      const totalParticles = Math.floor(120 * density * (zoom / 2));
      const effectiveStreakCount = Math.max(1, Math.floor(streakCount));

      // Calculate streak column X positions across canvas
      for (let s = 0; s < effectiveStreakCount; s++) {
        const xPct = (s + 0.5) / effectiveStreakCount;
        streaks.push({
          x: xPct * width,
          baseX: xPct * width,
          width: (25 + Math.random() * 35) * streakWidth * (zoom / 2),
          length: (200 + Math.random() * 250) * streakLength,
          color: colors[s % colors.length],
          speed: (1.5 + Math.random() * 2) * speed * 2,
          y: Math.random() * height,
        });
      }

      // Generate falling light particles
      for (let i = 0; i < totalParticles; i++) {
        const streakIdx = i % effectiveStreakCount;
        const parentStreak = streaks[streakIdx];

        particles.push({
          streakIdx,
          x: parentStreak.baseX + (Math.random() - 0.5) * parentStreak.width * 2,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (1.2 + Math.random() * 2.5) * speed * 2.5,
          size: (1.5 + Math.random() * 3.5) * (zoom / 2),
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 0.3 + Math.random() * 0.7,
          twinkleSpeed: 0.02 + Math.random() * 0.04 * twinkle,
          twinklePhase: Math.random() * Math.PI * 2,
          length: (30 + Math.random() * 60) * streakLength,
        });
      }
    };

    initParticles();

    // Render loop
    let lastTime = performance.now();

    const render = (now) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.1;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.1;

      // 1. Draw Base Background with radial glow
      ctx.globalAlpha = opacity;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Radial background glow centered
      if (backgroundGlow > 0) {
        const bgGlowRad = Math.max(width, height) * 0.7 * backgroundGlow;
        const grad = ctx.createRadialGradient(
          width * 0.5, height * 0.3, 10,
          width * 0.5, height * 0.3, bgGlowRad
        );
        grad.addColorStop(0, 'rgba(82, 39, 255, 0.35)');
        grad.addColorStop(0.5, 'rgba(166, 200, 255, 0.12)');
        grad.addColorStop(1, 'rgba(10, 41, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.globalCompositeOperation = 'lighter';

      // 2. Draw Falling Streaks
      streaks.forEach((st) => {
        st.y += st.speed * 60 * delta;
        if (st.y > height + st.length) {
          st.y = -st.length;
        }

        // Mouse interaction for streaks
        if (mouseInteraction && mouseRef.current.x > 0) {
          const dx = mouseRef.current.x - st.baseX;
          const dy = mouseRef.current.y - st.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = Math.min(width, height) * mouseRadius * 2.5;

          if (dist < maxDist) {
            const force = (1 - dist / maxDist) * mouseStrength * 80;
            st.x = st.baseX - (dx / (dist || 1)) * force;
          } else {
            st.x += (st.baseX - st.x) * 0.05;
          }
        } else {
          st.x += (st.baseX - st.x) * 0.05;
        }

        // Draw glowing gradient streak tail
        const streakGrad = ctx.createLinearGradient(st.x, st.y - st.length, st.x, st.y);
        streakGrad.addColorStop(0, 'rgba(0,0,0,0)');
        streakGrad.addColorStop(0.7, st.color + '44');
        streakGrad.addColorStop(1, st.color + 'CC');

        ctx.lineWidth = st.width;
        ctx.strokeStyle = streakGrad;
        if (glow > 0) {
          ctx.shadowBlur = 20 * glow;
          ctx.shadowColor = st.color;
        }

        ctx.beginPath();
        ctx.moveTo(st.x, st.y - st.length);
        ctx.lineTo(st.x, st.y);
        ctx.stroke();
      });

      // 3. Draw Particles & Sparkles
      const interactionDist = Math.min(width, height) * mouseRadius;

      particles.forEach((p) => {
        p.y += p.vy * 60 * delta;
        p.x += p.vx * 60 * delta;
        p.twinklePhase += p.twinkleSpeed * 60 * delta;

        if (p.y > height + p.length) {
          p.y = -p.length - Math.random() * 50;
          const parentStreak = streaks[p.streakIdx] || streaks[0];
          p.x = parentStreak.baseX + (Math.random() - 0.5) * parentStreak.width * 2.5;
        }

        // Mouse repulsion / deflection
        if (mouseInteraction && mouseRef.current.x > 0) {
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < interactionDist) {
            const force = (1 - dist / interactionDist) * mouseStrength * 15;
            p.x += (dx / (dist || 1)) * force;
            p.y += (dy / (dist || 1)) * force;
          }
        }

        // Twinkle alpha calculation
        const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.twinklePhase));

        // Particle line tail
        const partGrad = ctx.createLinearGradient(p.x, p.y - p.length, p.x, p.y);
        partGrad.addColorStop(0, 'rgba(0,0,0,0)');
        partGrad.addColorStop(1, p.color);

        ctx.lineWidth = p.size;
        ctx.strokeStyle = partGrad;
        ctx.globalAlpha = currentAlpha * opacity;

        if (glow > 0) {
          ctx.shadowBlur = 12 * glow;
          ctx.shadowColor = p.color;
        }

        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.length);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // Glowing particle head dot
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Reset shadows & composite
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [
    colors,
    backgroundColor,
    speed,
    streakCount,
    streakWidth,
    streakLength,
    density,
    twinkle,
    glow,
    backgroundGlow,
    zoom,
    opacity,
    mouseInteraction,
    mouseStrength,
    mouseRadius,
  ]);

  return (
    <div className="lightfall-container">
      <canvas ref={canvasRef} className="lightfall-canvas" />
    </div>
  );
}
