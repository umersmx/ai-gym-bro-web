import { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowLeft, CameraOff, Loader2, RefreshCw, Zap } from 'lucide-react';
import { PoseDetector } from '../lib/poseDetector';
import { ExerciseDetector } from '../lib/exercises';
import { calculateAngle } from '../lib/utils';
import ExerciseSelector from './ExerciseSelector';
import StatsPanel from './StatsPanel';
import './WorkoutSession.css';

function WorkoutSession({ onBack }) {
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const engineRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const facingModeRef = useRef('user');

  // State
  const [status, setStatus] = useState('initializing'); // initializing | loading-model | ready | error
  const [errorMsg, setErrorMsg] = useState('');
  const [currentKey, setCurrentKey] = useState(null);
  const [stats, setStats] = useState({
    name: 'SELECT EXERCISE',
    counter: 0,
    phase: 'UP',
    feedback: '',
    color: '#FF6B00',
    angle: null,
  });
  const [fps, setFps] = useState(0);
  const [bodyDetected, setBodyDetected] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [torchOn, setTorchOn] = useState(false);

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

        // Step 3: Init exercise engine (no default exercise)
        const engine = new ExerciseDetector(null);
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

            drawJoint(x1, y1, '#EF4444');
            drawJoint(x2, y2, '#FBBF24');
            drawJoint(x3, y3, '#EF4444');

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
          }
        } else {
          // No exercise selected — just show skeleton
          setStats((prev) => ({
            ...prev,
            name: 'SELECT EXERCISE',
            feedback: 'Pick an exercise to start tracking',
            color: '#FF6B00',
          }));
        }
      } else {
        setBodyDetected(false);
        setStats((prev) => ({
          ...prev,
          feedback: 'NO BODY DETECTED',
          color: '#EF4444',
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

  const handleExerciseSwitch = useCallback((key) => {
    if (engineRef.current) {
      engineRef.current.switchExercise(key);
      setCurrentKey(key);
      const ex = engineRef.current.currentExercise;
      setStats({
        name: ex.name,
        counter: ex.counter,
        phase: ex.phase,
        feedback: '',
        color: '#FF6B00',
        angle: null,
      });
    }
  }, []);

  const handleDeselect = useCallback(() => {
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
      color: '#10B981',
      angle: null,
    });
  }, []);

  const handleReset = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
      setStats((prev) => ({
        ...prev,
        counter: 0,
        phase: 'UP',
        feedback: '',
        color: '#10B981',
      }));
    }
  }, []);

  const handleBack = useCallback(() => {
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
  }, [onBack]);

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

  return (
    <div className="workout">
      {/* Top Bar */}
      <header className="workout__topbar glass">
        <button className="workout__back-btn" onClick={handleBack} id="back-btn">
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <div className="workout__topbar-center">
          <div className={`workout__status-dot ${bodyDetected ? 'workout__status-dot--active' : ''}`} />
          <span className="workout__status-text">
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
        </div>
        <div className="workout__topbar-right">
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

      {/* Main Content */}
      <div className="workout__content">
        {/* Left Sidebar */}
        <aside className="workout__sidebar workout__sidebar--left">
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

        {/* Camera View */}
        <main className="workout__camera-wrap">
          {/* Hidden video element (camera source) */}
          <video
            ref={videoRef}
            className="workout__video"
            playsInline
            muted
          />

          {/* Canvas with skeleton overlay */}
          <canvas
            ref={canvasRef}
            className="workout__canvas"
          />

          {/* Loading overlay */}
          {status !== 'ready' && status !== 'error' && (
            <div className="workout__loading-overlay">
              <Loader2 size={48} className="workout__spinner" />
              <p className="workout__loading-text">
                {status === 'initializing'
                  ? 'Starting camera...'
                  : 'Loading AI pose model (~10MB)...'}
              </p>
              <p className="workout__loading-sub">This may take a moment on first load</p>
            </div>
          )}

          {/* Error overlay */}
          {status === 'error' && (
            <div className="workout__error-overlay">
              <CameraOff size={48} />
              <p className="workout__error-text">{errorMsg}</p>
              <button
                className="workout__error-btn"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="workout__sidebar workout__sidebar--right">
          <StatsPanel
            exerciseName={stats.name}
            counter={stats.counter}
            phase={stats.phase}
            feedback={stats.feedback}
            color={stats.color}
            angle={stats.angle}
            onReset={handleReset}
          />
        </aside>
      </div>
    </div>
  );
}

export default WorkoutSession;
