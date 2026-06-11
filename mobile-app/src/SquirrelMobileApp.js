import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { api } from './api';
import { colors, radii, sizes } from './theme';

const todayKey = () => new Date().toISOString().slice(0, 10);

const defaultSupport = {
  checkins: {},
  taskEnergy: {},
  taskSteps: {},
  routines: {},
  currentTaskId: '',
  comfort: {
    calm: false,
    highContrast: false,
    reducedMotion: false,
  },
};

const defaultRoutines = [
  { id: 'morning', label: 'Morning launch', steps: ['Meds', 'Water', 'Food', 'One small task'] },
  { id: 'reset', label: 'Midday reset', steps: ['Breathe', 'Check body', 'Pick next task'] },
  { id: 'evening', label: 'Evening landing', steps: ['Tidy one spot', 'Prep meds', 'Set tomorrow'] },
];

const tabs = ['Dashboard', 'Meds', 'Tasks', 'Focus', 'Settings'];
const energyOptions = ['low', 'medium', 'high', 'quick'];
const focusDurations = [10, 15, 25];
const breathingDurations = [
  { seconds: 30, label: '30 sec reset' },
  { seconds: 60, label: '1 min starter' },
  { seconds: 300, label: '5 min full' },
];

const breathingTechniques = [
  {
    id: 'box',
    label: 'Box breathing',
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
    label: 'Balanced breathing',
    summary: 'No holds. Good if holding your breath feels uncomfortable.',
    pattern: [
      { label: 'Inhale', seconds: 4 },
      { label: 'Exhale', seconds: 4 },
    ],
  },
  {
    id: 'long-exhale',
    label: 'Long exhale',
    summary: 'A gentle longer exhale to help your body downshift.',
    pattern: [
      { label: 'Inhale', seconds: 4 },
      { label: 'Exhale slowly', seconds: 6 },
    ],
  },
  {
    id: '478',
    label: '4-7-8 breathing',
    summary: 'More intense. Best when breath holds feel okay.',
    pattern: [
      { label: 'Inhale', seconds: 4 },
      { label: 'Hold', seconds: 7 },
      { label: 'Exhale slowly', seconds: 8 },
    ],
  },
];

const initialMed = {
  med_name: '',
  dosage_mg: '',
  frequency: '',
  med_info: '',
};

const initialTask = {
  task_name: '',
  due_date_1: '',
  due_date_2: '',
};

const normalizeSupport = (data = {}) => ({
  ...defaultSupport,
  ...data,
  currentTaskId: data.currentTaskId || defaultSupport.currentTaskId,
  comfort: {
    ...defaultSupport.comfort,
    ...(data.comfort || {}),
  },
});

const objectValues = (value) => Object.values(value || {}).filter(Boolean);

