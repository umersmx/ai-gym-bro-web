import { useEffect, useRef } from 'react';

/**
 * SparkleBackground — Canvas-based twinkling sparkle particles.
 * Renders small dots that twinkle in/out at random positions across the viewport.
 * Fully non-interactive (pointer-events: none).
 */
function SparkleBackground({ sparkleCount = 60 }) {
  const canvasRef = useRef(null);
  const sparklesRef = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }
    resize();
    window.addEventListener('resize', resize);

    // Create sparkle particles
    function createSparkle() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random(),
        speed: Math.random() * 0.008 + 0.003,  // fade speed
        direction: Math.random() > 0.5 ? 1 : -1, // fade in or out
        color: Math.random() > 0.7
          ? `rgba(0, 223, 137, `     // emerald sparkle (30%)
          : Math.random() > 0.5
            ? `rgba(59, 130, 246, `   // blue sparkle (15%)
            : `rgba(255, 255, 255, `, // white sparkle (55%)
        // Slight drift
        driftX: (Math.random() - 0.5) * 0.15,
        driftY: (Math.random() - 0.5) * 0.1,
      };
    }

    sparklesRef.current = Array.from({ length: sparkleCount }, createSparkle);

    function draw() {
      ctx.clearRect(0, 0, width, height);

      for (const s of sparklesRef.current) {
        // Update opacity
        s.opacity += s.speed * s.direction;
        if (s.opacity >= 1) {
          s.opacity = 1;
          s.direction = -1;
        } else if (s.opacity <= 0) {
          s.opacity = 0;
          s.direction = 1;
          // Reposition when fully faded out
          s.x = Math.random() * width;
          s.y = Math.random() * height;
          s.size = Math.random() * 2.5 + 0.5;
        }

        // Slight drift
        s.x += s.driftX;
        s.y += s.driftY;

        // Wrap around edges
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        // Draw sparkle
        if (s.opacity > 0.02) {
          // Core dot
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = s.color + s.opacity + ')';
          ctx.fill();

          // Outer glow
          if (s.opacity > 0.4 && s.size > 1.2) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 2, 0, Math.PI * 2);
            ctx.fillStyle = s.color + (s.opacity * 0.15) + ')';
            ctx.fill();
          }

          // Cross sparkle rays for brightest particles
          if (s.opacity > 0.7 && s.size > 1.5) {
            ctx.strokeStyle = s.color + (s.opacity * 0.3) + ')';
            ctx.lineWidth = 0.5;

            // Horizontal ray
            ctx.beginPath();
            ctx.moveTo(s.x - s.size * 3, s.y);
            ctx.lineTo(s.x + s.size * 3, s.y);
            ctx.stroke();

            // Vertical ray
            ctx.beginPath();
            ctx.moveTo(s.x, s.y - s.size * 3);
            ctx.lineTo(s.x, s.y + s.size * 3);
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [sparkleCount]);

  return (
    <canvas
      ref={canvasRef}
      className="sparkle-bg"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

export default SparkleBackground;
