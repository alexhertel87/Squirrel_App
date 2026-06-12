import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { NewMedModal } from '../NewMedModal/NewMed';
import TaskListModal from '../TaskList/TaskListModal';
import * as MedsListActions from '../../store/meds_list';
import * as TaskListActions from '../../store/task_list';
import {
  formatDate,
  fetchSupportState,
  getEnergy,
  getMedCheckins,
  getLocalSupportState,
  getTaskSteps,
  medStatusLabel,
  normalizeSupportState,
  preserveLatestComfort,
  persistSupportState,
} from '../../utils/neuroSupport';
import styles from './Dashboard.module.css';

const defaultRoutines = [
  { id: 'morning', label: 'Morning launch', steps: ['Meds', 'Water', 'Food', 'One Small Task'] },
  { id: 'reset', label: 'Midday reset', steps: ['Breathe', 'Check Body', 'Pick Next Task'] },
  { id: 'evening', label: 'Evening landing', steps: ['Tidy One Spot', 'Prep Meds', 'Set Tomorrow'] },
];

const focusDurations = [10, 15, 25];
const breathingDurations = [
  { seconds: 30, label: '30 Sec Reset' },
  { seconds: 60, label: '1 Min Starter' },
  { seconds: 300, label: '5 Min Full' },
];

const breathingTechniques = [
  {
    id: 'box',
    label: 'Box Breathing',
    summary: 'Steady 4-4-4-4 pattern for a structured reset.',
    pattern: [
      { label: 'Inhale', seconds: 4 },
      { label: 'Hold', seconds: 4 },
      { label: 'Exhale', seconds: 4 },
      { label: 'Hold', seconds: 4 },
    ],
  },
  {
    id: 'balanced',
    label: 'Balanced Breathing',
    summary: 'No holds. Good if holding your breath feels uncomfortable.',
    pattern: [
      { label: 'Inhale', seconds: 4 },
      { label: 'Exhale', seconds: 4 },
    ],
  },
  {
    id: 'long-exhale',
    label: 'Long Exhale',
    summary: 'A gentle longer exhale to help your body downshift.',
    pattern: [
      { label: 'Inhale', seconds: 4 },
      { label: 'Exhale Slowly', seconds: 6 },
    ],
  },
  {
    id: '478',
    label: '4-7-8 Breathing',
    summary: 'More intense. Best when breath holds feel okay.',
    pattern: [
      { label: 'Inhale', seconds: 4 },
      { label: 'Hold', seconds: 7 },
      { label: 'Exhale Slowly', seconds: 8 },
    ],
  },
];

const getBreathingPhase = (technique, elapsedSeconds) => {
  if (!technique) return { label: 'Choose a technique', seconds: 0, phaseSecondsLeft: 0 };

  const cycleSeconds = technique.pattern.reduce((total, phase) => total + phase.seconds, 0);
  const cyclePosition = elapsedSeconds % cycleSeconds;
  let cursor = 0;

  for (const phase of technique.pattern) {
    if (cyclePosition < cursor + phase.seconds) {
      return {
        ...phase,
        phaseSecondsLeft: cursor + phase.seconds - cyclePosition,
      };
    }
    cursor += phase.seconds;
  }

  return { ...technique.pattern[0], phaseSecondsLeft: technique.pattern[0].seconds };
};

const weekDayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const padDatePart = (value) => String(value).padStart(2, '0');

