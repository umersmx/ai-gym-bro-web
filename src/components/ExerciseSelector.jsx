import { X } from 'lucide-react';
import { EXERCISE_MAP } from '../lib/exercises';
import './ExerciseSelector.css';

function ExerciseSelector({ currentKey, onSelect, onDeselect }) {
  return (
    <div className="exercise-selector">
      <h3 className="exercise-selector__title">SELECT EXERCISE</h3>
      <div className="exercise-selector__list">
        {Object.entries(EXERCISE_MAP).map(([key, ex]) => (
          <button
            key={key}
            className={`exercise-selector__btn ${key === currentKey ? 'exercise-selector__btn--active' : ''}`}
            onClick={() => onSelect(key)}
            id={`exercise-btn-${key}`}
          >
            <span className="exercise-selector__icon">{ex.icon}</span>
            <span className="exercise-selector__name">{ex.name}</span>
            <span className="exercise-selector__key">{key}</span>
          </button>
        ))}

        {/* Deselect button — only shows when an exercise is selected */}
        {currentKey !== null && (
          <button
            className="exercise-selector__btn exercise-selector__btn--deselect"
            onClick={onDeselect}
            id="exercise-btn-deselect"
          >
            <X size={16} />
            <span className="exercise-selector__name">Deselect</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ExerciseSelector;
