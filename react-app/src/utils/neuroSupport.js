export const todayKey = () => new Date().toISOString().slice(0, 10);

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

export const getEnergy = (taskId) => {
  const energies = loadJson('squirrel-task-energy', {});
  return energies[taskId] || 'medium';
};

export const getTaskSteps = (taskId) => {
  const steps = loadJson('squirrel-task-steps', {});
  return steps[taskId] || [];
};

export const getMedCheckins = () => loadJson(`squirrel-med-checkins-${todayKey()}`, {});

export const medStatusLabel = (status) => {
  if (status === 'taken') return 'Taken';
  if (status === 'skipped') return 'Skipped';
  if (status === 'unsure') return 'Not sure';
  return 'Check in';
};
