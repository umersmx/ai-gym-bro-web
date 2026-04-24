import { Camera, Dumbbell, Activity, Zap, ChevronRight, Target, TrendingUp, BarChart3, Shield } from 'lucide-react';
import './LandingPage.css';

const FEATURES = [
  {
    icon: <Target size={28} />,
    title: 'Define Your Goals',
    desc: 'Choose your fitness objective: fat loss, muscle gain, endurance, or overall wellness.',
  },
  {
    icon: <Camera size={28} />,
    title: 'Real-Time Tracking',
    desc: 'Your device camera tracks body movements with AI-powered pose detection in real-time.',
  },
  {
    icon: <TrendingUp size={28} />,
    title: 'Track Your Progress',
    desc: 'Log your workouts, monitor your reps, and view your progress over time.',
  },
  {
    icon: <BarChart3 size={28} />,
    title: 'Get Form Analysis',
    desc: 'Our AI system provides instant feedback on your form for every exercise you perform.',
  },
];

const EXERCISES = [
  { key: '1', name: 'Squat', icon: '🏋️', color: '#FF6B00', image: '/images/squat.png', instructions: 'Stand sideways to the camera so your full body profile is visible. Ensure clear lighting.' },
  { key: '2', name: 'Bicep Curl', icon: '💪', color: '#FF8533', image: '/images/bicep-curl.png', instructions: 'Stand sideways. Ensure your arm, torso, and dumbbells are fully visible in the frame.' },
  { key: '3', name: 'Push-Up', icon: '🫸', color: '#E05E00', image: '/images/pushup.png', instructions: 'Position your camera low to the ground, capturing your entire body side profile from head to toe.' },
  { key: '4', name: 'Shoulder Press', icon: '🙌', color: '#FF6B00', image: '/images/shoulder-press.png', instructions: 'Face the camera front-on. Ensure your upper body and arms are visible when fully extended upwards.' },
];

const HERO_BADGES = [
  'Real-Time Tracking',
  'Rep Counting',
  'AI Form Coaching',
  'Multiple Exercises',
  'Browser Based',
];

const BENEFITS = [
  {
    icon: <Dumbbell size={24} />,
    title: '4+ Exercise Variations',
    desc: 'From squats to shoulder press — choose exercises based on your preferences and goals.',
  },
  {
    icon: <Activity size={24} />,
    title: 'Adaptive Feedback',
    desc: 'Get real-time corrective feedback as your form changes — based on performance analysis.',
  },
  {
    icon: <BarChart3 size={24} />,
    title: 'Visual Progress Tracking',
    desc: 'See how far you\'ve come with clear rep counts and performance summaries.',
  },
  {
    icon: <Shield size={24} />,
    title: 'Always Accessible',
    desc: 'Train from home, the gym, or on the road — your tracker is always with you.',
  },
];

