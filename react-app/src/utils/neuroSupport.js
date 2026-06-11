export const todayKey = () => new Date().toISOString().slice(0, 10);

const supportStorageKey = 'squirrel-support-state';

export const defaultSupportState = {
  checkins: {},
  taskEnergy: {},
  taskSteps: {},
  routines: {},
  comfort: {
    calm: false,
    highContrast: false,
    reducedMotion: false,
  },
};

export const loadJson = (key, fallback) => {
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    return fallback;
  }
};

export const saveJson = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const normalizeSupportState = (data = {}) => ({
  ...defaultSupportState,
  ...data,
  checkins: {
    ...defaultSupportState.checkins,
    ...(data.checkins || {}),
  },
  taskEnergy: {
    ...defaultSupportState.taskEnergy,
    ...(data.taskEnergy || {}),
  },
  taskSteps: {
    ...defaultSupportState.taskSteps,
    ...(data.taskSteps || {}),
  },
  routines: {
    ...defaultSupportState.routines,
    ...(data.routines || {}),
  },
  comfort: {
    ...defaultSupportState.comfort,
    ...(data.comfort || {}),
  },
});

const mergeCheckins = (...checkinStates) => checkinStates.reduce((merged, checkins = {}) => {
  Object.entries(checkins).forEach(([date, dailyCheckins]) => {
    merged[date] = {
      ...(merged[date] || {}),
      ...(dailyCheckins || {}),
    };
  });

  return merged;
}, {});

const mergeSupportState = (...states) => states.reduce((merged, state) => {
  const normalized = normalizeSupportState(state);
  return normalizeSupportState({
    checkins: mergeCheckins(merged.checkins, normalized.checkins),
    taskEnergy: {
      ...merged.taskEnergy,
      ...normalized.taskEnergy,
    },
    taskSteps: {
      ...merged.taskSteps,
      ...normalized.taskSteps,
    },
    routines: {
      ...merged.routines,
      ...normalized.routines,
    },
    comfort: {
      ...merged.comfort,
      ...normalized.comfort,
    },
  });
}, normalizeSupportState());

const getLegacySupportState = () => ({
  checkins: {
    [todayKey()]: loadJson(`squirrel-med-checkins-${todayKey()}`, {}),
  },
  taskEnergy: loadJson('squirrel-task-energy', {}),
  taskSteps: loadJson('squirrel-task-steps', {}),
  routines: loadJson('squirrel-routine-progress', {}),
  comfort: loadJson('squirrel-comfort-settings', defaultSupportState.comfort),
});

export const getLocalSupportState = () => mergeSupportState(
  getLegacySupportState(),
  loadJson(supportStorageKey, {})
);

export const saveSupportStateLocal = (supportState) => {
  const normalized = normalizeSupportState(supportState);
  saveJson(supportStorageKey, normalized);
  saveJson(`squirrel-med-checkins-${todayKey()}`, normalized.checkins[todayKey()] || {});
  saveJson('squirrel-task-energy', normalized.taskEnergy);
  saveJson('squirrel-task-steps', normalized.taskSteps);
  saveJson('squirrel-routine-progress', normalized.routines);
  saveJson('squirrel-comfort-settings', normalized.comfort);
  return normalized;
};

export const persistSupportState = async (supportState) => {
  const normalized = saveSupportStateLocal(supportState);

  try {
    await fetch('/api/support_state/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: normalized }),
    });
  } catch (error) {
    // Local storage keeps the UI usable if the API is temporarily unreachable.
  }

  return normalized;
};

export const fetchSupportState = async () => {
  const localState = getLocalSupportState();

  try {
    const response = await fetch('/api/support_state/');
    if (!response.ok) return localState;

    const payload = await response.json();
    const merged = mergeSupportState(localState, payload.data);
    saveSupportStateLocal(merged);

    if (JSON.stringify(merged) !== JSON.stringify(normalizeSupportState(payload.data))) {
      persistSupportState(merged);
    }

    return merged;
  } catch (error) {
    return localState;
  }
};

export const formatDate = (date) => {
  if (!date) return 'Flexible';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getEnergy = (taskId, supportState = getLocalSupportState()) => {
  return supportState.taskEnergy[taskId] || 'medium';
};

export const getTaskSteps = (taskId, supportState = getLocalSupportState()) => {
  return supportState.taskSteps[taskId] || [];
};

export const getMedCheckins = (supportState = getLocalSupportState()) => {
  return supportState.checkins[todayKey()] || {};
};

export const medStatusLabel = (status) => {
  if (status === 'taken') return 'Taken';
  if (status === 'skipped') return 'Skipped';
  if (status === 'unsure') return 'Not sure';
  return 'Check in';
};
