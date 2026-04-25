/**
 * exercises.js - Exercise Detection & State Machine Engine
 * =========================================================
 * Port of exercises.py — defines exercise classes with state machine logic
 * for counting valid repetitions and analyzing form quality.
 *
 * State Machine Logic:
 *   State A (UP/STANDING)  = joint angle is ABOVE the upper threshold
 *   State B (DOWN/CURLED)  = joint angle is BELOW the lower threshold
 *
 *   Counter increases ONLY on a full A -> B -> A transition.
 *   Half-reps (not reaching State B) are NOT counted.
 *
 * Bilateral vs Unilateral:
 *   Bilateral exercises (squat, push-up, shoulder press) use BOTH arms/legs
 *   together — only the primary side drives rep counting to prevent double-counting.
 *   Unilateral exercises (bicep curl) track each side independently.
 */

/**
 * Base class for all exercises.
 * Each exercise tracks three body landmarks (forming an angle),
 * defines thresholds for "up" and "down" states, and provides
 * form feedback when the user is in a problematic range.
 *
 * @param {boolean} bilateral - If true, both sides move together and only
 *   the primary (left) side drives the rep counter. The right side is used
 *   only for angle visualization and form feedback.
 */
class Exercise {
  constructor(name, landmarks, altLandmarks, upThreshold, downThreshold, feedbackMsg, feedbackRange, icon, bilateral = false) {
    this.name = name;
    this.landmarks = landmarks;          // [p1, p2, p3] - Left side MediaPipe indices
    this.altLandmarks = altLandmarks;    // [p1, p2, p3] - Right side (alternate)
    this.upThreshold = upThreshold;
    this.downThreshold = downThreshold;
    this.feedbackMsg = feedbackMsg;
    this.feedbackRange = feedbackRange; // [low, high]
    this.icon = icon;
    this.bilateral = bilateral;         // Both sides move together (e.g., shoulder press)

    // State Machine variables
    this.counter = 0;
    this.phase = 'UP';
    this.phaseLeft = 'UP';
    this.phaseRight = 'UP';
    this.feedback = '';
    this.color = '#10B981'; // Green (emerald)
  }

  /**
   * Update the state machine with left and right angles.
   *
   * For BILATERAL exercises: averages both angles into a single value and
   * runs one state machine pass — guaranteeing exactly 1 rep per movement.
   *
   * For UNILATERAL exercises: processes each side independently so
   * alternating reps (e.g., left curl then right curl) each count.
   */
  update(angleLeft, angleRight) {
    let newFeedback = '';
    let worstColor = '#10B981';

    /**
     * Process a single angle through the state machine.
     * Returns { phase, repCompleted }.
     */
    const processSide = (angle, currentPhase) => {
      let phase = currentPhase;
      let repCompleted = false;
      if (angle === null || angle === undefined) return { phase, repCompleted };

      if (angle < this.downThreshold) {
        phase = 'DOWN';
        newFeedback = 'GOOD FORM!';
        worstColor = '#10B981';
      } else if (angle > this.upThreshold) {
        if (phase === 'DOWN') {
          repCompleted = true;
          phase = 'UP';
          newFeedback = 'REP COUNTED!';
          worstColor = '#10B981';
        } else {
          phase = 'UP';
          if (!newFeedback) worstColor = '#10B981';
        }
      } else if (angle >= this.feedbackRange[0] && angle <= this.feedbackRange[1]) {
        if (phase === 'UP') {
          newFeedback = this.feedbackMsg;
          worstColor = '#F59E0B'; // Orange warning
        }
      }
      return { phase, repCompleted };
    };

    if (this.bilateral) {
      // --- BILATERAL MODE ---
      // Merge both sides into a single representative angle.
      // Use the average if both are available, otherwise whichever is present.
      let mergedAngle = null;
      if (angleLeft != null && angleRight != null) {
        mergedAngle = (angleLeft + angleRight) / 2;
      } else if (angleLeft != null) {
        mergedAngle = angleLeft;
      } else if (angleRight != null) {
        mergedAngle = angleRight;
      }

      const { phase, repCompleted } = processSide(mergedAngle, this.phaseLeft);
      this.phaseLeft = phase;
      this.phaseRight = phase; // Keep in sync for UI

      if (repCompleted) {
        this.counter += 1;
      }
    } else {
      // --- UNILATERAL MODE ---
      // Each side counts independently (e.g., alternating bicep curls).
      if (angleLeft != null) {
        const resultL = processSide(angleLeft, this.phaseLeft);
        this.phaseLeft = resultL.phase;
        if (resultL.repCompleted) this.counter += 1;
      }
      if (angleRight != null) {
        const resultR = processSide(angleRight, this.phaseRight);
        this.phaseRight = resultR.phase;
        if (resultR.repCompleted) this.counter += 1;
      }
    }

    if (newFeedback) {
      this.feedback = newFeedback;
    }
    // Only update color if there's new feedback or it's non-green
    if (worstColor !== '#10B981' || newFeedback) {
      this.color = worstColor;
    }

    // Determine aggregate phase for UI (if either is down, consider in DOWN phase)
    this.phase = (this.phaseLeft === 'DOWN' || this.phaseRight === 'DOWN') ? 'DOWN' : 'UP';

    return { counter: this.counter, phase: this.phase, feedback: this.feedback, color: this.color };
  }

