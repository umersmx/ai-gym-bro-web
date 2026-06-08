import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import WorkoutSession from './components/WorkoutSession';
import VisitsPage from './components/VisitsPage';
import './App.css';

function App() {
  const [page, setPage] = useState(() => {
    // Check for secret /visits route on initial load
    const hash = window.location.hash.replace('#', '');
    const path = window.location.pathname.replace(/\/$/, '');
    if (hash === 'visits' || path === '/visits') return 'visits';
    return 'landing';
  });
  const [selectedExerciseKey, setSelectedExerciseKey] = useState(null);

  // Listen for hash changes
  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'visits') setPage('visits');
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const goToLanding = () => {
    window.location.hash = '';
    setSelectedExerciseKey(null);
    setPage('landing');
  };

  const startWorkout = (exerciseKey = null) => {
    setSelectedExerciseKey(exerciseKey);
    setPage('workout');
  };

  return (
    <div className="app">
      {page === 'visits' ? (
        <VisitsPage onBack={goToLanding} />
      ) : page === 'workout' ? (
        <WorkoutSession initialExerciseKey={selectedExerciseKey} onBack={goToLanding} />
      ) : (
        <LandingPage onStart={startWorkout} />
      )}
    </div>
  );
}

export default App;
