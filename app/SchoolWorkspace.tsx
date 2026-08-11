"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CourseFile, CourseFileViewer } from "./CourseFileViewer";

type Term = { id: string; name: string; startDate: string | null; endDate: string | null; sortOrder: number };
type Course = { id: string; termId: string; name: string; code: string | null; instructor: string | null; color: string };
type Assignment = { id: string; courseId: string; title: string; dueAt: string | null; status: string; notes: string | null };
type AcademicData = { terms: Term[]; courses: Course[]; assignments: Assignment[]; files: CourseFile[] };
type FileMatch = CourseFile & { courseName: string; courseCode: string | null; excerpt: string };
type Editor = { kind: "term" | "course" | "assignment"; id?: string } | null;

const emptyData: AcademicData = { terms: [], courses: [], assignments: [], files: [] };
const statusNames: Record<string, string> = { not_started: "Not started", in_progress: "In progress", complete: "Complete" };

async function readResponse(response: Response) {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "That change could not be saved.");
  return result;
}

export function SchoolWorkspace() {
  const [data, setData] = useState<AcademicData>(emptyData);
  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [tab, setTab] = useState<"assignments" | "files">("assignments");
  const [editor, setEditor] = useState<Editor>(null);
  const [viewer, setViewer] = useState<CourseFile | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileQuery, setFileQuery] = useState("");
  const [fileMatches, setFileMatches] = useState<FileMatch[]>([]);
  const [searchingFiles, setSearchingFiles] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/academic", { cache: "no-store" });
    const next = await readResponse(response) as AcademicData;
    setData(next);
    setSelectedTermId((current) => next.terms.some((term) => term.id === current) ? current : next.terms[0]?.id ?? "");
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refresh().catch((error) => { setMessage(error.message); setLoading(false); });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const termCourses = useMemo(() => data.courses.filter((course) => course.termId === selectedTermId), [data.courses, selectedTermId]);
  const activeCourseId = termCourses.some((course) => course.id === selectedCourseId) ? selectedCourseId : termCourses[0]?.id ?? "";
  const selectedTerm = data.terms.find((term) => term.id === selectedTermId);
  const selectedCourse = data.courses.find((course) => course.id === activeCourseId);
  const courseAssignments = data.assignments.filter((assignment) => assignment.courseId === activeCourseId);
  const courseFiles = data.files.filter((file) => file.courseId === activeCourseId);

  const remove = async (kind: "term" | "course" | "assignment", id: string, label: string) => {
    if (!window.confirm(`Remove ${label}? This cannot be undone.`)) return;
    setMessage("");
    try {
      await readResponse(await fetch(`/api/academic?resource=${kind}&id=${encodeURIComponent(id)}`, { method: "DELETE" }));
      await refresh();
      setMessage(`${label} removed.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That item could not be removed.");
    }
  };

  const removeFile = async (file: CourseFile) => {
    if (!window.confirm(`Remove ${file.fileName}? This cannot be undone.`)) return;
    try {
      await readResponse(await fetch(`/api/academic/files/${encodeURIComponent(file.id)}`, { method: "DELETE" }));
      await refresh();
      setMessage(`${file.fileName} removed.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The file could not be removed.");
    }
  };

  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeCourseId) return;
    const form = event.currentTarget;
    const input = form.elements.namedItem("file") as HTMLInputElement;
    if (!input.files?.[0]) return;
    setUploading(true);
    setMessage("");
    const body = new FormData();
    body.append("courseId", activeCourseId);
    body.append("file", input.files[0]);
    try {
      await readResponse(await fetch("/api/academic/files", { method: "POST", body }));
      form.reset();
      await refresh();
      setMessage("Lecture file uploaded privately.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The file could not be uploaded.");
    } finally {
      setUploading(false);
    }
  };

  const searchFiles = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (fileQuery.trim().length < 2) { setFileMatches([]); setMessage("Type at least two characters to search."); return; }
    setSearchingFiles(true); setMessage("");
    try {
      const result = await readResponse(await fetch(`/api/academic/files/search?q=${encodeURIComponent(fileQuery.trim())}`, { cache: "no-store" }));
      setFileMatches(result.matches);
      if (!result.matches.length) setMessage("No match. The file may be hiding under a deeply unhelpful name.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The repository could not be searched.");
    } finally { setSearchingFiles(false); }
  };

  if (loading) return <section className="panel schoolWorkspace" id="school"><p className="eyebrow">School & Documents</p><h2>School stuff, minus the digital junk drawer.</h2><p>Opening the school drawer…</p></section>;

  return (
    <section className="panel schoolWorkspace" id="school" aria-label="Editable school workspace">
      <header className="schoolWorkspaceHeader">
        <div><p className="eyebrow">School & Documents</p><h2>School stuff, minus the digital junk drawer.</h2><p>Terms, courses, assignments, and lecture files live here. Everything is editable; nothing requires a color-coded binder unless you are into that.</p></div>
        <button type="button" onClick={() => setEditor({ kind: "term" })}>+ New term</button>
      </header>

      {message && <p className="schoolMessage" role="status">{message}</p>}

      {data.terms.length === 0 ? (
        <div className="schoolEmpty"><strong>Start with the term you are currently surviving.</strong><p>Add courses when you are ready. Future You may even find them again.</p><button type="button" onClick={() => setEditor({ kind: "term" })}>Add my first term</button></div>
      ) : (
        <>
          <div className="termToolbar">
            <label className="field"><span>Term</span><select value={selectedTermId} onChange={(event) => setSelectedTermId(event.target.value)}>{data.terms.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}</select></label>
            <div className="termActions"><button type="button" onClick={() => setEditor({ kind: "term", id: selectedTermId })}>Edit term</button><button className="dangerButton" type="button" onClick={() => selectedTerm && remove("term", selectedTerm.id, selectedTerm.name)}>Remove</button></div>
          </div>

          <div className="courseSectionHeading"><div><h3>{selectedTerm?.name}</h3><p>{selectedTerm?.startDate || selectedTerm?.endDate ? `${selectedTerm.startDate || "Open"} – ${selectedTerm.endDate || "Open"}` : "Dates optional"}</p></div><button type="button" onClick={() => setEditor({ kind: "course" })}>+ Add course</button></div>
          {termCourses.length === 0 ? (
            <div className="schoolEmpty compact"><strong>No courses here. Suspicious, but easily fixed.</strong><button type="button" onClick={() => setEditor({ kind: "course" })}>Add a course</button></div>
          ) : (
            <div className="courseCards">{termCourses.map((course) => (
              <button className={course.id === activeCourseId ? "selected" : ""} key={course.id} type="button" onClick={() => setSelectedCourseId(course.id)} style={{ "--course-color": course.color } as React.CSSProperties}>
                <span className="courseColor" /><span><strong>{course.code || course.name}</strong><small>{course.code ? course.name : course.instructor || "Course"}</small></span>
              </button>
            ))}</div>
          )}

          {selectedCourse && (
            <section className="courseWorkspace">
              <header className="courseWorkspaceHeader"><div><p className="eyebrow">Current course</p><h3>{selectedCourse.code ? `${selectedCourse.code} · ${selectedCourse.name}` : selectedCourse.name}</h3><p>{selectedCourse.instructor || "No instructor added"}</p></div><div><button type="button" onClick={() => setEditor({ kind: "course", id: selectedCourse.id })}>Edit course</button><button className="dangerButton" type="button" onClick={() => remove("course", selectedCourse.id, selectedCourse.name)}>Remove</button></div></header>
              <div className="schoolTabs" role="tablist"><button className={tab === "assignments" ? "active" : ""} type="button" onClick={() => setTab("assignments")}>Assignments <span>{courseAssignments.length}</span></button><button className={tab === "files" ? "active" : ""} type="button" onClick={() => setTab("files")}>Lecture files <span>{courseFiles.length}</span></button></div>

              {tab === "assignments" ? (
                <div className="academicList"><div className="listHeading"><div><h4>Assignments</h4><p>The list. Tragically, it exists.</p></div><button type="button" onClick={() => setEditor({ kind: "assignment" })}>+ Add assignment</button></div>
                  {courseAssignments.length === 0 ? <p className="emptyResult">Suspiciously quiet. Enjoy it.</p> : courseAssignments.map((assignment) => <article className="academicRow" key={assignment.id}><div><strong>{assignment.title}</strong><small>{assignment.dueAt ? `Due ${new Date(assignment.dueAt).toLocaleString()}` : "No due date"}{assignment.notes ? ` · ${assignment.notes}` : ""}</small></div><span data-status={assignment.status}>{statusNames[assignment.status] || assignment.status}</span><div><button type="button" onClick={() => setEditor({ kind: "assignment", id: assignment.id })}>Edit</button><button className="dangerButton" type="button" onClick={() => remove("assignment", assignment.id, assignment.title)}>Remove</button></div></article>)}</div>
              ) : (
                <div className="academicList"><div className="listHeading"><div><h4>Lecture repository</h4><p>PDF and PPTX, up to 25 MB each.</p></div></div>
                  <form className="repositorySearch" onSubmit={searchFiles}><label className="field"><span>Search filenames and the words hiding inside the files</span><input type="search" value={fileQuery} onChange={(event) => setFileQuery(event.target.value)} placeholder="Filename or words inside the document" /></label><button type="submit" disabled={searchingFiles}>{searchingFiles ? "Searching…" : "Search files"}</button></form>
                  {fileQuery.trim().length >= 2 && fileMatches.length > 0 && <section className="repositoryResults" aria-label="Repository search results"><div className="listHeading"><div><h4>Search results</h4><p>{fileMatches.length} private file{fileMatches.length === 1 ? "" : "s"} matched by filename or contents.</p></div><button className="quietButton" type="button" onClick={() => { setFileQuery(""); setFileMatches([]); }}>Clear</button></div>{fileMatches.map((file) => <article className="academicRow searchFileRow" key={file.id}><div><strong>{file.fileName}</strong><small>{file.courseCode || file.courseName} · {file.excerpt}</small></div><div className="fileRowActions"><button type="button" onClick={() => setViewer(file)}>View</button><a href={`/api/academic/files/${encodeURIComponent(file.id)}`} download={file.fileName}>Download</a></div></article>)}</section>}
                  <form className="uploadForm" onSubmit={upload}><label><span>Choose a lecture file</span><input name="file" type="file" accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation" required /></label><button type="submit" disabled={uploading}>{uploading ? "Uploading…" : "Upload privately"}</button></form>
                  {courseFiles.length === 0 ? <p className="emptyResult">No lecture files yet. Either impressively organized or hiding in Downloads.</p> : courseFiles.map((file) => <article className="academicRow fileRow" key={file.id}><div><strong>{file.fileName}</strong><small>{file.contentType === "application/pdf" ? "PDF" : "PowerPoint"} · {(file.sizeBytes / 1024 / 1024).toFixed(1)} MB</small></div><div className="fileRowActions"><button type="button" onClick={() => setViewer(file)}>View</button><a href={`/api/academic/files/${encodeURIComponent(file.id)}`} download={file.fileName}>Download</a><button className="dangerButton" type="button" onClick={() => removeFile(file)}>Remove</button></div></article>)}</div>
              )}
            </section>
          )}
        </>
      )}
      {editor && <AcademicEditor editor={editor} data={data} selectedTermId={selectedTermId} selectedCourseId={activeCourseId} onClose={() => setEditor(null)} onSaved={async (text) => { setEditor(null); await refresh(); setMessage(text); }} />}
      {viewer && <CourseFileViewer file={viewer} onClose={() => setViewer(null)} />}
    </section>
  );
}

