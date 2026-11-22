"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ─── types ─────────────────────────────────────────────────────────────── */
type FileStatus = "pending" | "generating" | "done";

interface FileEntry {
  id: string;
  name: string;
  ext: string;
  color: string; // thumbnail accent
  status: FileStatus;
}

interface MetadataState {
  title: string;
  description: string;
  keywords: string[];
  titleVisible: boolean;
  descVisible: boolean;
  kwVisible: boolean[];
}

/* ─── sample data ────────────────────────────────────────────────────────── */
const FILES_INITIAL: FileEntry[] = [
  { id: "f1", name: "watercolor-splash-0142", ext: "png", color: "#93c5fd", status: "pending" },
  { id: "f2", name: "mountain-sunset-0891",   ext: "jpg", color: "#fbbf24", status: "pending" },
  { id: "f3", name: "vector-floral-0334",     ext: "svg", color: "#86efac", status: "pending" },
];

const META_F1 = {
  title: "Watercolor Splash Texture Background with Vibrant Blue and Purple Hues",
  description:
    "A vibrant watercolor splash texture blending blue and purple hues. Ideal for digital art, graphic design and creative backgrounds.",
  keywords: ["watercolor", "splash", "texture", "background", "blue", "purple", "artistic", "abstract", "paint", "stain"],
};

const META_F2 = {
  title: "Golden Mountain Sunset Landscape with Dramatic Sky",
  description:
    "Breathtaking mountain landscape at sunset with golden light and dramatic clouds.",
  keywords: ["mountain", "sunset", "landscape", "golden", "sky", "nature", "dramatic", "outdoors", "scenic", "peak"],
};

/* ─── timing (ms) ───────────────────────────────────────────────────────── */
const T = {
  appear:    200,   // initial window fade-in
  clickBtn:   2000, // "Generate All" click
  titleIn:   3200,  // title streams in
  descIn:    4600,  // description streams in
  kw0:       5600,  // first keyword chip
  kwStep:    150,   // stagger per chip
  f1done:    7600,  // f1 → Done badge
  exportHighlight: 10200, // Export button glow
  toastIn:   10800, // toast appears
  toastOut:  13200, // toast fades
  f2start:   13600, // second file starts generating
  loopReset: 15800, // back to start
};

const KW_COUNT = META_F1.keywords.length; // 10

/* ─── helpers ───────────────────────────────────────────────────────────── */
function emptyMeta(): MetadataState {
  return {
    title: "",
    description: "",
    keywords: [],
    titleVisible: false,
    descVisible: false,
    kwVisible: [],
  };
}

