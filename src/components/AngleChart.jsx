import { useEffect, useRef } from 'react';
import './AngleChart.css';

function AngleChart({ angle, color, height = 75 }) {
  const canvasRef = useRef(null);
  const angleHistoryRef = useRef([]);

  useEffect(() => {
    if (angle === null || angle === undefined) {
      angleHistoryRef.current = [];
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const now = Date.now();
    angleHistoryRef.current.push({
      angle: angle,
      color: color,
      time: now,
    });

    // Keep last 5 seconds of data
    const cutoff = now - 5000;
    angleHistoryRef.current = angleHistoryRef.current.filter((pt) => pt.time >= cutoff);

    // Draw on Canvas
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    // Set correct dimensions for high-DPI displays
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);

    const history = angleHistoryRef.current;
    if (history.length < 2) return;

    // Draw background grid lines (horizontal lines at 45°, 90°, 135°)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridAngles = [45, 90, 135];
    ctx.font = '8px Orbitron, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    
    gridAngles.forEach((gridAngle) => {
      // Map 0° to h - 6, 180° to 6
      const y = h - 6 - (gridAngle / 180) * (h - 12);
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();
      
      // Label text
      ctx.fillText(`${gridAngle}°`, 6, y + 3);
    });

    // Draw the continuous path
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < history.length; i++) {
      const p1 = history[i - 1];
      const p2 = history[i];

      const getX = (t) => {
        const pct = (t - cutoff) / 5000;
        return 35 + pct * (w - 45);
      };

      const getY = (ang) => {
        const clamped = Math.max(0, Math.min(180, ang));
        return h - 6 - (clamped / 180) * (h - 12);
      };

      const x1 = getX(p1.time);
      const y1 = getY(p1.angle);
      const x2 = getX(p2.time);
      const y2 = getY(p2.angle);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);

      const isWarning = p2.color === '#F59E0B' || p2.color === '#f59e0b' || p2.color === '#f43f5e' || p2.color === '#F43F5E';
      ctx.strokeStyle = isWarning ? '#f59e0b' : '#00df89';
      
      // Glow effect
      ctx.shadowColor = isWarning ? 'rgba(245, 158, 11, 0.5)' : 'rgba(0, 223, 137, 0.5)';
      ctx.shadowBlur = 4;

      ctx.stroke();
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
  }, [angle, color]);

  return (
    <div className="angle-chart" style={{ height: `${height}px` }}>
      <canvas ref={canvasRef} className="angle-chart__canvas" />
    </div>
  );
}

export default AngleChart;
