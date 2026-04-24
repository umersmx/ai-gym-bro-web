import { useState } from 'react';
import LandingPage from './components/LandingPage';
import WorkoutSession from './components/WorkoutSession';
import './App.css';

function App() {
  const [page, setPage] = useState('landing'); // 'landing' | 'workout'

  return (
    <div className="app">
      {page === 'landing' ? (
        <LandingPage onStart={() => setPage('workout')} />
      ) : (
        <WorkoutSession onBack={() => setPage('landing')} />
      )}
    </div>
  );
}

export default App;