  reset() {
    this.counter = 0;
    this.phase = 'UP';
    this.phaseLeft = 'UP';
    this.phaseRight = 'UP';
    this.feedback = '';
    this.color = '#10B981';
  }
}

/**
 * Squat: Hip -> Knee -> Ankle
 * Left: 23,25,27 | Right: 24,26,28
 * Relaxed thresholds: Standing > 155 | Squatting < 110
 * (more forgiving for front-facing camera)
 * BILATERAL: both legs move together
 */
class Squat extends Exercise {
  constructor() {
    super('SQUAT', [23, 25, 27], [24, 26, 28], 155, 110, 'LOWER!', [110, 140], '🏋️', true);
  }
}

/**
 * Bicep Curl: Shoulder -> Elbow -> Wrist
 * Left: 11,13,15 | Right: 12,14,16
 * UNILATERAL: each arm counts independently (alternating curls)
 */
class BicepCurl extends Exercise {
  constructor() {
    super('BICEP CURL', [11, 13, 15], [12, 14, 16], 160, 40, 'CURL MORE!', [40, 80], '💪', false);
  }
}

/**
 * Push-Up: Shoulder -> Elbow -> Wrist
 * Left: 11,13,15 | Right: 12,14,16
 * Relaxed thresholds: Up > 155 | Down < 100
 * BILATERAL: both arms move together
 */
class PushUp extends Exercise {
  constructor() {
    super('PUSH-UP', [11, 13, 15], [12, 14, 16], 155, 100, 'GO LOWER!', [100, 130], '🫸', true);
  }
}

/**
 * Shoulder Press: Hip -> Shoulder -> Elbow
 * Left: 23,11,13 | Right: 24,12,14
 * BILATERAL: both arms move together
 */
class ShoulderPress extends Exercise {
  constructor() {
    super('SHOULDER PRESS', [23, 11, 13], [24, 12, 14], 160, 40, 'EXTEND FULLY!', [120, 160], '🙌', true);
  }
}

// Map exercise keys to classes
export const EXERCISE_MAP = {
  '1': { class: Squat, name: 'Squat', icon: '🏋️' },
  '2': { class: BicepCurl, name: 'Bicep Curl', icon: '💪' },
  '3': { class: PushUp, name: 'Push-Up', icon: '🫸' },
  '4': { class: ShoulderPress, name: 'Shoulder Press', icon: '🙌' },
};

/**
 * Manages the active exercise, processes each frame,
 * and returns the current exercise state for UI rendering.
 */
export class ExerciseDetector {
  constructor(defaultKey = null) {
    this.exercises = {};
    for (const [key, val] of Object.entries(EXERCISE_MAP)) {
      this.exercises[key] = new val.class();
    }
    this.currentKey = defaultKey;
    this.currentExercise = defaultKey ? this.exercises[defaultKey] : null;
  }

  switchExercise(key) {
    if (this.exercises[key]) {
      this.currentKey = key;
      this.currentExercise = this.exercises[key];
    }
  }

  update(angleLeft, angleRight) {
    if (!this.currentExercise) return { name: 'SELECT EXERCISE', counter: 0, phase: 'UP', feedback: '', color: '#10B981', angle: null };
    const result = this.currentExercise.update(angleLeft, angleRight);
    return {
      name: this.currentExercise.name,
      ...result,
      angle: angleLeft !== null ? angleLeft : angleRight,
    };
  }

  reset() {
    if (this.currentExercise) {
      this.currentExercise.reset();
    }
  }

  resetAll() {
    for (const ex of Object.values(this.exercises)) {
      ex.reset();
    }
  }
}
