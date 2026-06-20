import { useCallback } from 'react';

/**
 * use3DTilt — A React hook to apply interactive 3D parallax tilt and cursor-following
 * glare to any element. Returns mouse handlers to spread on target elements.
 * 
 * @param {number} maxTilt - The maximum tilt angle in degrees.
 * @param {number} scale - Scale multiplier on hover.
 * @returns {object} Event handlers to bind to the elements.
 */
export function use3DTilt(maxTilt = 10, scale = 1.03) {
  const handleMouseMove = useCallback((e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalize coordinates from -1 to 1 relative to center
    const xc = ((x / rect.width) - 0.5) * 2;
    const yc = ((y / rect.height) - 0.5) * 2;

    // Apply rotation styles
    el.style.setProperty('--rx', `${-yc * maxTilt}deg`);
    el.style.setProperty('--ry', `${xc * maxTilt}deg`);
    // Glare coordinates (0% to 100%)
    el.style.setProperty('--mx', `${(x / rect.width) * 100}%`);
    el.style.setProperty('--my', `${(y / rect.height) * 100}%`);
    // Scale on hover
    el.style.setProperty('--scale', `${scale}`);
  }, [maxTilt, scale]);

  const handleMouseLeave = useCallback((e) => {
    const el = e.currentTarget;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--mx', '50%');
    el.style.setProperty('--my', '50%');
    el.style.setProperty('--scale', '1');
  }, []);

  return {
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };
}
