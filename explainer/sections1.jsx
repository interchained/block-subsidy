/* =============================================================================
   sections1.jsx — Hero, ProblemSection, AiASSolution, ITCLayer.
   ============================================================================= */
const { useState: useState1, useEffect: useEffect1, useRef: useRef1 } = React;
const { Section: S1, GlassCard: Card1, Icon: Ic1, Reveal: R1, useReducedMotion: useRM1, LogoBadge: LB1 } = window.Shared;
const { NetworkGraph } = window.Chrome;

function jump1(id) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }

/* ---------------- Hero ---------------- */
function Hero({ data, summaryLine }) {
  const reduced = useRM1();
  const logos = window.DATA.siteConfig.logos;
  return (
    <S1 id="hero" className="hero">
      <div className="hero-grid">
        <div className="hero-copy">
          <R1 className="hero-lockup" delay={0}>
            <span className="lockup-item"><img src={logos.aias} alt="AiAssist Secure" /> AiAssist Secure</span>
            <span className="lockup-x">×</span>
            <span className="lockup-item"><img src={logos.itc} alt="Interchained" /> Interchained</span>
          </R1>
          <R1 as="h1" className="h-display hero-headline" delay={0.05}>{data.headline}</R1>
          <R1 as="p" className="lead hero-sub" delay={0.12}>{data.subheadline}</R1>
          <R1 className="hero-tagline chip" delay={0.18}>
            <span className="dot dot-cyan"></span>{data.tagline}
          </R1>
          <R1 className="hero-ctas" delay={0.24}>
            {data.ctas.map((c) => (
              <button key={c.label} className={`btn ${c.variant === "primary" ? "btn-primary" : "btn-ghost"}`} onClick={() => jump1(c.target)}>
                {c.label}
                {c.variant === "primary" && <Ic1 name="ArrowRight" size={18} />}
              </button>
            ))}
          </R1>
        </div>
        <div className="hero-visual">
          <window.Visuals.NetworkGlobe reduced={reduced} />
        </div>
      </div>
      <R1 as="p" className="hero-summary caption" delay={0.3}>{summaryLine}</R1>
    </S1>
  );
}

/* ---------------- Problem ---------------- */
function StackToggle({ toggle }) {
  const [mode, setMode] = useState1("current");
  const reducedStack = useRM1();
  return (
    <div className="stack">
      <div className="stack-switch" role="tablist" aria-label="Compare stacks">
        {[toggle.current, toggle.fixed].map((t) => (
          <button
            key={t.id} role="tab" aria-selected={mode === t.id}
            className={`stack-tab ${mode === t.id ? "is-active" : ""}`}
            onClick={() => setMode(t.id)}
          >
            {t.label}
          </button>
        ))}
        <span className={`stack-thumb ${mode === "fixed" ? "right" : "left"}`}></span>
      </div>

      <div className={`stack-stage ${mode}`}>
        <window.Visuals.StackDiagram mode={mode} reduced={reducedStack} />
        <p className="stack-caption caption">
          {mode === "current"
            ? "Scattered tools, broken connectors, rising costs, data leaking to third-party clouds."
            : "One connected mesh — owned, private, coordinated. Data flows to infrastructure you control."}
        </p>
      </div>
    </div>
  );
}

function ProblemSection({ data }) {
  return (
    <S1 id="problem" className="problem">
      <div className="sec-head">
        <R1 className="eyebrow red" as="span">{data.eyebrow}</R1>
        <R1 as="h2" className="h-2" delay={0.05}>{data.headline}</R1>
        <R1 as="p" className="lead" delay={0.1}>{data.intro}</R1>
      </div>

      <div className="problem-layout">
        <div className="problem-cards">
          {data.cards.map((c, i) => (
            <R1 key={c.title} delay={0.05 * i}>
              <Card1 className="problem-card">
                <span className="problem-num">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="card-title">{c.title}</h3>
                <p className="body">{c.body}</p>
              </Card1>
            </R1>
          ))}
        </div>
        <R1 delay={0.1} className="problem-aside">
          <Card1 className="stack-wrap">
            <StackToggle toggle={data.toggle} />
          </Card1>
        </R1>
      </div>
    </S1>
  );
}

