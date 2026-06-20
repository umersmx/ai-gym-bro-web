import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Dumbbell, Clock, ShieldAlert, CheckCircle2, ChevronRight, RotateCcw, Award } from 'lucide-react';
import './WorkoutPlanner.css';

const AGE_GROUPS = [
  { id: 'teen', label: 'Teen (13-19)', desc: 'Foundation & Athletics' },
  { id: 'young', label: 'Young Adult (20-35)', desc: 'Peak Power & Hypertrophy' },
  { id: 'mid', label: 'Mid-Life (36-50)', desc: 'Strength & Joint Care' },
  { id: 'master', label: 'Master (50+)', desc: 'Longevity & Mobility' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: 'New to fitness tracking' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Active & familiar with lifts' },
  { id: 'advanced', label: 'Advanced', desc: 'Regular lifter looking to push' },
];

const GOALS = [
  { id: 'muscle', label: 'Muscle Building', desc: 'Hypertrophy and strength' },
  { id: 'fat', label: 'Fat Loss (Tone)', desc: 'High heart rate & calorie burn' },
  { id: 'mobility', label: 'Core & Mobility', desc: 'Balance, control & longevity' },
];

const EQUIPMENTS = [
  { id: 'bodyweight', label: 'Bodyweight Only', desc: 'No equipment needed' },
  { id: 'dumbbells', label: 'Dumbbells', desc: 'Dumbbells or kettlebells' },
  { id: 'full', label: 'Full Gym', desc: 'Access to barbell & rack' },
];

function WorkoutPlanner({ onBack, onStartWorkout }) {
  const [profile, setProfile] = useState({
    ageGroup: '',
    experience: '',
    goal: '',
    equipment: '',
  });

  const [activeStep, setActiveStep] = useState(1);
  const [plan, setPlan] = useState(null);
  const [history, setHistory] = useState([]);

  // Load plan and history on mount
  useEffect(() => {
    const savedPlan = localStorage.getItem('gym-bro-workout-plan');
    if (savedPlan) {
      setPlan(JSON.parse(savedPlan));
    }
    const savedHistory = localStorage.getItem('gym-bro-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Generate Plan logic
  const handleGeneratePlan = () => {
    const { ageGroup, experience, goal, equipment } = profile;
    if (!ageGroup || !experience || !goal || !equipment) return;

    // Compile dynamic descriptive advice
    let ageBio = '';
    switch (ageGroup) {
      case 'teen':
        ageBio = 'As a teenager, your body is still developing. This routine focuses on teaching you correct motor patterns and building a solid foundation of coordination and form, rather than excessively heavy loading.';
        break;
      case 'young':
        ageBio = 'As a young adult, your recovery capacity and joint resilience are at their peak. This routine features higher volume and intensiveness to optimize muscle hypertrophy and metabolic efficiency.';
        break;
      case 'mid':
        ageBio = 'For mid-life training, consistency and injury prevention are key. This routine provides a balanced intensity profile that sustains muscle mass and strength while preserving joint health.';
        break;
      case 'master':
        ageBio = 'For mature lifters, safety, stability, and longevity are paramount. This routine features lower rep counts per set, extended rest times, and a high focus on controlled mobility to protect joints.';
        break;
    }

    let goalBio = '';
    switch (goal) {
      case 'muscle':
        goalBio = 'The exercises are structured into standard resistance sets to maximize mechanical tension and metabolic stress for muscle building.';
        break;
      case 'fat':
        goalBio = 'We have increased rep targets and shortened the rest periods to create a high-tempo circuit effect, keeping your heart rate elevated for fat loss.';
        break;
      case 'mobility':
        goalBio = 'The emphasis here is on slow tempo, postural control, and dynamic balance, supporting core stability and joint flexibility.';
        break;
    }

    // Dynamic Exercises Compilation
    const exercises = [];

    // 1. Squat (Lower Body)
    const squatSets = experience === 'beginner' ? 2 : experience === 'intermediate' ? 3 : 4;
    const squatReps = ageGroup === 'master' ? 8 : goal === 'fat' ? 15 : 12;
    const squatRest = ageGroup === 'master' ? 90 : goal === 'fat' ? 45 : 60;
    const squatTip = equipment === 'bodyweight' 
      ? 'Weight on heels, push knees out. Go down until thighs are parallel to the floor.'
      : 'Hold weights at your shoulders or sides. Keep chest upright and drive through heels.';
    exercises.push({
      key: '1',
      name: 'Squat',
      icon: '🏋️',
      sets: squatSets,
      reps: squatReps,
      rest: squatRest,
      tip: squatTip
    });

    // 2. Push-Up (Chest/Core)
    const pushupSets = experience === 'beginner' ? 2 : experience === 'intermediate' ? 3 : 4;
    const pushupReps = ageGroup === 'master' ? 8 : goal === 'fat' ? 15 : 10;
    const pushupRest = ageGroup === 'master' ? 90 : goal === 'fat' ? 45 : 60;
    const pushupTip = experience === 'beginner'
      ? 'Perform on knees if standard push-ups are too difficult. Keep core locked tight.'
      : 'Keep elbows tucked at a 45-degree angle. Touch chest to the floor and push up.';
    exercises.push({
      key: '3',
      name: 'Push-Up',
      icon: '🫸',
      sets: pushupSets,
      reps: pushupReps,
      rest: pushupRest,
      tip: pushupTip
    });

    // 3. Bicep Curl (Arms)
    const curlSets = experience === 'beginner' ? 2 : experience === 'intermediate' ? 3 : 4;
    const curlReps = ageGroup === 'master' ? 10 : goal === 'fat' ? 15 : 12;
    const curlRest = ageGroup === 'master' ? 75 : goal === 'fat' ? 45 : 60;
    const curlTip = equipment === 'bodyweight'
      ? 'Use two water bottles or a backpack filled with books. Keep elbows pinned to your ribs.'
      : 'Hold dumbbells with palms forward. Curl upward with zero back swinging.';
    exercises.push({
      key: '2',
      name: 'Bicep Curl',
      icon: '💪',
      sets: curlSets,
      reps: curlReps,
      rest: curlRest,
      tip: curlTip
    });

    // 4. Shoulder Press (Shoulders)
    const pressSets = experience === 'beginner' ? 2 : experience === 'intermediate' ? 3 : 4;
    const pressReps = ageGroup === 'master' ? 8 : goal === 'fat' ? 12 : 10;
    const pressRest = ageGroup === 'master' ? 90 : goal === 'fat' ? 45 : 60;
    const pressTip = equipment === 'bodyweight'
      ? 'Perform bodyweight Pike Push-ups (hips raised in a V) or press water bottles overhead.'
      : 'Press dumbbells vertically until locked out. Squeeze core to avoid arching back.';
    exercises.push({
      key: '4',
      name: 'Shoulder Press',
      icon: '🙌',
      sets: pressSets,
      reps: pressReps,
      rest: pressRest,
      tip: pressTip
    });

    // Format Plan Name
    const ageLabel = AGE_GROUPS.find(a => a.id === ageGroup)?.label.split(' ')[0] || '';
    const goalLabel = GOALS.find(g => g.id === goal)?.label || '';
    const title = `AI ${ageLabel} ${goalLabel} Routine`;

    const generatedPlan = {
      title,
      bio: `${ageBio} ${goalBio}`,
      exercises,
      timestamp: Date.now(),
      profile: { ageGroup, experience, goal, equipment }
    };

    localStorage.setItem('gym-bro-workout-plan', JSON.stringify(generatedPlan));
    setPlan(generatedPlan);
  };

  const handleResetPlan = () => {
    if (window.confirm('Do you want to reset your generated plan and create a new one?')) {
      localStorage.removeItem('gym-bro-workout-plan');
      setPlan(null);
      setActiveStep(1);
      setProfile({
        ageGroup: '',
        experience: '',
        goal: '',
        equipment: '',
      });
    }
  };

  // Helper to count how many sets of an exercise were logged today
  const getCompletedSetsCount = (exerciseName) => {
    const todayStr = new Date().toDateString();
    // Normalize names to match logs e.g. "Squat" -> "SQUAT"
    const targetName = exerciseName.toUpperCase();
    return history.filter(
      (set) => set.exercise.toUpperCase() === targetName && new Date(set.date).toDateString() === todayStr
    ).length;
  };

  // Step wizard navigation helper
  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));

  // Determine button disabled state
  const isNextDisabled = () => {
    if (activeStep === 1 && !profile.ageGroup) return true;
    if (activeStep === 2 && !profile.experience) return true;
    if (activeStep === 3 && !profile.goal) return true;
    if (activeStep === 4 && !profile.equipment) return true;
    return false;
  };

  return (
    <div className="planner">
      <div className="planner__container">
        
        {/* Header */}
        <header className="planner__header glass">
          <button className="planner__back-btn" onClick={onBack} id="back-btn">
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div className="planner__header-title-wrap">
            <Sparkles size={20} className="planner__logo-icon" />
            <h1 className="planner__title">AI WORKOUT PLANNER</h1>
          </div>
          {plan && (
            <button className="planner__reset-btn" onClick={handleResetPlan} title="Create New Plan" id="reset-plan-btn">
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
          )}
        </header>

        {/* Plan Display (If plan already generated) */}
        {plan ? (
          <div className="planner__plan-view">
            
            {/* Summary Panel */}
            <section className="planner__summary-card glass reveal-child">
              <div className="planner__summary-header">
                <Award className="planner__summary-icon" size={24} />
                <h2 className="planner__plan-title">{plan.title.toUpperCase()}</h2>
              </div>
              <p className="planner__plan-bio">{plan.bio}</p>
              <div className="planner__meta-tags">
                <span className="planner__meta-tag">⚡ {EXPERIENCE_LEVELS.find(e => e.id === plan.profile.experience)?.label}</span>
                <span className="planner__meta-tag">🏋️ {EQUIPMENTS.find(e => e.id === plan.profile.equipment)?.label}</span>
                <span className="planner__meta-tag">⏱️ 4 Exercises</span>
              </div>
            </section>

            {/* Exercises List */}
            <section className="planner__exercises-section">
              <h3 className="planner__section-title">TODAY'S SCHEDULE</h3>
              <div className="planner__exercises-grid">
                {plan.exercises.map((ex) => {
                  const completed = getCompletedSetsCount(ex.name);
                  const isFinished = completed >= ex.sets;

                  return (
                    <div 
                      key={ex.key} 
                      className={`planner__exercise-card glass ${isFinished ? 'planner__exercise-card--completed' : ''}`}
                    >
                      <div className="planner__ex-header">
                        <div className="planner__ex-icon-wrap">
                          <span className="planner__ex-icon">{ex.icon}</span>
                        </div>
                        <div className="planner__ex-details">
                          <h4 className="planner__ex-name">{ex.name}</h4>
                          <div className="planner__ex-specs">
                            <span>{ex.sets} Sets</span>
                            <span>•</span>
                            <span>{ex.reps} Reps</span>
                            <span>•</span>
                            <span className="planner__ex-rest-span"><Clock size={12} /> {ex.rest}s rest</span>
                          </div>
                        </div>
                        {isFinished && (
                          <div className="planner__ex-badge-complete">
                            <CheckCircle2 size={16} />
                            <span>DONE</span>
                          </div>
                        )}
                      </div>

                      <p className="planner__ex-tip">
                        <strong>Spotter Tip:</strong> {ex.tip}
                      </p>

                      {/* Progress Set Tracker */}
                      <div className="planner__tracker-section">
                        <div className="planner__tracker-pills-label">
                          <span>Set Progress:</span>
                          <span className="planner__tracker-ratio">{completed} / {ex.sets}</span>
                        </div>
                        <div className="planner__tracker-pills">
                          {Array.from({ length: ex.sets }).map((_, idx) => {
                            const isSetDone = completed > idx;
                            const isNextSet = completed === idx;

                            if (isSetDone) {
                              return (
                                <div key={idx} className="planner__set-pill planner__set-pill--done">
                                  <span>Set {idx + 1} Done</span>
                                  <CheckCircle2 size={12} />
                                </div>
                              );
                            }

                            if (isNextSet) {
                              return (
                                <button
                                  key={idx}
                                  className="planner__set-pill planner__set-pill--active"
                                  onClick={() => onStartWorkout(ex.key, ex.reps)}
                                  title={`Launch webcam tracker to spot Set ${idx + 1}`}
                                  id={`spot-btn-${ex.name}-${idx + 1}`}
                                >
                                  <span>Spot Set {idx + 1}</span>
                                  <ChevronRight size={12} />
                                </button>
                              );
                            }

                            return (
                              <div key={idx} className="planner__set-pill planner__set-pill--pending">
                                <span>Set {idx + 1}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

          </div>
        ) : (
          /* Intake Form Wizard (If no plan generated yet) */
          <div className="planner__wizard">
            
            {/* Step Indicators */}
            <div className="planner__progress-bar">
              <div 
                className="planner__progress-fill" 
                style={{ width: `${(activeStep / 4) * 100}%` }}
              />
              <div className="planner__steps-dots">
                {[1, 2, 3, 4].map((step) => (
                  <div 
                    key={step} 
                    className={`planner__step-dot ${activeStep >= step ? 'planner__step-dot--active' : ''}`}
                    onClick={() => {
                      // Allow jumping back to answered steps
                      if (step < activeStep) setActiveStep(step);
                    }}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Wizard Cards */}
            <div className="planner__wizard-card glass animate-fade-in">
              
              {activeStep === 1 && (
                <div className="planner__step-content">
                  <div className="planner__step-header">
                    <span className="planner__step-num">Step 01</span>
                    <h2 className="planner__step-title">What is your Age Profile?</h2>
                    <p className="planner__step-subtitle">This helps our system adjust joint loads and rest timers</p>
                  </div>
                  <div className="planner__options-grid">
                    {AGE_GROUPS.map((item) => (
                      <button
                        key={item.id}
                        className={`planner__option-card ${profile.ageGroup === item.id ? 'planner__option-card--active' : ''}`}
                        onClick={() => {
                          setProfile(prev => ({ ...prev, ageGroup: item.id }));
                          setTimeout(nextStep, 150); // slight delay for visual response
                        }}
                      >
                        <strong className="planner__option-label">{item.label}</strong>
                        <span className="planner__option-desc">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="planner__step-content">
                  <div className="planner__step-header">
                    <span className="planner__step-num">Step 02</span>
                    <h2 className="planner__step-title">What is your Experience Level?</h2>
                    <p className="planner__step-subtitle">Adjusts total set counts and difficulty metrics</p>
                  </div>
                  <div className="planner__options-grid">
                    {EXPERIENCE_LEVELS.map((item) => (
                      <button
                        key={item.id}
                        className={`planner__option-card ${profile.experience === item.id ? 'planner__option-card--active' : ''}`}
                        onClick={() => {
                          setProfile(prev => ({ ...prev, experience: item.id }));
                          setTimeout(nextStep, 150);
                        }}
                      >
                        <strong className="planner__option-label">{item.label}</strong>
                        <span className="planner__option-desc">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="planner__step-content">
                  <div className="planner__step-header">
                    <span className="planner__step-num">Step 03</span>
                    <h2 className="planner__step-title">What is your Fitness Goal?</h2>
                    <p className="planner__step-subtitle">Sets structural pacing and rep target models</p>
                  </div>
                  <div className="planner__options-grid">
                    {GOALS.map((item) => (
                      <button
                        key={item.id}
                        className={`planner__option-card ${profile.goal === item.id ? 'planner__option-card--active' : ''}`}
                        onClick={() => {
                          setProfile(prev => ({ ...prev, goal: item.id }));
                          setTimeout(nextStep, 150);
                        }}
                      >
                        <strong className="planner__option-label">{item.label}</strong>
                        <span className="planner__option-desc">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeStep === 4 && (
                <div className="planner__step-content">
                  <div className="planner__step-header">
                    <span className="planner__step-num">Step 04</span>
                    <h2 className="planner__step-title">What Equipment do you have?</h2>
                    <p className="planner__step-subtitle">Adapts cues and weights guidelines for tracking</p>
                  </div>
                  <div className="planner__options-grid">
                    {EQUIPMENTS.map((item) => (
                      <button
                        key={item.id}
                        className={`planner__option-card ${profile.equipment === item.id ? 'planner__option-card--active' : ''}`}
                        onClick={() => {
                          setProfile(prev => ({ ...prev, equipment: item.id }));
                        }}
                      >
                        <strong className="planner__option-label">{item.label}</strong>
                        <span className="planner__option-desc">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Wizard Footer Controls */}
              <div className="planner__wizard-footer">
                <button 
                  className="planner__wizard-btn planner__wizard-btn--prev"
                  onClick={prevStep}
                  disabled={activeStep === 1}
                >
                  Back
                </button>
                
                {activeStep < 4 ? (
                  <button 
                    className="planner__wizard-btn planner__wizard-btn--next"
                    onClick={nextStep}
                    disabled={isNextDisabled()}
                  >
                    Next
                  </button>
                ) : (
                  <button 
                    className="planner__wizard-btn planner__wizard-btn--generate"
                    onClick={handleGeneratePlan}
                    disabled={isNextDisabled()}
                    id="generate-plan-btn"
                  >
                    <Sparkles size={16} />
                    <span>Generate AI Plan</span>
                  </button>
                )}
              </div>

            </div>

            {/* Health Disclaimer */}
            <div className="planner__disclaimer glass">
              <ShieldAlert size={16} className="planner__disclaimer-icon" />
              <p>
                <strong>Safety Disclaimer:</strong> Please consult a healthcare professional before initiating any exercise program. Listen to your body and stop immediately if you feel pain, dizziness, or chest discomfort.
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default WorkoutPlanner;
