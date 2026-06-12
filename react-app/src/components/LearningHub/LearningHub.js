import React, { useEffect, useMemo, useState } from 'react';
import styles from './LearningHub.module.css';

const defaultLearning = {
  areas: [],
  planner: [],
  materials: [],
};

const areaTypes = ['Course', 'Lab', 'Seminar', 'Study Group', 'Program'];
const plannerTypes = ['Homework', 'Class', 'Reading', 'Exam', 'Project', 'Deadline', 'Office Hours'];
const materialKinds = ['Lecture', 'Reading', 'Syllabus', 'Assignment', 'Notes', 'Slides', 'Reference'];

const currentYear = String(new Date().getFullYear());

const formatBytes = (bytes = 0) => {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const normalizeLearning = (learning = {}) => ({
  ...defaultLearning,
  ...learning,
  areas: learning.areas || [],
  planner: learning.planner || [],
  materials: learning.materials || [],
});

const groupMaterials = (materials) => materials.reduce((grouped, material) => {
  const course = material.course || material.area || 'Unsorted';
  const term = material.term || 'No Term';
  const year = material.year || 'No Year';

  grouped[course] = grouped[course] || {};
  grouped[course][term] = grouped[course][term] || {};
  grouped[course][term][year] = grouped[course][term][year] || [];
  grouped[course][term][year].push(material);

  return grouped;
}, {});

export default function LearningHub() {
  const [learning, setLearning] = useState(defaultLearning);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [areaForm, setAreaForm] = useState({ name: '', type: 'Course' });
  const [plannerForm, setPlannerForm] = useState({
    title: '',
    area: '',
    type: 'Homework',
    dueDate: todayInputValue(),
    term: '',
    year: currentYear,
  });
  const [materialForm, setMaterialForm] = useState({
    title: '',
    area: '',
    course: '',
    term: '',
    year: currentYear,
    kind: 'Lecture',
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const courseOptions = useMemo(() => {
    const names = new Set();
    learning.areas.forEach((area) => {
      if (area.name) names.add(area.name);
    });
    learning.materials.forEach((material) => {
      if (material.course && material.course !== 'Unsorted') names.add(material.course);
    });
    learning.planner.forEach((item) => {
      if (item.area) names.add(item.area);
    });
    return [...names].sort((left, right) => left.localeCompare(right));
  }, [learning]);

  const groupedMaterials = useMemo(() => groupMaterials(learning.materials), [learning.materials]);
  const openPlanner = learning.planner
    .filter((item) => item.status !== 'done')
    .sort((left, right) => (left.dueDate || '').localeCompare(right.dueDate || ''));
  const completedPlanner = learning.planner.filter((item) => item.status === 'done').length;

  useEffect(() => {
    const loadLearning = async () => {
      setLoading(true);
      setStatus('');

      try {
        const response = await fetch('/api/learning/');
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.errors?.join(' ') || 'School section is not available yet.');
        setLearning(normalizeLearning(payload.learning));
      } catch (error) {
        setStatus(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadLearning();
  }, []);

  const saveLearning = async (nextLearning, successMessage) => {
    const normalized = normalizeLearning(nextLearning);
    setLearning(normalized);
    setStatus('');

    try {
      const response = await fetch('/api/learning/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learning: normalized }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.errors?.join(' ') || 'Could not save that yet.');
      setLearning(normalizeLearning(payload.learning));
      setStatus(successMessage);
    } catch (error) {
      setStatus(error.message);
    }
  };

  const addArea = (event) => {
    event.preventDefault();
    const name = areaForm.name.trim();
    if (!name) return;

    saveLearning({
      ...learning,
      areas: [
        ...learning.areas,
        {
          id: `area-${Date.now()}`,
          name,
          type: areaForm.type,
        },
      ],
    }, 'Course added.');
    setAreaForm({ name: '', type: areaForm.type });
  };

  const addPlannerItem = (event) => {
    event.preventDefault();
    const title = plannerForm.title.trim();
    if (!title) return;

    saveLearning({
      ...learning,
      planner: [
        {
          id: `planner-${Date.now()}`,
          ...plannerForm,
          title,
          status: 'open',
          createdAt: new Date().toISOString(),
        },
        ...learning.planner,
      ],
    }, 'Planner item added.');
    setPlannerForm({ ...plannerForm, title: '' });
  };

  const togglePlannerItem = (itemId) => {
    saveLearning({
      ...learning,
      planner: learning.planner.map((item) => (
        item.id === itemId
          ? { ...item, status: item.status === 'done' ? 'open' : 'done' }
          : item
      )),
    }, 'Planner updated.');
  };

  const deletePlannerItem = (itemId) => {
    saveLearning({
      ...learning,
      planner: learning.planner.filter((item) => item.id !== itemId),
    }, 'Planner item removed.');
  };

  const uploadMaterial = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setStatus('Choose a file to deposit first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    Object.entries(materialForm).forEach(([key, value]) => formData.append(key, value));

    try {
      setStatus('Depositing material...');
      const response = await fetch('/api/learning/materials', {
        method: 'POST',
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.errors?.join(' ') || 'Could not upload that material.');
      setLearning(normalizeLearning(payload.learning));
      setSelectedFile(null);
      setMaterialForm({
        ...materialForm,
        title: '',
      });
      event.target.reset();
      setStatus('Material deposited and organized.');
    } catch (error) {
      setStatus(error.message);
    }
  };

  const deleteMaterial = async (materialId) => {
    try {
      const response = await fetch(`/api/learning/materials/${materialId}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.errors?.join(' ') || 'Could not delete that material.');
      setLearning(normalizeLearning(payload.learning));
      setStatus('Material removed.');
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>School</p>
          <h1>One calm home for classes, homework, and course materials.</h1>
          <p>
            Keep courses, lecture files, syllabi, assignments, and deadlines in one
            organized place without turning school into a scavenger hunt.
          </p>
        </div>
        <div className={styles.heroStats}>
          <span>{learning.areas.length} Courses</span>
          <span>{openPlanner.length} Open School Items</span>
          <span>{learning.materials.length} Course Files</span>
        </div>
      </section>

      {status && <p className={styles.status}>{status}</p>}

      <section className={styles.layout}>
        <article className={styles.panel}>
          <p className={styles.eyebrow}>Courses</p>
          <h2>Classes, Labs, And Study Buckets</h2>
          <form className={styles.inlineForm} onSubmit={addArea}>
            <input
              aria-label="Course name"
              onChange={(event) => setAreaForm({ ...areaForm, name: event.target.value })}
              placeholder="Biology 101, lab, study group..."
              value={areaForm.name}
            />
            <select
              aria-label="School area type"
              onChange={(event) => setAreaForm({ ...areaForm, type: event.target.value })}
              value={areaForm.type}
            >
              {areaTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <button type="submit">Add Course</button>
          </form>

          <div className={styles.areaList}>
            {learning.areas.length ? learning.areas.map((area) => (
              <div className={styles.areaChip} key={area.id}>
                <strong>{area.name}</strong>
                <span>{area.type}</span>
              </div>
            )) : (
              <p className={styles.emptyState}>Add a course, lab, or study bucket to start sorting.</p>
            )}
          </div>
        </article>

        <article className={styles.panel}>
          <p className={styles.eyebrow}>Planner</p>
          <h2>Homework, Classes, And Deadlines</h2>
          <form className={styles.plannerForm} onSubmit={addPlannerItem}>
            <input
              aria-label="Planner item title"
              onChange={(event) => setPlannerForm({ ...plannerForm, title: event.target.value })}
              placeholder="Read chapter 4, prep lab, email professor..."
              value={plannerForm.title}
            />
            <select
              aria-label="Planner item course"
              onChange={(event) => setPlannerForm({ ...plannerForm, area: event.target.value })}
              value={plannerForm.area}
            >
              <option value="">Choose Course</option>
              {courseOptions.map((course) => <option key={course} value={course}>{course}</option>)}
            </select>
            <select
              aria-label="Planner item type"
              onChange={(event) => setPlannerForm({ ...plannerForm, type: event.target.value })}
              value={plannerForm.type}
            >
              {plannerTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <input
              aria-label="Due date"
              onChange={(event) => setPlannerForm({ ...plannerForm, dueDate: event.target.value })}
              type="date"
              value={plannerForm.dueDate}
            />
            <input
              aria-label="Term"
              onChange={(event) => setPlannerForm({ ...plannerForm, term: event.target.value })}
              placeholder="Fall, Spring, Q1..."
              value={plannerForm.term}
            />
            <input
              aria-label="Year"
              onChange={(event) => setPlannerForm({ ...plannerForm, year: event.target.value })}
              placeholder="2026"
              value={plannerForm.year}
            />
            <button type="submit">Add Planner Item</button>
          </form>
        </article>
      </section>

      <section className={styles.layout}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Due Next</p>
              <h2>Planner Queue</h2>
            </div>
            <span className={styles.countPill}>{completedPlanner} Done</span>
          </div>
          <div className={styles.plannerList}>
            {openPlanner.length ? openPlanner.slice(0, 8).map((item) => (
              <div className={styles.plannerItem} key={item.id}>
                <button
                  aria-label={`Mark ${item.title} done`}
                  aria-pressed={item.status === 'done'}
                  onClick={() => togglePlannerItem(item.id)}
                  type="button"
                >
                  Done
                </button>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.area || 'Unsorted'} · {item.type} · due {item.dueDate || 'Flexible'}</span>
                </div>
                <button onClick={() => deletePlannerItem(item.id)} type="button">Remove</button>
              </div>
            )) : (
              <p className={styles.emptyState}>Nothing due yet. Suspiciously peaceful.</p>
            )}
          </div>
        </article>

        <article className={styles.panel}>
          <p className={styles.eyebrow}>Deposit</p>
          <h2>Upload A Course Document Or Lecture Material</h2>
          <form className={styles.uploadForm} onSubmit={uploadMaterial}>
            <input
              aria-label="Material title"
              onChange={(event) => setMaterialForm({ ...materialForm, title: event.target.value })}
              placeholder="Optional title"
              value={materialForm.title}
            />
            <input
              aria-label="Course"
              list="learning-course-options"
              onChange={(event) => setMaterialForm({
                ...materialForm,
                area: event.target.value,
                course: event.target.value,
              })}
              placeholder="Course"
              value={materialForm.course}
            />
            <datalist id="learning-course-options">
              {courseOptions.map((course) => <option key={course} value={course} />)}
            </datalist>
            <input
              aria-label="Semester or term"
              onChange={(event) => setMaterialForm({ ...materialForm, term: event.target.value })}
              placeholder="Semester / term"
              value={materialForm.term}
            />
            <input
              aria-label="Year"
              onChange={(event) => setMaterialForm({ ...materialForm, year: event.target.value })}
              placeholder="Year"
              value={materialForm.year}
            />
            <select
              aria-label="Material kind"
              onChange={(event) => setMaterialForm({ ...materialForm, kind: event.target.value })}
              value={materialForm.kind}
            >
              {materialKinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
            </select>
            <input
              aria-label="Choose material file"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              type="file"
            />
            <button type="submit">Deposit Material</button>
          </form>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Repository</p>
            <h2>Organized By Course, Semester, And Year</h2>
          </div>
          <span className={styles.countPill}>{learning.materials.length} Files</span>
        </div>

        {learning.materials.length ? (
          <div className={styles.materialGroups}>
            {Object.entries(groupedMaterials).sort().map(([course, terms]) => (
              <section className={styles.materialCourse} key={course}>
                <h3>{course}</h3>
                {Object.entries(terms).sort().map(([term, years]) => (
                  <div className={styles.termGroup} key={`${course}-${term}`}>
                    <h4>{term}</h4>
                    {Object.entries(years).sort().reverse().map(([year, materials]) => (
                      <div className={styles.yearGroup} key={`${course}-${term}-${year}`}>
                        <p>{year}</p>
                        <div className={styles.materialList}>
                          {materials.map((material) => (
                            <div className={styles.materialItem} key={material.id}>
                              <div>
                                <strong>{material.title}</strong>
                                <span>{material.kind} · {material.fileName} · {formatBytes(material.size)}</span>
                              </div>
                              <div className={styles.materialActions}>
                                <a href={`/api/learning/materials/${material.id}/download`}>Download</a>
                                <button onClick={() => deleteMaterial(material.id)} type="button">Remove</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </section>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>
            Deposit a syllabus, lecture slide deck, PDF, screenshot, or handout. Squirrel will file it under the course, semester, and year you choose.
          </p>
        )}
      </section>

      {loading && <p className={styles.loading}>Loading school section...</p>}
    </main>
  );
}
