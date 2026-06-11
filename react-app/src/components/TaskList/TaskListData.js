import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import * as TaskListActions from '../../store/task_list';
import EditTaskModal from './EditTaskListModal';
import styles from './TaskList.module.css';
import TaskListModal from './TaskListModal';
import {
  fetchSupportState,
  formatDate,
  getLocalSupportState,
  normalizeSupportState,
  persistSupportState,
} from '../../utils/neuroSupport';

const energyOptions = [
  { value: 'all', label: 'All' },
  { value: 'low', label: 'Low energy' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'quick', label: 'Quick win' },
];

const starterSteps = ['Open the task', 'Do the first visible piece', 'Pause and reassess'];

const TaskListData = () => {
  const tasks = useSelector((state) => state.task_items);
  const taskArray = Object.values(tasks).filter((task) => task && task.id);
  const dispatch = useDispatch();
  const location = useLocation();
  const [support, setSupport] = useState(getLocalSupportState);
  const [newStepByTask, setNewStepByTask] = useState({});
  const [filter, setFilter] = useState('all');
  const energyByTask = support.taskEnergy;
  const stepsByTask = support.taskSteps;
  const isChoosingCurrentTask = new URLSearchParams(location.search).get('pick') === 'current';
  const currentTask = taskArray.find((task) => String(task.id) === String(support.currentTaskId));

  useEffect(() => {
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

  const updateSupport = (updater) => {
    setSupport((current) => {
      const nextSupport = normalizeSupportState(typeof updater === 'function' ? updater(current) : updater);
      persistSupportState(nextSupport);
      return nextSupport;
    });
  };

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return taskArray;
    return taskArray.filter((task) => (energyByTask[task.id] || 'medium') === filter);
  }, [energyByTask, filter, taskArray]);

  const updateEnergy = (taskId, energy) => {
    updateSupport((current) => ({
      ...current,
      taskEnergy: {
        ...current.taskEnergy,
        [taskId]: energy,
      },
    }));
  };

  const selectCurrentTask = (taskId) => {
    updateSupport((current) => ({
      ...current,
      currentTaskId: taskId,
      routines: {
        ...current.routines,
        'reset:Pick next task': true,
      },
    }));
  };

  const clearCurrentTask = () => {
    updateSupport((current) => ({
      ...current,
      currentTaskId: '',
      routines: {
        ...current.routines,
        'reset:Pick next task': false,
      },
    }));
  };

  const removeTask = (taskId) => {
    dispatch(TaskListActions.delete_task_item(taskId));
    if (String(support.currentTaskId) === String(taskId)) clearCurrentTask();
  };

  const handleTaskCreated = (createdTask, nextSupport) => {
    if (nextSupport) setSupport(nextSupport);
    if (createdTask?.id) setFilter('all');
  };

  const addStarterSteps = (taskId) => {
    const existingSteps = stepsByTask[taskId] || [];
    updateSupport((current) => ({
      ...current,
      taskSteps: {
        ...current.taskSteps,
        [taskId]: existingSteps.length ? existingSteps : starterSteps.map((label, index) => ({
          id: `${taskId}-starter-${index}`,
          label,
          done: false,
        })),
      },
    }));
  };

  const addStep = (taskId) => {
    const label = (newStepByTask[taskId] || '').trim();
    if (!label) return;

    updateSupport((current) => ({
      ...current,
      taskSteps: {
        ...current.taskSteps,
        [taskId]: [
          ...(current.taskSteps[taskId] || []),
          {
            id: `${taskId}-${Date.now()}`,
            label,
            done: false,
          },
        ],
      },
    }));
    setNewStepByTask({ ...newStepByTask, [taskId]: '' });
  };

  const toggleStep = (taskId, stepId) => {
    updateSupport((current) => ({
      ...current,
      taskSteps: {
        ...current.taskSteps,
        [taskId]: (current.taskSteps[taskId] || []).map((step) => (
          step.id === stepId ? { ...step, done: !step.done } : step
        )),
      },
    }));
  };

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Task support</p>
          <h1>Make the next step smaller</h1>
          <p>Sort by energy, break tasks into steps, and restart without guilt.</p>
        </div>
        <TaskListModal
          makeCurrentDefault={isChoosingCurrentTask}
          onTaskCreated={handleTaskCreated}
        />
      </section>

      {(currentTask || isChoosingCurrentTask) && (
        <section className={styles.currentTaskBanner} aria-label="Current task">
          <div>
            <p className={styles.eyebrow}>Current task</p>
            {currentTask ? (
              <>
                <strong>{currentTask.task_name}</strong>
                <span>{energyByTask[currentTask.id] || 'medium'} energy · due {formatDate(currentTask.due_date_1)}</span>
              </>
            ) : (
              <>
                <strong>Choose what gets your attention next.</strong>
                <span>Select an existing task below, or add a new one and make it current.</span>
              </>
            )}
          </div>
          {currentTask && (
            <button onClick={clearCurrentTask} type="button">Clear</button>
          )}
        </section>
      )}

      <section className={styles.toolbar} aria-label="Task filters">
        {energyOptions.map((option) => (
          <button
            className={filter === option.value ? styles.activeFilter : ''}
            key={option.value}
            onClick={() => setFilter(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </section>

      <section className={styles.grid}>
        {filteredTasks.length ? filteredTasks.map((task) => {
          const taskEnergy = energyByTask[task.id] || 'medium';
          const steps = stepsByTask[task.id] || [];
          const completedSteps = steps.filter((step) => step.done).length;
          const isCurrentTask = String(support.currentTaskId) === String(task.id);

          return (
            <article className={`${styles.card} ${isCurrentTask ? styles.currentCard : ''}`} key={task.id}>
              <div className={styles.cardHeader}>
                <div>
                  <h2>{task.task_name}</h2>
                  <p>Goal: {formatDate(task.due_date_1)} · Latest: {formatDate(task.due_date_2)}</p>
                </div>
                <span className={styles.progress}>{completedSteps}/{steps.length || 1}</span>
              </div>

              <label className={styles.energyLabel}>
                Energy needed
                <select value={taskEnergy} onChange={(event) => updateEnergy(task.id, event.target.value)}>
                  {energyOptions.filter((option) => option.value !== 'all').map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <div className={styles.steps}>
                {steps.length ? steps.map((step) => (
                  <label className={step.done ? styles.doneStep : ''} key={step.id}>
                    <input
                      checked={step.done}
                      onChange={() => toggleStep(task.id, step.id)}
                      type="checkbox"
                    />
                    {step.label}
                  </label>
                )) : (
                  <p className={styles.emptySteps}>No steps yet. Make this task less slippery.</p>
                )}
              </div>

              <div className={styles.stepComposer}>
                <input
                  aria-label={`Add a step for ${task.task_name}`}
                  onChange={(event) => setNewStepByTask({ ...newStepByTask, [task.id]: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') addStep(task.id);
                  }}
                  placeholder="Add one tiny step"
                  value={newStepByTask[task.id] || ''}
                />
                <button onClick={() => addStep(task.id)} type="button">Add</button>
                <button onClick={() => addStarterSteps(task.id)} type="button">Make it smaller</button>
              </div>

              <div className={styles.cardActions}>
                <button
                  aria-pressed={isCurrentTask}
                  className={isCurrentTask ? styles.currentTaskButtonActive : styles.currentTaskButton}
                  onClick={() => selectCurrentTask(task.id)}
                  type="button"
                >
                  {isCurrentTask ? 'Current task' : 'Set current task'}
                </button>
                <EditTaskModal task={task} />
                <button
                  onClick={() => removeTask(task.id)}
                  className={styles.deleteButton}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </article>
          );
        }) : (
          <article className={styles.emptyState}>
            <h2>No tasks in this view</h2>
            <p>Try another energy filter, or add one task that Future You will thank you for.</p>
          </article>
        )}
      </section>
    </main>
  );
};

export default TaskListData;