function AcademicEditor({ editor, data, selectedTermId, selectedCourseId, onClose, onSaved }: { editor: NonNullable<Editor>; data: AcademicData; selectedTermId: string; selectedCourseId: string; onClose: () => void; onSaved: (message: string) => Promise<void> }) {
  const existing = editor.kind === "term" ? data.terms.find((item) => item.id === editor.id) : editor.kind === "course" ? data.courses.find((item) => item.id === editor.id) : data.assignments.find((item) => item.id === editor.id);
  const initial = existing ? { ...existing } as Record<string, string | number | null> : editor.kind === "term" ? { name: "", startDate: "", endDate: "", sortOrder: data.terms.length } : editor.kind === "course" ? { termId: selectedTermId, name: "", code: "", instructor: "", color: "#36bde8" } : { courseId: selectedCourseId, title: "", dueAt: "", status: "not_started", notes: "" };
  const [form, setForm] = useState<Record<string, string | number | null>>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const title = `${editor.id ? "Edit" : "Add"} ${editor.kind}`;
  const change = (key: string, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      await readResponse(await fetch("/api/academic", { method: editor.id ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resource: editor.kind, id: editor.id, ...form }) }));
      await onSaved(`${editor.kind[0].toUpperCase()}${editor.kind.slice(1)} saved.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "That change could not be saved."); setSaving(false); }
  };
  return <div className="modalBackdrop" role="presentation"><section className="academicModal" role="dialog" aria-modal="true" aria-label={title}><div className="modalHeading"><div><p className="eyebrow">School workspace</p><h2>{title}</h2></div><button className="iconButton" type="button" onClick={onClose}>×</button></div><form className="academicForm" onSubmit={save}>
    {editor.kind === "term" && <><label className="field"><span>Term name</span><input required maxLength={80} value={String(form.name ?? "")} onChange={(event) => change("name", event.target.value)} placeholder="Fall 2026" /></label><div className="profileFormGrid"><label className="field"><span>Start date <small>(optional)</small></span><input type="date" value={String(form.startDate ?? "")} onChange={(event) => change("startDate", event.target.value)} /></label><label className="field"><span>End date <small>(optional)</small></span><input type="date" value={String(form.endDate ?? "")} onChange={(event) => change("endDate", event.target.value)} /></label></div></>}
    {editor.kind === "course" && <><label className="field"><span>Term</span><select required value={String(form.termId ?? "")} onChange={(event) => change("termId", event.target.value)}>{data.terms.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}</select></label><label className="field"><span>Course name</span><input required maxLength={120} value={String(form.name ?? "")} onChange={(event) => change("name", event.target.value)} placeholder="Advanced Pharmacology" /></label><div className="profileFormGrid"><label className="field"><span>Course code</span><input maxLength={40} value={String(form.code ?? "")} onChange={(event) => change("code", event.target.value)} placeholder="NSG 506" /></label><label className="field"><span>Instructor</span><input maxLength={120} value={String(form.instructor ?? "")} onChange={(event) => change("instructor", event.target.value)} /></label></div><label className="field colorField"><span>Course color</span><input type="color" value={String(form.color ?? "#36bde8")} onChange={(event) => change("color", event.target.value)} /></label></>}
    {editor.kind === "assignment" && <><label className="field"><span>Course</span><select required value={String(form.courseId ?? "")} onChange={(event) => change("courseId", event.target.value)}>{data.courses.map((course) => <option key={course.id} value={course.id}>{course.code ? `${course.code} · ` : ""}{course.name}</option>)}</select></label><label className="field"><span>Assignment</span><input required maxLength={160} value={String(form.title ?? "")} onChange={(event) => change("title", event.target.value)} /></label><div className="profileFormGrid"><label className="field"><span>Due date and time</span><input type="datetime-local" value={String(form.dueAt ?? "").slice(0, 16)} onChange={(event) => change("dueAt", event.target.value)} /></label><label className="field"><span>Status</span><select value={String(form.status ?? "not_started")} onChange={(event) => change("status", event.target.value)}><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="complete">Complete</option></select></label></div><label className="field"><span>Notes <small>(optional)</small></span><textarea maxLength={2000} value={String(form.notes ?? "")} onChange={(event) => change("notes", event.target.value)} /></label></>}
    {message && <p className="formMessage">{message}</p>}<div className="modalActions"><button className="quietButton" type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button></div>
  </form></section></div>;
}
