import { useEffect, useRef } from 'react';

/**
 * ConfettiCanvas — Canvas-based confetti explosion with Web Audio synthesized fanfare.
 */
function ConfettiCanvas({ onComplete }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    // 1. Play Synthesized Fanfare (Web Audio API)
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        // C4 (261.6), E4 (329.6), G4 (392.0), C5 (523.3) arpeggio
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'triangle'; // warmer chip-tune sound
          osc.frequency.value = freq;
          
          gainNode.gain.setValueAtTime(0, now + idx * 0.08);
          gainNode.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);
          
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.5);
        });
      }
    } catch (e) {
      console.warn('AudioContext playback failed:', e);
    }

    // 2. Setup Canvas Confetti Physics
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

    const colors = [
      '#00df89', // emerald
      '#3b82f6', // blue
      '#a855f7', // purple
      '#ec4899', // pink
      '#f59e0b', // gold
      '#ef4444', // red
      '#06b6d4', // cyan
    ];

    const particleCount = 140;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 50,
        // Start slightly above the middle of screen for fountain effect
        y: height * 0.45,
        radius: Math.random() * 4 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        // Polar coordinates velocity
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 15 - 5, // shoot upwards
        gravity: 0.35,
        friction: 0.98,
        opacity: 1,
        fadeSpeed: Math.random() * 0.007 + 0.005,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        shape: Math.random() > 0.5 ? 'circle' : 'rect',
        width: Math.random() * 8 + 6,
        height: Math.random() * 14 + 8,
      });
    }

    let framesElapsed = 0;

    function update() {
      ctx.clearRect(0, 0, width, height);

      let activeCount = 0;

      for (const p of particles) {
        if (p.opacity <= 0) continue;
        activeCount++;

        p.vx *= p.friction;
        p.vy = p.vy * p.friction + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= p.fadeSpeed;
        p.rotation += p.rotationSpeed;

        if (p.opacity > 0) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
          }
          ctx.restore();
        }
      }

      framesElapsed++;

      // Automatically stop after particles fade or max timeout (3.5 seconds)
      if (activeCount > 0 && framesElapsed < 210) {
        animRef.current = requestAnimationFrame(update);
      } else {
        onComplete();
      }
    }

    animRef.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [onComplete]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        width: '100vw',
        height: '100vh',
      }}
    />
  );
}

export default ConfettiCanvas;
