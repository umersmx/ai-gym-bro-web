import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Flame, Calendar, Award, Trash2, Dumbbell, Sparkles } from 'lucide-react';
import './HistoryPage.css';

const EXERCISE_ICONS = {
  'SQUAT': '🏋️',
  'BICEP CURL': '💪',
  'PUSH-UP': '🫸',
  'SHOULDER PRESS': '🙌',
};

const formatExerciseName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => {
      return word
        .split('-')
        .map(sub => sub.charAt(0).toUpperCase() + sub.slice(1))
        .join('-');
    })
    .join(' ');
};

function HistoryPage({ onBack }) {
  const [history, setHistory] = useState(() => {
    return JSON.parse(localStorage.getItem('gym-bro-history') || '[]');
  });
  const [stats, setStats] = useState({
    repsToday: 0,
    streak: 0,
    prs: {},
  });
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    // Compute stats
    const data = history;

    // 2. Compute stats
    const todayStr = new Date().toDateString();
    let repsToday = 0;
    const prs = {
      'SQUAT': 0,
      'BICEP CURL': 0,
      'PUSH-UP': 0,
      'SHOULDER PRESS': 0,
    };

    // Keep track of unique dates for streak calculation
    const uniqueDates = new Set();

    data.forEach((set) => {
      const setDate = new Date(set.date);
      uniqueDates.add(setDate.toDateString());

      // Reps Today
      if (setDate.toDateString() === todayStr) {
        repsToday += set.reps;
      }

      // PRs
      if (prs[set.exercise] !== undefined) {
        prs[set.exercise] = Math.max(prs[set.exercise], set.reps);
      }
    });

    // Streak calculation (continuous daily active days)
    let streak = 0;
    const checkDate = new Date();
    // If worked out today, streak starts, else check yesterday
    if (uniqueDates.has(checkDate.toDateString())) {
      streak = 1;
      while (true) {
        checkDate.setDate(checkDate.getDate() - 1);
        if (uniqueDates.has(checkDate.toDateString())) {
          streak++;
        } else {
          break;
        }
      }
    } else {
      // Check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
      if (uniqueDates.has(checkDate.toDateString())) {
        streak = 1;
        while (true) {
          checkDate.setDate(checkDate.getDate() - 1);
          if (uniqueDates.has(checkDate.toDateString())) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    setStats({ repsToday, streak, prs });

    // 3. Compute Achievements/Badges
    const totalReps = data.reduce((acc, curr) => acc + curr.reps, 0);
    const earnedBadges = [];

    // Badge list definitions
    const badgeConfigs = [
      {
        id: 'first-step',
        title: 'First Step',
        desc: 'Complete your first tracked workout set',
        icon: '🎯',
        earned: data.length > 0,
      },
      {
        id: 'consistency-3',
        title: 'Streak Starter',
        desc: 'Achieve a 3-day active streak',
        icon: '🔥',
        earned: streak >= 3,
      },
      {
        id: 'reps-50',
        title: 'Milestone 50',
        desc: 'Complete 50 total reps across all sessions',
        icon: '⚡',
        earned: totalReps >= 50,
      },
      {
        id: 'reps-200',
        title: 'Centurion',
        desc: 'Complete 200 total reps across all sessions',
        icon: '👑',
        earned: totalReps >= 200,
      },
      {
        id: 'squat-master',
        title: 'Leg Day Legend',
        desc: 'Perform 15+ reps in a single Squat set',
        icon: '🏋️',
        earned: prs['SQUAT'] >= 15,
      },
      {
        id: 'curl-beast',
        title: 'Bicep Shredder',
        desc: 'Perform 15+ reps in a single Bicep Curl set',
        icon: '💪',
        earned: prs['BICEP CURL'] >= 15,
      },
      {
        id: 'pushup-titan',
        title: 'Push-Up Titan',
        desc: 'Perform 15+ reps in a single Push-Up set',
        icon: '🫸',
        earned: prs['PUSH-UP'] >= 15,
      },
    ];

    setBadges(badgeConfigs);
  }, [history]);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your workout history and personal records?')) {
      localStorage.removeItem('gym-bro-history');
      setHistory([]);
    }
  };

  const handleSeedDemoData = () => {
    const today = new Date();
    
    // Helper to get ISO date string offset by days
    const getDateOffset = (days) => {
      const d = new Date(today);
      d.setDate(today.getDate() - days);
      return d.toISOString();
    };

    const demoSets = [
      {
        id: Date.now() - 4 * 86400000,
        date: getDateOffset(4),
        exercise: 'SQUAT',
        reps: 12,
        formScore: 90
      },
      {
        id: Date.now() - 4 * 86400000 + 1000,
        date: getDateOffset(4),
        exercise: 'BICEP CURL',
        reps: 10,
        formScore: 95
      },
      {
        id: Date.now() - 3 * 86400000,
        date: getDateOffset(3),
        exercise: 'PUSH-UP',
        reps: 14,
        formScore: 80
      },
      {
        id: Date.now() - 2 * 86400000,
        date: getDateOffset(2),
        exercise: 'SQUAT',
        reps: 16,
        formScore: 92
      },
      {
        id: Date.now() - 2 * 86400000 + 1000,
        date: getDateOffset(2),
        exercise: 'BICEP CURL',
        reps: 15,
        formScore: 88
      },
      {
        id: Date.now() - 86400000,
        date: getDateOffset(1),
        exercise: 'PUSH-UP',
        reps: 18,
        formScore: 85
      },
      {
        id: Date.now(),
        date: today.toISOString(),
        exercise: 'SHOULDER PRESS',
        reps: 12,
        formScore: 92
      },
      {
        id: Date.now() + 1000,
        date: today.toISOString(),
        exercise: 'PUSH-UP',
        reps: 20,
        formScore: 94
      }
    ];

    localStorage.setItem('gym-bro-history', JSON.stringify(demoSets));
    setHistory(demoSets);
  };

  const getFormattedDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="history">
      <div className="history__container">
        {/* Header */}
        <header className="history__header glass">
          <button className="history__back-btn" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <h1 className="history__title">WORKOUT ANALYTICS</h1>
          {history.length > 0 && (
            <button className="history__clear-btn" onClick={handleClearHistory} title="Clear Workout History">
              <Trash2 size={16} />
              <span>Clear</span>
            </button>
          )}
        </header>

        {/* Dashboard Stats */}
        <div className="history__dashboard">
          <div className="history__stat-card glass reveal-child" style={{ '--delay': '0.05s' }}>
            <div className="history__stat-icon history__stat-icon--today">
              <Sparkles size={20} />
            </div>
            <div className="history__stat-info">
              <span className="history__stat-label">REPS TODAY</span>
              <strong className="history__stat-value">{stats.repsToday}</strong>
            </div>
          </div>

          <div className="history__stat-card glass reveal-child" style={{ '--delay': '0.1s' }}>
            <div className="history__stat-icon history__stat-icon--streak">
              <Flame size={20} />
            </div>
            <div className="history__stat-info">
              <span className="history__stat-label">DAILY STREAK</span>
              <strong className="history__stat-value">
                {stats.streak} {stats.streak === 1 ? 'day' : 'days'}
              </strong>
            </div>
          </div>

          <div className="history__stat-card glass reveal-child" style={{ '--delay': '0.15s' }}>
            <div className="history__stat-icon history__stat-icon--total">
              <Trophy size={20} />
            </div>
            <div className="history__stat-info">
              <span className="history__stat-label">TOTAL SETS</span>
              <strong className="history__stat-value">{history.length}</strong>
            </div>
          </div>
        </div>

        <div className="history__grid">
          {/* Left Column: PRs and Achievements */}
          <div className="history__column">
            {/* PR Section */}
            <section className="history__section glass reveal-child" style={{ '--delay': '0.2s' }}>
              <div className="history__section-header">
                <Trophy size={18} className="history__section-icon" />
                <h2 className="history__section-title">Personal Records</h2>
              </div>
              <div className="history__pr-list">
                {Object.entries(stats.prs).map(([exercise, reps]) => (
                  <div key={exercise} className="history__pr-item">
                    <span className="history__pr-icon">{EXERCISE_ICONS[exercise]}</span>
                    <span className="history__pr-name">{formatExerciseName(exercise)}</span>
                    <strong className="history__pr-value">{reps} <span className="history__pr-unit">Reps</span></strong>
                  </div>
                ))}
              </div>
            </section>

            {/* Achievements Section */}
            <section className="history__section glass reveal-child" style={{ '--delay': '0.25s' }}>
              <div className="history__section-header">
                <Award size={18} className="history__section-icon" />
                <h2 className="history__section-title">Achievements</h2>
              </div>
              <div className="history__badge-grid">
                {badges.map((b) => (
                  <div 
                    key={b.id} 
                    className={`history__badge-card ${b.earned ? 'history__badge-card--earned' : ''}`}
                    title={b.desc}
                  >
                    <span className="history__badge-emoji">{b.icon}</span>
                    <h3 className="history__badge-title">{b.title}</h3>
                    <p className="history__badge-desc">{b.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: History Log */}
          <div className="history__column">
            <section className="history__section history__section--log glass reveal-child" style={{ '--delay': '0.3s' }}>
              <div className="history__section-header">
                <Calendar size={18} className="history__section-icon" />
                <h2 className="history__section-title">Workout Logs</h2>
              </div>
              
              {history.length === 0 ? (
                <div className="history__empty">
                  <Dumbbell size={36} />
                  <p>No sets completed yet.</p>
                  <p className="history__empty-sub">Select an exercise and start spotting to log your reps!</p>
                  <button className="history__seed-btn" onClick={handleSeedDemoData} id="seed-demo-btn">
                    Load Demo Data
                  </button>
                </div>
              ) : (
                <div className="history__log-list">
                  {history.slice().reverse().map((set) => (
                    <div key={set.id} className="history__log-item">
                      <span className="history__log-icon">{EXERCISE_ICONS[set.exercise]}</span>
                      <div className="history__log-details">
                        <span className="history__log-name">{formatExerciseName(set.exercise)}</span>
                        <span className="history__log-date">{getFormattedDate(set.date)}</span>
                      </div>
                      <div className="history__log-result">
                        <strong className="history__log-reps">{set.reps}</strong>
                        <span className="history__log-unit">reps</span>
                        {set.formScore !== undefined && (
                          <span className="history__log-score" style={{ color: set.formScore >= 85 ? 'var(--green-400)' : 'var(--orange)' }}>
                            Form: {set.formScore}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoryPage;