const formatDate = (date) => {
  if (!date) return 'Flexible';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const medStatusLabel = (status) => {
  if (status === 'taken') return 'Taken';
  if (status === 'skipped') return 'Skipped';
  if (status === 'unsure') return 'Not sure';
  return 'Check in';
};

const getBreathingPhase = (technique, elapsedSeconds) => {
  if (!technique) return { label: 'Choose a technique', phaseSecondsLeft: 0 };

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

const AppButton = ({ children, tone = 'primary', onPress, disabled, style }) => (
  <Pressable
    accessibilityRole="button"
    disabled={disabled}
    hitSlop={4}
    onPress={onPress}
    style={({ pressed }) => [
      styles.button,
      styles[`button_${tone}`],
      disabled && styles.buttonDisabled,
      pressed && !disabled && styles.buttonPressed,
      style,
    ]}
  >
    <Text style={[styles.buttonText, ['secondary', 'success'].includes(tone) && styles.secondaryButtonText]}>
      {children}
    </Text>
  </Pressable>
);

const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const Pill = ({ children, tone = 'idle' }) => (
  <View style={[styles.pill, styles[`pill_${tone}`]]}>
    <Text style={styles.pillText}>{children}</Text>
  </View>
);

const Field = ({ label, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      autoCapitalize="none"
      keyboardType={keyboardType}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      secureTextEntry={secureTextEntry}
      style={styles.input}
      value={value}
    />
  </View>
);

export default function SquirrelMobileApp() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [meds, setMeds] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [support, setSupport] = useState(defaultSupport);
  const [supportReady, setSupportReady] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [newMed, setNewMed] = useState(initialMed);
  const [newTask, setNewTask] = useState(initialTask);
  const [taskFilter, setTaskFilter] = useState('all');
  const [newStepText, setNewStepText] = useState({});
  const [focusMinutes, setFocusMinutes] = useState(10);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [focusTask, setFocusTask] = useState('');
  const [makeNewTaskCurrent, setMakeNewTaskCurrent] = useState(false);
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [breathingTechniqueId, setBreathingTechniqueId] = useState('');
  const [breathingDuration, setBreathingDuration] = useState(60);
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState(0);
  const [breathingElapsed, setBreathingElapsed] = useState(0);

  const today = todayKey();
  const todaysCheckins = support.checkins[today] || {};

  const medsTaken = meds.filter((med) => todaysCheckins[med.id]?.status === 'taken').length;
  const quickTasks = tasks.filter((task) => ['low', 'quick'].includes(support.taskEnergy[task.id] || 'medium'));
  const filteredTasks = taskFilter === 'all'
    ? tasks
    : tasks.filter((task) => (support.taskEnergy[task.id] || 'medium') === taskFilter);
  const currentTask = tasks.find((task) => String(task.id) === String(support.currentTaskId));

  const focusClock = `${String(Math.floor(focusSeconds / 60)).padStart(2, '0')}:${String(focusSeconds % 60).padStart(2, '0')}`;
  const selectedBreathingTechnique = breathingTechniques.find((technique) => technique.id === breathingTechniqueId);
  const breathingRunning = breathingSecondsLeft > 0;
  const breathingComplete = Boolean(!breathingRunning && breathingElapsed >= breathingDuration && breathingTechniqueId);
  const breathingPhase = breathingComplete
    ? { label: 'Done', phaseSecondsLeft: 0 }
    : getBreathingPhase(selectedBreathingTechnique, breathingElapsed);
  const breathingProgress = breathingDuration ? Math.min(100, (breathingElapsed / breathingDuration) * 100) : 0;

  const syncSupport = (updater) => {
    setSupport((current) => normalizeSupport(typeof updater === 'function' ? updater(current) : updater));
  };

  const loadEverything = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [medPayload, taskPayload, supportPayload] = await Promise.all([
        api.getMeds(),
        api.getTasks(),
        api.getSupportState(),
      ]);
      setMeds(objectValues(medPayload));
      setTasks(objectValues(taskPayload));
      setSupport(normalizeSupport(supportPayload.data));
      setSupportReady(true);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const authUser = await api.authenticate();
        if (!authUser.errors) {
          setUser(authUser);
          await loadEverything();
        }
      } catch (error) {
        setSupportReady(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!user || !supportReady) return undefined;

    const timer = setTimeout(() => {
      api.saveSupportState(support).catch((error) => setMessage(error.message));
    }, 500);

    return () => clearTimeout(timer);
  }, [support, supportReady, user]);

  useEffect(() => {
    if (!focusSeconds) return undefined;
    const timer = setInterval(() => {
      setFocusSeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [focusSeconds]);

  useEffect(() => {
    if (!breathingSecondsLeft) return undefined;
    const timer = setInterval(() => {
      setBreathingSecondsLeft((seconds) => Math.max(seconds - 1, 0));
      setBreathingElapsed((seconds) => Math.min(seconds + 1, breathingDuration));
    }, 1000);
    return () => clearInterval(timer);
  }, [breathingDuration, breathingSecondsLeft]);

  useEffect(() => {
    if (!breathingComplete || support.routines['reset:Breathe']) return;

    syncSupport((current) => ({
      ...current,
      routines: {
        ...current.routines,
        'reset:Breathe': true,
      },
    }));
  }, [breathingComplete, support.routines]);

  const submitAuth = async () => {
    setLoading(true);
    setMessage('');
    try {
      const authUser = authMode === 'login'
        ? await api.login(authForm.email, authForm.password)
        : await api.signup(authForm.username, authForm.email, authForm.password);
      setUser(authUser);
      setAuthForm({ username: '', email: '', password: '' });
      await loadEverything();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await api.logout().catch(() => undefined);
    setUser(null);
    setMeds([]);
    setTasks([]);
    setSupport(defaultSupport);
    setSupportReady(false);
  };

  const createMed = async () => {
    if (!newMed.med_name.trim()) {
      setMessage('Medication name is required.');
      return;
    }

    setLoading(true);
    try {
      const med = await api.createMed({
        ...newMed,
        dosage_mg: Number.parseInt(newMed.dosage_mg || '0', 10),
        taken: false,
      });
      setMeds((current) => [...current, med]);
      setNewMed(initialMed);
      setMessage('Medication added.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteMed = async (id) => {
    setLoading(true);
    try {
      await api.deleteMed(id);
      setMeds((current) => current.filter((med) => med.id !== id));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateMedCheckin = (medId, status) => {
    syncSupport((current) => ({
      ...current,
      checkins: {
        ...current.checkins,
        [today]: {
          ...(current.checkins[today] || {}),
          [medId]: {
            status,
            time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          },
        },
      },
    }));
  };

  const setCurrentTask = (taskId) => {
    syncSupport((current) => ({
      ...current,
      currentTaskId: taskId,
      routines: {
        ...current.routines,
        'reset:Pick next task': true,
      },
    }));
  };

  const clearCurrentTask = () => {
    syncSupport((current) => ({
      ...current,
      currentTaskId: '',
      routines: {
        ...current.routines,
        'reset:Pick next task': false,
      },
    }));
  };

  const createTask = async () => {
    if (!newTask.task_name.trim()) {
      setMessage('Task name is required.');
      return;
    }

    setLoading(true);
    try {
      const task = await api.createTask(newTask);
      setTasks((current) => [...current, task]);
      if (makeNewTaskCurrent) {
        setCurrentTask(task.id);
        setMakeNewTaskCurrent(false);
      }
      setNewTask(initialTask);
      setMessage('Task added.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    setLoading(true);
    try {
      await api.deleteTask(id);
      setTasks((current) => current.filter((task) => task.id !== id));
      if (String(support.currentTaskId) === String(id)) clearCurrentTask();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const setTaskEnergy = (taskId, energy) => {
    syncSupport((current) => ({
      ...current,
      taskEnergy: {
        ...current.taskEnergy,
        [taskId]: energy,
      },
    }));
  };

  const addStarterSteps = (taskId) => {
    syncSupport((current) => {
      const existing = current.taskSteps[taskId] || [];
      if (existing.length) return current;

      return {
        ...current,
        taskSteps: {
          ...current.taskSteps,
          [taskId]: ['Open the task', 'Do the first visible piece', 'Pause and reassess']
            .map((label, index) => ({ id: `${taskId}-starter-${index}`, label, done: false })),
        },
      };
    });
  };

  const addStep = (taskId) => {
    const label = (newStepText[taskId] || '').trim();
    if (!label) return;

    syncSupport((current) => ({
      ...current,
      taskSteps: {
        ...current.taskSteps,
        [taskId]: [
          ...(current.taskSteps[taskId] || []),
          { id: `${taskId}-${Date.now()}`, label, done: false },
        ],
      },
    }));
    setNewStepText((current) => ({ ...current, [taskId]: '' }));
  };

  const toggleStep = (taskId, stepId) => {
    syncSupport((current) => ({
      ...current,
      taskSteps: {
        ...current.taskSteps,
        [taskId]: (current.taskSteps[taskId] || []).map((step) => (
          step.id === stepId ? { ...step, done: !step.done } : step
        )),
      },
    }));
  };

  const toggleRoutineStep = (routineId, step) => {
    const key = `${routineId}:${step}`;
    syncSupport((current) => ({
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

  const setComfort = (key, value) => {
    syncSupport((current) => ({
      ...current,
      comfort: {
        ...current.comfort,
        [key]: value,
      },
    }));
  };

  const screenStyle = [
    styles.screen,
    support.comfort.calm && styles.screenCalm,
    support.comfort.highContrast && styles.screenHighContrast,
  ];
  const scrollContentStyle = [styles.scrollContent, isTablet && styles.tabletScrollContent];
  const authScrollStyle = [styles.authScroll, isTablet && styles.tabletAuthScroll];
  const cardGridStyle = isTablet ? styles.tabletCardGrid : styles.stack;
  const tabletGridCardStyle = isTablet ? styles.tabletGridCard : undefined;

  if (!user) {
    return (
      <SafeAreaView style={screenStyle}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={authScrollStyle}>
            <Text style={styles.eyebrow}>Squirrel mobile</Text>
            <Text style={styles.title}>Daily support that travels with you.</Text>
            <Text style={styles.subtitle}>
              Log in to sync meds, tasks, routines, check-ins, and comfort settings with the web app.
            </Text>

            <View style={styles.segmented}>
              <AppButton style={styles.pairButton} tone={authMode === 'login' ? 'primary' : 'secondary'} onPress={() => setAuthMode('login')}>Log in</AppButton>
              <AppButton style={styles.pairButton} tone={authMode === 'signup' ? 'primary' : 'secondary'} onPress={() => setAuthMode('signup')}>Sign up</AppButton>
            </View>

            <Card>
              {authMode === 'signup' && (
                <Field
                  label="Username"
                  onChangeText={(username) => setAuthForm((form) => ({ ...form, username }))}
                  placeholder="Your name"
                  value={authForm.username}
                />
              )}
              <Field
                label="Email"
                keyboardType="email-address"
                onChangeText={(email) => setAuthForm((form) => ({ ...form, email }))}
                placeholder="you@example.com"
                value={authForm.email}
              />
              <Field
                label="Password"
                onChangeText={(password) => setAuthForm((form) => ({ ...form, password }))}
                placeholder="Password"
                secureTextEntry
                value={authForm.password}
              />
              <AppButton disabled={loading} onPress={submitAuth}>
                {loading ? 'Working...' : authMode === 'login' ? 'Log in' : 'Create account'}
              </AppButton>
            </Card>

            {!!message && <Text style={styles.message}>{message}</Text>}
            <Text style={styles.apiNote}>Backend: {api.baseUrl}</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const renderDashboard = () => (
    <>
      <View style={[styles.hero, isTablet && styles.tabletHero]}>
        <Text style={styles.eyebrow}>Gentle daily support</Text>
        <Text style={styles.title}>Start with the next kind thing.</Text>
        <Text style={styles.subtitle}>
          Your meds, tasks, routines, and focus tools stay synced when you are logged in.
        </Text>
      </View>

      <View style={[styles.summaryRow, isTablet && styles.tabletSummaryRow]}>
        <Card style={styles.summaryCard}>
          <Text style={styles.cardLabel}>Meds</Text>
          <Text style={styles.bigNumber}>{medsTaken}/{meds.length}</Text>
          <Text style={styles.muted}>checked in today</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.cardLabel}>Tasks</Text>
          <Text style={styles.bigNumber}>{tasks.length}</Text>
          <Text style={styles.muted}>{quickTasks.length} quick/low-energy</Text>
        </Card>
      </View>

      {!!currentTask && (
        <Card style={styles.currentTaskCard}>
          <Text style={styles.eyebrow}>Current task</Text>
          <Text style={styles.sectionTitle}>{currentTask.task_name}</Text>
          <Text style={styles.muted}>
            {support.taskEnergy[currentTask.id] || 'medium'} energy · due {formatDate(currentTask.due_date_1)}
          </Text>
          <View style={styles.twoGrid}>
            <AppButton style={styles.pairButton} tone="secondary" onPress={() => setActiveTab('Tasks')}>Change task</AppButton>
            <AppButton style={styles.pairButton} tone="secondary" onPress={clearCurrentTask}>Clear</AppButton>
          </View>
        </Card>
      )}

      <View style={cardGridStyle}>
        <Card style={tabletGridCardStyle}>
          <Text style={styles.sectionTitle}>Start here</Text>
          {(quickTasks.length ? quickTasks : tasks).slice(0, 3).map((task) => (
            <View key={task.id} style={styles.listItem}>
              <View style={styles.listText}>
                <Text style={styles.itemTitle}>{task.task_name}</Text>
                <Text style={styles.muted}>{support.taskEnergy[task.id] || 'medium'} energy · due {formatDate(task.due_date_1)}</Text>
              </View>
              <Pill>{(support.taskSteps[task.id] || []).filter((step) => step.done).length}/{(support.taskSteps[task.id] || []).length || 1}</Pill>
            </View>
          ))}
          {!tasks.length && <Text style={styles.muted}>No tasks yet. Add one tiny thing.</Text>}
        </Card>

        <Card style={tabletGridCardStyle}>
          <Text style={styles.sectionTitle}>Visual routines</Text>
          {defaultRoutines.map((routine) => (
            <View key={routine.id} style={styles.routineBlock}>
              <Text style={styles.itemTitle}>{routine.label}</Text>
              <View style={styles.chipGrid}>
                {routine.steps.map((step) => {
                  const checked = !!support.routines[`${routine.id}:${step}`];
                  const isBreathingButton = routine.id === 'reset' && step === 'Breathe';
                  const isPickNextTaskButton = routine.id === 'reset' && step === 'Pick next task';
                  const stepDone = checked || (isPickNextTaskButton && !!currentTask);

                  return (
                    <AppButton
                      key={step}
                      style={styles.chipButton}
                      tone={stepDone ? 'success' : 'secondary'}
                      onPress={() => (
                        isBreathingButton
                          ? openBreathingCoach()
                          : isPickNextTaskButton
                            ? setActiveTab('Tasks')
                            : toggleRoutineStep(routine.id, step)
                      )}
                    >
                      {stepDone ? 'Done: ' : ''}{step}
                    </AppButton>
                  );
                })}
              </View>
            </View>
          ))}
        </Card>
      </View>
    </>
  );

  const renderMeds = () => (
    <>
      <Card>
        <Text style={styles.sectionTitle}>Add medication</Text>
        <Field label="Name" value={newMed.med_name} placeholder="Medication name" onChangeText={(med_name) => setNewMed((med) => ({ ...med, med_name }))} />
        <Field label="Dosage mg" value={newMed.dosage_mg} placeholder="10" keyboardType="number-pad" onChangeText={(dosage_mg) => setNewMed((med) => ({ ...med, dosage_mg }))} />
        <Field label="Frequency" value={newMed.frequency} placeholder="Morning" onChangeText={(frequency) => setNewMed((med) => ({ ...med, frequency }))} />
        <Field label="Notes" value={newMed.med_info} placeholder="Take with water" onChangeText={(med_info) => setNewMed((med) => ({ ...med, med_info }))} />
        <AppButton disabled={loading} onPress={createMed}>Add medication</AppButton>
      </Card>

      <View style={cardGridStyle}>
        {meds.map((med) => {
          const status = todaysCheckins[med.id]?.status;
          return (
            <Card key={med.id} style={tabletGridCardStyle}>
              <View style={styles.cardHeader}>
                <View style={styles.listText}>
                  <Text style={styles.sectionTitle}>{med.med_name}</Text>
                  <Text style={styles.muted}>{med.dosage_mg}mg · {med.frequency}</Text>
                </View>
                <Pill tone={status || 'idle'}>{medStatusLabel(status)}</Pill>
              </View>
              {!!med.med_info && <Text style={styles.note}>{med.med_info}</Text>}
              <View style={styles.threeGrid}>
                <AppButton style={styles.equalButton} tone={status === 'taken' ? 'success' : 'secondary'} onPress={() => updateMedCheckin(med.id, 'taken')}>Taken</AppButton>
                <AppButton style={styles.equalButton} tone={status === 'skipped' ? 'danger' : 'secondary'} onPress={() => updateMedCheckin(med.id, 'skipped')}>Skipped</AppButton>
                <AppButton style={styles.equalButton} tone={status === 'unsure' ? 'warning' : 'secondary'} onPress={() => updateMedCheckin(med.id, 'unsure')}>Not sure</AppButton>
              </View>
              <AppButton tone="danger" onPress={() => deleteMed(med.id)}>Delete medication</AppButton>
            </Card>
          );
        })}
      </View>
    </>
  );

  const renderTasks = () => (
    <>
      <Card>
        <Text style={styles.sectionTitle}>Add task</Text>
        <Field label="Task" value={newTask.task_name} placeholder="Pack bag" onChangeText={(task_name) => setNewTask((task) => ({ ...task, task_name }))} />
        <Field label="Goal date" value={newTask.due_date_1} placeholder="YYYY-MM-DD" onChangeText={(due_date_1) => setNewTask((task) => ({ ...task, due_date_1 }))} />
        <Field label="Latest date" value={newTask.due_date_2} placeholder="YYYY-MM-DD" onChangeText={(due_date_2) => setNewTask((task) => ({ ...task, due_date_2 }))} />
        <View style={styles.settingRow}>
          <Text style={styles.itemTitle}>Make current task</Text>
          <Switch value={makeNewTaskCurrent} onValueChange={setMakeNewTaskCurrent} />
        </View>
        <AppButton disabled={loading} onPress={createTask}>Add task</AppButton>
      </Card>

      {!!currentTask && (
        <Card style={styles.currentTaskCard}>
          <Text style={styles.eyebrow}>Current task</Text>
          <Text style={styles.sectionTitle}>{currentTask.task_name}</Text>
          <Text style={styles.muted}>
            {support.taskEnergy[currentTask.id] || 'medium'} energy · due {formatDate(currentTask.due_date_1)}
          </Text>
          <AppButton tone="secondary" onPress={clearCurrentTask}>Clear current task</AppButton>
        </Card>
      )}

      <View style={styles.filterGrid}>
        {['all', ...energyOptions].map((option) => (
          <AppButton
            key={option}
            tone={taskFilter === option ? 'primary' : 'secondary'}
            onPress={() => setTaskFilter(option)}
            style={styles.filterButton}
          >
            {option === 'all' ? 'All' : option}
          </AppButton>
        ))}
      </View>

      <View style={cardGridStyle}>
        {filteredTasks.map((task) => {
          const energy = support.taskEnergy[task.id] || 'medium';
          const steps = support.taskSteps[task.id] || [];
          const isCurrentTask = String(support.currentTaskId) === String(task.id);

          return (
            <Card key={task.id} style={[tabletGridCardStyle, isCurrentTask && styles.currentTaskCard]}>
              <View style={styles.cardHeader}>
                <View style={styles.listText}>
                  <Text style={styles.sectionTitle}>{task.task_name}</Text>
                  <Text style={styles.muted}>Goal {formatDate(task.due_date_1)} · Latest {formatDate(task.due_date_2)}</Text>
                </View>
                <Pill>{steps.filter((step) => step.done).length}/{steps.length || 1}</Pill>
              </View>
              <Text style={styles.label}>Energy needed</Text>
              <View style={styles.fourGrid}>
                {energyOptions.map((option) => (
                  <AppButton
                    key={option}
                    tone={energy === option ? 'primary' : 'secondary'}
                    onPress={() => setTaskEnergy(task.id, option)}
                    style={styles.equalButton}
                  >
                    {option}
                  </AppButton>
                ))}
              </View>
              {steps.map((step) => (
                <Pressable key={step.id} onPress={() => toggleStep(task.id, step.id)} style={styles.stepRow}>
                  <View style={[styles.checkbox, step.done && styles.checkboxChecked]} />
                  <Text style={[styles.stepText, step.done && styles.stepDone]}>{step.label}</Text>
                </Pressable>
              ))}
              {!steps.length && <Text style={styles.muted}>No steps yet. Make it smaller.</Text>}
              <View style={styles.stepComposer}>
                <TextInput
                  onChangeText={(value) => setNewStepText((current) => ({ ...current, [task.id]: value }))}
                  placeholder="Add one tiny step"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, styles.stepInput]}
                  value={newStepText[task.id] || ''}
                />
                <AppButton onPress={() => addStep(task.id)}>Add</AppButton>
              </View>
              <View style={styles.twoGrid}>
                <AppButton style={styles.pairButton} tone={isCurrentTask ? 'success' : 'secondary'} onPress={() => setCurrentTask(task.id)}>
                  {isCurrentTask ? 'Current task' : 'Set current'}
                </AppButton>
                <AppButton style={styles.pairButton} tone="secondary" onPress={() => addStarterSteps(task.id)}>Make it smaller</AppButton>
                <AppButton style={styles.pairButton} tone="danger" onPress={() => deleteTask(task.id)}>Remove</AppButton>
              </View>
            </Card>
          );
        })}
      </View>
    </>
  );

  const renderFocus = () => (
    <Card style={isTablet && styles.centerCard}>
      <Text style={styles.eyebrow}>Focus mode</Text>
      <Text style={styles.titleSmall}>Body-double one task</Text>
      <TextInput
        onChangeText={setFocusTask}
        placeholder="What are we starting?"
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={focusTask}
      />
      <View style={styles.threeGrid}>
        {focusDurations.map((minutes) => (
          <AppButton
            key={minutes}
            style={styles.equalButton}
            tone={focusMinutes === minutes ? 'primary' : 'secondary'}
            onPress={() => setFocusMinutes(minutes)}
          >
            {minutes}m
          </AppButton>
        ))}
      </View>
      <Text style={styles.timerText}>{focusSeconds ? focusClock : `${focusMinutes}:00`}</Text>
      <Text style={styles.muted}>{focusTask || currentTask?.task_name || quickTasks[0]?.task_name || tasks[0]?.task_name || 'one kind next step'}</Text>
      <View style={styles.threeGrid}>
        <AppButton style={styles.equalButton} onPress={() => setFocusSeconds(focusMinutes * 60)}>Start</AppButton>
        <AppButton style={styles.equalButton} tone="secondary" onPress={() => setFocusSeconds(0)}>Reset</AppButton>
        <AppButton style={styles.equalButton} tone="warning" onPress={() => setFocusSeconds(5 * 60)}>Distracted</AppButton>
      </View>
    </Card>
  );

  const renderSettings = () => (
    <View style={cardGridStyle}>
      <Card style={tabletGridCardStyle}>
        <Text style={styles.sectionTitle}>Sensory-friendly settings</Text>
        {[
          ['calm', 'Calm colors'],
          ['highContrast', 'Higher contrast'],
          ['reducedMotion', 'Reduced motion'],
        ].map(([key, label]) => (
          <View key={key} style={styles.settingRow}>
            <Text style={styles.itemTitle}>{label}</Text>
            <Switch value={support.comfort[key]} onValueChange={(value) => setComfort(key, value)} />
          </View>
        ))}
      </Card>
      <Card style={tabletGridCardStyle}>
        <Text style={styles.sectionTitle}>Account and sync</Text>
        <Text style={styles.muted}>Logged in as {user.email}</Text>
        <Text style={styles.apiNote}>Backend: {api.baseUrl}</Text>
        <View style={styles.twoGrid}>
          <AppButton style={styles.pairButton} tone="secondary" onPress={loadEverything}>Sync now</AppButton>
          <AppButton style={styles.pairButton} tone="danger" onPress={logout}>Log out</AppButton>
        </View>
      </Card>
    </View>
  );

  const renderBreathingCoach = () => (
    <Modal
      animationType={support.comfort.reducedMotion ? 'none' : 'fade'}
      onRequestClose={closeBreathingCoach}
      transparent
      visible={breathingOpen}
    >
      <View style={[styles.modalBackdrop, isTablet && styles.tabletModalBackdrop]}>
        <View style={[styles.breathingModal, isTablet && styles.tabletBreathingModal]}>
          <ScrollView contentContainerStyle={styles.breathingModalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text style={styles.eyebrow}>Breathe</Text>
                <Text style={styles.sectionTitle}>Pick a breathing reset</Text>
                <Text style={styles.muted}>
                  Short resets help in the moment. The 5 minute option is there for a fuller calming practice.
                </Text>
              </View>
              <AppButton tone="secondary" style={styles.closeButton} onPress={closeBreathingCoach}>Close</AppButton>
            </View>

            <View style={[styles.breathingTechniqueGrid, isTablet && styles.tabletBreathingTechniqueGrid]}>
              {breathingTechniques.map((technique) => (
                <Pressable
                  accessibilityRole="button"
                  disabled={breathingRunning}
                  key={technique.id}
                  onPress={() => selectBreathingTechnique(technique.id)}
                  style={({ pressed }) => [
                    styles.techniqueOption,
                    isTablet && styles.tabletTechniqueOption,
                    breathingTechniqueId === technique.id && styles.techniqueOptionSelected,
                    breathingRunning && styles.optionDisabled,
                    pressed && !breathingRunning && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.techniqueTitle}>{technique.label}</Text>
                  <Text style={styles.techniqueSummary}>{technique.summary}</Text>
                </Pressable>
              ))}
            </View>

            {!!selectedBreathingTechnique && (
              <>
                <View style={styles.threeGrid}>
                  {breathingDurations.map((duration) => (
                    <AppButton
                      disabled={breathingRunning}
                      key={duration.seconds}
                      onPress={() => {
                        setBreathingDuration(duration.seconds);
                        setBreathingElapsed(0);
                        setBreathingSecondsLeft(0);
                      }}
                      style={styles.equalButton}
                      tone={breathingDuration === duration.seconds ? 'primary' : 'secondary'}
                    >
                      {duration.label}
                    </AppButton>
                  ))}
                </View>

                <View style={styles.breathingCoach}>
                  <View style={styles.breathingOrb}>
                    <Text style={styles.breathingOrbText}>
                      {breathingComplete ? 'Done' : breathingPhase.phaseSecondsLeft || ''}
                    </Text>
                  </View>
                  <Text style={styles.breathingPhaseText}>
                    {breathingComplete ? 'Nice work.' : breathingPhase.label}
                  </Text>
                  <Text style={styles.muted}>
                    {breathingRunning
                      ? `${breathingSecondsLeft}s left`
                      : breathingComplete
                        ? 'Your breathe routine is marked done for today.'
                        : 'Press Start when you are ready.'}
                  </Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${breathingProgress}%` }]} />
                  </View>
                </View>

                <View style={styles.twoGrid}>
                  <AppButton style={styles.pairButton} onPress={startBreathingSession}>
                    {breathingComplete ? 'Restart' : breathingRunning ? 'Restart' : 'Start'}
                  </AppButton>
                  <AppButton
                    style={styles.pairButton}
                    tone="secondary"
                    onPress={() => {
                      setBreathingSecondsLeft(0);
                      setBreathingElapsed(0);
                    }}
                  >
                    Reset
                  </AppButton>
                </View>
              </>
            )}

            <Text style={styles.apiNote}>
              Stop if you feel dizzy or short of breath. Choose Balanced breathing if holds do not feel good.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderScreen = () => {
    if (activeTab === 'Meds') return renderMeds();
    if (activeTab === 'Tasks') return renderTasks();
    if (activeTab === 'Focus') return renderFocus();
    if (activeTab === 'Settings') return renderSettings();
    return renderDashboard();
  };

  return (
    <SafeAreaView style={screenStyle}>
      <View style={styles.appShell}>
        <ScrollView contentContainerStyle={scrollContentStyle}>
          <Text style={styles.appName}>Squirrel</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}
          {renderScreen()}
        </ScrollView>
        <View style={[styles.tabBar, isTablet ? styles.tabletTabBar : styles.phoneTabBar]}>
          {tabs.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {renderBreathingCoach()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  screenCalm: {
    backgroundColor: '#f4fbfd',
  },
  screenHighContrast: {
    backgroundColor: '#fff',
  },
  appShell: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    padding: 16,
    paddingBottom: 92,
  },
  tabletScrollContent: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1040,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 112,
  },
  authScroll: {
    gap: 16,
    justifyContent: 'center',
    minHeight: '100%',
    padding: 20,
  },
  tabletAuthScroll: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 560,
  },
  appName: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 38,
  },
  hero: {
    gap: 8,
    padding: 22,
    borderColor: colors.border,
    borderRadius: radii.control,
    borderWidth: 1,
    backgroundColor: colors.panel,
  },
  tabletHero: {
    padding: 30,
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 38,
  },
  titleSmall: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 18,
    lineHeight: 25,
  },
  eyebrow: {
    color: colors.accentLavender,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  card: {
    gap: 14,
    padding: 18,
    borderColor: colors.border,
    borderRadius: radii.control,
    borderWidth: 1,
    backgroundColor: colors.surface,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tabletSummaryRow: {
    gap: 16,
  },
  summaryCard: {
    flex: 1,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: colors.accentLavender,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  bigNumber: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 38,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: '700',
    lineHeight: 27,
  },
  itemTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  muted: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
  },
  note: {
    padding: 12,
    borderRadius: radii.control,
    backgroundColor: colors.soft,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
  },
  stack: {
    gap: 16,
  },
  tabletCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  tabletGridCard: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 320,
  },
  centerCard: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 640,
  },
  currentTaskCard: {
    borderColor: colors.primary,
    backgroundColor: colors.panelBlue,
  },
  message: {
    padding: 12,
    borderRadius: radii.control,
    backgroundColor: colors.unsure,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  apiNote: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    minHeight: sizes.controlHeight,
    paddingHorizontal: 14,
    borderRadius: radii.control,
  },
  equalButton: {
    flex: 1,
    minWidth: 0,
  },
  pairButton: {
    flex: 1,
    minWidth: 118,
  },
  filterButton: {
    minWidth: 88,
  },
  chipButton: {
    minWidth: 118,
  },
  button_primary: {
    backgroundColor: colors.primary,
  },
  button_secondary: {
    backgroundColor: colors.secondary,
  },
  button_success: {
    backgroundColor: colors.taken,
  },
  button_danger: {
    backgroundColor: colors.danger,
  },
  button_warning: {
    backgroundColor: colors.warning,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonText: {
    flexShrink: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: colors.ink,
  },
  field: {
    gap: 6,
  },
  label: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    minHeight: sizes.controlHeight,
    paddingHorizontal: 12,
    borderColor: colors.inputBorder,
    borderRadius: radii.control,
    borderWidth: 1,
    backgroundColor: '#fff',
    color: colors.ink,
    fontSize: 16,
  },
  segmented: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: sizes.gap,
  },
  threeGrid: {
    flexDirection: 'row',
    gap: sizes.gap,
  },
  fourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sizes.gap,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sizes.gap,
  },
  twoGrid: {
    alignItems: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sizes.gap,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sizes.gap,
  },
  listItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 60,
    padding: 12,
    borderRadius: radii.control,
    backgroundColor: colors.soft,
  },
  listText: {
    flex: 1,
    gap: 2,
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    minWidth: 68,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.idle,
  },
  pill_taken: {
    backgroundColor: colors.taken,
  },
  pill_skipped: {
    backgroundColor: colors.skipped,
  },
  pill_unsure: {
    backgroundColor: colors.unsure,
  },
  pill_idle: {
    backgroundColor: colors.idle,
  },
  pillText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  routineBlock: {
    gap: 10,
  },
  stepComposer: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: sizes.gap,
  },
  stepInput: {
    flex: 1,
  },
  stepRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: sizes.controlHeight,
    padding: 10,
    borderRadius: radii.control,
    backgroundColor: colors.soft,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderColor: colors.primary,
    borderRadius: 4,
    borderWidth: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  stepText: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    lineHeight: 21,
  },
  stepDone: {
    color: colors.accentLavender,
    textDecorationLine: 'line-through',
  },
  timerText: {
    color: colors.ink,
    fontSize: 58,
    fontWeight: '700',
    lineHeight: 64,
    textAlign: 'center',
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: sizes.controlHeight,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    backgroundColor: colors.surface,
  },
  phoneTabBar: {
    right: 0,
    left: 0,
  },
  tabletTabBar: {
    alignSelf: 'center',
    bottom: 20,
    width: '92%',
    maxWidth: 720,
    paddingBottom: 10,
    borderColor: colors.border,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRadius: radii.control,
    shadowColor: colors.ink,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: radii.control,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#fff',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(39, 54, 64, 0.28)',
  },
  tabletModalBackdrop: {
    alignItems: 'center',
    padding: 32,
  },
  breathingModal: {
    width: '100%',
    maxHeight: '90%',
    borderColor: colors.border,
    borderRadius: radii.control,
    borderWidth: 1,
    backgroundColor: colors.surface,
    shadowColor: colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  tabletBreathingModal: {
    maxWidth: 760,
  },
  breathingModalContent: {
    gap: 14,
    padding: 18,
  },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  modalHeaderText: {
    flex: 1,
    gap: 4,
  },
  closeButton: {
    minWidth: 76,
  },
  breathingTechniqueGrid: {
    gap: sizes.gap,
  },
  tabletBreathingTechniqueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  techniqueOption: {
    gap: 5,
    minHeight: 82,
    padding: 12,
    borderColor: colors.border,
    borderRadius: radii.control,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  tabletTechniqueOption: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  techniqueOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.panelBlue,
  },
  optionDisabled: {
    opacity: 0.68,
  },
  techniqueTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 21,
  },
  techniqueSummary: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 19,
  },
  breathingCoach: {
    alignItems: 'center',
    gap: 10,
    padding: 18,
    borderRadius: radii.control,
    backgroundColor: colors.soft,
  },
  breathingOrb: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 132,
    height: 132,
    borderColor: colors.taken,
    borderRadius: 66,
    borderWidth: 8,
    backgroundColor: colors.surface,
  },
  breathingOrbText: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 34,
  },
  breathingPhaseText: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 29,
    textAlign: 'center',
  },
  progressTrack: {
    overflow: 'hidden',
    width: '100%',
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
});
