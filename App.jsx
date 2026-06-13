import { useState, useEffect } from 'react';
import { Plus, Trash2, Dumbbell, Calendar as CalendarIcon, ChevronDown, ChevronUp, Check, X, ChevronLeft, ChevronRight, Edit2, Trophy, Flame } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function App() {
  const initialSets = [
    { reps: 0, weight: 0 }, { reps: 0, weight: 0 }, 
    { reps: 0, weight: 0 }, { reps: 0, weight: 0 }
  ];

  const getTodayString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };

  const todayMaxDate = getTodayString();

  // Core States
  const [library, setLibrary] = useState({});
  const [history, setHistory] = useState([]); 
  const [customSplits, setCustomSplits] = useState({});
  const [selectedDate, setSelectedDate] = useState(todayMaxDate);
  const [selectedDay, setSelectedDay] = useState('');
  
  const [selectedBodyPart, setSelectedBodyPart] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [sets, setSets] = useState(initialSets);
  const [editingId, setEditingId] = useState(null);
  
  const [isAddingPart, setIsAddingPart] = useState(false);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newInput, setNewInput] = useState('');

  // Collapsible Dropdown Toggle States
  const [isPrExpanded, setIsPrExpanded] = useState(false);
  const [isSplitStructureExpanded, setIsSplitStructureExpanded] = useState(false);

  // Calendar Modal States
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());

  useEffect(() => {
    const savedLib = localStorage.getItem('fz_lib');
    const savedSplits = localStorage.getItem('fz_splits');
    const savedLogs = localStorage.getItem('fz_logs');
    
    if (savedLib) setLibrary(JSON.parse(savedLib));
    if (savedSplits) setCustomSplits(JSON.parse(savedSplits));
    if (savedLogs) {
      const allLogs = JSON.parse(savedLogs);
      const todaysSavedLogs = allLogs.filter(log => log.created_at === todayMaxDate);
      setHistory(todaysSavedLogs);
    }
  }, []);

  const saveLibrary = (newLib) => {
    setLibrary(newLib);
    localStorage.setItem('fz_lib', JSON.stringify(newLib));
  };

  const saveLogs = (newLogs) => {
    setHistory(newLogs);
    localStorage.setItem('fz_logs', JSON.stringify(newLogs));
  };

  const saveSplitsData = (newSplits) => {
    setCustomSplits(newSplits);
    localStorage.setItem('fz_splits', JSON.stringify(newSplits));
  };

  const deleteMuscleGroup = () => {
    if (!selectedBodyPart) return alert("Please select a muscle group to delete first.");
    if (confirm(`Are you sure you want to delete "${selectedBodyPart}" and all of its corresponding exercises from your library?`)) {
      const updatedLib = { ...library };
      delete updatedLib[selectedBodyPart];
      saveLibrary(updatedLib);
      setSelectedBodyPart('');
      setSelectedExercise('');
    }
  };

  const deleteExerciseOption = () => {
    if (!selectedBodyPart || !selectedExercise) return alert("Please select an exercise option to delete first.");
    if (confirm(`Are you sure you want to remove "${selectedExercise}" from the ${selectedBodyPart} menu?`)) {
      const updatedLib = { ...library };
      updatedLib[selectedBodyPart] = updatedLib[selectedBodyPart].filter(ex => ex !== selectedExercise);
      saveLibrary(updatedLib);
      setSelectedExercise('');
    }
  };

  const addExerciseToDay = () => {
    if (!selectedDay) return alert("Please select a day from the split dropdown first!");
    if (!selectedBodyPart || !selectedExercise) return alert("Please select both a Muscle Group and an Exercise below to add it!");

    const currentDaySetup = customSplits[selectedDay] || { exercises: [] };
    const exists = currentDaySetup.exercises.some(ex => ex.name === selectedExercise);
    if (exists) {
      return alert("This exercise is already added to today's split routine!");
    }

    const updatedSplits = {
      ...customSplits,
      [selectedDay]: {
        exercises: [...currentDaySetup.exercises, { name: selectedExercise, muscle: selectedBodyPart }]
      }
    };
    saveSplitsData(updatedSplits);
    
    setIsSplitStructureExpanded(true);
    handleDaySelect(selectedDay);
  };

  const removeExerciseFromDay = (exerciseNameToRemove) => {
    if (!selectedDay || !customSplits[selectedDay]) return;

    if (confirm("Are you sure you want to delete this exercise?")) {
      const targetExercises = customSplits[selectedDay].exercises.filter(ex => ex.name !== exerciseNameToRemove);
      const updatedSplits = { ...customSplits };

      if (targetExercises.length === 0) {
        delete updatedSplits[selectedDay];
      } else {
        updatedSplits[selectedDay] = { exercises: targetExercises };
      }

      saveSplitsData(updatedSplits);
      
      const savedLogs = localStorage.getItem('fz_logs');
      let globalLogs = savedLogs ? JSON.parse(savedLogs) : [];
      
      globalLogs = globalLogs.filter(
        log => !(log.created_at === selectedDate && log.exercise_name === exerciseNameToRemove && log.isSkeleton)
      );
      
      localStorage.setItem('fz_logs', JSON.stringify(globalLogs));
      setHistory(globalLogs.filter(log => log.created_at === selectedDate));
    }
  };

  const handleDaySelect = (day) => {
    setSelectedDay(day);
    if (!day) {
      const savedLogs = localStorage.getItem('fz_logs');
      const globalLogs = savedLogs ? JSON.parse(savedLogs) : [];
      setHistory(globalLogs.filter(log => log.created_at === selectedDate));
      setIsSplitStructureExpanded(false);
      return;
    }

    setIsSplitStructureExpanded(false);

    const savedLogs = localStorage.getItem('fz_logs');
    let globalLogs = savedLogs ? JSON.parse(savedLogs) : [];

    globalLogs = globalLogs.filter(log => !(log.created_at === selectedDate && log.isSkeleton));

    const daySetup = customSplits[day];
    if (daySetup) {
      daySetup.exercises.forEach(routineEx => {
        const alreadyExists = globalLogs.some(
          log => log.created_at === selectedDate && log.exercise_name === routineEx.name
        );

        if (!alreadyExists) {
          const skeletonLog = {
            id: crypto.randomUUID(),
            body_part: routineEx.muscle,
            exercise_name: routineEx.name,
            sets_data: [
              { reps: 0, weight: 0 }, { reps: 0, weight: 0 },
              { reps: 0, weight: 0 }, { reps: 0, weight: 0 }
            ],
            created_at: selectedDate,
            isSkeleton: true
          };
          globalLogs.push(skeletonLog);
        }
      });
    }
    
    localStorage.setItem('fz_logs', JSON.stringify(globalLogs));
    setHistory(globalLogs.filter(log => log.created_at === selectedDate));

    if (daySetup && daySetup.exercises.length > 0) {
      setSelectedBodyPart(daySetup.exercises[0].muscle);
      setSelectedExercise(daySetup.exercises[0].name);
    }
  };

  const handleSave = () => {
    if (!selectedExercise) return alert("Select an exercise!");
    
    const savedLogs = localStorage.getItem('fz_logs');
    let globalLogs = savedLogs ? JSON.parse(savedLogs) : [];

    if (editingId) {
      globalLogs = globalLogs.map(log => log.id === editingId ? { ...log, body_part: selectedBodyPart, exercise_name: selectedExercise, sets_data: sets, isSkeleton: false } : log);
      setEditingId(null);
    } else {
      const existingIdx = globalLogs.findIndex(log => log.created_at === selectedDate && log.exercise_name === selectedExercise);
      
      if (existingIdx !== -1) {
        globalLogs[existingIdx] = { ...globalLogs[existingIdx], body_part: selectedBodyPart, sets_data: sets, isSkeleton: false };
      } else {
        const entry = { id: crypto.randomUUID(), body_part: selectedBodyPart, exercise_name: selectedExercise, sets_data: sets, created_at: selectedDate, isSkeleton: false };
        globalLogs = [entry, ...globalLogs];
      }
    }

    localStorage.setItem('fz_logs', JSON.stringify(globalLogs));
    setHistory(globalLogs.filter(log => log.created_at === selectedDate));

    setSets(initialSets);
    setSelectedExercise('');
  };

  const getPersonalRecords = () => {
    const savedLogs = localStorage.getItem('fz_logs');
    const globalLogs = savedLogs ? JSON.parse(savedLogs) : [];
    
    const prMap = {};
    globalLogs.forEach(log => {
      if (log.isSkeleton) return;
      log.sets_data.forEach(set => {
        if (set.weight > (prMap[log.exercise_name] || 0)) {
          prMap[log.exercise_name] = set.weight;
        }
      });
    });
    return prMap;
  };

  const getDayMuscleSummary = (day) => {
    if (!customSplits[day] || customSplits[day].exercises.length === 0) return 'Empty';
    const muscles = [...new Set(customSplits[day].exercises.map(e => e.muscle))];
    return muscles.join(' & ');
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleCalendarDayClick = (dayNum) => {
    if (!dayNum) return;
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    
    const targetDateObj = new Date(year, month, dayNum);
    const offset = targetDateObj.getTimezoneOffset();
    const targetStr = new Date(targetDateObj.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];

    if (targetStr > todayMaxDate) return; 

    setSelectedDate(targetStr);
    setShowCalendarModal(false);
    setSelectedDay('');

    const savedLogs = localStorage.getItem('fz_logs');
    const globalLogs = savedLogs ? JSON.parse(savedLogs) : [];
    setHistory(globalLogs.filter(log => log.created_at === targetStr));
  };

  const changeMonth = (direction) => {
    const newMonth = currentViewDate.getMonth() + direction;
    const updatedDate = new Date(currentViewDate.getFullYear(), newMonth, 1);
    
    const now = new Date();
    if (direction === 1 && updatedDate.getFullYear() >= now.getFullYear() && updatedDate.getMonth() > now.getMonth()) {
      return;
    }
    setCurrentViewDate(updatedDate);
  };

  const generateCalendarGridDays = () => {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const totalSlots = [];
    for (let i = 0; i < adjustedFirstDay; i++) {
      totalSlots.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      totalSlots.push(d);
    }
    return totalSlots;
  };

  const isCurrentSelectionCell = (dayNum) => {
    if (!dayNum) return false;
    const [sYear, sMonth, sDay] = selectedDate.split('-').map(Number);
    return (
      dayNum === sDay && 
      currentViewDate.getMonth() === (sMonth - 1) && 
      currentViewDate.getFullYear() === sYear
    );
  };

  const isCellFutureDisabled = (dayNum) => {
    if (!dayNum) return false;
    const targetDateObj = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), dayNum);
    const offset = targetDateObj.getTimezoneOffset();
    const targetStr = new Date(targetDateObj.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
    return targetStr > todayMaxDate;
  };

  const prs = getPersonalRecords();
  const getLabel = (i) => i < 3 ? `S${i + 1}` : `DS${i - 2}`;
  const filteredHistory = history.filter(log => log.created_at === selectedDate);

  return (
    <div className="min-h-screen text-zinc-100 p-4 font-sans antialiased" style={{ backgroundColor: '#09090b', minHeight: '100vh', color: '#f4f4f5', boxSizing: 'border-box' }}>
      <div className="max-w-md mx-auto" style={{ maxWidth: '448px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', boxSizing: 'border-box' }}>
        
        {/* HEADER */}
        <header style={{ textAlign: 'center', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#2563eb', padding: '10px', borderRadius: '12px' }}>
              <Dumbbell size={24} style={{ color: '#ffffff' }} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', tracking: '-0.05em', margin: 0 }}>
              Fitness Zone
            </h1>
          </div>
        </header>

        {/* DATE PICKER BAR */}
        <section style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div 
            onClick={() => {
              const [sYear, sMonth] = selectedDate.split('-').map(Number);
              setCurrentViewDate(new Date(sYear, sMonth - 1, 1));
              setShowCalendarModal(true);
            }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px', 
              backgroundColor: '#18181b', 
              border: '1px solid #27272a', 
              padding: '12px 24px', 
              borderRadius: '16px', 
              width: '100%',
              maxWidth: '240px',
              cursor: 'pointer',
              fontWeight: '800',
              fontSize: '14px',
              color: '#f4f4f5',
              boxSizing: 'border-box'
            }}
          >
            <CalendarIcon size={16} style={{ color: '#3b82f6' }} />
            <span>{formatDisplayDate(selectedDate)}</span>
          </div>
        </section>

        {/* WEEKLY TRAINING SPLIT ROUTINE */}
        <section style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '16px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>
              <Flame size={14} />
              <span>Weekly Training Split Routine</span>
            </div>
            {selectedDay && selectedBodyPart && selectedExercise && (
              <button onClick={addExerciseToDay} style={{ fontSize: '10px', backgroundColor: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa', fontWeight: '800', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)', cursor: 'pointer' }}>
                + Link Exercise
              </button>
            )}
          </div>
          
          <select value={selectedDay} onChange={e => handleDaySelect(e.target.value)} style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #27272a', padding: '14px', borderRadius: '12px', color: '#e4e4e7', fontSize: '14px', fontWeight: '700', boxSizing: 'border-box' }}>
            <option value="">Choose a Target Day to Load or Edit...</option>
            {DAYS_OF_WEEK.map(day => (
              <option key={day} value={day}>
                {day} • ({getDayMuscleSummary(day)})
              </option>
            ))}
          </select>

          {/* Render Routine Exercise Items */}
          {selectedDay && customSplits[selectedDay]?.exercises.length > 0 && (
            <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
              <div 
                onClick={() => setIsSplitStructureExpanded(!isSplitStructureExpanded)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#09090b', padding: '12px', borderRadius: isSplitStructureExpanded ? '16px 16px 0 0' : '16px', border: '1px solid #27272a', cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}
              >
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', tracking: '0.05em' }}>
                  {selectedDay.toUpperCase()} SPLIT STRUCTURE LIST ({customSplits[selectedDay].exercises.length})
                </span>
                <div style={{ color: '#71717a', display: 'flex', alignItems: 'center' }}>
                  {isSplitStructureExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {isSplitStructureExpanded && (
                <div style={{ backgroundColor: '#09090b', borderLeft: '1px solid #27272a', borderRight: '1px solid #27272a', borderBottom: '1px solid #27272a', padding: '12px', borderRadius: '0 0 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
                  {customSplits[selectedDay].exercises.map((ex, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#18181b', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(39, 39, 42, 0.4)', width: '100%', boxSizing: 'border-box' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', color: '#3b82f6', marginRight: '8px', textTransform: 'uppercase', fontWeight: '900' }}>[{ex.muscle}]</span>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#f4f4f5', cursor: 'pointer' }} onClick={() => { setSelectedBodyPart(ex.muscle); setSelectedExercise(ex.name); }}>{ex.name}</span>
                      </div>
                      <button onClick={() => removeExerciseFromDay(ex.name)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* COLLAPSIBLE PERSONAL RECORDS DASHBOARD */}
        {Object.keys(prs).length > 0 && (
          <section style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '16px 20px', borderRadius: '24px', boxSizing: 'border-box', width: '100%' }}>
            <div 
              onClick={() => setIsPrExpanded(!isPrExpanded)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>
                <Trophy size={16} />
                <span>Personal Records Dashboard</span>
              </div>
              <div style={{ color: '#71717a', display: 'flex', alignItems: 'center' }}>
                {isPrExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>

            {isPrExpanded && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', width: '100%', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(39, 39, 42, 0.4)' }}>
                {Object.entries(prs).map(([exercise, maxWeight]) => (
                  <div key={exercise} style={{ backgroundColor: '#09090b', border: '1px solid #27272a', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
                    <span style={{ fontSize: '12px', color: '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>{exercise}</span>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff' }}>{maxWeight}<span style={{ fontSize: '10px', color: '#f59e0b', marginLeft: '2px' }}>KG</span></span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* MAIN INPUT LOGGING CONSOLE CONTAINER */}
        <section style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box', width: '100%' }}>
          
          {/* Muscle dropdown block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', width: '100%' }}>
              <span>Muscle Group Target</span>
              <button onClick={() => setIsAddingPart(true)} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ Add Custom</button>
            </div>
            {isAddingPart ? (
              <div style={{ display: 'flex', gap: '3%', width: '100%', boxSizing: 'border-box', alignItems: 'center' }}>
                <input autoFocus value={newInput} onChange={e => setNewInput(e.target.value)} placeholder="e.g. Chest" style={{ width: '85%', backgroundColor: '#09090b', border: '1px solid #3b82f6', padding: '14px', borderRadius: '12px', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box', height: '50px' }} />
                <button onClick={() => { if(!newInput) return; saveLibrary({...library, [newInput]: []}); setSelectedBodyPart(newInput); setIsAddingPart(false); setNewInput(''); }} style={{ backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '12px', border: 'none', cursor: 'pointer', width: '12%', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><Check size={18}/></button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '3%', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                <select value={selectedBodyPart} onChange={e => { setSelectedBodyPart(e.target.value); setSelectedExercise(''); }} style={{ width: selectedBodyPart ? '85%' : '100%', backgroundColor: '#09090b', border: '1px solid #27272a', padding: '14px', borderRadius: '12px', color: '#e4e4e7', fontSize: '14px', fontWeight: '700', boxSizing: 'border-box', height: '50px' }}>
                  <option value="">Select Target Muscle...</option>
                  {Object.keys(library).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {selectedBodyPart && (
                  <button onClick={deleteMuscleGroup} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', height: '50px', width: '12%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', cursor: 'pointer', padding: 0 }}>
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Exercise dropdown block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', width: '100%' }}>
              <span>Exercise Name</span>
              <button disabled={!selectedBodyPart} onClick={() => setIsAddingExercise(true)} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', opacity: selectedBodyPart ? 1 : 0.3, padding: 0 }}>+ Add Custom</button>
            </div>
            {isAddingExercise ? (
              <div style={{ display: 'flex', gap: '3%', width: '100%', boxSizing: 'border-box', alignItems: 'center' }}>
                <input autoFocus value={newInput} onChange={e => setNewInput(e.target.value)} placeholder="e.g. Bench Press" style={{ width: '85%', backgroundColor: '#09090b', border: '1px solid #3b82f6', padding: '14px', borderRadius: '12px', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box', height: '50px' }} />
                <button onClick={() => { if(!newInput || !selectedBodyPart) return; saveLibrary({...library, [selectedBodyPart]: [...(library[selectedBodyPart] || []), newInput]}); setSelectedExercise(newInput); setIsAddingExercise(false); setNewInput(''); }} style={{ backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '12px', border: 'none', cursor: 'pointer', width: '12%', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><Check size={18}/></button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '3%', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                <select disabled={!selectedBodyPart} value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)} style={{ width: selectedExercise ? '85%' : '100%', backgroundColor: '#09090b', border: '1px solid #27272a', padding: '14px', borderRadius: '12px', color: '#e4e4e7', fontSize: '14px', fontWeight: '700', opacity: selectedBodyPart ? 1 : 0.4, boxSizing: 'border-box', height: '50px' }}>
                  <option value="">Choose Exercise...</option>
                  {selectedBodyPart && library[selectedBodyPart]?.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                </select>
                {selectedExercise && (
                  <button onClick={deleteExerciseOption} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', height: '50px', width: '12%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', cursor: 'pointer', padding: 0 }}>
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* INPUT ROWS FOR REPS AND WEIGHTS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px', borderTop: '1px solid rgba(39, 39, 42, 0.6)', width: '100%' }}>
            <div style={{ display: 'flex', width: '100%', fontSize: '10px', fontWeight: '900', color: '#71717a', textTransform: 'uppercase', textAlign: 'center' }}>
              <div style={{ width: '15%', textAlign: 'left' }}>Set</div>
              <div style={{ width: '35%' }}>Reps</div>
              <div style={{ width: '42%' }}>Weight</div>
              <div style={{ width: '8%' }}></div>
            </div>

            {sets.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px', backgroundColor: 'rgba(9, 9, 11, 0.3)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(39, 39, 42, 0.3)', boxSizing: 'border-box' }}>
                <div style={{ width: '15%', textAlign: 'center', fontSize: '12px', fontWeight: '900', color: i >= 3 ? '#f59e0b' : '#71717a' }}>{getLabel(i)}</div>
                <input type="number" placeholder="0" onChange={e => { const n = [...sets]; n[i].reps = Number(e.target.value); setSets(n); }} value={s.reps || ''} style={{ width: '35%', backgroundColor: '#09090b', border: '1px solid #27272a', padding: '10px', borderRadius: '8px', color: '#ffffff', textAlign: 'center', fontSize: '14px', boxSizing: 'border-box' }} />
                <div style={{ width: '42%', display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <input type="number" placeholder="0" onChange={e => { const n = [...sets]; n[i].weight = Number(e.target.value); setSets(n); }} value={s.weight || ''} style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #27272a', padding: '10px', borderRadius: '8px', color: '#ffffff', textAlign: 'center', fontSize: '14px', boxSizing: 'border-box', paddingRight: '24px' }} />
                  <span style={{ position: 'absolute', right: '8px', fontSize: '9px', fontWeight: '900', color: '#3f3f46' }}>kg</span>
                </div>
                <button onClick={() => setSets(sets.filter((_, idx) => idx !== i))} style={{ width: '8%', background: 'none', border: 'none', color: '#3f3f46', cursor: 'pointer', display: 'flex', justifyContent: 'center', padding: 0 }}><Trash2 size={16}/></button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', paddingTop: '6px', width: '100%' }}>
            {editingId ? (
              <>
                <button onClick={() => { setEditingId(null); setSets(initialSets); }} style={{ flex: 1, backgroundColor: '#27272a', color: '#d4d4d8', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSave} style={{ flex: 1, backgroundColor: '#f59e0b', color: '#ffffff', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer' }}>Update Log</button>
              </>
            ) : (
              <>
                <button onClick={() => setSets([...sets, {reps: 0, weight: 0}])} style={{ flex: 1, backgroundColor: '#27272a', color: '#d4d4d8', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer' }}>Add Drop Set</button>
                <button onClick={handleSave} style={{ flex: 1, backgroundColor: '#2563eb', color: '#ffffff', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer' }}>Save Workout</button>
              </>
            )}
          </div>
        </section>

        {/* WORKOUT HISTORY AREA (LOCKED TO READ-ONLY STATUS FIELDS) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
          <h2 style={{ fontSize: '10px', fontWeight: '900', color: '#52525b', textTransform: 'uppercase', tracking: '0.1em', paddingLeft: '8px', borderLeft: '2px solid #2563eb', margin: 0 }}>Today's Workout History & Pre-loaded Split</h2>
          {filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', backgroundColor: 'rgba(24, 24, 27, 0.2)', border: '1px solid rgba(39, 39, 42, 0.4)', borderRadius: '24px', color: '#52525b', fontSize: '12px', fontStyle: 'italic', fontWeight: '600', boxSizing: 'border-box', width: '100%' }}>No logs tracked or day routines loaded yet. Select a template day from the split section above!</div>
          ) : (
            filteredHistory.map(log => (
              <div key={log.id} style={{ backgroundColor: 'rgba(24, 24, 27, 0.6)', border: '1px solid #27272a', padding: '12px 16px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', boxSizing: 'border-box', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div>
                    <span style={{ fontSize: '8px', fontWeight: '900', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '4px 10px', borderRadius: '8px', textTransform: 'uppercase', display: 'inline-block', marginBottom: '4px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>{log.body_part}</span>
                    <h3 style={{ fontWeight: '800', color: log.isSkeleton ? '#52525b' : '#ffffff', fontSize: '16px', textTransform: 'uppercase', fontStyle: 'italic', margin: 0 }}>
                      {log.exercise_name} {log.isSkeleton && <span style={{ fontSize: '11px', fontWeight: '500', color: '#3f3f46' }}>(Template)</span>}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button onClick={() => { setEditingId(log.id); setSelectedBodyPart(log.body_part); setSelectedExercise(log.exercise_name); setSets(log.sets_data); window.scrollTo({top:0, behavior:'smooth'}); }} style={{ padding: '8px', color: '#52525b', background: 'none', border: 'none', cursor: 'pointer' }}><Edit2 size={15}/></button>
                    <button onClick={() => { if(confirm("Are you sure you want to delete this log?")) { const savedLogs = localStorage.getItem('fz_logs'); const globalLogs = savedLogs ? JSON.parse(savedLogs) : []; const updated = globalLogs.filter(h => h.id !== log.id); saveLogs(updated); setHistory(updated.filter(h => h.created_at === selectedDate)); } }} style={{ padding: '8px', color: '#52525b', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={15}/></button>
                  </div>
                </div>

                {/* Grid matrix displays read-only status metrics to protect against data override errors */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px', width: '100%' }}>
                  {log.sets_data.map((s, i) => (
                    <div key={i} style={{ backgroundColor: '#09090b', border: '1px solid #27272a', padding: '6px', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', boxSizing: 'border-box' }}>
                      <span style={{ fontWeight: '900', fontSize: '9px', color: i >= 3 ? '#f59e0b' : '#52525b' }}>{getLabel(i)}</span>
                      <div style={{ width: '100%', backgroundColor: '#18181b', padding: '4px 0', color: s.reps ? '#ffffff' : '#3f3f46', fontSize: '13px', textAlign: 'center', fontWeight: '700', borderRadius: '6px' }}>
                        {s.reps || 'Reps'}
                      </div>
                      <div style={{ width: '100%', backgroundColor: '#18181b', padding: '4px 0', color: s.weight ? '#3b82f6' : '#3f3f46', fontSize: '13px', textAlign: 'center', fontWeight: '900', borderRadius: '6px' }}>
                        {s.weight ? `${s.weight} kg` : 'kg'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* CUSTOM POPUP CALENDAR MODAL COMPONENT */}
        {showCalendarModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropBlur: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              backgroundColor: '#1c1c1e',
              border: '1px solid #2c2c2e',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '340px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              boxSizing: 'border-box'
            }}>
              
              <div style={{ backgroundColor: '#2c2c2e', padding: '20px', color: '#ffffff', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '14px', opacity: 0.6, fontWeight: '600' }}>{currentViewDate.getFullYear()}</div>
                <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px', textTransform: 'capitalize' }}>
                  {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 12px' }}>
                <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px' }}><ChevronLeft size={18} /></button>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>
                  {MONTHS[currentViewDate.getMonth()]} {currentViewDate.getFullYear()}
                </div>
                <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px' }}><ChevronRight size={18} /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', textAlign: 'center', padding: '0 12px', marginBottom: '8px' }}>
                {DAYS_SHORT.map((d, idx) => (
                  <span key={idx} style={{ fontSize: '11px', fontWeight: '900', color: '#71717a' }}>{d}</span>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '4px', padding: '0 12px 16px 12px', textAlign: 'center' }}>
                {generateCalendarGridDays().map((day, idx) => {
                  const isSelected = isCurrentSelectionCell(day);
                  const isDisabled = isCellFutureDisabled(day);

                  return (
                    <div 
                      key={idx}
                      onClick={() => !isDisabled && handleCalendarDayClick(day)}
                      style={{
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: '700',
                        borderRadius: '50%',
                        cursor: day && !isDisabled ? 'pointer' : 'default',
                        backgroundColor: isSelected ? '#3b82f6' : 'transparent',
                        color: isDisabled ? '#3f3f46' : isSelected ? '#ffffff' : day ? '#e4e4e7' : 'transparent',
                      }}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', padding: '12px 20px', borderTop: '1px solid #2c2c2e' }}>
                <button onClick={() => setShowCalendarModal(false)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => { setSelectedDate(todayMaxDate); setShowCalendarModal(false); setSelectedDay(''); const savedLogs = localStorage.getItem('fz_logs'); const globalLogs = savedLogs ? JSON.parse(savedLogs) : []; setHistory(globalLogs.filter(h => h.created_at === todayMaxDate)); }} style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>Today</button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
