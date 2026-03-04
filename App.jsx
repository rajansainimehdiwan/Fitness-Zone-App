import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Dumbbell, Edit2, X, Timer, Copy, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

const FitnessZone = () => {
  // DATE FEATURE: Initialize with today's date in YYYY-MM-DD format for the input
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [categories, setCategories] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [history, setHistory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(false);

  const [sets, setSets] = useState([
    { id: 1, label: 'S1', reps: '', weight: '' },
    { id: 2, label: 'S2', reps: '', weight: '' },
    { id: 3, label: 'S3', reps: '', weight: '' },
    { id: 4, label: 'DS1', reps: '', weight: '' },
  ]);

  useEffect(() => {
    const savedCats = localStorage.getItem('fz_categories');
    const savedExs = localStorage.getItem('fz_exercises');
    const savedHistory = localStorage.getItem('fz_history');
    if (savedCats) setCategories(JSON.parse(savedCats));
    if (savedExs) setExercises(JSON.parse(savedExs));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      alert("Rest Over!");
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const persist = (key, data) => localStorage.setItem(key, JSON.stringify(data));

  // DATE FEATURE: Filter history based on the selected calendar date
  const filteredHistory = history.filter(log => log.date === selectedDate);

  const handleSave = () => {
    if (!selectedExercise) return alert("Select an exercise!");
    
    const logEntry = { 
      id: editingId || Date.now(), 
      date: selectedDate, // Stores the date selected in the calendar
      category: selectedCategory, 
      exercise: selectedExercise, 
      sets: [...sets] 
    };

    const updatedHistory = editingId 
      ? history.map(item => item.id === editingId ? logEntry : item) 
      : [logEntry, ...history];

    setHistory(updatedHistory);
    persist('fz_history', updatedHistory);
    
    setTimeLeft(60);
    setTimerActive(true);
    resetForm();
    setEditingId(null);
  };

  const resetForm = () => {
    setSelectedCategory("");
    setSelectedExercise("");
    setSets([{ id: 1, label: 'S1', reps: '', weight: '' }, { id: 2, label: 'S2', reps: '', weight: '' }, { id: 3, label: 'S3', reps: '', weight: '' }, { id: 4, label: 'DS1', reps: '', weight: '' }]);
  };

  return (
    <div className="container">
      {timeLeft !== null && (
        <div className="timer-banner">
          <Timer size={18} /> Rest: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          <X size={18} onClick={() => setTimeLeft(null)} style={{cursor:'pointer'}}/>
        </div>
      )}

      <div className="header-brand">
        <div className="icon-box"><Dumbbell size={24} color="white" /></div>
        <h1>FITNESS ZONE</h1>
      </div>

      {/* DATE FEATURE: Calendar Input Strip */}
      <div className="date-selector-card">
        <Calendar size={18} color="#3b82f6" />
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)}
          className="calendar-input"
        />
      </div>

      <div className="card">
        {editingId && <div className="edit-indicator">Editing Log</div>}
        
        <div className="input-group">
          <label>MUSCLE GROUP <span className="add-link" onClick={() => {const n = prompt("New Group:"); if(n) setCategories([...categories, n])}}>+ NEW</span></label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="">Select...</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="input-group">
          <label>EXERCISE <span className="add-link" onClick={() => {const n = prompt("New Exercise:"); if(n) setExercises([...exercises, n])}}>+ NEW</span></label>
          <div className="row-flex">
            <select value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)}>
              <option value="">Choose...</option>
              {exercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
            </select>
            <button className="copy-btn" onClick={() => {
                const last = history.find(h => h.exercise === selectedExercise);
                if(last) setSets(last.sets.map(s => ({...s, id: Math.random()})));
            }}><Copy size={18}/></button>
          </div>
        </div>

        <div className="grid-header"><span>LABEL</span><span>REPS</span><span>WEIGHT</span><span></span></div>

        {sets.map((set) => (
          <div className="grid-row" key={set.id}>
            <span className={set.label.startsWith('DS') ? 'ds-label' : 's-label'}>{set.label}</span>
            <input type="number" placeholder="0" value={set.reps} onChange={(e) => setSets(sets.map(s => s.id === set.id ? {...s, reps: e.target.value} : s))} />
            <input type="number" placeholder="0" value={set.weight} onChange={(e) => setSets(sets.map(s => s.id === set.id ? {...s, weight: e.target.value} : s))} />
            <Trash2 size={18} className="row-delete" onClick={() => setSets(sets.filter(s => s.id !== set.id))} />
          </div>
        ))}

        <div className="actions-grid">
          <button className="btn-secondary" onClick={() => setSets([...sets, { id: Date.now(), label: 'S+', reps: '', weight: '' }])}>+ SET</button>
          <button className="btn-primary" onClick={handleSave}>{editingId ? 'UPDATE' : 'SAVE'}</button>
        </div>
      </div>

      <div className="history-container">
        <h3><TrendingUp size={18} /> LOGS FOR {selectedDate}</h3>
        {filteredHistory.length === 0 ? (
          <p className="empty">No workouts found for this date.</p>
        ) : (
          filteredHistory.map(log => (
            <div key={log.id} className="history-card">
              <div className="history-header">
                <strong>{log.exercise}</strong>
                <div className="history-btns">
                  <Edit2 size={16} onClick={() => {setEditingId(log.id); setSets(log.sets); setSelectedExercise(log.exercise); window.scrollTo(0,0)}} className="edit-icon" />
                  <Trash2 size={16} onClick={() => setHistory(history.filter(h => h.id !== log.id))} className="delete-icon" />
                </div>
              </div>
              <div className="set-pills">
                {log.sets.map(s => <span key={s.id}>{s.label}: {s.reps}x{s.weight}kg</span>)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FitnessZone;