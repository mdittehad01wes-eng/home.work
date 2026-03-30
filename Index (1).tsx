import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle2, Circle, BookOpen, Trash2, Timer, Play, Pause, RotateCcw, BellOff, ChevronDown, ChevronUp } from "lucide-react";

interface Task {
  id: number;
  task: string;
  done: boolean;
  timerTotal: number;
  timeLeft: number;
  isRunning: boolean;
  alarmRinging: boolean;
  timerOpen: boolean;
}

const PRESETS = [
  { label: "5m", seconds: 300 },
  { label: "15m", seconds: 900 },
  { label: "25m", seconds: 1500 },
  { label: "45m", seconds: 2700 },
];

const formatTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const playAlarmSound = () => {
  try {
    const ctx = new AudioContext();
    const playBeep = (time: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "square";
      gain.gain.setValueAtTime(0.3, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.3);
      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + 0.3);
    };
    for (let i = 0; i < 6; i++) playBeep(i * 0.5);
    setTimeout(() => ctx.close(), 4000);
  } catch {}
};

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [nextId, setNextId] = useState(1);

  // Tick all running timers
  useEffect(() => {
    const hasRunning = tasks.some(t => t.isRunning && t.timeLeft > 0);
    if (!hasRunning) return;

    const interval = setInterval(() => {
      setTasks(prev => prev.map(t => {
        if (!t.isRunning || t.timeLeft <= 0) return t;
        if (t.timeLeft <= 1) {
          playAlarmSound();
          return { ...t, timeLeft: 0, isRunning: false, alarmRinging: true };
        }
        return { ...t, timeLeft: t.timeLeft - 1 };
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, {
      id: nextId, task: newTask.trim(), done: false,
      timerTotal: 1500, timeLeft: 1500, isRunning: false,
      alarmRinging: false, timerOpen: false,
    }]);
    setNextId(nextId + 1);
    setNewTask("");
  };

  const toggleDone = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done, isRunning: false } : t));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleTimerOpen = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, timerOpen: !t.timerOpen } : t));
  };

  const setPreset = (id: number, seconds: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, timerTotal: seconds, timeLeft: seconds, isRunning: false, alarmRinging: false } : t));
  };

  const toggleTaskTimer = (id: number) => {
    setTasks(tasks.map(t => {
      if (t.id !== id) return t;
      if (t.alarmRinging) return { ...t, alarmRinging: false };
      if (t.timeLeft === 0) return { ...t, timeLeft: t.timerTotal, isRunning: true };
      return { ...t, isRunning: !t.isRunning };
    }));
  };

  const resetTaskTimer = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, timeLeft: t.timerTotal, isRunning: false, alarmRinging: false } : t));
  };

  const pending = tasks.filter(t => !t.done).length;
  const completed = tasks.filter(t => t.done).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-surface-dark text-surface-dark-foreground">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-8 h-8 text-accent" />
              <h1 className="text-3xl font-bold tracking-tight">Homework Tracker</h1>
            </div>
            <p className="text-surface-dark-foreground/60 text-sm font-mono">
              Digital Homework Management System
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-6 mt-6"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-sm font-mono">{pending} Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm font-mono">{completed} Done</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-surface-dark-foreground/30" />
              <span className="text-sm font-mono">{tasks.length} Total</span>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-6 py-8 flex-1 w-full">
        {/* Add Task */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3 mb-8"
        >
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Apna homework yahan likho..."
            className="flex-1 px-4 py-3 rounded-lg border border-border bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono text-sm transition-shadow"
          />
          <button
            onClick={addTask}
            className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add
          </button>
        </motion.div>

        {/* Task List */}
        {tasks.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-mono">Koi homework nahi hai — abhi add karo!</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {tasks.map((task, index) => {
                const progress = task.timerTotal > 0 ? ((task.timerTotal - task.timeLeft) / task.timerTotal) * 100 : 0;
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-lg border transition-all overflow-hidden ${
                      task.alarmRinging
                        ? "bg-accent/5 border-accent/40"
                        : task.done
                        ? "bg-primary/5 border-primary/20"
                        : "bg-card border-border hover:border-accent/40"
                    }`}
                  >
                    {/* Task Row */}
                    <div className="flex items-center gap-4 p-4">
                      <button onClick={() => toggleDone(task.id)} className="flex-shrink-0 transition-transform hover:scale-110">
                        {task.done ? (
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        ) : (
                          <Circle className="w-6 h-6 text-muted-foreground hover:text-accent" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <span className={`font-mono text-sm block truncate ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {task.task}
                        </span>
                      </div>

                      {/* Mini timer badge */}
                      {(task.isRunning || task.timeLeft < task.timerTotal || task.alarmRinging) && (
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          task.alarmRinging ? "bg-accent/15 text-accent animate-pulse" : task.isRunning ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          {task.alarmRinging ? "⏰" : formatTime(task.timeLeft)}
                        </span>
                      )}

                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${task.done ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                        {task.done ? "Done" : "Pending"}
                      </span>

                      <button onClick={() => toggleTimerOpen(task.id)} className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors">
                        {task.timerOpen ? <ChevronUp className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
                      </button>

                      <button onClick={() => deleteTask(task.id)} className="flex-shrink-0 text-muted-foreground hover:text-accent transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Expandable Timer Panel */}
                    <AnimatePresence>
                      {task.timerOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 border-t border-border/50">
                            <div className="flex items-center gap-4 flex-wrap">
                              {/* Presets */}
                              <div className="flex gap-1.5">
                                {PRESETS.map(p => (
                                  <button
                                    key={p.seconds}
                                    onClick={() => setPreset(task.id, p.seconds)}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-all ${
                                      task.timerTotal === p.seconds
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                                    }`}
                                  >
                                    {p.label}
                                  </button>
                                ))}
                              </div>

                              {/* Progress bar + time */}
                              <div className="flex-1 min-w-[120px]">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-1000 ${task.alarmRinging ? "bg-accent" : "bg-primary"}`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className={`text-sm font-mono font-bold min-w-[50px] text-right ${task.alarmRinging ? "text-accent animate-pulse" : "text-foreground"}`}>
                                    {formatTime(task.timeLeft)}
                                  </span>
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => toggleTaskTimer(task.id)}
                                  className={`p-2 rounded-lg transition-all active:scale-95 ${
                                    task.alarmRinging
                                      ? "bg-accent text-accent-foreground animate-pulse"
                                      : task.isRunning
                                      ? "bg-accent/10 text-accent"
                                      : "bg-primary text-primary-foreground"
                                  }`}
                                >
                                  {task.alarmRinging ? <BellOff className="w-4 h-4" /> : task.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => resetTaskTimer(task.id)}
                                  className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition-colors active:scale-95"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-surface-dark text-surface-dark-foreground/60 mt-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs font-mono">
          <span>Project Assigned by <span className="text-accent font-semibold">Aneek Ahmad</span></span>
          <span>Created by <span className="text-primary font-semibold">Md Ittehad</span></span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