const getLocalDateKey = (date) => (
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`
);

const getModelDateKey = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  return `${parsed.getUTCFullYear()}-${padDatePart(parsed.getUTCMonth() + 1)}-${padDatePart(parsed.getUTCDate())}`;
};

const parseDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatAgendaDate = (dateKey, todayKey) => {
  if (dateKey === todayKey) return 'Today';

  return parseDateKey(dateKey).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

const buildCalendarDays = (year, month, todayKey) => {
  const firstOfMonth = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const dateKey = getLocalDateKey(date);

    return {
      dateKey,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: dateKey === todayKey,
    };
  });
};

export const Dashboard = () => {
  const dispatch = useDispatch();
  const meds = useSelector((state) => state.active_meds);
  const tasks = useSelector((state) => state.task_items);
  const medsArray = useMemo(() => Object.values(meds).filter((med) => med && med.id), [meds]);
  const taskArray = useMemo(() => Object.values(tasks).filter((task) => task && task.id), [tasks]);
  const [support, setSupport] = useState(getLocalSupportState);
  const [selectedTask, setSelectedTask] = useState('');
  const [focusMinutes, setFocusMinutes] = useState(10);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [breathingTechniqueId, setBreathingTechniqueId] = useState('');
  const [breathingDuration, setBreathingDuration] = useState(60);
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState(0);
  const [breathingElapsed, setBreathingElapsed] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarEventsStatus, setCalendarEventsStatus] = useState('');
  const medCheckins = getMedCheckins(support);
  const routineState = support.routines;
  const learningState = support.learning || { areas: [], planner: [], materials: [] };
  const currentTask = taskArray.find((task) => String(task.id) === String(support.currentTaskId));
  const selectedBreathingTechnique = breathingTechniques.find((technique) => technique.id === breathingTechniqueId);
  const breathingRunning = breathingSecondsLeft > 0;
  const breathingComplete = Boolean(!breathingRunning && breathingElapsed >= breathingDuration && breathingTechniqueId);
  const breathingPhase = breathingComplete
    ? { label: 'Done', phaseSecondsLeft: 0 }
    : getBreathingPhase(selectedBreathingTechnique, breathingElapsed);
  const breathingProgress = breathingDuration ? Math.min(100, (breathingElapsed / breathingDuration) * 100) : 0;
  const todayKey = getLocalDateKey(now);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const calendarDays = useMemo(
    () => buildCalendarDays(currentYear, currentMonth, todayKey),
    [currentMonth, currentYear, todayKey]
  );
  const calendarMonthLabel = now.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const updateSupport = (updater) => {
    setSupport((current) => {
      const nextSupport = preserveLatestComfort(
        normalizeSupportState(typeof updater === 'function' ? updater(current) : updater)
      );
      persistSupportState(nextSupport);
      return nextSupport;
    });
  };

  useEffect(() => {
    dispatch(MedsListActions.all_active_meds());
    dispatch(TaskListActions.all_task_items());
  }, [dispatch]);

  useEffect(() => {
    let isMounted = true;

    fetchSupportState().then((nextSupport) => {
      if (isMounted) setSupport(nextSupport);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!secondsLeft) return undefined;

    const timer = setInterval(() => {
      setSecondsLeft((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    setCalendarEventsStatus('');
    fetch(`/api/calendar/events?date=${todayKey}`)
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!isMounted) return;
        if (!response.ok) throw new Error(payload.errors?.join(' ') || 'Calendar events are not available yet.');
        setCalendarEvents(payload.events || []);
      })
      .catch((error) => {
        if (!isMounted) return;
        setCalendarEvents([]);
        setCalendarEventsStatus(error.message);
      });

    return () => {
      isMounted = false;
    };
  }, [todayKey]);

  useEffect(() => {
    if (!breathingSecondsLeft) return undefined;

    const timer = setInterval(() => {
      setBreathingSecondsLeft((seconds) => Math.max(seconds - 1, 0));
      setBreathingElapsed((seconds) => Math.min(seconds + 1, breathingDuration));
    }, 1000);

    return () => clearInterval(timer);
  }, [breathingDuration, breathingSecondsLeft]);

  useEffect(() => {
    if (!breathingComplete || routineState['reset:Breathe']) return;

    updateSupport((current) => ({
      ...current,
      routines: {
        ...current.routines,
        'reset:Breathe': true,
      },
    }));
  }, [breathingComplete, routineState]);

  const medsTaken = medsArray.filter((med) => medCheckins[med.id]?.status === 'taken').length;
  const openLearningItems = (learningState.planner || []).filter((item) => item.status !== 'done');
  const quickWins = taskArray.filter((task) => ['low', 'quick'].includes(getEnergy(task.id, support)));
  const nextTasks = quickWins.length ? quickWins.slice(0, 3) : taskArray.slice(0, 3);
  const calendarDayEvents = calendarEvents.filter((event) => !event.category?.startsWith('task'));
  const taskDeadlines = taskArray.flatMap((task) => {
    const goalDate = getModelDateKey(task.due_date_1);
    const latestDate = getModelDateKey(task.due_date_2);
    const deadlines = [];

    if (goalDate) {
      deadlines.push({
        id: `${task.id}-goal`,
        dateKey: goalDate,
        label: 'Goal Date',
        title: task.task_name,
      });
    }

    if (latestDate && latestDate !== goalDate) {
      deadlines.push({
        id: `${task.id}-latest`,
        dateKey: latestDate,
        label: 'Final Deadline',
        title: task.task_name,
      });
    }

    return deadlines;
  }).sort((left, right) => left.dateKey.localeCompare(right.dateKey));
  const todayDeadlines = taskDeadlines.filter((deadline) => deadline.dateKey === todayKey);
  const upcomingDeadlines = taskDeadlines.filter((deadline) => deadline.dateKey >= todayKey).slice(0, 5);
  const displayedDeadlines = todayDeadlines.length ? todayDeadlines : upcomingDeadlines;
  const selectedTaskName = selectedTask || currentTask?.task_name || nextTasks[0]?.task_name || taskArray[0]?.task_name || 'one kind next step';
  const focusTime = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;
  const todayDate = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const localTime = now.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  const toggleRoutineStep = (routineId, step) => {
    const key = `${routineId}:${step}`;
    updateSupport((current) => ({
      ...current,
      routines: {
        ...current.routines,
        [key]: !current.routines[key],
      },
    }));
  };

  const openBreathingCoach = () => {
    setBreathingOpen(true);
    setBreathingTechniqueId('');
    setBreathingSecondsLeft(0);
    setBreathingElapsed(0);
  };

  const closeBreathingCoach = () => {
    setBreathingOpen(false);
    setBreathingSecondsLeft(0);
    setBreathingElapsed(0);
  };

  const selectBreathingTechnique = (techniqueId) => {
    if (breathingRunning) return;
    setBreathingTechniqueId(techniqueId);
    setBreathingSecondsLeft(0);
    setBreathingElapsed(0);
  };

  const startBreathingSession = () => {
    if (!selectedBreathingTechnique) return;
    setBreathingSecondsLeft(breathingDuration);
    setBreathingElapsed(0);
  };

  const handleTaskCreated = (createdTask, nextSupport) => {
    if (nextSupport) setSupport(nextSupport);
    if (createdTask?.id) dispatch(TaskListActions.all_task_items());
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Gentle daily support</p>
          <h1 className={styles.title}>Start with the next kind thing.</h1>
          <p className={styles.subtitle}>
            Meds, routines, and tasks in one calmer place, built for distracted and
            detail-rich brains.
          </p>
        </div>
        <div className={styles.actions}>
          <NewMedModal />
          <TaskListModal onTaskCreated={handleTaskCreated} />
        </div>
      </section>

      <section className={styles.summaryGrid} aria-label="Today summary">
        <article className={styles.summaryCard}>
          <span className={styles.cardLabel}>Medication</span>
          <strong>{medsTaken} of {medsArray.length}</strong>
          <p>{medsArray.length ? 'checked in today' : 'Add your first med to begin.'}</p>
          <Link to="/dashboard/current_meds" className={styles.textLink}>Open Meds</Link>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.cardLabel}>Tasks</span>
          <strong>{taskArray.length}</strong>
          <p>{quickWins.length ? `${quickWins.length} low-energy quick win${quickWins.length === 1 ? '' : 's'}` : 'waiting without judgment'}</p>
          <Link to="/dashboard/task_list" className={styles.textLink}>Open Tasks</Link>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.cardLabel}>Today</span>
          <strong>{todayDate}</strong>
          <p>{localTime} local time · Pick one small start, then reassess.</p>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.cardLabel}>Calendar</span>
          <strong>Sync</strong>
          <p>Send tasks and med reminders to your calendar.</p>
          <Link to="/dashboard/calendar" className={styles.textLink}>Open Calendar</Link>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.cardLabel}>School</span>
          <strong>{openLearningItems.length}</strong>
          <p>{(learningState.materials || []).length} course material{(learningState.materials || []).length === 1 ? '' : 's'} organized.</p>
          <Link to="/dashboard/school" className={styles.textLink}>Open School</Link>
        </article>
      </section>

      {currentTask && (
        <section className={styles.currentTaskBanner} aria-label="Current task">
          <div>
            <p className={styles.eyebrow}>Current task</p>
            <strong>{currentTask.task_name}</strong>
            <span>{getEnergy(currentTask.id, support)} energy · due {formatDate(currentTask.due_date_1)}</span>
          </div>
          <Link to="/dashboard/task_list?pick=current" className={styles.secondaryButton}>Change Task</Link>
        </section>
      )}

      <section className={`${styles.layout} ${styles.calendarLayout}`} aria-label="Calendar and schedule">
        <div className={`${styles.panel} ${styles.calendarPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Calendar</p>
              <h2>{calendarMonthLabel}</h2>
            </div>
            <Link to="/dashboard/calendar" className={styles.secondaryButton}>Sync</Link>
          </div>
          <div className={styles.calendarGrid} aria-label={`${calendarMonthLabel} calendar`}>
            {weekDayLabels.map((label, index) => (
              <span className={styles.calendarWeekday} key={`${label}-${index}`}>{label}</span>
            ))}
            {calendarDays.map((day) => (
              <div
                aria-current={day.isToday ? 'date' : undefined}
                className={[
                  styles.calendarDay,
                  day.isCurrentMonth ? '' : styles.calendarDayMuted,
                  day.isToday ? styles.calendarToday : '',
                ].filter(Boolean).join(' ')}
                key={day.dateKey}
              >
                <span>{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${styles.panel} ${styles.agendaPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Today</p>
              <h2>Schedule & Deadlines</h2>
            </div>
            <span className={styles.statusPill}>{calendarDayEvents.length + todayDeadlines.length}</span>
          </div>

          {calendarEventsStatus && <p className={styles.calendarStatus}>{calendarEventsStatus}</p>}

          <div className={styles.agendaSections}>
            <section className={styles.agendaGroup}>
              <h3>Calendar Events</h3>
              <div className={styles.agendaList}>
                {calendarDayEvents.length ? calendarDayEvents.map((event) => (
                  <div className={styles.agendaItem} key={event.id}>
                    <span className={styles.agendaTime}>{event.timeLabel}</span>
                    <div>
                      <strong>{event.title}</strong>
                      <span>{event.description}</span>
                    </div>
                  </div>
                )) : (
                  <p className={styles.agendaEmpty}>No synced calendar events for today.</p>
                )}
              </div>
            </section>

            <section className={styles.agendaGroup}>
              <h3>{todayDeadlines.length ? 'Due Today' : 'Upcoming Deadlines'}</h3>
              <div className={styles.agendaList}>
                {displayedDeadlines.length ? displayedDeadlines.map((deadline) => (
                  <div className={styles.agendaItem} key={deadline.id}>
                    <span className={styles.agendaTime}>{formatAgendaDate(deadline.dateKey, todayKey)}</span>
                    <div>
                      <strong>{deadline.title}</strong>
                      <span>{deadline.label}</span>
                    </div>
                  </div>
                )) : (
                  <p className={styles.agendaEmpty}>No deadlines on deck yet.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Meds check-in</p>
              <h2>Memory support, not pressure</h2>
            </div>
            <Link to="/dashboard/current_meds" className={styles.secondaryButton}>Manage</Link>
          </div>
          <div className={styles.list}>
            {medsArray.length ? medsArray.slice(0, 4).map((med) => (
              <div className={styles.listItem} key={med.id}>
                <div>
                  <strong>{med.med_name}</strong>
                  <span>{med.dosage_mg}mg · {med.frequency}</span>
                </div>
                <span className={`${styles.statusPill} ${styles[medCheckins[med.id]?.status || 'idle']}`}>
                  {medStatusLabel(medCheckins[med.id]?.status)}
                </span>
              </div>
            )) : (
              <p className={styles.emptyState}>No meds yet. Add one when you are ready.</p>
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Start here</p>
              <h2>Low-friction next tasks</h2>
            </div>
            <Link to="/dashboard/task_list" className={styles.secondaryButton}>Details</Link>
          </div>
          <div className={styles.list}>
            {nextTasks.length ? nextTasks.map((task) => (
              <div className={styles.listItem} key={task.id}>
                <div>
                  <strong>{task.task_name}</strong>
                  <span>{getEnergy(task.id, support)} energy · due {formatDate(task.due_date_1)}</span>
                </div>
                <span className={styles.stepCount}>{getTaskSteps(task.id, support).filter((step) => step.done).length}/{getTaskSteps(task.id, support).length || 1}</span>
              </div>
            )) : (
              <p className={styles.emptyState}>No tasks yet. Add one tiny thing.</p>
            )}
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <div className={styles.panel}>
          <p className={styles.eyebrow}>Focus mode</p>
          <h2>Body-double one task</h2>
          <select
            className={styles.select}
            value={selectedTask}
            onChange={(event) => setSelectedTask(event.target.value)}
            aria-label="Choose focus task"
          >
            <option value="">Choose a task</option>
            {taskArray.map((task) => (
              <option key={task.id} value={task.task_name}>{task.task_name}</option>
            ))}
          </select>
          <div className={styles.segmented}>
            {focusDurations.map((minutes) => (
              <button
                className={focusMinutes === minutes ? styles.activeSegment : ''}
                key={minutes}
                onClick={() => setFocusMinutes(minutes)}
                type="button"
              >
                {minutes}m
              </button>
            ))}
          </div>
          <div className={styles.timer}>{secondsLeft ? focusTime : `${focusMinutes}:00`}</div>
          <p className={styles.focusTask}>{selectedTaskName}</p>
          <div className={styles.timerActions}>
            <button type="button" onClick={() => setSecondsLeft(focusMinutes * 60)}>Start</button>
            <button type="button" onClick={() => setSecondsLeft(0)}>Reset</button>
            <button type="button" onClick={() => setSecondsLeft(5 * 60)}>I got distracted</button>
          </div>
        </div>

        <div className={styles.panel}>
          <p className={styles.eyebrow}>Visual routines</p>
          <h2>Reusable anchors</h2>
          <div className={styles.routines}>
            {defaultRoutines.map((routine) => (
              <div className={styles.routine} key={routine.id}>
                <strong>{routine.label}</strong>
                <div className={styles.chips}>
                  {routine.steps.map((step) => {
                    const key = `${routine.id}:${step}`;
                    const isBreathingButton = routine.id === 'reset' && step === 'Breathe';
                    const isPickNextTaskButton = routine.id === 'reset' && step === 'Pick Next Task';
                    if (isPickNextTaskButton) {
                      return (
                        <Link
                          className={currentTask ? styles.checkedChip : ''}
                          key={step}
                          to="/dashboard/task_list?pick=current"
                        >
                          {currentTask ? 'Done: ' : ''}{step}
                        </Link>
                      );
                    }

                    return (
                      <button
                        className={routineState[key] ? styles.checkedChip : ''}
                        key={step}
                        onClick={() => (isBreathingButton ? openBreathingCoach() : toggleRoutineStep(routine.id, step))}
                        type="button"
                      >
                        {routineState[key] ? 'Done: ' : ''}{step}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {breathingOpen && (
        <div className={styles.breathingOverlay} role="presentation">
          <section
            aria-labelledby="breathing-title"
            aria-modal="true"
            className={styles.breathingDialog}
            role="dialog"
          >
            <div className={styles.breathingHeader}>
              <div>
                <p className={styles.eyebrow}>Breathe</p>
                <h2 id="breathing-title">Pick a breathing reset</h2>
                <p>
                  Short resets are useful in the moment. The 5 minute option is there when you
                  want a fuller calming practice.
                </p>
              </div>
              <button className={styles.iconButton} onClick={closeBreathingCoach} type="button" aria-label="Close breathing coach">Close</button>
            </div>

            <div className={`${styles.breathingOptions} ${selectedBreathingTechnique ? styles.compactBreathingOptions : ''}`}>
              {breathingTechniques.map((technique) => (
                <button
                  aria-label={`${technique.label}. ${technique.summary}`}
                  className={breathingTechniqueId === technique.id ? styles.selectedBreathingOption : ''}
                  disabled={breathingRunning}
                  key={technique.id}
                  onClick={() => selectBreathingTechnique(technique.id)}
                  type="button"
                >
                  <strong>{technique.label}</strong>
                  <span>{technique.summary}</span>
                </button>
              ))}
            </div>

            {selectedBreathingTechnique && (
              <>
                <div className={styles.durationGrid} aria-label="Breathing session length">
                  {breathingDurations.map((duration) => (
                    <button
                      className={breathingDuration === duration.seconds ? styles.activeDuration : ''}
                      disabled={breathingRunning}
                      key={duration.seconds}
                      onClick={() => {
                        setBreathingDuration(duration.seconds);
                        setBreathingElapsed(0);
                        setBreathingSecondsLeft(0);
                      }}
                      type="button"
                    >
                      {duration.label}
                    </button>
                  ))}
                </div>

                <div className={styles.breathingCoach}>
                  <div className={styles.breathingOrb} aria-hidden="true">
                    <span>{breathingComplete ? 'Done' : breathingPhase.phaseSecondsLeft || ''}</span>
                  </div>
                  <div className={styles.breathingText}>
                    <strong>{breathingComplete ? 'Nice work.' : breathingPhase.label}</strong>
                    <span>
                      {breathingRunning
                        ? `${breathingSecondsLeft}s left`
                        : breathingComplete
                          ? 'Your breathe routine is marked done for today.'
                          : 'Press Start when you are ready.'}
                    </span>
                  </div>
                  <div className={styles.breathingProgress} aria-hidden="true">
                    <span style={{ width: `${breathingProgress}%` }} />
                  </div>
                </div>

                <div className={styles.breathingActions}>
                  <button type="button" onClick={startBreathingSession}>
                    {breathingComplete ? 'Restart' : breathingRunning ? 'Restart' : 'Start'}
                  </button>
                  <button type="button" onClick={() => {
                    setBreathingSecondsLeft(0);
                    setBreathingElapsed(0);
                  }}>
                    Reset
                  </button>
                </div>
              </>
            )}

            <p className={styles.breathingNote}>
              Stop if you feel dizzy or short of breath. Choose Balanced breathing if holds do not feel good.
            </p>
          </section>
        </div>
      )}
    </main>
  );
};

export default Dashboard;