function LandingPage({ onStart }) {
  return (
    <div className="landing">
      {/* Navigation */}
      <header className="landing__header">
        <div className="landing__logo">
          <div className="landing__logo-icon">
            <Dumbbell size={20} />
          </div>
          <span className="landing__logo-text">
            AI GYM<span className="landing__logo-accent">⚡</span>BRO
          </span>
        </div>
        <nav className="landing__nav">
          <a href="#how-it-works" className="landing__nav-link">How It Works</a>
          <a href="#exercises" className="landing__nav-link">Exercises</a>
          <a href="#benefits" className="landing__nav-link">Benefits</a>
        </nav>
        <button className="landing__signup-btn" onClick={onStart} id="nav-start-btn">
          Start Now
        </button>
      </header>

      {/* Hero Section */}
      <section className="landing__hero">
        <div className="landing__hero-overlay" />
        <div className="landing__hero-content">
          <h1 className="landing__title">
            Achieve Fitness Goals with Your
            <br />
            <span className="landing__title-accent">AI GYM⚡BRO</span>
          </h1>

          <button className="landing__cta" onClick={onStart} id="start-webcam-btn">
            <Camera size={20} />
            <span>Get Your Program</span>
            <ChevronRight size={18} />
          </button>

          <div className="landing__hero-badges">
            {HERO_BADGES.map((badge, i) => (
              <span key={i} className="landing__hero-badge">{badge}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Motivational Quote */}
      <section className="landing__quote-section">
        <div className="landing__quote-wrap">
          <span className="landing__quote-icon">✨</span>
          <p className="landing__quote">
            Trust the process, even when results feel slow. Every step forward, no matter how small, is part of something bigger than what you see today.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="landing__features" id="how-it-works">
        <div className="landing__section-header">
          <h2 className="landing__section-title">
            <span className="landing__title-bold">How</span> It Works
          </h2>
          <p className="landing__section-subtitle">Your Personalized Fitness Roadmap</p>
        </div>
        <div className="landing__feature-grid">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="landing__feature-card animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="landing__feature-icon">{f.icon}</div>
              <h3 className="landing__feature-title">{f.title}</h3>
              <p className="landing__feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="landing__feature-cta-wrap">
          <button className="landing__feature-cta" onClick={onStart}>
            More About Us
          </button>
        </div>
      </section>

      {/* Exercise Preview */}
      <section className="landing__exercises" id="exercises">
        <div className="landing__section-header">
          <h2 className="landing__section-title">
            <span className="landing__title-bold">Supported</span> Exercises
          </h2>
          <p className="landing__section-subtitle">Select an exercise and start tracking</p>
        </div>
        <div className="landing__exercise-grid">
          {EXERCISES.map((ex) => (
            <div
              key={ex.key}
              className="landing__exercise-card"
              style={{ '--card-accent': ex.color }}
            >
              <div className="landing__exercise-image-wrap">
                <img src={ex.image} alt={`${ex.name} position`} className="landing__exercise-img" />
                <div className="landing__exercise-camera-badge">
                  <Camera size={14} />
                  <span>Camera Ready</span>
                </div>
              </div>
              <p className="landing__exercise-instructions">{ex.instructions}</p>
              
              <div className="landing__exercise-card-bottom">
                <div className="landing__exercise-title-wrap">
                  <span className="landing__exercise-icon">{ex.icon}</span>
                  <span className="landing__exercise-name">{ex.name}</span>
                </div>
                <div className="landing__exercise-actions">
                  <span className="landing__exercise-key">Press {ex.key}</span>
                  <button className="landing__exercise-start" onClick={onStart}>
                    Start
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Key Benefits */}
      <section className="landing__benefits" id="benefits">
        <div className="landing__section-header">
          <h2 className="landing__section-title">
            Key <span className="landing__title-orange">Benefits</span>
          </h2>
          <p className="landing__section-subtitle">Why AI GYM BRO Works</p>
        </div>
        <div className="landing__benefits-grid">
          {BENEFITS.map((b, i) => (
            <div key={i} className="landing__benefit-card">
              <div className="landing__benefit-icon">{b.icon}</div>
              <h3 className="landing__benefit-title">{b.title}</h3>
              <p className="landing__benefit-desc">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing__footer">
        <div className="landing__footer-top">
          <div className="landing__footer-links">
            <a href="#how-it-works">About Us</a>
            <a href="#exercises">Exercises</a>
          </div>
          <div className="landing__footer-logo">
            <span className="landing__logo-text landing__logo-text--footer">
              AI GYM<span className="landing__logo-accent">⚡</span>BRO
            </span>
          </div>
          <div className="landing__footer-links">
            <a href="#benefits">Benefits</a>
            <a href="#how-it-works">Support</a>
          </div>
        </div>
        <div className="landing__footer-bottom">
          <p>Built by <strong>Muhammad Umer Farooq</strong> — Superior University Student</p>
          <p>© 2025 AI Gym Bro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