/* ---------------- AiAS ---------------- */
function Dashboard({ modules, inView }) {
  return (
    <div className={`dash ${inView ? "in" : ""}`} aria-hidden="true">
      <div className="dash-bar">
        <span className="dash-dot"></span><span className="dash-dot"></span><span className="dash-dot"></span>
        <span className="dash-title"><img className="dash-logo" src={window.DATA.siteConfig.logos.aias} alt="" /> AiAssist Secure</span>
      </div>
      <div className="dash-grid">
        {modules.map((m, i) => (
          <div key={m} className="dash-mod" style={{ transitionDelay: `${0.06 * i}s` }}>
            <span className="dash-mod-line w70"></span>
            <span className="dash-mod-name">{m}</span>
            <span className="dash-mod-line w40"></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiASSolution({ data }) {
  const ref = useRef1(null);
  const [inView, setInView] = useState1(false);
  useEffect1(() => {
    const el = ref.current; if (!el) return;
    let done = false;
    const reveal = () => { if (!done) { done = true; setInView(true); cleanup(); } };
    const check = () => { const r = el.getBoundingClientRect(); if (r.top < window.innerHeight * 0.9 && r.bottom > 0) { reveal(); return true; } return false; };
    const onScroll = () => check();
    let io = null;
    const cleanup = () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (io) io.disconnect(); };
    if (check()) return cleanup;
    if (typeof IntersectionObserver !== "undefined") { io = new IntersectionObserver(([e]) => { if (e.isIntersecting) reveal(); }, { threshold: 0.3 }); io.observe(el); }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return cleanup;
  }, []);
  return (
    <S1 id="aias" className="aias">
      <div className="sec-head">
        <R1 className="sec-badge-wrap"><LB1 src={window.DATA.siteConfig.logos.aias} alt="AiAssist Secure" /></R1>
        <R1 className="eyebrow" as="span">{data.eyebrow}</R1>
        <R1 as="h2" className="h-2" delay={0.05}>{data.headline}</R1>
        <R1 as="p" className="lead" delay={0.1}>{data.lead}</R1>
      </div>

      <div className="aias-layout">
        <div className="aias-features">
          {data.features.map((f, i) => (
            <R1 key={f.title} delay={0.04 * i}>
              <Card1 className="feature-card">
                <span className="feature-icon"><Ic1 name={f.icon} size={20} /></span>
                <div>
                  <h3 className="card-title sm">{f.title}</h3>
                  <p className="body sm">{f.body}</p>
                </div>
              </Card1>
            </R1>
          ))}
        </div>
        <div className="aias-visual" ref={ref}>
          <Dashboard modules={data.dashboardModules} inView={inView} />
        </div>
      </div>
    </S1>
  );
}

/* ---------------- ITC ---------------- */
function ITCLayer({ data, disclaimer }) {
  const reducedItc = useRM1();
  return (
    <S1 id="itc" className="itc">
      <div className="sec-head">
        <R1 className="sec-badge-wrap"><LB1 src={window.DATA.siteConfig.logos.itc} alt="Interchained" accent="gold" /></R1>
        <R1 className="eyebrow gold" as="span">{data.eyebrow}</R1>
        <R1 as="h2" className="h-2" delay={0.05}>{data.headline}</R1>
        <R1 as="p" className="lead" delay={0.1}>{data.lead}</R1>
      </div>

      <div className="itc-cards">
        {data.features.map((f, i) => (
          <R1 key={f.title} delay={0.05 * i}>
            <Card1 className="itc-card" accent="gold" glow={i === 1}>
              <span className="feature-icon gold"><Ic1 name={f.icon} size={20} /></span>
              <h3 className="card-title sm">{f.title}</h3>
              <p className="body sm">{f.body}</p>
            </Card1>
          </R1>
        ))}
      </div>

      <R1 delay={0.1} className="itc-rail-wrap">
        <window.Visuals.BlockchainRail nodes={data.railNodes} reduced={reducedItc} />
      </R1>

      <R1 as="p" className="disclaimer caption" delay={0.05}>{disclaimer}</R1>
    </S1>
  );
}

window.Sections1 = { Hero, ProblemSection, AiASSolution, ITCLayer };
