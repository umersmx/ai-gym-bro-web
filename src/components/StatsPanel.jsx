import { ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import './StatsPanel.css';

function StatsPanel({ exerciseName, counter, phase, feedback, color, angle, onReset }) {
  return (
    <div className="stats-panel glass">
      {/* Exercise Name */}
      <div className="stats-panel__header">
        <h2 className="stats-panel__exercise">{exerciseName}</h2>
        <button className="stats-panel__reset" onClick={onReset} title="Reset Counter" id="reset-btn">
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Rep Counter */}
      <div className="stats-panel__counter-wrap">
        <span className="stats-panel__counter-label">REPS</span>
        <span className="stats-panel__counter" key={counter}>
          {counter}
        </span>
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
