import { useState, useEffect, useRef, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import WorkoutSession from './components/WorkoutSession';
import VisitsPage from './components/VisitsPage';
import HistoryPage from './components/HistoryPage';
import WorkoutPlanner from './components/WorkoutPlanner';
import SparkleBackground from './components/SparkleBackground';
import './App.css';

function App() {
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    const path = window.location.pathname.replace(/\/$/, '');
    if (hash === 'visits' || path === '/visits') return 'visits';
    return 'landing';
  });
  const [selectedExerciseKey, setSelectedExerciseKey] = useState(null);
  const [selectedTargetGoal, setSelectedTargetGoal] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [displayPage, setDisplayPage] = useState(page);
  const pageRef = useRef(null);

  // Listen for hash changes
  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'visits') navigateTo('visits');
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Smooth page transition helper
  const navigateTo = useCallback((nextPage, exerciseKey = null, targetGoal = null) => {
    if (transitioning) return;
    setTransitioning(true);

    // Start exit animation
    setTimeout(() => {
      setSelectedExerciseKey(exerciseKey);
      setSelectedTargetGoal(targetGoal);
      setPage(nextPage);
      setDisplayPage(nextPage);
      setTransitioning(false);
    }, 250);
  }, [transitioning]);

  const goToLanding = () => {
    window.location.hash = '';
    navigateTo('landing', null, null);
  };

  const startWorkout = (exerciseKey = null, targetGoal = null) => {
    navigateTo('workout', exerciseKey, targetGoal);
  };

  return (
    <div className="app">
      {/* Sparkle Particle Background */}
      <SparkleBackground sparkleCount={65} />

      {/* Floating Orb Background */}
      <div className="app__orbs" aria-hidden="true">
        <div className="app__orb app__orb--1" />
        <div className="app__orb app__orb--2" />
        <div className="app__orb app__orb--3" />
        <div className="app__orb app__orb--4" />
      </div>

      {/* Page Content with Transitions */}
      <div
        ref={pageRef}
        className={`app__page ${transitioning ? 'app__page--exit' : ''}`}
        key={displayPage}
      >
        {displayPage === 'visits' ? (
          <VisitsPage onBack={goToLanding} />
        ) : displayPage === 'workout' ? (
          <WorkoutSession 
            initialExerciseKey={selectedExerciseKey} 
            initialTargetGoal={selectedTargetGoal} 
            onBack={goToLanding} 
          />
        ) : displayPage === 'history' ? (
          <HistoryPage onBack={goToLanding} />
        ) : displayPage === 'planner' ? (
          <WorkoutPlanner onBack={goToLanding} onStartWorkout={startWorkout} />
        ) : (
          <LandingPage onStart={startWorkout} onNavigate={navigateTo} />
        )}
      </div>
    </div>
  );
}

export default App;
