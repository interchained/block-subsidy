/* =============================================================================
   sections2.jsx — EcosystemDiagram, UseCases, WhyNow, PitchSection,
   ClosingVision, Footer.
   ============================================================================= */
const { useState: useState2, useEffect: useEffect2, useRef: useRef2 } = React;
const { Section: S2, GlassCard: Card2, Icon: Ic2, Reveal: R2 } = window.Shared;

function jump2(id) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }

/* ---------------- Ecosystem: circular diagram ---------------- */
function CircularEcosystem({ data }) {
  const [selected, setSelected] = useState2(null);
  const parts = data.participants;
  const n = parts.length;
  const R = 40; // radius in viewBox %
  const cx = 50, cy = 50;
  const positions = parts.map((p, i) => {
    const ang = (-90 + (360 / n) * i) * (Math.PI / 180);
    return { ...p, x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) };
  });
  const active = selected != null ? parts.find((p) => p.id === selected) : null;
  const activeIndex = selected != null ? positions.findIndex((p) => p.id === selected) : -1;

  return (
    <div className="eco-circle-wrap">
      <div className="eco-circle">
        <window.Visuals.EcoFlowCanvas count={n} activeIndex={activeIndex} reduced={window.Shared.useReducedMotion()} />

        {/* center node */}
        <div className="eco-center">
          <span className="eco-center-logos">
            <img src={window.DATA.siteConfig.logos.aias} alt="" />
            <img src={window.DATA.siteConfig.logos.itc} alt="" />
          </span>
          <span className="eco-center-label">{data.centerLabel}</span>
        </div>

        {/* participant nodes (HTML so hover/tap + a11y are easy) */}
        {positions.map((p) => (
          <button
            key={p.id}
            className={`eco-node ${selected === p.id ? "is-active" : ""}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            onMouseEnter={() => setSelected(p.id)}
            onFocus={() => setSelected(p.id)}
            onClick={() => setSelected((s) => (s === p.id ? null : p.id))}
            aria-pressed={selected === p.id}
            aria-label={p.name}
          >
            <span className="eco-node-icon"><Ic2 name={p.icon} size={18} /></span>
            <span className="eco-node-name">{p.name}</span>
          </button>
        ))}
      </div>

      {/* reveal panel */}
      <div className="eco-detail" aria-live="polite">
        {active ? (
          <Card2 className="eco-detail-card" glow>
            <div className="eco-detail-head">
              <span className="feature-icon"><Ic2 name={active.icon} size={20} /></span>
              <h3 className="card-title sm">{active.name}</h3>
            </div>
            <p className="body sm">{active.role}</p>
            <ul className="eco-benefits">
              {active.benefits.map((b) => (
                <li key={b}><span className="tick"></span>{b}</li>
              ))}
            </ul>
          </Card2>
        ) : (
          <Card2 className="eco-detail-card empty">
            <p className="body sm">Hover or tap a participant to see its role and benefits.</p>
            <div className="eco-legend">
              <span><span className="dot dot-cyan"></span>AiAS flow</span>
              <span><span className="dot dot-gold"></span>ITC flow</span>
            </div>
          </Card2>
        )}
      </div>
    </div>
  );
}

/* value loop — an ITC token orbits the closed loop, lighting each stage */
function ValueLoop({ items, title }) {
  const [lit, setLit] = useState2(-1);
  const reduced = window.Shared.useReducedMotion();
  return (
    <div className="loop">
      <h3 className="sub-h">{title}</h3>
      <div className="loop-ring">
        {items.map((it, i) => {
          const ang = (-90 + (360 / items.length) * i) * (Math.PI / 180);
          const r = 42;
          const x = 50 + r * Math.cos(ang);
          const y = 50 + r * Math.sin(ang);
          return (
            <div key={it} className={`loop-node ${lit === i ? "is-lit" : ""}`} style={{ left: `${x}%`, top: `${y}%` }}>
              <span className="loop-idx">{i + 1}</span>
              <span className="loop-text">{it}</span>
            </div>
          );
        })}
        <window.Visuals.LoopOrbitCanvas count={items.length} onActive={setLit} reduced={reduced} />
        <span className="loop-center">
          <img className="loop-center-logo" src={window.DATA.siteConfig.logos.aias} alt="" />
          <img className="loop-center-logo" src={window.DATA.siteConfig.logos.itc} alt="" />
        </span>
      </div>
      <p className="loop-caption caption">A loop, not a funnel — value returns to the network and compounds.</p>
    </div>
  );
}

/* ecosystem map table */
function EcoMap({ layers, title }) {
  return (
    <div className="eco-map">
      <h3 className="sub-h">{title}</h3>
      <div className="eco-map-grid">
        <div className="eco-map-row head">
          <span>Layer</span><span>Participants</span><span>Value Created</span>
        </div>
        {layers.map((l) => (
          <R2 key={l.id} className="eco-map-row">
            <span className="eco-map-layer">{l.title}</span>
            <span className="eco-map-parts">{l.participants.map((p) => <span key={p} className="chip sm">{p}</span>)}</span>
            <span className="body sm">{l.value}</span>
          </R2>
        ))}
      </div>
    </div>
  );
}

function EcosystemDiagram({ data }) {
  return (
    <S2 id="ecosystem" className="ecosystem">
      <div className="sec-head">
        <R2 className="eyebrow" as="span">{data.eyebrow}</R2>
        <R2 as="h2" className="h-2" delay={0.05}>{data.headline}</R2>
        <R2 as="p" className="lead" delay={0.1}>{data.copy}</R2>
      </div>

      <R2 delay={0.05}><CircularEcosystem data={data} /></R2>

      <R2 className="eco-why" delay={0.05}>
        <Card2 className="eco-why-card" glow>
          <h3 className="card-title">{data.whyTitle}</h3>
          <p className="body">{data.whyBody}</p>
        </Card2>
      </R2>

      <div className="eco-bottom">
        <R2><ValueLoop items={data.valueLoop} title={data.loopTitle} /></R2>
        <R2 delay={0.08}><EcoMap layers={data.layers} title={data.mapTitle} /></R2>
      </div>
    </S2>
  );
}

/* ---------------- UseCases carousel ---------------- */
function UseCases({ data }) {
  const [i, setI] = useState2(0);
  const startX = useRef2(null);
  const cards = data.cards;
  const go = (d) => setI((p) => (p + d + cards.length) % cards.length);

  const onDown = (e) => { startX.current = (e.touches ? e.touches[0].clientX : e.clientX); };
  const onUp = (e) => {
    if (startX.current == null) return;
    const end = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
    const dx = end - startX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    startX.current = null;
  };

  return (
    <S2 id="use-cases" className="usecases">
      <div className="sec-head">
        <R2 className="eyebrow" as="span">{data.eyebrow}</R2>
        <R2 as="h2" className="h-2" delay={0.05}>{data.headline}</R2>
      </div>

      <R2 delay={0.05}>
        <div className="carousel"
          onTouchStart={onDown} onTouchEnd={onUp}
          onMouseDown={onDown} onMouseUp={onUp}
        >
          <button className="car-arrow left" onClick={() => go(-1)} aria-label="Previous use case"><Ic2 name="ChevronLeft" size={22} /></button>
          <div className="car-viewport">
            <div className="car-track" style={{ transform: `translateX(-${i * 100}%)` }}>
              {cards.map((c, idx) => (
                <div className="car-slide" key={c.title} aria-hidden={idx !== i}>
                  <Card2 className="car-card" glow={idx === i}>
                    <span className="car-num">{String(idx + 1).padStart(2, "0")}</span>
                    <h3 className="card-title">{c.title}</h3>
                    <p className="body">{c.body}</p>
                  </Card2>
                </div>
              ))}
            </div>
          </div>
          <button className="car-arrow right" onClick={() => go(1)} aria-label="Next use case"><Ic2 name="ChevronRight" size={22} /></button>
        </div>
      </R2>

      <div className="car-dots" role="tablist" aria-label="Use cases">
        {cards.map((c, idx) => (
          <button key={c.title} className={`car-dot ${idx === i ? "is-active" : ""}`} onClick={() => setI(idx)} aria-label={`Go to ${c.title}`} aria-selected={idx === i} role="tab"></button>
        ))}
      </div>
    </S2>
  );
}

/* ---------------- WhyNow ---------------- */
function WhyNow({ data }) {
  return (
    <S2 id="why-now" className="whynow">
      <div className="sec-head">
        <R2 className="eyebrow" as="span">{data.eyebrow}</R2>
        <R2 as="h2" className="h-2" delay={0.05}>{data.headline}</R2>
      </div>

      <div className="whynow-points">
        {data.points.map((p, i) => (
          <R2 key={p.title} delay={0.04 * i}>
            <Card2 className="whynow-card">
              <h3 className="card-title sm">{p.title}</h3>
              <p className="body sm">{p.body}</p>
            </Card2>
          </R2>
        ))}
      </div>

      <R2 className="timeline" delay={0.05}>
        {data.timeline.map((t, i) => (
          <div key={t.stage} className={`tl-step ${t.now ? "is-now" : ""}`}>
            <span className="tl-dot"></span>
            {i < data.timeline.length - 1 && <span className="tl-line"></span>}
            <span className="tl-stage">{t.stage}</span>
            <span className="tl-note caption">{t.note}</span>
            {t.now && <span className="tl-badge">Now</span>}
          </div>
        ))}
      </R2>
    </S2>
  );
}

/* ---------------- Pitch ---------------- */
function PitchSection({ data }) {
  return (
    <S2 id="pitch" className="pitch">
      <div className="sec-head">
        <R2 className="eyebrow gold" as="span">{data.eyebrow}</R2>
        <R2 as="h2" className="h-2" delay={0.05}>{data.headline}</R2>
        <R2 as="p" className="lead" delay={0.1}>{data.body}</R2>
      </div>

      <div className="pitch-groups">
        {data.groups.map((g, i) => (
          <R2 key={g.title} delay={0.06 * i}>
            <Card2 className="pitch-card" accent={i === 2 ? "gold" : "cyan"} glow={i === 2}>
              <h3 className="card-title">{g.title}</h3>
              <ul className="pitch-list">
                {g.items.map((it) => (
                  <li key={it}><span className="tick"></span>{it}</li>
                ))}
              </ul>
            </Card2>
          </R2>
        ))}
      </div>
    </S2>
  );
}

/* ---------------- Closing ---------------- */
function ClosingVision({ data, summaryLine }) {
  return (
    <S2 id="closing" className="closing">
      <div className="closing-inner">
        <R2 className="eyebrow" as="span">{data.eyebrow}</R2>
        <R2 as="h2" className="h-display" delay={0.05}>{data.headline}</R2>
        <R2 as="p" className="lead" delay={0.1}>{data.body}</R2>
        <R2 delay={0.14}>
          <Card2 className="closing-summary glass" glow>
            <p className="body lg">{summaryLine}</p>
          </Card2>
        </R2>
        <R2 className="closing-ctas" delay={0.18}>
          {data.ctas.map((c) => (
            <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" className={`btn ${c.variant === "primary" ? "btn-primary" : "btn-ghost"}`}>
              {c.label}
            </a>
          ))}
        </R2>
      </div>
    </S2>
  );
}

/* ---------------- Footer ---------------- */
function Footer({ siteConfig }) {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-top">
          <button className="nav-brand" onClick={() => jump2("hero")}>
            <span className="nav-logos">
              <img className="nav-logo" src={siteConfig.logos.itc} alt="Interchained" />
              <img className="nav-logo" src={siteConfig.logos.aias} alt="AiAssist Secure" />
            </span>
            <span className="nav-brand-text">Interchained<span className="nav-brand-sub"> · AiAS</span></span>
          </button>
          <nav className="footer-links" aria-label="Footer">
            {siteConfig.links.map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
            ))}
          </nav>
        </div>
        <p className="disclaimer caption">{siteConfig.disclaimer}</p>
        <p className="footer-legal caption">© {new Date().getFullYear()} Interchained LLC. Builder-owned infrastructure.</p>
      </div>
    </footer>
  );
}

window.Sections2 = { EcosystemDiagram, UseCases, WhyNow, PitchSection, ClosingVision, Footer };
