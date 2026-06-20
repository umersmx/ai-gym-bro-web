import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Dumbbell, Activity, Zap, ChevronRight, Target, TrendingUp, BarChart3, Shield } from 'lucide-react';
import { use3DTilt } from '../hooks/use3DTilt';
import './LandingPage.css';

const FEATURES = [
  {
    icon: <Camera size={24} />,
    title: 'Real-Time Webcam',
    desc: 'Uses your device camera to track body movements with AI-powered pose estimation.',
  },
  {
    icon: <Activity size={24} />,
    title: 'Rep Counting',
    desc: 'Automatically counts your reps using smart state-machine logic. No manual input needed.',
  },
  {
    icon: <Zap size={24} />,
    title: 'Form Feedback',
    desc: 'Get instant corrective feedback when your form needs improvement.',
  },
  {
    icon: <Dumbbell size={24} />,
    title: '4 Exercises',
    desc: 'Squat, Bicep Curl, Push-Up, and Shoulder Press — all tracked in real-time.',
  },
];

const EXERCISES = [
  { key: '1', name: 'Squat', icon: '🏋️', color: '#00df89', image: '/images/squat-transparent.png' },
  { key: '2', name: 'Bicep Curl', icon: '💪', color: '#34d399', image: '/images/bicep-curl-transparent.png' },
  { key: '3', name: 'Push-Up', icon: '🫸', color: '#059669', image: '/images/pushup-transparent.png' },
  { key: '4', name: 'Shoulder Press', icon: '🙌', color: '#00df89', image: '/images/shoulder-press-transparent.png' },
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

/* ============================================
   Custom Hook: Scroll Reveal via IntersectionObserver
   ============================================ */
function useScrollReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      el.classList.add('reveal--visible');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('reveal--visible');
          observer.unobserve(el);
        }
      },
      {
        threshold: options.threshold || 0.15,
        rootMargin: options.rootMargin || '0px 0px -40px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}


function LandingPage({ onStart, onNavigate }) {
  const [headerScrolled, setHeaderScrolled] = useState(false);

  // 3D Tilt handlers
  const exerciseTilt = use3DTilt(12, 1.04);
  const cardTilt = use3DTilt(7, 1.02);
  const heroTilt = use3DTilt(4, 1.01);

  // Scroll-reveal refs
  const heroRef = useScrollReveal({ threshold: 0.1 });
  const exercisesRef = useScrollReveal({ threshold: 0.1 });
  const featuresRef = useScrollReveal({ threshold: 0.1 });
  const benefitsRef = useScrollReveal({ threshold: 0.1 });
  const footerRef = useScrollReveal({ threshold: 0.1 });

  // Increment visitor count in backend (analytics)
  useEffect(() => {
    async function trackVisit() {
      try {
        const alreadyCounted = sessionStorage.getItem('gym-bro-counted');
        if (!alreadyCounted) {
          await fetch('https://abacus.jasoncameron.dev/hit/ai-gym-bro-web/visits');
          sessionStorage.setItem('gym-bro-counted', 'true');
        }
      } catch (err) {
        console.warn('Visitor tracking unavailable:', err);
      }
    }
    trackVisit();
  }, []);

  // Header scroll effect
  useEffect(() => {
    function handleScroll() {
      setHeaderScrolled(window.scrollY > 50);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll handler for nav links
  const handleNavClick = useCallback((e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div className="landing">
      {/* Navigation */}
      <header className={`landing__header ${headerScrolled ? 'landing__header--scrolled' : ''}`}>
        <div className="landing__logo">
          <div className="landing__logo-icon">
            <Dumbbell size={20} />
          </div>
          <span className="landing__logo-text">
            AI <span className="landing__logo-accent">Gymbro</span>
          </span>
        </div>
        <nav className="landing__nav">
          <a href="#how-it-works" className="landing__nav-link" onClick={(e) => handleNavClick(e, 'how-it-works')}>How It Works</a>
          <a href="#exercises" className="landing__nav-link" onClick={(e) => handleNavClick(e, 'exercises')}>Exercises</a>
          <a href="#benefits" className="landing__nav-link" onClick={(e) => handleNavClick(e, 'benefits')}>Benefits</a>
          <a href="#history" className="landing__nav-link" onClick={(e) => { e.preventDefault(); onNavigate('history'); }}>History</a>
        </nav>
        <button className="landing__signup-btn" onClick={() => onStart(null)} id="nav-start-btn">
          Start Now
        </button>
      </header>

      {/* Hero Section */}
      <section className="landing__hero reveal" ref={heroRef}>
        <div className="landing__hero-overlay" />
        <div className="landing__hero-content tilt-card" {...heroTilt}>
          <div className="landing__badge hero-anim hero-anim--1">
            <Zap size={12} className="landing__badge-icon" />
            <span>Powered by MediaPipe AI</span>
          </div>

          <h1 className="landing__title hero-anim hero-anim--2">
            Your Virtual
            <br />
            <span className="landing__title-gradient">Fitness Spotter</span>
          </h1>

          <p className="landing__description hero-anim hero-anim--3">
            Real-time pose detection, rep counting, and form analysis — all running directly in your browser. No downloads, no servers, just your webcam.
          </p>

          <div className="landing__cta-wrap hero-anim hero-anim--4">
            <button className="landing__cta" onClick={() => onStart(null)} id="start-webcam-btn">
              <Camera size={20} className="landing__cta-icon-camera" />
              <span>Start Webcam</span>
              <ChevronRight size={18} className="landing__cta-icon-chevron" />
            </button>
          </div>

          <div className="landing__hero-badges hero-anim hero-anim--5">
            {HERO_BADGES.map((badge, i) => (
              <span key={i} className="landing__hero-badge" style={{ '--badge-delay': `${i * 0.08}s` }}>{badge}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Exercises */}
      <section className="landing__exercises reveal" id="exercises" ref={exercisesRef}>
        <h2 className="landing__exercises-title">Supported Exercises</h2>
        <div className="landing__exercise-grid">
          {EXERCISES.map((ex, i) => (
            <div
              key={ex.key}
              className="landing__exercise-card reveal-child tilt-card"
              onClick={() => onStart(ex.key)}
              {...exerciseTilt}
            >
              <div className="landing__exercise-image-wrap">
                <img src={ex.image} alt={ex.name} className="landing__exercise-img" />
              </div>
              <div className="landing__exercise-info">
                <span className="landing__exercise-icon">{ex.icon}</span>
                <span className="landing__exercise-name">{ex.name}</span>
              </div>
              <span className="landing__exercise-key">Press {ex.key}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="landing__features reveal" id="how-it-works" ref={featuresRef}>
        <h2 className="landing__features-title">How It Works</h2>
        <div className="landing__feature-grid">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="landing__feature-card reveal-child tilt-card"
              {...cardTilt}
            >
              <div className="landing__feature-step">{String(i + 1).padStart(2, '0')}</div>
              <div className="landing__feature-icon">{f.icon}</div>
              <h3 className="landing__feature-title">{f.title}</h3>
              <p className="landing__feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Key Benefits */}
      <section className="landing__benefits reveal" id="benefits" ref={benefitsRef}>
        <div className="landing__section-header">
          <h2 className="landing__section-title">
            Key <span className="landing__title-green">Benefits</span>
          </h2>
          <p className="landing__section-subtitle">Why AI GYM BRO Works</p>
        </div>
        <div className="landing__benefits-grid">
          {BENEFITS.map((b, i) => (
            <div key={i} className="landing__benefit-card reveal-child tilt-card" {...cardTilt}>
              <div className="landing__benefit-icon">{b.icon}</div>
              <h3 className="landing__benefit-title">{b.title}</h3>
              <p className="landing__benefit-desc">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing__footer reveal" ref={footerRef}>
        <div className="landing__footer-top">
          <div className="landing__footer-links">
            <a href="#how-it-works">About Us</a>
            <a href="#exercises">Exercises</a>
          </div>
          <div className="landing__footer-logo">
            <span className="landing__logo-text landing__logo-text--footer">
              AI <span className="landing__logo-accent">Gymbro</span>
            </span>
          </div>
          <div className="landing__footer-links">
            <a href="#benefits">Benefits</a>
            <a href="#how-it-works">Support</a>
          </div>
        </div>

        <div className="landing__footer-bottom">
          <p>Built by <strong>Muhammad Umer Farooq</strong> — Superior University Student</p>
          <p>© 2026 AI Gym Bro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
