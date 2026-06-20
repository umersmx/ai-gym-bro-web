import { ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import './StatsPanel.css';

function StatsPanel({ exerciseName, counter, phase, feedback, color, angle, onReset, targetGoal, setTargetGoal }) {
  return (
    <div className="stats-panel glass">
      {/* Exercise Name */}
      <div className="stats-panel__header">
        <h2 className="stats-panel__exercise">{exerciseName}</h2>
        <button className="stats-panel__reset" onClick={onReset} title="Reset Counter" id="reset-btn">
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Target Goal Selector */}
      <div className="stats-panel__target-wrap">
        <span className="stats-panel__target-label">REP TARGET</span>
        <div className="stats-panel__target-controls">
          <button 
            className="stats-panel__target-btn" 
            onClick={() => setTargetGoal(prev => Math.max(0, prev - 5))}
            disabled={targetGoal <= 0}
          >
            -5
          </button>
          <button 
            className="stats-panel__target-btn" 
            onClick={() => setTargetGoal(prev => Math.max(0, prev - 1))}
            disabled={targetGoal <= 0}
          >
            -
          </button>
          <span className="stats-panel__target-val">
            {targetGoal === 0 ? 'NONE' : targetGoal}
          </span>
          <button 
            className="stats-panel__target-btn" 
            onClick={() => setTargetGoal(prev => (prev === 0 ? 5 : prev + 1))}
          >
            +
          </button>
          <button 
            className="stats-panel__target-btn" 
            onClick={() => setTargetGoal(prev => (prev === 0 ? 5 : prev + 5))}
          >
            +5
          </button>
        </div>
      </div>

      {/* Rep Counter with Circular Progress Ring */}
      <div className="stats-panel__counter-wrap">
        <svg className="stats-panel__progress-svg" viewBox="0 0 160 160" aria-hidden="true">
          {/* Background circle */}
          <circle 
            className="stats-panel__progress-bg" 
            cx="80" 
            cy="80" 
            r="70" 
          />
          {/* Active progress ring */}
          {targetGoal > 0 && (
            <circle 
              className="stats-panel__progress-bar" 
              cx="80" 
              cy="80" 
              r="70" 
              style={{
                strokeDasharray: 440,
                strokeDashoffset: 440 - (Math.min(counter / targetGoal, 1) * 440),
                stroke: color || 'var(--green-500)',
                filter: `drop-shadow(0 0 8px ${color || 'var(--green-500)'}50)`
              }}
            />
          )}
        </svg>

        <div className="stats-panel__counter-content">
          <span className="stats-panel__counter-label">REPS</span>
          <span className="stats-panel__counter" key={counter}>
            {counter}
          </span>
          {targetGoal > 0 && (
            <span className="stats-panel__counter-target-label">of {targetGoal}</span>
          )}
        </div>
      </div>

      {/* Phase Indicator */}
      <div className="stats-panel__phase-wrap">
        <div className={`stats-panel__phase-dot ${phase === 'UP' ? 'stats-panel__phase-dot--up' : 'stats-panel__phase-dot--down'}`} />
        <span className="stats-panel__phase-label">STAGE:</span>
        <span className={`stats-panel__phase-value ${phase === 'UP' ? 'stats-panel__phase-value--up' : 'stats-panel__phase-value--down'}`}>
          {phase}
        </span>
        {phase === 'UP' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
      </div>

      {/* Angle Display */}
      {angle !== null && angle !== undefined && (
        <div className="stats-panel__angle-wrap">
          <span className="stats-panel__angle-label">FORM ANGLE</span>
          <span className="stats-panel__angle-value">{Math.round(angle)}°</span>
        </div>
      )}

      {/* Form Feedback */}
      <div className="stats-panel__feedback-wrap">
        <span className="stats-panel__feedback-label">FORM FEEDBACK</span>
        <div
          className="stats-panel__feedback"
          style={{ color: color || 'var(--emerald-400)' }}
        >
          {feedback || '—'}
        </div>
      </div>
    </div>
  );
}

export default StatsPanel;