export default function GenMetaHeroDemo() {
  const [files, setFiles] = useState<FileEntry[]>(FILES_INITIAL.map(f => ({ ...f })));
  const [selectedId, setSelectedId] = useState("f1");
  const [meta, setMeta] = useState<MetadataState>(emptyMeta());
  const [btnActive, setBtnActive] = useState(false);
  const [exportGlow, setExportGlow] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastFading, setToastFading] = useState(false);
  const [appVisible, setAppVisible] = useState(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const after = useCallback((ms: number, fn: () => void) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  const setFileStatus = useCallback((fileId: string, status: FileStatus) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status } : f));
  }, []);

  const runAnimationRef = useRef<() => void>(() => {});

  const runAnimation = useCallback(() => {
    // Reset state
    setAppVisible(false);
    setFiles(FILES_INITIAL.map(f => ({ ...f })));
    setSelectedId("f1");
    setMeta(emptyMeta());
    setBtnActive(false);
    setExportGlow(false);
    setToastVisible(false);
    setToastFading(false);

    // Beat 0: app appears
    after(T.appear, () => setAppVisible(true));

    // Beat 1 → Beat 2: "Generate All" click animation
    after(T.clickBtn - 100, () => setBtnActive(true));
    after(T.clickBtn + 200, () => {
      setBtnActive(false);
      setFileStatus("f1", "generating");
    });

    // Beat 3: metadata streams in for f1
    after(T.titleIn, () => {
      setMeta(prev => ({
        ...prev,
        title: META_F1.title,
        titleVisible: true,
      }));
    });

    after(T.descIn, () => {
      setMeta(prev => ({
        ...prev,
        description: META_F1.description,
        descVisible: true,
      }));
    });

    // Keywords stagger
    for (let i = 0; i < KW_COUNT; i++) {
      const delay = T.kw0 + i * T.kwStep;
      after(delay, () => {
        setMeta(prev => ({
          ...prev,
          keywords: i === 0 ? [META_F1.keywords[0]!] : [...prev.keywords, META_F1.keywords[i]!],
          kwVisible: [...Array(i + 1)].map((_, j) => j <= i),
        }));
      });
    }

    // f1 → Done
    after(T.f1done, () => setFileStatus("f1", "done"));

    // Beat 4: Export highlight + toast
    after(T.exportHighlight, () => setExportGlow(true));
    after(T.toastIn, () => setToastVisible(true));

    // Toast fade out + f2 starts
    after(T.toastOut, () => {
      setToastFading(true);
      setExportGlow(false);
      after(600, () => {
        setToastVisible(false);
        setToastFading(false);
      });
    });

    after(T.f2start, () => {
      setSelectedId("f2");
      setFileStatus("f2", "generating");
      setMeta({
        title: META_F2.title,
        description: META_F2.description,
        keywords: [],
        titleVisible: true,
        descVisible: false,
        kwVisible: [],
      });
    });

    // Loop reset
    after(T.loopReset, () => runAnimationRef.current());
  }, [after, setFileStatus]);

  useEffect(() => {
    runAnimationRef.current = runAnimation;
    runAnimation();
    return clearAllTimers;
  }, [runAnimation, clearAllTimers]);

  /* ── derived ── */
  const selectedFile = files.find(f => f.id === selectedId)!;
  const isMeta2 = selectedId === "f2";
  const currentMeta = isMeta2 ? META_F2 : META_F1;

  return (
    <>
      <style>{`
        @keyframes gm-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes gm-pulse-ring {
          0%  { box-shadow: 0 0 0 0 rgba(37,99,235,0.35); }
          70% { box-shadow: 0 0 0 6px rgba(37,99,235,0); }
          100%{ box-shadow: 0 0 0 0 rgba(37,99,235,0); }
        }
        @keyframes gm-btn-press {
          0%  { transform: scale(1); }
          50% { transform: scale(0.96); }
          100%{ transform: scale(1); }
        }
        @keyframes gm-toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gm-toast-out {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(8px); }
        }
        @keyframes gm-window-in {
          from { opacity: 0; transform: scale(0.98) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes gm-chip-in {
          from { opacity: 0; transform: translateY(4px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes gm-field-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes gm-status-in {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        .gm-stage {
          width: 100%;
          background: #f4f4f5;
          font-family: system-ui, -apple-system, 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
          /* aspect-ratio drives height */
          aspect-ratio: 900 / 480;
        }
        .gm-window {
          position: absolute;
          inset: 8px 8px 0 8px;
          background: #ffffff;
          border: 1px solid #e4e4e7;
          border-radius: 10px 10px 0 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 4px 32px -4px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.04);
          transform-origin: top center;
        }
        .gm-window.visible {
          animation: gm-window-in 0.4s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .gm-window.hidden-init { opacity: 0; }

        /* title bar */
        .gm-titlebar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          height: 36px;
          background: #f9f9f9;
          border-bottom: 1px solid #e4e4e7;
          flex-shrink: 0;
          user-select: none;
        }
        .gm-traffic { display: flex; gap: 6px; }
        .gm-dot {
          width: 12px; height: 12px; border-radius: 50%;
        }
        .gm-dot-red   { background: #ff5f57; }
        .gm-dot-yellow{ background: #ffbd2e; }
        .gm-dot-green { background: #28c840; }
        .gm-title-text {
          flex: 1;
          text-align: center;
          font-size: 12px;
          font-weight: 500;
          color: #71717a;
          letter-spacing: 0.01em;
        }

        /* toolbar */
        .gm-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          height: 44px;
          background: #fafafa;
          border-bottom: 1px solid #e4e4e7;
          flex-shrink: 0;
        }
        .gm-btn-generate {
          display: flex; align-items: center; gap: 6px;
          padding: 0 16px;
          height: 30px;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, box-shadow 0.15s;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }
        .gm-btn-generate.active {
          animation: gm-btn-press 0.25s ease;
        }
        .gm-btn-export {
          display: flex; align-items: center; gap: 6px;
          padding: 0 14px;
          height: 30px;
          background: transparent;
          color: #3f3f46;
          border: 1px solid #e4e4e7;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s, color 0.2s;
          white-space: nowrap;
        }
        .gm-btn-export.glow {
          border-color: #2563eb;
          color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.15);
        }
        .gm-toolbar-spacer { flex: 1; }
        .gm-status-bar-text {
          font-size: 11px;
          color: #a1a1aa;
          font-family: ui-monospace, monospace;
        }

        /* body */
        .gm-body {
          flex: 1;
          display: flex;
          overflow: hidden;
          min-height: 0;
        }

        /* sidebar */
        .gm-sidebar {
          width: 248px;
          flex-shrink: 0;
          border-right: 1px solid #e4e4e7;
          display: flex;
          flex-direction: column;
          background: #fafafa;
          overflow: hidden;
        }
        .gm-sidebar-header {
          padding: 10px 12px 8px;
          font-size: 11px;
          font-weight: 600;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border-bottom: 1px solid #e4e4e7;
        }
        .gm-file-list { flex: 1; overflow-y: auto; padding: 4px 0; }
        .gm-file-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 10px;
          cursor: pointer;
          border-radius: 6px;
          margin: 1px 4px;
          transition: background 0.12s;
        }
        .gm-file-row:hover { background: #f4f4f5; }
        .gm-file-row.selected { background: #eff6ff; }
        .gm-thumb {
          width: 36px;
          height: 36px;
          border-radius: 5px;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .gm-thumb-inner {
          width: 100%; height: 100%;
        }
        .gm-file-info { flex: 1; min-width: 0; }
        .gm-file-name {
          font-size: 12px;
          font-weight: 500;
          color: #09090b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .gm-file-ext {
          font-size: 10px;
          color: #a1a1aa;
          font-family: ui-monospace, monospace;
          margin-top: 1px;
        }
        .gm-badge {
          flex-shrink: 0;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 0.375rem;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .gm-badge-pending {
          background: #f4f4f5;
          color: #71717a;
        }
        .gm-badge-generating {
          background: #eff6ff;
          color: #2563eb;
          animation: gm-pulse-ring 1.4s ease-out infinite;
        }
        .gm-badge-done {
          background: #dcfce7;
          color: #16a34a;
          animation: gm-status-in 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }

        /* spinner dot */
        .gm-spinner {
          width: 10px; height: 10px;
          border: 1.5px solid rgba(37,99,235,0.2);
          border-top-color: #2563eb;
          border-radius: 50%;
          display: inline-block;
          animation: gm-spin 0.7s linear infinite;
          margin-right: 3px;
          vertical-align: middle;
        }

        /* right panel */
        .gm-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 16px 20px 12px;
          gap: 14px;
          overflow-y: auto;
          min-width: 0;
        }
        .gm-panel-heading {
          font-size: 13px;
          font-weight: 600;
          color: #3f3f46;
          margin-bottom: 2px;
        }
        .gm-field-block { display: flex; flex-direction: column; gap: 4px; }
        .gm-field-label {
          font-size: 10px;
          font-weight: 600;
          color: #a1a1aa;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-family: ui-monospace, monospace;
        }
        .gm-field-value {
          font-size: 13px;
          color: #09090b;
          line-height: 1.5;
          padding: 7px 10px;
          background: #fafafa;
          border: 1px solid #e4e4e7;
          border-radius: 6px;
          min-height: 34px;
          transition: opacity 0.4s ease;
        }
        .gm-field-value.entering {
          animation: gm-field-in 0.5s ease both;
        }
        .gm-field-value.empty {
          background: #f4f4f5;
          border-color: #e4e4e7;
        }
        .gm-field-desc {
          font-size: 12px;
          color: #3f3f46;
          line-height: 1.55;
          padding: 8px 10px;
          background: #fafafa;
          border: 1px solid #e4e4e7;
          border-radius: 6px;
          min-height: 52px;
          transition: opacity 0.4s ease;
        }
        .gm-field-desc.entering {
          animation: gm-field-in 0.5s ease both;
        }
        .gm-kw-section { display: flex; flex-direction: column; gap: 6px; }
        .gm-kw-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          align-content: flex-start;
        }
        .gm-chip {
          display: inline-flex;
          align-items: center;
          padding: 3px 9px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid #bfdbfe;
          animation: gm-chip-in 0.25s cubic-bezier(0.16,1,0.3,1) both;
          white-space: nowrap;
        }
        .gm-kw-more {
          font-size: 11px;
          color: #a1a1aa;
          align-self: center;
          font-style: italic;
        }

        /* empty state placeholder lines */
        .gm-placeholder-line {
          height: 10px;
          background: #e4e4e7;
          border-radius: 4px;
          margin: 3px 0;
        }

        /* toast */
        .gm-toast-wrapper {
          position: absolute;
          bottom: 16px;
          right: 16px;
          z-index: 10;
          pointer-events: none;
        }
        .gm-toast {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #09090b;
          color: #fafafa;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
          white-space: nowrap;
        }
        .gm-toast.entering {
          animation: gm-toast-in 0.3s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .gm-toast.leaving {
          animation: gm-toast-out 0.4s ease forwards;
        }
        .gm-toast-icon {
          width: 16px; height: 16px;
          background: #22c55e;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }

        /* scrollbar for sidebar */
        .gm-file-list::-webkit-scrollbar { width: 4px; }
        .gm-file-list::-webkit-scrollbar-track { background: transparent; }
        .gm-file-list::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 2px; }

        /* panel scrollbar */
        .gm-panel::-webkit-scrollbar { width: 4px; }
        .gm-panel::-webkit-scrollbar-track { background: transparent; }
        .gm-panel::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 2px; }
      `}</style>

      <div className="gm-stage" aria-label="GenMeta animated demo">
        {/* ── window ── */}
        <div className={`gm-window ${appVisible ? "visible" : "hidden-init"}`}>

          {/* title bar */}
          <div className="gm-titlebar">
            <div className="gm-traffic">
              <div className="gm-dot gm-dot-red" />
              <div className="gm-dot gm-dot-yellow" />
              <div className="gm-dot gm-dot-green" />
            </div>
            <span className="gm-title-text">GenMeta 2.1.4</span>
            {/* spacer to balance traffic lights */}
            <div style={{ width: 42 }} />
          </div>

          {/* toolbar */}
          <div className="gm-toolbar">
            <button
              className={`gm-btn-generate${btnActive ? " active" : ""}`}
              tabIndex={-1}
              aria-hidden
            >
              {/* sparkle icon */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l1.5 4.5H18l-3.75 2.75 1.5 4.5L12 11l-3.75 2.75 1.5-4.5L6 6.5h4.5z"/>
              </svg>
              Generate All
            </button>

            <button
              className={`gm-btn-export${exportGlow ? " glow" : ""}`}
              tabIndex={-1}
              aria-hidden
            >
              {/* download icon */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </button>

            <div className="gm-toolbar-spacer" />

            <span className="gm-status-bar-text">
              {files.filter(f => f.status === "done").length} of {files.length} processed
            </span>
          </div>

          {/* body */}
          <div className="gm-body">

            {/* ── sidebar ── */}
            <aside className="gm-sidebar">
              <div className="gm-sidebar-header">Files</div>
              <div className="gm-file-list">
                {files.map(file => (
                  <div
                    key={file.id}
                    className={`gm-file-row${file.id === selectedId ? " selected" : ""}`}
                    onClick={() => setSelectedId(file.id)}
                    data-file={file.id}
                  >
                    {/* thumbnail */}
                    <div className="gm-thumb">
                      <div
                        className="gm-thumb-inner"
                        style={{
                          background: `linear-gradient(135deg, ${file.color}80 0%, ${file.color} 100%)`,
                        }}
                      />
                    </div>

                    <div className="gm-file-info">
                      <div className="gm-file-name">{file.name}</div>
                      <div className="gm-file-ext">.{file.ext}</div>
                    </div>

                    {/* status badge */}
                    {file.status === "pending" && (
                      <span className="gm-badge gm-badge-pending">Pending</span>
                    )}
                    {file.status === "generating" && (
                      <span className="gm-badge gm-badge-generating">
                        <span className="gm-spinner" />
                        Gen…
                      </span>
                    )}
                    {file.status === "done" && (
                      <span className="gm-badge gm-badge-done">Done</span>
                    )}
                  </div>
                ))}
              </div>
            </aside>

            {/* ── right panel ── */}
            <div className="gm-panel" data-panel="metadata">
              <div className="gm-panel-heading">
                {selectedFile
                  ? `${selectedFile.name}.${selectedFile.ext}`
                  : "Select a file"}
              </div>

              {/* Title */}
              <div className="gm-field-block">
                <span className="gm-field-label">Title</span>
                {meta.titleVisible ? (
                  <div className="gm-field-value entering">
                    {meta.title || currentMeta.title}
                  </div>
                ) : (
                  <div className="gm-field-value empty">
                    <div className="gm-placeholder-line" style={{ width: "80%" }} />
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="gm-field-block">
                <span className="gm-field-label">Description</span>
                {meta.descVisible ? (
                  <div className="gm-field-desc entering">
                    {meta.description}
                  </div>
                ) : (
                  <div className="gm-field-desc empty">
                    <div className="gm-placeholder-line" style={{ width: "95%" }} />
                    <div className="gm-placeholder-line" style={{ width: "75%" }} />
                  </div>
                )}
              </div>

              {/* Keywords */}
              <div className="gm-kw-section">
                <span className="gm-field-label">Keywords</span>
                <div className="gm-kw-chips">
                  {meta.keywords.map((kw, i) => (
                    <span key={`${kw}-${i}`} className="gm-chip">
                      {kw}
                    </span>
                  ))}
                  {meta.keywords.length > 0 && (
                    <span className="gm-kw-more">
                      +{isMeta2 ? 28 : 35} more
                    </span>
                  )}
                  {meta.keywords.length === 0 && (
                    <>
                      <div className="gm-placeholder-line" style={{ width: 56, height: 22, borderRadius: 999 }} />
                      <div className="gm-placeholder-line" style={{ width: 48, height: 22, borderRadius: 999 }} />
                      <div className="gm-placeholder-line" style={{ width: 64, height: 22, borderRadius: 999 }} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── toast ── */}
        {toastVisible && (
          <div className="gm-toast-wrapper">
            <div className={`gm-toast ${toastFading ? "leaving" : "entering"}`}>
              <div className="gm-toast-icon">
                {/* checkmark */}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              adobe-stock.csv exported
            </div>
          </div>
        )}
      </div>
    </>
  );
}
