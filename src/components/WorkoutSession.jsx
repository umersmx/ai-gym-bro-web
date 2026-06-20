import { useRef, useState, useEffect, useCallback } from 'react';
import { CameraOff, RefreshCw, Zap, Home, Dumbbell, Plus, BookOpen, User } from 'lucide-react';
import { PoseDetector } from '../lib/poseDetector';
import { ExerciseDetector, EXERCISE_MAP } from '../lib/exercises';
import { calculateAngle } from '../lib/utils';
import ExerciseSelector from './ExerciseSelector';
import StatsPanel from './StatsPanel';
import ConfettiCanvas from './ConfettiCanvas';
import AngleChart from './AngleChart';
import './WorkoutSession.css';

function WorkoutSession({ initialExerciseKey = null, onBack }) {
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const engineRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const facingModeRef = useRef('user');
  const formQualityTicksRef = useRef([]);

  // State
  const [status, setStatus] = useState('initializing'); // initializing | loading-model | ready | error
  const [errorMsg, setErrorMsg] = useState('');
  const [currentKey, setCurrentKey] = useState(initialExerciseKey);
  const [stats, setStats] = useState(() => {
    if (initialExerciseKey && EXERCISE_MAP[initialExerciseKey]) {
      return {
        name: EXERCISE_MAP[initialExerciseKey].name,
        counter: 0,
        phase: 'UP',
        feedback: '',
        color: '#00df89',
        angle: null,
      };
    }
    return {
      name: 'SELECT EXERCISE',
      counter: 0,
      phase: 'UP',
      feedback: '',
      color: '#00df89',
      angle: null,
    };
  });
  const [fps, setFps] = useState(0);
  const [bodyDetected, setBodyDetected] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [torchOn, setTorchOn] = useState(false);
  const [targetGoal, setTargetGoal] = useState(10); // default goal: 10 reps
  const [celebrating, setCelebrating] = useState(false);
  const celebratedForSet = useRef(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const isSimulatingRef = useRef(false);

  // Trigger celebration on matching target goal
  useEffect(() => {
    if (targetGoal > 0 && stats.counter >= targetGoal && !celebratedForSet.current) {
      celebratedForSet.current = true;
      setCelebrating(true);
    }
  }, [stats.counter, targetGoal]);

  // Initialize camera and pose detector
  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        // Step 1: Request camera access
        setStatus('initializing');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: facingModeRef.current,
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        // Step 2: Load MediaPipe model
        setStatus('loading-model');
        const detector = new PoseDetector();
        const success = await detector.init();

        if (cancelled) {
          detector.destroy();
          return;
        }

        if (!success) {
          setErrorMsg('Failed to load the AI model. Please refresh and try again.');
          setStatus('error');
          return;
        }

        detectorRef.current = detector;

        // Step 3: Init exercise engine (with initial exercise key)
        const engine = new ExerciseDetector(initialExerciseKey);
        engineRef.current = engine;

        setStatus('ready');
      } catch (err) {
        if (!cancelled) {
          console.error('Setup error:', err);
          if (err.name === 'NotAllowedError') {
            setErrorMsg('Camera access was denied. Please allow camera access and reload.');
          } else if (err.name === 'NotFoundError') {
            setErrorMsg('No camera found on this device.');
          } else {
            setErrorMsg(`Setup failed: ${err.message}`);
          }
          setStatus('error');
        }
      }
    }

    setup();

    return () => {
      cancelled = true;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (detectorRef.current) {
        detectorRef.current.destroy();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Detection loop
  useEffect(() => {
    if (status !== 'ready') return;

    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    function detectFrame() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const detector = detectorRef.current;
      const engine = engineRef.current;

      if (!video || !canvas || !detector || !engine) {
        animFrameRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      const ctx = canvas.getContext('2d');
      const w = video.videoWidth;
      const h = video.videoHeight;

      if (w === 0 || h === 0) {
        animFrameRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      canvas.width = w;
      canvas.height = h;

      if (isSimulatingRef.current) {
        setBodyDetected(true);
        const timestamp = performance.now();
        // Simulate a smooth rep cycle: a sine wave oscillating between 35° and 165°
        // Cycle time: 4.5 seconds per rep (frequency = 2 * PI / 4500)
        const period = 4500;
        const angleValue = 100 + Math.sin((timestamp / period) * Math.PI * 2) * 65;

        // Draw simulation overlay on canvas
        ctx.fillStyle = 'rgba(0, 223, 137, 0.12)';
        ctx.fillRect(0, 0, w, h);
        
        ctx.strokeStyle = '#00df89';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, w, h);

        ctx.font = 'bold 24px Orbitron, sans-serif';
        ctx.fillStyle = '#00df89';
        ctx.textAlign = 'center';
        ctx.fillText('SIMULATION ACTIVE', w / 2, 40);

        if (engine && engine.currentExercise) {
          // Feed simulated angles into the engine
          const result = engine.update(angleValue, angleValue);
          setStats(result);

          // Draw a mock visual arm/leg angle on canvas
          const cx = w / 2, cy = h / 2 + 30;
          const len = 100;
          const r1 = (angleValue * Math.PI) / 180;
          
          // Joint 1: center
          // Joint 2: up
          const x1 = cx;
          const y1 = cy - len;
          // Joint 3: angled
          const x2 = cx + len * Math.sin(r1);
          const y2 = cy - len * Math.cos(r1);

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(cx, cy);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // Draw joint circles
          const drawJoint = (x, y, jointColor) => {
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, 2 * Math.PI);
            ctx.fillStyle = jointColor;
            ctx.fill();
          };
          drawJoint(x1, y1, '#f43f5e');
          drawJoint(cx, cy, '#f59e0b');
          drawJoint(x2, y2, '#f43f5e');

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px Orbitron, sans-serif';
          ctx.fillText(`${Math.round(angleValue)}°`, cx, cy + 45);

          // Record form quality ticks (same logic as actual loop)
          if (result.feedback) {
            const isWarning = result.color === '#F59E0B' || result.color === '#f59e0b' ||
                              result.feedback === 'LOWER!' || result.feedback === 'CURL MORE!' ||
                              result.feedback === 'GO LOWER!' || result.feedback === 'EXTEND FULLY!';
            const score = isWarning ? 70 : 100;
            formQualityTicksRef.current.push(score);
          }
        } else {
          setStats(prev => ({
            ...prev,
            name: 'SELECT EXERCISE',
            feedback: 'Pick an exercise to start simulating',
            color: '#00df89',
          }));
        }

        // FPS calculation
        frameCount++;
        const now = performance.now();
        if (now - lastFpsUpdate >= 1000) {
          setFps(frameCount);
          frameCount = 0;
          lastFpsUpdate = now;
        }

        animFrameRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      // Draw video frame on canvas (mirror for front camera)
      if (facingModeRef.current === 'user') {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-w, 0);
        ctx.drawImage(video, 0, 0, w, h);
        ctx.restore();
      } else {
        ctx.drawImage(video, 0, 0, w, h);
      }

      // Run pose detection
      const timestamp = performance.now();
      const landmarks = detector.detect(video, timestamp);

      if (landmarks && landmarks.length > 0) {
        setBodyDetected(true);

        // Mirror landmarks coordinates if front camera
        if (facingModeRef.current === 'user') {
          detector.landmarks.forEach(pt => {
            pt.x = 1 - pt.x;
          });
        }

        // Draw skeleton
        detector.drawSkeleton(ctx, w, h);

        // Only track exercise if one is selected
        const ex = engine.currentExercise;
        if (ex) {
          const lm = detector.landmarks;

          // Helper: calculate angle for a set of landmarks
          const calcSideAngle = (indices) => {
            const [i1, i2, i3] = indices;
            if (i1 >= lm.length || i2 >= lm.length || i3 >= lm.length) return null;
            const ax = lm[i1].x * w, ay = lm[i1].y * h;
            const bx = lm[i2].x * w, by = lm[i2].y * h;
            const cx = lm[i3].x * w, cy = lm[i3].y * h;
            return {
              angle: calculateAngle([ax, ay], [bx, by], [cx, cy]),
              coords: { x1: ax, y1: ay, x2: bx, y2: by, x3: cx, y3: cy }
            };
          };

          // Calculate angle for both left and right side
          const leftResult = calcSideAngle(ex.landmarks);
          const altResult = ex.altLandmarks ? calcSideAngle(ex.altLandmarks) : null;

          const drawSideAngle = (result) => {
            if (!result) return;
            const { angle, coords } = result;
            const { x1, y1, x2, y2, x3, y3 } = coords;

            // Draw angle visualization on canvas
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.stroke();

            // Joint circles
            const drawJoint = (x, y, fillColor) => {
              ctx.beginPath();
              ctx.arc(x, y, 10, 0, 2 * Math.PI);
              ctx.fillStyle = fillColor;
              ctx.fill();
              ctx.strokeStyle = fillColor;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(x, y, 15, 0, 2 * Math.PI);
              ctx.stroke();
            };

            drawJoint(x1, y1, '#f43f5e');
            drawJoint(x2, y2, '#f59e0b');
            drawJoint(x3, y3, '#f43f5e');

            // Angle text
            ctx.font = 'bold 18px Orbitron, sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.strokeText(`${Math.round(angle)}°`, x2 - 30, y2 + 40);
            ctx.fillText(`${Math.round(angle)}°`, x2 - 30, y2 + 40);
          };

          if (leftResult || altResult) {
            drawSideAngle(leftResult);
            drawSideAngle(altResult);

            const angleLeft = leftResult ? leftResult.angle : null;
            const angleRight = altResult ? altResult.angle : null;

            // Update exercise engine
            const result = engine.update(angleLeft, angleRight);
            setStats(result);

            // Record form quality tick
            if (result.feedback && result.feedback !== 'NO BODY DETECTED' && result.feedback !== 'Pick an exercise to start tracking') {
              const isWarning = result.color === '#F59E0B' || result.color === '#f59e0b' ||
                                result.feedback === 'LOWER!' || result.feedback === 'CURL MORE!' ||
                                result.feedback === 'GO LOWER!' || result.feedback === 'EXTEND FULLY!';
              const score = isWarning ? 70 : 100;
              formQualityTicksRef.current.push(score);
            }
          }
        } else {
          // No exercise selected — just show skeleton
          setStats((prev) => ({
            ...prev,
            name: 'SELECT EXERCISE',
            feedback: 'Pick an exercise to start tracking',
            color: '#00df89',
          }));
        }
      } else {
        setBodyDetected(false);
        setStats((prev) => ({
          ...prev,
          feedback: 'NO BODY DETECTED',
          color: '#f43f5e',
          angle: null,
        }));
      }

      // FPS calculation
      frameCount++;
      const now = performance.now();
      if (now - lastFpsUpdate >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastFpsUpdate = now;
      }

      animFrameRef.current = requestAnimationFrame(detectFrame);
    }

    animFrameRef.current = requestAnimationFrame(detectFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [status]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      const key = e.key;
      if (['1', '2', '3', '4'].includes(key)) {
        handleExerciseSwitch(key);
      } else if (key === 'd' || key === 'D') {
        handleDeselect();
      } else if (key === 'r' || key === 'R') {
        handleReset();
      } else if (key === 'Escape') {
        handleBack();
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const saveCompletedSet = useCallback((exerciseName, reps) => {
    if (reps <= 0 || exerciseName === 'SELECT EXERCISE') return;
    try {
      const history = JSON.parse(localStorage.getItem('gym-bro-history') || '[]');
      
      const ticks = formQualityTicksRef.current;
      const avgScore = ticks.length > 0
        ? Math.round(ticks.reduce((sum, val) => sum + val, 0) / ticks.length)
        : 100;

      const newSet = {
        id: Date.now(),
        date: new Date().toISOString(),
        exercise: exerciseName,
        reps: reps,
        formScore: avgScore,
      };
      localStorage.setItem('gym-bro-history', JSON.stringify([...history, newSet]));
    } catch (e) {
      console.warn('Failed to save set in localStorage:', e);
    } finally {
      formQualityTicksRef.current = []; // Always reset ticks ref
    }
  }, []);

  const handleExerciseSwitch = useCallback((key) => {
    if (engineRef.current) {
      // Save running set before switching
      if (stats.counter > 0 && stats.name !== 'SELECT EXERCISE') {
        saveCompletedSet(stats.name, stats.counter);
      }
      
      engineRef.current.switchExercise(key);
      setCurrentKey(key);
      const ex = engineRef.current.currentExercise;
      setStats({
        name: ex.name,
        counter: ex.counter,
        phase: ex.phase,
        feedback: '',
        color: '#00df89',
        angle: null,
      });
      celebratedForSet.current = false;
    }
  }, [stats.counter, stats.name, saveCompletedSet]);

  const handleDeselect = useCallback(() => {
    if (stats.counter > 0 && stats.name !== 'SELECT EXERCISE') {
      saveCompletedSet(stats.name, stats.counter);
    }

    if (engineRef.current) {
      engineRef.current.currentKey = null;
      engineRef.current.currentExercise = null;
    }
    setCurrentKey(null);
    setStats({
      name: 'SELECT EXERCISE',
      counter: 0,
      phase: 'UP',
      feedback: '',
      color: '#00df89',
      angle: null,
    });
    celebratedForSet.current = false;
  }, [stats.counter, stats.name, saveCompletedSet]);

  const handleReset = useCallback(() => {
    if (stats.counter > 0 && stats.name !== 'SELECT EXERCISE') {
      saveCompletedSet(stats.name, stats.counter);
    }

    if (engineRef.current) {
      engineRef.current.reset();
      setStats((prev) => ({
        ...prev,
        counter: 0,
        phase: 'UP',
        feedback: '',
        color: '#00df89',
      }));
      celebratedForSet.current = false;
    }
  }, [stats.counter, stats.name, saveCompletedSet]);

  const handleBack = useCallback(() => {
    isSimulatingRef.current = false;
    if (stats.counter > 0 && stats.name !== 'SELECT EXERCISE') {
      saveCompletedSet(stats.name, stats.counter);
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (detectorRef.current) {
      detectorRef.current.destroy();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    onBack();
  }, [stats.counter, stats.name, saveCompletedSet, onBack]);

  const toggleSimulation = useCallback(() => {
    setIsSimulating(prev => {
      const next = !prev;
      isSimulatingRef.current = next;
      if (next) {
        setBodyDetected(true);
        setStatus('ready');
      } else {
        setBodyDetected(false);
      }
      return next;
    });
  }, []);

  const handleFlipCamera = useCallback(async () => {
    const newMode = facingModeRef.current === 'user' ? 'environment' : 'user';
    facingModeRef.current = newMode;
    setFacingMode(newMode);
    setTorchOn(false);

    // Stop current stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: newMode,
        },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();
    } catch (err) {
      console.error('Failed to switch camera:', err);
    }
  }, []);

  const handleToggleTorch = useCallback(async () => {
    if (!streamRef.current) return;

    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    const newTorchState = !torchOn;

    try {
      await track.applyConstraints({
        advanced: [{ torch: newTorchState }],
      });
      setTorchOn(newTorchState);
    } catch (err) {
      console.error('Torch not supported on this device/camera:', err);
    }
  }, [torchOn]);

  const getMobileHeaderTitle = () => {
    if (currentKey) {
      const name = EXERCISE_MAP[currentKey]?.name;
      // Return plural for Squat to Squats to match mockup
      return name === 'Squat' ? 'SQUATS' : `${name.toUpperCase()}S`;
    }
    return 'EXERCISES';
  };

  return (
    <div className="workout">
      {/* Responsive Top Bar */}
      <header className="workout__topbar glass">
        <button className="workout__back-btn" onClick={handleBack} id="back-btn">
          <span>← Back</span>
        </button>
        <div className="workout__topbar-center">
          <div className={`workout__status-dot ${bodyDetected ? 'workout__status-dot--active' : ''}`} />
          <span className="workout__status-text workout__status-text--desktop">
            {status === 'ready'
              ? currentKey === null
                ? 'SELECT AN EXERCISE TO BEGIN'
                : bodyDetected
                  ? `${stats.name} SESSION ACTIVE`
                  : 'WAITING FOR BODY'
              : status === 'loading-model'
              ? 'LOADING AI MODEL...'
              : status === 'initializing'
              ? 'STARTING CAMERA...'
              : 'ERROR'
            }
          </span>
          <span className="workout__status-text workout__status-text--mobile">
            {getMobileHeaderTitle()}
          </span>
        </div>
        <div className="workout__topbar-right">
          <button
            className={`workout__sim-btn ${isSimulating ? 'workout__sim-btn--active' : ''}`}
            onClick={toggleSimulation}
            title={isSimulating ? 'Stop Simulation' : 'Simulate Workout Reps'}
            id="sim-btn"
          >
            <span>{isSimulating ? '⏹️ Stop Sim' : '▶️ Simulate'}</span>
          </button>
          <button
            className={`workout__torch-btn ${torchOn ? 'workout__torch-btn--active' : ''}`}
            onClick={handleToggleTorch}
            title={torchOn ? 'Turn Off Flashlight' : 'Turn On Flashlight'}
            id="torch-btn"
          >
            <Zap size={16} />
          </button>
          <button
            className="workout__flip-btn"
            onClick={handleFlipCamera}
            title="Flip Camera"
            id="flip-camera-btn"
          >
            <RefreshCw size={16} />
          </button>
          <div className="workout__fps">
            FPS: <span className="workout__fps-value">{fps}</span>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="workout__content">
        
        {/* Left Sidebar (Desktop only) */}
        <aside className="workout__sidebar workout__sidebar--left workout__sidebar--desktop-only">
          <ExerciseSelector
            currentKey={currentKey}
            onSelect={handleExerciseSwitch}
            onDeselect={handleDeselect}
          />
          <div className="workout__controls-hint">
            <p>⌨️ Keyboard shortcuts:</p>
            <p><strong>1-4</strong> Switch exercise</p>
            <p><strong>D</strong> Deselect exercise</p>
            <p><strong>R</strong> Reset counter</p>
            <p><strong>ESC</strong> Go back</p>
          </div>
        </aside>

        {/* Dynamic Center View (Adapts to mobile!) */}
        <div className="workout__center-view">
          
          <main className="workout__camera-wrap">
            <video ref={videoRef} className="workout__video" playsInline muted />
            <canvas ref={canvasRef} className="workout__canvas" />

            {status !== 'ready' && status !== 'error' && (
              <div className="workout__loading-overlay">
                <div className="workout__spinner-circle" />
                <p className="workout__loading-text">
                  {status === 'initializing' ? 'Starting camera...' : 'Loading AI Pose Model...'}
                </p>
                <p className="workout__loading-sub">This may take a moment on first load</p>
              </div>
            )}

            {status === 'error' && (
              <div className="workout__error-overlay">
                <CameraOff size={48} />
                <p className="workout__error-text">{errorMsg}</p>
                <button className="workout__error-btn" onClick={() => window.location.reload()}>Retry</button>
              </div>
            )}
          </main>

          {/* Mobile-only Workout Dashboard */}
          <div className="workout__mobile-dashboard">
            {/* Counter and Active Exercise name card */}
            <div className="workout__mobile-counter-card glass">
              <div className="workout__mobile-counter-header">
                <span className="workout__mobile-exercise-name">
                  {currentKey ? EXERCISE_MAP[currentKey]?.name.toUpperCase() : 'SELECT EXERCISE'}
                </span>
                <div className="workout__mobile-header-actions">
                  <div className="workout__mobile-target-controls">
                    <button className="workout__mobile-target-btn" onClick={() => setTargetGoal(prev => Math.max(0, prev - 1))} disabled={targetGoal <= 0}>-</button>
                    <span className="workout__mobile-target-val">{targetGoal === 0 ? 'GOAL: NONE' : `GOAL: ${targetGoal}`}</span>
                    <button className="workout__mobile-target-btn" onClick={() => setTargetGoal(prev => (prev === 0 ? 5 : prev + 1))}>+</button>
                  </div>
                  <button className="workout__mobile-reset-btn" onClick={handleReset} title="Reset Counter" id="mobile-reset-btn">
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
              <div className="workout__mobile-counter-body">
                <span className="workout__mobile-counter-val" key={stats.counter}>
                  {stats.counter}
                </span>
                <span className="workout__mobile-counter-label">REPS {targetGoal > 0 ? `/ ${targetGoal}` : ''}</span>
              </div>
              {targetGoal > 0 && (
                <div className="workout__mobile-progress-bar-wrap">
                  <div 
                    className="workout__mobile-progress-bar-fill" 
                    style={{ 
                      width: `${Math.min((stats.counter / targetGoal) * 100, 100)}%`,
                      backgroundColor: stats.color || 'var(--green-500)',
                      boxShadow: `0 0 8px ${stats.color || 'var(--green-500)'}50`
                    }} 
                  />
                </div>
              )}
            </div>

            {/* Comments (Form Feedback) */}
            <div className="workout__mobile-feedback-card glass" style={{ borderColor: stats.color + '40' }}>
              <span className="workout__mobile-feedback-label">FORM COACH</span>
              <div className="workout__mobile-feedback-val" style={{ color: stats.color }}>
                {stats.feedback || 'POSITION YOUR ENTIRE BODY IN CAMERA FRAME'}
              </div>
            </div>

            {/* Mobile Angle Chart */}
            {stats.angle !== null && stats.angle !== undefined && (
              <div className="workout__mobile-chart-card glass" style={{ borderColor: stats.color + '30' }}>
                <div className="workout__mobile-chart-header">
                  <span className="workout__mobile-chart-label">ANGLE PROGRESSION</span>
                  <span className="workout__mobile-chart-val" style={{ color: stats.color }}>{Math.round(stats.angle)}°</span>
                </div>
                <AngleChart angle={stats.angle} color={stats.color} height={60} />
              </div>
            )}

            {/* All Exercises List */}
            <div className="workout__mobile-exercise-selector-wrap">
              <ExerciseSelector
                currentKey={currentKey}
                onSelect={handleExerciseSwitch}
                onDeselect={handleDeselect}
              />
            </div>
          </div>

        </div>

        {/* Right Sidebar (Desktop only) */}
        <aside className="workout__sidebar workout__sidebar--right workout__sidebar--desktop-only">
          <StatsPanel
            exerciseName={stats.name}
            counter={stats.counter}
            phase={stats.phase}
            feedback={stats.feedback}
            color={stats.color}
            angle={stats.angle}
            onReset={handleReset}
            targetGoal={targetGoal}
            setTargetGoal={setTargetGoal}
          />
        </aside>
      </div>

      {celebrating && (
        <ConfettiCanvas onComplete={() => setCelebrating(false)} />
      )}
    </div>
  );
}

export default WorkoutSession;
