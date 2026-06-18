import { useState, useEffect } from 'react';
import { Plus, Trash2, Dumbbell, Calendar as CalendarIcon, ChevronDown, ChevronUp, Check, X, ChevronLeft, ChevronRight, Edit2, Trophy, Flame, Copy, FileText, Play, Square, Clock, Pause } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function App() {
  const initialSets = [
    { reps: 0, weight: 0, type: 'standard' }, 
    { reps: 0, weight: 0, type: 'standard' }, 
    { reps: 0, weight: 0, type: 'standard' }
  ];

  const getTodayString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };

  const todayMaxDate = getTodayString();

  // Core Local States
  const [library, setLibrary] = useState({});
  const [history, setHistory] = useState([]); 
  const [globalFullHistory, setGlobalFullHistory] = useState([]); 
  const [customSplits, setCustomSplits] = useState({});
  const [selectedDate, setSelectedDate] = useState(todayMaxDate);
  const [selectedDay, setSelectedDay] = useState('');
  
  const [selectedBodyPart, setSelectedBodyPart] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [sets, setSets] = useState(initialSets);
  const [notes, setNotes] = useState(''); 
  const [editingId, setEditingId] = useState(null);

  // Advanced Timer States (Supporting Local Storage Persistent Pause Engine)
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedDuration, setCompletedDuration] = useState('');
  
  // Custom Addition Toggles
  const [isAddingPart, setIsAddingPart] = useState(false);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newInput, setNewInput] = useState('');

  // Name Renaming/Editing States
  const [isEditingPartName, setIsEditingPartName] = useState(false);
  const [isEditingExerciseName, setIsEditingExerciseName] = useState(false);
  const [renameInput, setRenameInput] = useState('');

  // Collapsible Layout Toggles
  const [isPrExpanded, setIsPrExpanded] = useState(false);
  const [isSplitStructureExpanded, setIsSplitStructureExpanded] = useState(false);

  // Calendar States
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());

  // Initialization Hook
  useEffect(() => {
    const savedLib = localStorage.getItem('fz_lib');
    const savedSplits = localStorage.getItem('fz_splits');
    const savedHistory = localStorage.getItem('fz_history');
    
    const savedTimerRunning = localStorage.getItem('fz_timer_running') === 'true';
    const savedTimerStart = localStorage.getItem('fz_timer_start');
    const savedTimerAccumulated = localStorage.getItem('fz_timer_accumulated') || '0';
    const savedCompletedDuration = localStorage.getItem('fz_completed_duration') || '';
    
    const loadedLib = savedLib ? JSON.parse(savedLib) : {};
    const loadedSplits = savedSplits ? JSON.parse(savedSplits) : {};
    const loadedGlobalHistory = savedHistory ? JSON.parse(savedHistory) : [];

    setLibrary(loadedLib);
    setCustomSplits(loadedSplits);
    setGlobalFullHistory(loadedGlobalHistory);
    setCompletedDuration(savedCompletedDuration);
    
    // Restore exact state of timer and calculations across app refreshes
    if (savedTimerRunning && savedTimerStart) {
      const startTimestamp = parseInt(savedTimerStart, 10);
      const accumulated = parseInt(savedTimerAccumulated, 10);
      setStartTime(startTimestamp);
      setIsTimerRunning(true);
      setElapsedSeconds(accumulated + Math.floor((Date.now() - startTimestamp) / 1000));
    } else {
      const accumulated = parseInt(savedTimerAccumulated, 10);
      setElapsedSeconds(accumulated);
      setIsTimerRunning(false);
    }

    filterAndLoadLogsForDate(todayMaxDate, loadedGlobalHistory, loadedSplits, '');
  }, []);

  // Visual stopwatch sync interval block
  useEffect(() => {
    let intervalIndex = null;
    if (isTimerRunning && startTime) {
      const savedTimerAccumulated = parseInt(localStorage.getItem('fz_timer_accumulated') || '0', 10);
      intervalIndex = setInterval(() => {
        setElapsedSeconds(savedTimerAccumulated + Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (intervalIndex) clearInterval(intervalIndex);
    };
  }, [isTimerRunning, startTime]);

  const filterAndLoadLogsForDate = (dateStr, fullHistoryList, currentSplitsSetup, activeDay) => {
    let dayLogs = fullHistoryList.filter(log => log.created_at === dateStr && !log.isSkeleton);

    if (activeDay && currentSplitsSetup[activeDay]) {
      currentSplitsSetup[activeDay].exercises.forEach(routineEx => {
        const alreadyExists = dayLogs.some(log => log.exercise_name === routineEx.name);

        if (!alreadyExists) {
          const skeletonTemplateLog = {
            id: `skeleton-${routineEx.name}-${dateStr}`,
            body_part: routineEx.muscle,
            exercise_name: routineEx.name,
            sets_data: initialSets,
            notes: '', 
            duration: '',
            created_at: dateStr,
            isSkeleton: true
          };
          dayLogs.push(skeletonTemplateLog);
        }
      });
    }

    setHistory(dayLogs);
  };

  // ADVANCED TRACKING PAUSE ENGINE ENGINE METHODS
  const handleStartWorkout = () => {
    const currentTimestamp = Date.now();
    setStartTime(currentTimestamp);
    setIsTimerRunning(true);
    
    localStorage.setItem('fz_timer_start', currentTimestamp.toString());
    localStorage.setItem('fz_timer_running', 'true');
  };

  const handlePauseWorkout = () => {
    if (!isTimerRunning || !startTime) return;
    
    // Freeze current interval slice and update cumulative baseline balance values
    const additionalElapsed = Math.floor((Date.now() - startTime) / 1000);
    const totalAccumulated = parseInt(localStorage.getItem('fz_timer_accumulated') || '0', 10) + additionalElapsed;
    
    setIsTimerRunning(false);
    setStartTime(null);
    setElapsedSeconds(totalAccumulated);
    
    localStorage.setItem('fz_timer_accumulated', totalAccumulated.toString());
    localStorage.setItem('fz_timer_running', 'false');
    localStorage.removeItem('fz_timer_start');
  };

  const handleEndWorkout = () => {
    let finalTotalSeconds = elapsedSeconds;
    
    // Catch active ticking seconds if stopping while timer is unpaused
    if (isTimerRunning && startTime) {
      const additionalElapsed = Math.floor((Date.now() - startTime) / 1000);
      finalTotalSeconds = parseInt(localStorage.getItem('fz_timer_accumulated') || '0', 10) + additionalElapsed;
    }
    
    const hours = Math.floor(finalTotalSeconds / 3600);
    const minutes = Math.floor((finalTotalSeconds % 3600) / 60);
    
    let durationString = '';
    if (hours > 0) {
      durationString = `${hours}h ${minutes}m`;
    } else {
      durationString = `${minutes || 1} mins`;
    }

    setCompletedDuration(durationString);
    setIsTimerRunning(false);
    setStartTime(null);
    setElapsedSeconds(0);
    
    localStorage.setItem('fz_completed_duration', durationString);
    localStorage.removeItem('fz_timer_start');
    localStorage.removeItem('fz_timer_accumulated');
    localStorage.setItem('fz_timer_running', 'false');
    
    alert(`Workout session finalized! Total Duration: ${durationString}`);
  };

  const formatStopwatchDisplay = (totalSecs) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const saveLibrary = (newLib) => {
    setLibrary(newLib);
    localStorage.setItem('fz_lib', JSON.stringify(newLib));
  };

  const saveSplitsData = (newSplits) => {
    setCustomSplits(newSplits);
    localStorage.setItem('fz_splits', JSON.stringify(newSplits));
  };

  const saveGlobalHistoryData = (newHistoryList) => {
    setGlobalFullHistory(newHistoryList);
    localStorage.setItem('fz_history', JSON.stringify(newHistoryList));
  };

  const handleRenameMuscleGroup = () => {
    if (!selectedBodyPart || !renameInput.trim()) return;
    const oldName = selectedBodyPart;
    const newName = renameInput.trim();

    if (library[newName]) {
      alert("A muscle group with this name already exists!");
      return;
    }

    const updatedLib = { ...library };
    updatedLib[newName] = updatedLib[oldName] || [];
    delete updatedLib[oldName];
    saveLibrary(updatedLib);

    const updatedSplits = { ...customSplits };
    Object.keys(updatedSplits).forEach(day => {
      if (updatedSplits[day]?.exercises) {
        updatedSplits[day].exercises = updatedSplits[day].exercises.map(ex => 
          ex.muscle === oldName ? { ...ex, muscle: newName } : ex
        );
      }
    });
    saveSplitsData(updatedSplits);

    const updatedGlobalHistory = globalFullHistory.map(log => 
      log.body_part === oldName ? { ...log, body_part: newName } : log
    );
    saveGlobalHistoryData(updatedGlobalHistory);

    setSelectedBodyPart(newName);
    setIsEditingPartName(false);
    setRenameInput('');
    filterAndLoadLogsForDate(selectedDate, updatedGlobalHistory, updatedSplits, selectedDay);
    alert(`Successfully renamed category to "${newName}"`);
  };

  const handleRenameExerciseOption = () => {
    if (!selectedBodyPart || !selectedExercise || !renameInput.trim()) return;
    const oldExName = selectedExercise;
    const newExName = renameInput.trim();

    const currentExercises = library[selectedBodyPart] || [];
    if (currentExercises.includes(newExName)) {
      alert("This exercise name option already exists inside this category!");
      return;
    }

    const updatedLib = { ...library };
    updatedLib[selectedBodyPart] = currentExercises.map(ex => ex === oldExName ? newExName : ex);
    saveLibrary(updatedLib);

    const updatedSplits = { ...customSplits };
    Object.keys(updatedSplits).forEach(day => {
      if (updatedSplits[day]?.exercises) {
        updatedSplits[day].exercises = updatedSplits[day].exercises.map(ex => 
          ex.name === oldExName ? { ...ex, name: newExName } : ex
        );
      }
    });
    saveSplitsData(updatedSplits);

    const updatedGlobalHistory = globalFullHistory.map(log => 
      log.exercise_name === oldExName ? { ...log, exercise_name: newExName } : log
    );
    saveGlobalHistoryData(updatedGlobalHistory);

    setSelectedExercise(newExName);
    setIsEditingExerciseName(false);
    setRenameInput('');
    filterAndLoadLogsForDate(selectedDate, updatedGlobalHistory, updatedSplits, selectedDay);
    alert(`Successfully renamed exercise to "${newExName}"`);
  };

  const handleCopyPreviousData = () => {
    if (!selectedExercise) return alert("Please choose an exercise option to look up first!");
    const pastLogs = globalFullHistory.filter(log => log.exercise_name === selectedExercise && !log.isSkeleton);
    
    if (pastLogs.length === 0) {
      return alert(`No previous log data recorded local for "${selectedExercise}" yet!`);
    }

    const latestLoggedEntry = pastLogs[0];
    setSets(JSON.parse(JSON.stringify(latestLoggedEntry.sets_data)));
    if (latestLoggedEntry.notes) setNotes(latestLoggedEntry.notes); 
    alert(`Auto-filled metrics and description notes recorded on ${formatDisplayDate(latestLoggedEntry.created_at)}!`);
  };

  const deleteMuscleGroup = () => {
    if (!selectedBodyPart) return alert("Please select a muscle group to delete first.");
    if (confirm(`Are you sure you want to delete "${selectedBodyPart}"? This will clear it from all weekly templates and personal histories.`)) {
      const updatedLib = { ...library };
      delete updatedLib[selectedBodyPart];
      saveLibrary(updatedLib);

      const updatedSplits = { ...customSplits };
      Object.keys(updatedSplits).forEach(day => {
        if (updatedSplits[day]?.exercises) {
          updatedSplits[day].exercises = updatedSplits[day].exercises.filter(ex => ex.muscle !== selectedBodyPart);
        }
      });
      saveSplitsData(updatedSplits);

      const updatedGlobalHistory = globalFullHistory.filter(log => log.body_part !== selectedBodyPart);
      saveGlobalHistoryData(updatedGlobalHistory);

      setSelectedBodyPart('');
      setSelectedExercise('');
      filterAndLoadLogsForDate(selectedDate, updatedGlobalHistory, updatedSplits, selectedDay);
    }
  };

  const deleteExerciseOption = () => {
    if (!selectedBodyPart || !selectedExercise) return alert("Please select an exercise option to delete first.");
    if (confirm(`Are you sure you want to remove "${selectedExercise}"? This will clear it from all templates and personal record history metrics.`)) {
      const updatedLib = { ...library };
      updatedLib[selectedBodyPart] = updatedLib[selectedBodyPart].filter(ex => ex !== selectedExercise);
      saveLibrary(updatedLib);

      const updatedSplits = { ...customSplits };
      Object.keys(updatedSplits).forEach(day => {
        if (updatedSplits[day]?.exercises) {
          updatedSplits[day].exercises = updatedSplits[day].exercises.filter(ex => ex.name !== selectedExercise);
        }
      });
      saveSplitsData(updatedSplits);

      const updatedGlobalHistory = globalFullHistory.filter(log => log.exercise_name !== selectedExercise);
      saveGlobalHistoryData(updatedGlobalHistory);

      setSelectedExercise('');
      filterAndLoadLogsForDate(selectedDate, updatedGlobalHistory, updatedSplits, selectedDay);
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

    if (confirm("Are you sure you want to delete this exercise from the split layout?")) {
      const targetExercises = customSplits[selectedDay].exercises.filter(ex => ex.name !== exerciseNameToRemove);
      const updatedSplits = { ...customSplits };

      if (targetExercises.length === 0) {
        delete updatedSplits[selectedDay];
      } else {
        updatedSplits[selectedDay] = { exercises: targetExercises };
      }

      saveSplitsData(updatedSplits);
      handleDaySelect(selectedDay);
    }
  };

  const handleDaySelect = (day) => {
    setSelectedDay(day);
    filterAndLoadLogsForDate(selectedDate, globalFullHistory, customSplits, day);

    if (day && customSplits[day] && customSplits[day].exercises.length > 0) {
      setSelectedBodyPart(customSplits[day].exercises[0].muscle);
      setSelectedExercise(customSplits[day].exercises[0].name);
    }
  };

  const handleSave = () => {
    if (!selectedExercise) return alert("Please select or click an exercise template first!");
    
    const targetPayload = {
      body_part: selectedBodyPart,
      exercise_name: selectedExercise,
      sets_data: sets,
      notes: notes.trim(), 
      duration: completedDuration || '', 
      created_at: selectedDate,
      isSkeleton: false
    };

    let updatedGlobalList = [...globalFullHistory];

    if (editingId && !editingId.toString().startsWith('skeleton-')) {
      const existingEntry = updatedGlobalList.find(log => log.id === editingId);
      if (existingEntry && !targetPayload.duration) {
        targetPayload.duration = existingEntry.duration || '';
      }

      updatedGlobalList = updatedGlobalList.map(log => 
        log.id === editingId ? { ...log, ...targetPayload } : log
      );
      alert("Workout Log Updated Successfully in Local Storage!");
      setEditingId(null);
    } else {
      updatedGlobalList = updatedGlobalList.filter(log => 
        !(log.created_at === selectedDate && log.exercise_name === selectedExercise)
      );
      
      const newLocalLogEntry = {
        id: `local-log-${crypto.randomUUID()}`,
        ...targetPayload
      };
      
      updatedGlobalList.unshift(newLocalLogEntry);
      alert("Workout Saved Successfully to Local Storage!");
      setEditingId(null);
    }

    saveGlobalHistoryData(updatedGlobalList);
    setSets(initialSets);
    setNotes(''); 
    setSelectedExercise('');
    filterAndLoadLogsForDate(selectedDate, updatedGlobalList, customSplits, selectedDay);
  };

  const handleDeleteLogEntry = (logIdToDelete) => {
    if (logIdToDelete.toString().startsWith('skeleton-')) {
      return alert("This is a template routine layout card. You can track data inside it or remove it from your weekly split dropdown options panel above!");
    }
    if (confirm("Are you sure you want to delete this log permanently from local storage?")) {
      const updatedGlobalList = globalFullHistory.filter(log => log.id !== logIdToDelete);
      saveGlobalHistoryData(updatedGlobalList);
      filterAndLoadLogsForDate(selectedDate, updatedGlobalList, customSplits, selectedDay);
    }
  };

  const getLabel = (index, currentSetsArray) => {
    let standardCount = 0;
    let dropCount = 0;

    for (let i = 0; i <= index; i++) {
      const setItem = currentSetsArray[i];
      if (!setItem) continue;
      
      if (setItem.type === 'dropset') {
        dropCount++;
      } else {
        standardCount++;
      }
    }

    return currentSetsArray[index]?.type === 'dropset' 
      ? `DS${dropCount}` 
      : `S${standardCount}`;
  };

  const getPersonalRecords = () => {
    const prMap = {};
    const existingMasterExercises = Object.values(library).flat();

    let allowedExercises = [];
    if (selectedDay && customSplits[selectedDay]) {
      allowedExercises = customSplits[selectedDay].exercises.map(ex => ex.name);
    }

    globalFullHistory.forEach(log => {
      if (log.isSkeleton) return;
      if (!existingMasterExercises.includes(log.exercise_name)) return;
      if (selectedDay && !allowedExercises.includes(log.exercise_name)) return;

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
    
    const targetStr = new Date(year, month, dayNum + 1).toISOString().split('T')[0];
    if (targetStr > todayMaxDate) return; 

    setSelectedDate(targetStr);
    setShowCalendarModal(false);
    setSelectedDay('');
    filterAndLoadLogsForDate(targetStr, globalFullHistory, customSplits, '');
  };

  const changeMonth = (direction) => {
    const newMonth = currentViewDate.getMonth() + direction;
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), newMonth, 1));
  };

  const generateCalendarGridDays = () => {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const totalSlots = [];
    for (let i = 0; i < adjustedFirstDay; i++) totalSlots.push(null);
    for (let d = 1; d <= daysInMonth; d++) totalSlots.push(d);
    return totalSlots;
  };

  const isCurrentSelectionCell = (dayNum) => {
    if (!dayNum) return false;
    const [sYear, sMonth, sDay] = selectedDate.split('-').map(Number);
    return dayNum === sDay && currentViewDate.getMonth() === (sMonth - 1) && currentViewDate.getFullYear() === sYear;
  };

  const isCellFutureDisabled = (dayNum) => {
    if (!dayNum) return false;
    const targetStr = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), dayNum + 1).toISOString().split('T')[0];
    return targetStr > todayMaxDate;
  };

  const prs = getPersonalRecords();
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
              Fitness Zone <span style={{ fontSize: '10px', color: '#10b981', fontStyle: 'normal', verticalAlign: 'middle', border: '1px solid #10b981', padding: '2px 6px', borderRadius: '6px', marginLeft: '4px' }}>OFFLINE</span>
            </h1>
          </div>
        </header>

        {/* WORKOUT TIMER ENGINE CONTAINER PANEL WITH SEPARATE PAUSE ACTION INTERFACE */}
        <section style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '16px 20px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: isTimerRunning ? 'rgba(16, 185, 129, 0.1)' : 'rgba(113, 111, 122, 0.1)', padding: '10px', borderRadius: '50%', border: isTimerRunning ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(113, 111, 122, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} style={{ color: isTimerRunning ? '#10b981' : '#71717a' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', fontWeight: '900', color: '#71717a', textTransform: 'uppercase', tracking: '0.05em' }}>
                {isTimerRunning ? 'Session Active' : elapsedSeconds > 0 ? 'Session Paused' : 'Session Inactive'}
              </span>
              <span style={{ fontSize: '18px', fontWeight: '900', color: isTimerRunning ? '#ffffff' : '#71717a', fontFamily: 'monospace' }}>
                {formatStopwatchDisplay(elapsedSeconds)}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* If timer hasn't started yet and has zero elapsed metrics, render play only */}
            {!isTimerRunning && elapsedSeconds === 0 ? (
              <button onClick={handleStartWorkout} style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '14px', padding: '10px 16px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', textTransform: 'uppercase' }}>
                <Play size={12} fill="#ffffff" /> Start
              </button>
            ) : (
              <>
                {/* Render active contextual conditional buttons mapping state rules */}
                {isTimerRunning ? (
                  <button onClick={handlePauseWorkout} style={{ backgroundColor: '#a1a1aa', color: '#09090b', border: 'none', borderRadius: '14px', padding: '10px 14px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', textTransform: 'uppercase' }}>
                    <Pause size={12} fill="#09090b" /> Pause
                  </button>
                ) : (
                  <button onClick={handleStartWorkout} style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '14px', padding: '10px 14px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', textTransform: 'uppercase' }}>
                    <Play size={12} fill="#ffffff" /> Resume
                  </button>
                )}
                
                <button onClick={handleEndWorkout} style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '14px', padding: '10px 14px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', textTransform: 'uppercase' }}>
                  <Square size={12} fill="#ffffff" /> End
                </button>
              </>
            )}
          </div>
        </section>

        {/* DATE PICKER BAR */}
        <section style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div 
            onClick={() => setShowCalendarModal(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#18181b', border: '1px solid #27272a', padding: '12px 24px', borderRadius: '16px', width: '100%', maxWidth: '240px', cursor: 'pointer', fontWeight: '800', fontSize: '14px', color: '#f4f4f5', boxSizing: 'border-box' }}
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
              <option key={day} value={day}>{day} • ({getDayMuscleSummary(day)})</option>
            ))}
          </select>

          {/* Render Split Structure Collapsible List */}
          {selectedDay && customSplits[selectedDay]?.exercises.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box', marginTop: '4px' }}>
              <div onClick={() => setIsSplitStructureExpanded(!isSplitStructureExpanded)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#09090b', border: '1px solid #27272a', padding: '12px 16px', borderRadius: isSplitStructureExpanded ? '16px 16px 0 0' : '16px', cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}>
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase' }}>{selectedDay.toUpperCase()} SPLIT BLUEPRINT ({customSplits[selectedDay].exercises.length})</span>
                {isSplitStructureExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {isSplitStructureExpanded && (
                <div style={{ backgroundColor: '#09090b', borderLeft: '1px solid #27272a', borderRight: '1px solid #27272a', borderBottom: '1px solid #27272a', padding: '12px', borderRadius: '0 0 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
                  {customSplits[selectedDay].exercises.map((ex, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#18181b', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(39, 39, 42, 0.4)', width: '100%', boxSizing: 'border-box' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: '#3b82f6', marginRight: '8px', textTransform: 'uppercase', fontWeight: '900' }}>[{ex.muscle}]</span>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#f4f4f5' }}>{ex.name}</span>
                      </div>
                      <button onClick={() => removeExerciseFromDay(ex.name)} style={{ background: 'none', border: 'none', color: '#575757', cursor: 'pointer' }}><X size={16} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* PERSONAL RECORDS DASHBOARD */}
        <section style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '16px 20px', borderRadius: '24px', boxSizing: 'border-box', width: '100%' }}>
          <div onClick={() => setIsPrExpanded(!isPrExpanded)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>
              <Trophy size={16} />
              <span>{selectedDay ? `${selectedDay} PR Standings` : 'Global Personal Records'}</span>
            </div>
            {isPrExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          {isPrExpanded && (
            <div style={{ width: '100%', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(39, 39, 42, 0.4)' }}>
              {Object.keys(prs).length === 0 ? (
                <div style={{ fontSize: '12px', color: '#52525b', fontStyle: 'italic', padding: '8px 0' }}>
                  {selectedDay ? `No logged metrics for ${selectedDay} exercises yet.` : 'No maximum weight records available.'}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                  {Object.entries(prs).map(([exercise, maxWeight]) => (
                    <div key={exercise} style={{ backgroundColor: '#09090b', border: '1px solid #27272a', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px', boxSizing: 'border-box' }}>
                      <span style={{ fontSize: '11px', color: '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '700' }}>{exercise}</span>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff' }}>{maxWeight}<span style={{ fontSize: '10px', color: '#f59e0b', marginLeft: '2px' }}>KG</span></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* MAIN INPUT LOGGING ENGINE RIG CONSOLE */}
        <section style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box', width: '100%' }}>
          
          {/* Muscle dropdown block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', width: '100%' }}>
              <span>Muscle Group Target</span>
              {!isAddingPart && selectedBodyPart && !isEditingPartName && (
                <button onClick={() => { setIsEditingPartName(true); setRenameInput(selectedBodyPart); }} style={{ color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Edit Name</button>
              )}
              {!isAddingPart && !isEditingPartName && (
                <button onClick={() => setIsAddingPart(true)} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ Add Custom</button>
              )}
            </div>
            
            {isAddingPart ? (
              <div style={{ display: 'flex', gap: '3%', width: '100%', boxSizing: 'border-box', alignItems: 'center' }}>
                <input autoFocus value={newInput} onChange={e => setNewInput(e.target.value)} placeholder="e.g. Chest" style={{ width: '85%', backgroundColor: '#09090b', border: '1px solid #3b82f6', padding: '14px', borderRadius: '12px', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box', height: '50px' }} />
                <button onClick={() => { if(!newInput) return; saveLibrary({...library, [newInput]: []}); setSelectedBodyPart(newInput); setIsAddingPart(false); setNewInput(''); }} style={{ backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '12px', border: 'none', cursor: 'pointer', width: '12%', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={18}/></button>
              </div>
            ) : isEditingPartName ? (
              <div style={{ display: 'flex', gap: '3%', width: '100%', boxSizing: 'border-box', alignItems: 'center' }}>
                <input autoFocus value={renameInput} onChange={e => setRenameInput(e.target.value)} style={{ width: '70%', backgroundColor: '#09090b', border: '1px solid #f59e0b', padding: '14px', borderRadius: '12px', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box', height: '50px' }} />
                <button onClick={handleRenameMuscleGroup} style={{ backgroundColor: '#f59e0b', color: '#ffffff', borderRadius: '12px', border: 'none', cursor: 'pointer', width: '12%', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={18}/></button>
                <button onClick={() => setIsEditingPartName(false)} style={{ backgroundColor: '#27272a', color: '#ffffff', borderRadius: '12px', border: 'none', cursor: 'pointer', width: '12%', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18}/></button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '3%', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                <select value={selectedBodyPart} onChange={e => { setSelectedBodyPart(e.target.value); setSelectedExercise(''); }} style={{ width: selectedBodyPart ? '85%' : '100%', backgroundColor: '#09090b', border: '1px solid #27272a', padding: '14px', borderRadius: '12px', color: '#e4e4e7', fontSize: '14px', fontWeight: '700', boxSizing: 'border-box', height: '50px' }}>
                  <option value="">Select Target Muscle...</option>
                  {Object.keys(library).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {selectedBodyPart && <button onClick={deleteMuscleGroup} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', height: '50px', width: '12%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', cursor: 'pointer' }}><Trash2 size={18} /></button>}
              </div>
            )}
          </div>

          {/* Exercise dropdown block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', width: '100%' }}>
              <span>Exercise Name</span>
              {!isAddingExercise && selectedExercise && !isEditingExerciseName && (
                <button onClick={() => { setIsEditingExerciseName(true); setRenameInput(selectedExercise); }} style={{ color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Edit Name</button>
              )}
              {!isAddingExercise && !isEditingExerciseName && (
                <button disabled={!selectedBodyPart} onClick={() => setIsAddingExercise(true)} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', opacity: selectedBodyPart ? 1 : 0.3, padding: 0 }}>+ Add Custom</button>
              )}
            </div>
            
            {isAddingExercise ? (
              <div style={{ display: 'flex', gap: '3%', width: '100%', boxSizing: 'border-box', alignItems: 'center' }}>
                <input autoFocus value={newInput} onChange={e => setNewInput(e.target.value)} placeholder="e.g. Bench Press" style={{ width: '85%', backgroundColor: '#09090b', border: '1px solid #3b82f6', padding: '14px', borderRadius: '12px', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box', height: '50px' }} />
                <button onClick={() => { if(!newInput || !selectedBodyPart) return; saveLibrary({...library, [selectedBodyPart]: [...(library[selectedBodyPart] || []), newInput]}); setSelectedExercise(newInput); setIsAddingExercise(false); setNewInput(''); }} style={{ backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '12px', border: 'none', cursor: 'pointer', width: '12%', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={18}/></button>
              </div>
            ) : isEditingExerciseName ? (
              <div style={{ display: 'flex', gap: '3%', width: '100%', boxSizing: 'border-box', alignItems: 'center' }}>
                <input autoFocus value={renameInput} onChange={e => setRenameInput(e.target.value)} style={{ width: '70%', backgroundColor: '#09090b', border: '1px solid #f59e0b', padding: '14px', borderRadius: '12px', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box', height: '50px' }} />
                <button onClick={handleRenameExerciseOption} style={{ backgroundColor: '#f59e0b', color: '#ffffff', borderRadius: '12px', border: 'none', cursor: 'pointer', width: '12%', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={18}/></button>
                <button onClick={() => setIsEditingExerciseName(false)} style={{ backgroundColor: '#27272a', color: '#ffffff', borderRadius: '12px', border: 'none', cursor: 'pointer', width: '12%', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18}/></button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                <select disabled={!selectedBodyPart} value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)} style={{ flex: 1, backgroundColor: '#09090b', border: '1px solid #27272a', padding: '14px', borderRadius: '12px', color: '#e4e4e7', fontSize: '14px', fontWeight: '700', opacity: selectedBodyPart ? 1 : 0.4, boxSizing: 'border-box', height: '50px' }}>
                  <option value="">Choose Exercise...</option>
                  {selectedBodyPart && library[selectedBodyPart]?.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                </select>
                
                {selectedExercise && (
                  <button onClick={handleCopyPreviousData} title="Copy Previous Set Weights" style={{ backgroundColor: '#1c1c1e', border: '1px solid #27272a', color: '#60a5fa', height: '50px', width: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', cursor: 'pointer' }}>
                    <Copy size={20} />
                  </button>
                )}
                
                {selectedExercise && <button onClick={deleteExerciseOption} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', height: '50px', width: '12%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', cursor: 'pointer' }}><Trash2 size={18} /></button>}
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
                <div style={{ width: '15%', textAlign: 'center', fontSize: '12px', fontWeight: '900', color: s.type === 'dropset' ? '#f59e0b' : '#71717a' }}>{getLabel(i, sets)}</div>
                <input type="number" placeholder="0" onChange={e => { const n = [...sets]; n[i].reps = Number(e.target.value); setSets(n); }} value={s.reps || ''} style={{ width: '35%', backgroundColor: '#09090b', border: '1px solid #27272a', padding: '10px', borderRadius: '8px', color: '#ffffff', textAlign: 'center', fontSize: '14px', boxSizing: 'border-box' }} />
                <div style={{ width: '42%', display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <input type="number" placeholder="0" onChange={e => { const n = [...sets]; n[i].weight = Number(e.target.value); setSets(n); }} value={s.weight || ''} style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #27272a', padding: '10px', borderRadius: '8px', color: '#ffffff', textAlign: 'center', fontSize: '14px', boxSizing: 'border-box', paddingRight: '24px' }} />
                  <span style={{ position: 'absolute', right: '8px', fontSize: '9px', fontWeight: '900', color: '#3f3f46' }}>kg</span>
                </div>
                <button onClick={() => setSets(sets.filter((_, idx) => idx !== i))} style={{ width: '8%', background: 'none', border: 'none', color: '#3f3f46', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}><Trash2 size={16}/></button>
              </div>
            ))}
          </div>

          {/* DOWNSIDE DESCRIPTION ENGINE SECTION BOX */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', paddingTop: '6px', borderTop: '1px solid rgba(39, 39, 42, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase' }}>
              <FileText size={12} style={{ color: '#3b82f6' }} />
              <span>Exercise Description / Particular Notes</span>
            </div>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add personal details about your workout today (e.g. form adjustment, machine seat number, injury protection details...)"
              style={{ width: '100%', minHeight: '64px', backgroundColor: '#09090b', border: '1px solid #27272a', padding: '12px', borderRadius: '12px', color: '#ffffff', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          {/* ACTION CONTROL BUTTONS */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
            <button onClick={() => setSets([...sets, { reps: 0, weight: 0, type: 'standard' }])} style={{ flex: 1, minWidth: '120px', backgroundColor: '#27272a', color: '#d4d4d8', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer' }}>+ Add Set</button>
            <button onClick={() => setSets([...sets, { reps: 0, weight: 0, type: 'dropset' }])} style={{ flex: 1, minWidth: '120px', backgroundColor: '#27272a', color: '#d4d4d8', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer' }}>+ Add Drop Set</button>
            
            {editingId ? (
              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '4px' }}>
                <button onClick={() => { setEditingId(null); setSets(initialSets); setNotes(''); setSelectedExercise(''); }} style={{ flex: 1, backgroundColor: '#3f3f46', color: '#d4d4d8', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSave} style={{ flex: 1, backgroundColor: '#f59e0b', color: '#ffffff', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer' }}>Update Log</button>
              </div>
            ) : (
              <button onClick={handleSave} style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '4px' }}>Save Workout</button>
            )}
          </div>
        </section>

        {/* WORKOUT HISTORY AREA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
          
          {/* MASTER UPDATED WORKOUT HISTORY HEADER LAYOUT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px', borderLeft: '2px solid #2563eb' }}>
            <h2 style={{ fontSize: '10px', fontWeight: '900', color: '#52525b', textTransform: 'uppercase', tracking: '0.1em', margin: 0 }}>
              Today's Workout History & Pre-loaded Split
            </h2>
            
            {/* FIXED FEATURE: Total session length banner pops up dynamically under the subtitle row */}
            {completedDuration && (
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                Total Duration: {completedDuration}
              </span>
            )}
          </div>

          {filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', backgroundColor: 'rgba(24, 24, 27, 0.2)', border: '1px solid rgba(39, 39, 42, 0.4)', borderRadius: '24px', color: '#52525b', fontSize: '12px', fontStyle: 'italic', fontWeight: '600', boxSizing: 'border-box', width: '100%' }}>No logs tracked or day routines loaded yet. Select a template day from the split section above!</div>
          ) : (
            filteredHistory.map(log => (
              <div key={log.id} style={{ backgroundColor: 'rgba(24, 24, 27, 0.6)', border: '1px solid #27272a', padding: '12px 16px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', boxSizing: 'border-box', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontSize: '8px', fontWeight: '900', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '4px 10px', borderRadius: '8px', textTransform: 'uppercase', border: '1px solid rgba(59, 130, 246, 0.1)' }}>{log.body_part}</span>
                      
                      {log.duration && (
                        <span style={{ fontSize: '8px', fontWeight: '900', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                          ⏱ {log.duration}
                        </span>
                      )}
                    </div>
                    
                    <h3 style={{ fontWeight: '800', color: log.isSkeleton ? '#3f3f46' : '#ffffff', fontSize: '16px', textTransform: 'uppercase', fontStyle: 'italic', margin: 0 }}>
                      {log.exercise_name} {log.isSkeleton && <span style={{ fontSize: '11px', fontWeight: '500', color: '#27272a' }}>(Template)</span>}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button onClick={() => { setEditingId(log.id); setSelectedBodyPart(log.body_part); setSelectedExercise(log.exercise_name); setSets(log.sets_data); setNotes(log.notes || ''); window.scrollTo({top:0, behavior:'smooth'}); }} style={{ padding: '8px', color: '#52525b', background: 'none', border: 'none', cursor: 'pointer' }}><Edit2 size={15}/></button>
                    <button onClick={() => handleDeleteLogEntry(log.id)} style={{ padding: '8px', color: '#52525b', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={15}/></button>
                  </div>
                </div>

                {/* CONDITIONALLY RENDER DESCRIPTION NOTES ONLY IF TEXT DATA EXISTS */}
                {log.notes && log.notes.trim().length > 0 && (
                  <div style={{ backgroundColor: '#09090b', borderLeft: '3px solid #3b82f6', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', color: '#d4d4d8', fontStyle: 'italic', lineHeight: '1.4' }}>
                    <span style={{ display: 'block', fontStyle: 'normal', fontWeight: '900', color: '#71717a', textTransform: 'uppercase', fontSize: '9px', marginBottom: '4px', tracking: '0.05em' }}>Notes / Particulars:</span>
                    {log.notes}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px', width: '100%' }}>
                  {log.sets_data.map((s, i) => (
                    <div key={i} style={{ backgroundColor: '#09090b', border: '1px solid #27272a', padding: '6px', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', boxSizing: 'border-box' }}>
                      <span style={{ fontWeight: '900', fontSize: '9px', color: s.type === 'dropset' ? '#f59e0b' : '#52525b' }}>{getLabel(i, log.sets_data)}</span>
                      <div style={{ width: '100%', backgroundColor: '#18181b', padding: '6px 0', color: s.reps ? '#ffffff' : '#3f3f46', fontSize: '13px', textAlign: 'center', fontWeight: '700', borderRadius: '6px' }}>
                        {s.reps || 'Reps'}
                      </div>
                      <div style={{ width: '100%', backgroundColor: '#18181b', padding: '6px 0', color: s.weight ? '#3b82f6' : '#3f3f46', fontSize: '13px', textAlign: 'center', fontWeight: '900', borderRadius: '6px' }}>
                        {s.weight ? `${s.weight} kg` : 'kg'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* POPUP CALENDAR MODAL */}
        {showCalendarModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', backdropBlur: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px', boxSizing: 'border-box' }}>
            <div style={{ backgroundColor: '#1c1c1e', border: '1px solid #2c2c2e', borderRadius: '24px', width: '100%', maxWidth: '340px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', boxSizing: 'border-box' }}>
              <div style={{ backgroundColor: '#2c2c2e', padding: '20px', color: '#ffffff', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '14px', opacity: 0.6, fontWeight: '600' }}>{currentViewDate.getFullYear()}</div>
                <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px', textTransform: 'capitalize' }}>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 12px' }}>
                <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px' }}><ChevronLeft size={18} /></button>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>{MONTHS[currentViewDate.getMonth()]} {currentViewDate.getFullYear()}</div>
                <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px' }}><ChevronRight size={18} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', textAlign: 'center', padding: '0 12px', marginBottom: '8px' }}>
                {DAYS_SHORT.map((d, idx) => <span key={idx} style={{ fontSize: '11px', fontWeight: '900', color: '#71717a' }}>{d}</span>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '4px', padding: '0 12px 16px 12px', textAlign: 'center' }}>
                {generateCalendarGridDays().map((day, idx) => {
                  const isSelected = isCurrentSelectionCell(day);
                  const isDisabled = isCellFutureDisabled(day);
                  return (
                    <div key={idx} onClick={() => !isDisabled && handleCalendarDayClick(day)} style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', borderRadius: '50%', cursor: day && !isDisabled ? 'pointer' : 'default', backgroundColor: isSelected ? '#3b82f6' : 'transparent', color: isDisabled ? '#3f3f46' : isSelected ? '#ffffff' : day ? '#e4e4e7' : 'transparent' }}>{day}</div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', padding: '12px 20px', borderTop: '1px solid #2c2c2e' }}>
                <button onClick={() => setShowCalendarModal(false)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => { setSelectedDate(todayMaxDate); setShowCalendarModal(false); setSelectedDay(''); filterAndLoadLogsForDate(todayMaxDate, globalFullHistory, customSplits, ''); }} style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>Today</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
