/**
 * poseDetector.js - MediaPipe Pose Landmarker Wrapper
 * =====================================================
 * Port of pose_detector.py — wraps the MediaPipe Tasks Vision JS SDK
 * for real-time pose detection in the browser.
 *
 * Uses @mediapipe/tasks-vision PoseLandmarker (WASM-based).
 */

import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { calculateAngle } from './utils';

// MediaPipe Pose skeleton connections for drawing
const POSE_CONNECTIONS = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  // Upper body
  [11, 12],             // Shoulders
  [11, 13], [13, 15],   // Left arm
  [12, 14], [14, 16],   // Right arm
  [15, 17], [15, 19], [15, 21],  // Left hand
  [16, 18], [16, 20], [16, 22],  // Right hand
  // Torso
  [11, 23], [12, 24], [23, 24],
  // Lower body
  [23, 25], [25, 27],   // Left leg
  [24, 26], [26, 28],   // Right leg
  [27, 29], [27, 31],   // Left foot
  [28, 30], [28, 32],   // Right foot
];

/**
 * PoseDetector wraps MediaPipe PoseLandmarker for browser-based pose detection.
 */
export class PoseDetector {
  constructor() {
    this.landmarker = null;
    this.lastResult = null;
    this.landmarks = []; // [{x, y, z, visibility}, ...]
    this.isReady = false;
  }

  /**
   * Initialize the PoseLandmarker by loading WASM runtime + model from CDN.
   */
  async init() {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.isReady = true;
      console.log('PoseLandmarker initialized successfully!');
      return true;
    } catch (error) {
      console.error('Failed to initialize PoseLandmarker:', error);
      return false;
    }
  }

  /**
   * Detect pose landmarks from a video frame.
   * @param {HTMLVideoElement} video - The video element to detect from
   * @param {number} timestamp - The current timestamp in milliseconds
   * @returns {Array|null} Array of 33 landmarks or null if not detected
   */
  detect(video, timestamp) {
    if (!this.landmarker || !this.isReady) return null;

    try {
      const result = this.landmarker.detectForVideo(video, timestamp);
      this.lastResult = result;

      if (result.landmarks && result.landmarks.length > 0) {
        this.landmarks = result.landmarks[0];
        return this.landmarks;
      }
    } catch (e) {
      // Silently handle detection errors (common during camera startup)
    }

    this.landmarks = [];
    return null;
  }

  /**
   * Draw the skeleton overlay on a canvas context.
   * @param {CanvasRenderingContext2D} ctx - Canvas context to draw on
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  drawSkeleton(ctx, width, height) {
    if (!this.landmarks || this.landmarks.length === 0) return;

    const lm = this.landmarks;

    // Draw connections (skeleton lines)
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
      if (startIdx < lm.length && endIdx < lm.length) {
        const a = lm[startIdx];
        const b = lm[endIdx];
        const x1 = a.x * width;
        const y1 = a.y * height;
        const x2 = b.x * width;
        const y2 = b.y * height;

        if ((x1 > 0 || y1 > 0) && (x2 > 0 || y2 > 0)) {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }

    // Draw landmark points
    for (const point of lm) {
      const x = point.x * width;
      const y = point.y * height;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#10B981';
      ctx.fill();
    }
  }

  /**
   * Calculate and draw angle visualization at a joint.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} p1 - First landmark index
   * @param {number} p2 - Vertex landmark index
   * @param {number} p3 - Third landmark index
   * @returns {number|null} The angle in degrees, or null
   */
  findAngle(ctx, width, height, p1, p2, p3) {
    if (!this.landmarks || this.landmarks.length === 0) return null;

    const lm = this.landmarks;
    if (p1 >= lm.length || p2 >= lm.length || p3 >= lm.length) return null;

    const x1 = lm[p1].x * width, y1 = lm[p1].y * height;
    const x2 = lm[p2].x * width, y2 = lm[p2].y * height;
    const x3 = lm[p3].x * width, y3 = lm[p3].y * height;

    const angle = calculateAngle([x1, y1], [x2, y2], [x3, y3]);

    // Draw angle visualization
    if (ctx) {
      // Lines connecting the three joints
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.stroke();

      // Joint circles
      const drawJoint = (x, y, color, radius = 10) => {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, 2 * Math.PI);
        ctx.stroke();
      };

      drawJoint(x1, y1, '#EF4444'); // Red
      drawJoint(x2, y2, '#FBBF24'); // Yellow (vertex)
      drawJoint(x3, y3, '#EF4444'); // Red

      // Angle text near vertex joint
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(`${Math.round(angle)}°`, x2 - 30, y2 + 35);
      ctx.fillText(`${Math.round(angle)}°`, x2 - 30, y2 + 35);
    }

    return angle;
  }

  /**
   * Clean up resources.
   */
  destroy() {
    if (this.landmarker) {
      this.landmarker.close();
      this.landmarker = null;
    }
    this.isReady = false;
  }
}
