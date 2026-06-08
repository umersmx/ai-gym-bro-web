import { useRef, useState, useEffect, useCallback } from 'react';
import { CameraOff, RefreshCw, Zap, Home, Dumbbell, Plus, BookOpen, User } from 'lucide-react';
import { PoseDetector } from '../lib/poseDetector';
import { ExerciseDetector, EXERCISE_MAP } from '../lib/exercises';
import { calculateAngle } from '../lib/utils';
import ExerciseSelector from './ExerciseSelector';
import StatsPanel from './StatsPanel';
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
  
  // Mobile Tab Navigation State: 'camera' | 'selector' | 'sessions' | 'profile'
  // If no exercise is selected initially, open on the exercises selector tab so they can pick.
  const [activeTab, setActiveTab] = useState(initialExerciseKey ? 'camera' : 'selector');

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
        color: '#00df89',
        angle: null,
      });
      // Switch back to camera tab on mobile so they can see tracking
      setActiveTab('camera');
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
      color: '#00df89',
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
        color: '#00df89',
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
          <div className="workout__header-icons-mobile">
            <span className="workout__header-icon">🔔</span>
            <span className="workout__header-avatar">👤</span>
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

        {/* Dynamic Center View (Adapts to mobile tabs!) */}
        <div className="workout__center-view">
          
          {/* 1. Live Camera / Main Workout Tab */}
          <div
            className="workout__camera-tab-content"
            style={{ display: activeTab === 'camera' ? 'flex' : 'none' }}
          >
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

            {/* Mobile Stats Panel Grid (Rendered directly under camera on mobile active tab) */}
            <div className="workout__mobile-stats-wrap">
              <StatsPanel
                exerciseName={stats.name}
                counter={stats.counter}
                phase={stats.phase}
                feedback={stats.feedback}
                color={stats.color}
                angle={stats.angle}
                onReset={handleReset}
              />

              {/* Latest Session Mockup Widget shown on active tab as in phone mockup */}
              <div className="workout__mobile-sessions-card">
                <div className="workout__mobile-sessions-header">LATEST SESSION</div>
                <div className="workout__mobile-session-item">
                  <img src="/images/squat-dark.png" alt="Squat Thumbnail" className="workout__mobile-session-thumb" />
                  <div className="workout__mobile-session-info">
                    <span className="workout__mobile-session-name">Squat Mock 1</span>
                    <span className="workout__mobile-session-date">2026-7:10 PM</span>
                  </div>
                  <div className="workout__mobile-session-data">
                    <div className="workout__mobile-session-reps">
                      <span className="workout__mobile-session-label">REPS TOTAL</span>
                      <span className="workout__mobile-session-value">14</span>
                    </div>
                    <span className="workout__mobile-session-score">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Mobile Exercise Selector Tab */}
          {activeTab === 'selector' && (
            <div className="workout__mobile-tab-view workout__mobile-tab-view--padded">
              <ExerciseSelector
                currentKey={currentKey}
                onSelect={handleExerciseSwitch}
                onDeselect={handleDeselect}
              />
            </div>
          )}

          {/* 3. Mobile Sessions List Tab */}
          {activeTab === 'sessions' && (
            <div className="workout__mobile-tab-view workout__mobile-tab-view--padded">
              <h2 className="workout__mobile-section-title">WORKOUT SESSIONS</h2>
              <div className="workout__mobile-sessions-list">
                <div className="workout__mobile-session-item">
                  <img src="/images/squat-dark.png" alt="Squat Thumbnail" className="workout__mobile-session-thumb" />
                  <div className="workout__mobile-session-info">
                    <span className="workout__mobile-session-name">Squat Session</span>
                    <span className="workout__mobile-session-date">Today - 08:34 AM</span>
                  </div>
                  <div className="workout__mobile-session-data">
                    <span className="workout__mobile-session-score">14 reps</span>
                  </div>
                </div>
                <div className="workout__mobile-session-item">
                  <img src="/images/bicep-curl-dark.png" alt="Curl Thumbnail" className="workout__mobile-session-thumb" />
                  <div className="workout__mobile-session-info">
                    <span className="workout__mobile-session-name">Bicep Curl Session</span>
                    <span className="workout__mobile-session-date">Yesterday - 05:20 PM</span>
                  </div>
                  <div className="workout__mobile-session-data">
                    <span className="workout__mobile-session-score">24 reps</span>
                  </div>
                </div>
                <div className="workout__mobile-session-item text-muted">
                  <p className="workout__empty-history">End of session log history</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Mobile Profile Tab */}
          {activeTab === 'profile' && (
            <div className="workout__mobile-tab-view workout__mobile-tab-view--padded">
              <div className="workout__profile-card">
                <div className="workout__profile-avatar">👤</div>
                <h2 className="workout__profile-name">Muhammad Umer Farooq</h2>
                <p className="workout__profile-title">Lead Developer & UI Designer</p>
                <div className="workout__profile-stats">
                  <div className="workout__profile-stat">
                    <span>Active Session</span>
                    <strong>{currentKey ? EXERCISE_MAP[currentKey]?.name : 'None'}</strong>
                  </div>
                  <div className="workout__profile-stat">
                    <span>Rank</span>
                    <strong>Gym Bro Pro</strong>
                  </div>
                </div>
                <p className="workout__profile-footer">Built with 💪 and Javascript</p>
              </div>
            </div>
          )}

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
          />
        </aside>
      </div>

      {/* Mobile Tab Navigation Bar */}
      <nav className="workout__mobile-nav">
        <button
          className={`workout__mobile-nav-btn ${activeTab === 'home' ? 'workout__mobile-nav-btn--active' : ''}`}
          onClick={handleBack}
        >
          <Home size={20} />
          <span>Home</span>
        </button>
        <button
          className={`workout__mobile-nav-btn ${activeTab === 'selector' ? 'workout__mobile-nav-btn--active' : ''}`}
          onClick={() => setActiveTab('selector')}
        >
          <Dumbbell size={20} />
          <span>Exercises</span>
        </button>
        <button
          className={`workout__mobile-nav-btn workout__mobile-nav-btn--center ${activeTab === 'camera' ? 'workout__mobile-nav-btn--active' : ''}`}
          onClick={() => setActiveTab('camera')}
        >
          <div className="workout__mobile-nav-plus-circle">
            <Plus size={24} />
          </div>
        </button>
        <button
          className={`workout__mobile-nav-btn ${activeTab === 'sessions' ? 'workout__mobile-nav-btn--active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          <BookOpen size={20} />
          <span>Sessions</span>
        </button>
        <button
          className={`workout__mobile-nav-btn ${activeTab === 'profile' ? 'workout__mobile-nav-btn--active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={20} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}

export default WorkoutSession;
