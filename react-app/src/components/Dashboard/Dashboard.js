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
  persistSupportState,
} from '../../utils/neuroSupport';
import styles from './Dashboard.module.css';

const defaultRoutines = [
  { id: 'morning', label: 'Morning launch', steps: ['Meds', 'Water', 'Food', 'One small task'] },
  { id: 'reset', label: 'Midday reset', steps: ['Breathe', 'Check body', 'Pick next task'] },
  { id: 'evening', label: 'Evening landing', steps: ['Tidy one spot', 'Prep meds', 'Set tomorrow'] },
];

const focusDurations = [10, 15, 25];

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
  const medCheckins = getMedCheckins(support);
  const routineState = support.routines;
  const comfort = support.comfort;

  const updateSupport = (updater) => {
    setSupport((current) => {
      const nextSupport = normalizeSupportState(typeof updater === 'function' ? updater(current) : updater);
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
    document.body.classList.toggle('theme-calm', comfort.calm);
    document.body.classList.toggle('theme-contrast', comfort.highContrast);
    document.body.classList.toggle('reduce-motion', comfort.reducedMotion);
  }, [comfort]);

  useEffect(() => {
    if (!secondsLeft) return undefined;

    const timer = setInterval(() => {
      setSecondsLeft((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const medsTaken = medsArray.filter((med) => medCheckins[med.id]?.status === 'taken').length;
  const quickWins = taskArray.filter((task) => ['low', 'quick'].includes(getEnergy(task.id, support)));
  const nextTasks = quickWins.length ? quickWins.slice(0, 3) : taskArray.slice(0, 3);
  const selectedTaskName = selectedTask || nextTasks[0]?.task_name || taskArray[0]?.task_name || 'one kind next step';
  const focusTime = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

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
          <TaskListModal />
        </div>
      </section>

      <section className={styles.summaryGrid} aria-label="Today summary">
        <article className={styles.summaryCard}>
          <span className={styles.cardLabel}>Medication</span>
          <strong>{medsTaken} of {medsArray.length}</strong>
          <p>{medsArray.length ? 'checked in today' : 'Add your first med to begin.'}</p>
          <Link to="/dashboard/current_meds" className={styles.textLink}>Open meds</Link>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.cardLabel}>Tasks</span>
          <strong>{taskArray.length}</strong>
          <p>{quickWins.length ? `${quickWins.length} low-energy quick win${quickWins.length === 1 ? '' : 's'}` : 'waiting without judgment'}</p>
          <Link to="/dashboard/task_list" className={styles.textLink}>Open tasks</Link>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.cardLabel}>Today</span>
          <strong>{new Date().toLocaleDateString(undefined, { weekday: 'long' })}</strong>
          <p>Pick one small start, then reassess.</p>
        </article>
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
                    return (
                      <button
                        className={routineState[key] ? styles.checkedChip : ''}
                        key={step}
                        onClick={() => toggleRoutineStep(routine.id, step)}
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

      <section className={styles.panel}>
        <p className={styles.eyebrow}>Sensory-friendly settings</p>
        <h2>Make the app easier to sit with</h2>
        <div className={styles.toggleRow}>
          <label><input checked={comfort.calm} onChange={() => updateSupport((current) => ({ ...current, comfort: { ...current.comfort, calm: !current.comfort.calm } }))} type="checkbox" /> Calm colors</label>
          <label><input checked={comfort.highContrast} onChange={() => updateSupport((current) => ({ ...current, comfort: { ...current.comfort, highContrast: !current.comfort.highContrast } }))} type="checkbox" /> Higher contrast</label>
          <label><input checked={comfort.reducedMotion} onChange={() => updateSupport((current) => ({ ...current, comfort: { ...current.comfort, reducedMotion: !current.comfort.reducedMotion } }))} type="checkbox" /> Reduced motion</label>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
