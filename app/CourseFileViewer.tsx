"use client";

import { useEffect, useRef, useState } from "react";

export type CourseFile = {
  id: string;
  courseId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: number;
};

export function CourseFileViewer({ file, onClose }: { file: CourseFile; onClose: () => void }) {
  const slideRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState(file.contentType === "application/pdf" ? "" : "Preparing slides…");
  const fileUrl = `/api/academic/files/${encodeURIComponent(file.id)}`;

  useEffect(() => {
    if (file.contentType === "application/pdf" || !slideRef.current) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;
    const render = async () => {
      try {
        const [{ init }, response] = await Promise.all([
          import("pptx-preview"),
          fetch(fileUrl, { cache: "no-store" }),
        ]);
        if (!response.ok) throw new Error("The slide deck could not be opened.");
        const viewer = init(slideRef.current!, { width: 960, height: 540, mode: "slide" });
        destroy = () => viewer.destroy();
        await viewer.preview(await response.arrayBuffer());
        if (!cancelled) setMessage("");
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "The slide deck could not be opened.");
      }
    };
    void render();
    return () => { cancelled = true; destroy?.(); };
  }, [file.contentType, fileUrl]);

  return (
    <div className="fileViewerBackdrop" role="presentation">
      <section className="fileViewer" role="dialog" aria-modal="true" aria-labelledby="file-viewer-title">
        <header className="fileViewerHeader">
          <div><p className="eyebrow">Lecture repository</p><h2 id="file-viewer-title">{file.fileName}</h2></div>
          <div className="fileViewerActions"><a href={fileUrl} download={file.fileName}>Download</a><button type="button" onClick={onClose}>Close</button></div>
        </header>
        <div className="fileViewerBody">
          {file.contentType === "application/pdf" ? (
            <iframe title={file.fileName} src={fileUrl} />
          ) : (
            <div className="pptxCanvas" ref={slideRef} />
          )}
          {message && <p className="viewerMessage" role="status">{message}</p>}
        </div>
      </section>
    </div>
  );
}
