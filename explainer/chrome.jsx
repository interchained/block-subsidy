/* =============================================================================
   chrome.jsx — Navigation, ProgressIndicator, PitchModeControls, NetworkGraph.
   ============================================================================= */
const { useState, useEffect } = React;
const { Icon: NavIcon } = window.Shared;

function smoothTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------------- Navigation ---------------- */
function Navigation({ sections, active, onJump, onPitch, hidden }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  if (hidden) return null;

  const go = (id) => { onJump(id); setOpen(false); };

  return (
    <header className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
      <div className="nav-inner container">
        <button className="nav-brand" onClick={() => go("hero")} aria-label="Go to intro">
          <span className="nav-logos">
            <img className="nav-logo" src={window.DATA.siteConfig.logos.itc} alt="Interchained" />
            <img className="nav-logo" src={window.DATA.siteConfig.logos.aias} alt="AiAssist Secure" />
          </span>
          <span className="nav-brand-text">Interchained<span className="nav-brand-sub"> · AiAS</span></span>
        </button>

        <nav className="nav-links" aria-label="Primary">
          {sections.slice(1, -1).map((s) => (
            <button key={s.id} className={`nav-link ${active === s.id ? "is-active" : ""}`} onClick={() => go(s.id)}>
              {s.label}
            </button>
          ))}
        </nav>

        <div className="nav-actions">
          <button className="btn btn-ghost nav-pitch" onClick={onPitch}>
            <NavIcon name="Play" size={16} /> Pitch Mode
          </button>
          <button className="nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
            <NavIcon name={open ? "X" : "Menu"} size={22} />
          </button>
        </div>
      </div>

      {open && (
        <div className="nav-drawer glass">
          {sections.map((s) => (
            <button key={s.id} className={`nav-drawer-link ${active === s.id ? "is-active" : ""}`} onClick={() => go(s.id)}>
              {s.label}
            </button>
          ))}
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => { onPitch(); setOpen(false); }}>
            <NavIcon name="Play" size={16} /> Enter Pitch Mode
          </button>
        </div>
      )}
    </header>
  );
}

/* ---------------- ProgressIndicator ---------------- */
function ProgressIndicator({ sections, active, onJump, hidden }) {
  if (hidden) return null;
  const activeIdx = sections.findIndex((s) => s.id === active);
  const pct = ((activeIdx + 1) / sections.length) * 100;
  return (
    <>
      {/* desktop vertical rail */}
      <div className="progress-rail" aria-hidden="false">
        {sections.map((s, i) => (
          <button
            key={s.id}
            className={`progress-dot ${active === s.id ? "is-active" : ""} ${i <= activeIdx ? "is-past" : ""}`}
            onClick={() => onJump(s.id)}
            aria-label={`Go to ${s.progressLabel}`}
          >
            <span className="progress-tick"></span>
            <span className="progress-label">{s.progressLabel}</span>
          </button>
        ))}
      </div>
      {/* mobile top bar */}
      <div className="progress-bar-wrap" aria-hidden="true">
        <div className="progress-bar" style={{ width: `${pct}%` }}></div>
      </div>
    </>
  );
}

/* ---------------- PitchModeControls ---------------- */
function PitchModeControls({ sections, index, onPrev, onNext, onExit }) {
  const s = sections[index];
  const atStart = index === 0;
  const atEnd = index === sections.length - 1;
  return (
    <div className="pitch-controls" role="toolbar" aria-label="Pitch mode controls">
      <button className="pitch-nav prev" onClick={onPrev} disabled={atStart} aria-label="Previous section">
        <NavIcon name="ChevronLeft" size={20} />
        <span className="pitch-nav-label">Prev</span>
      </button>
      <div className="pitch-meta">
        <span className="pitch-count">{String(index + 1).padStart(2, "0")} / {String(sections.length).padStart(2, "0")}</span>
        <span className="pitch-name">{s.progressLabel}</span>
      </div>
      <button className="pitch-nav next" onClick={onNext} disabled={atEnd} aria-label="Next section">
        <span className="pitch-nav-label">Next</span>
        <NavIcon name="ChevronRight" size={20} />
      </button>
      <button className="pitch-exit" onClick={onExit} aria-label="Exit pitch mode">
        <NavIcon name="X" size={18} />
        <span className="pitch-nav-label">Exit</span>
      </button>
    </div>
  );
}

/* ---------------- NetworkGraph (hero) ---------------- */
/* Scattered nodes animate into a connected mesh on mount. */
function NetworkGraph({ reduced }) {
  const [linked, setLinked] = useState(reduced);
  useEffect(() => {
    if (reduced) { setLinked(true); return; }
    const t = setTimeout(() => setLinked(true), 350);
    return () => clearTimeout(t);
  }, [reduced]);

  // node target positions (connected mesh) + scattered start
  const nodes = [
    { id: 0, x: 50, y: 50, r: 7, core: true },
    { id: 1, x: 24, y: 28, sx: 12, sy: 14 },
    { id: 2, x: 76, y: 26, sx: 88, sy: 12 },
    { id: 3, x: 80, y: 62, sx: 90, sy: 84 },
    { id: 4, x: 58, y: 80, sx: 66, sy: 90 },
    { id: 5, x: 26, y: 70, sx: 12, sy: 86 },
    { id: 6, x: 18, y: 50, sx: 10, sy: 44 },
    { id: 7, x: 68, y: 42, sx: 82, sy: 40 },
    { id: 8, x: 40, y: 36, sx: 32, sy: 16 },
  ];
  const edges = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[1,8],[8,7],[7,2],[7,3],[3,4],[4,5],[5,6],[6,1]];

  return (
    <div className="netgraph" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <g className="netgraph-edges" style={{ opacity: linked ? 1 : 0 }}>
          {edges.map(([a, b], i) => {
            const na = nodes[a], nb = nodes[b];
            return (
              <line
                key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                className="netedge"
                style={{ transitionDelay: `${0.2 + i * 0.03}s` }}
              />
            );
          })}
        </g>
        <g className="netgraph-nodes">
          {nodes.map((n) => {
            const cx = linked ? n.x : (n.sx ?? n.x);
            const cy = linked ? n.y : (n.sy ?? n.y);
            return (
              <g key={n.id} style={{ transform: `translate(${cx}px, ${cy}px)`, transition: "transform 0.9s cubic-bezier(0.22,1,0.36,1)" }}>
                {n.core && <circle r="11" className="netcore-halo anim-loop pulse" />}
                <circle r={n.r || 3.4} className={n.core ? "netcore" : "netnode"} />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

window.Chrome = { Navigation, ProgressIndicator, PitchModeControls, NetworkGraph, smoothTo };
