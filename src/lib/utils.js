/**
 * utils.js - Mathematical Utility Functions for AI Gym Bro
 * =========================================================
 * Port of utils.py — contains angle calculation for exercise detection.
 */

/**
 * Calculates the angle (in degrees) at joint 'b' formed by points a-b-c.
 *
 * Uses Math.atan2 to compute the angle between two vectors:
 *   Vector 1: b -> a
 *   Vector 2: b -> c
 *
 * @param {number[]} a - [x, y] coordinates of the first joint (e.g., Hip)
 * @param {number[]} b - [x, y] coordinates of the middle/vertex joint (e.g., Knee)
 * @param {number[]} c - [x, y] coordinates of the third joint (e.g., Ankle)
 * @returns {number} The angle at joint 'b' in degrees, always between 0 and 180
 */
export function calculateAngle(a, b, c) {
  const radians =
    Math.atan2(c[1] - b[1], c[0] - b[0]) -
    Math.atan2(a[1] - b[1], a[0] - b[0]);

  let angle = Math.abs(radians * (180.0 / Math.PI));

  // Ensure we always return the inner angle (<= 180 degrees)
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }

  return angle;
}
