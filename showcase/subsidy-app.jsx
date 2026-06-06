/* =============================================================================
   subsidy-app.jsx — the Block Subsidy portal: hero, the centerpiece, the four
   "truths" wired to the curve, the BTC-vs-ITC scarcity contrast, the real source,
   the eco-grants payoff, and the footer. Composes + wires Tweaks. Mounts to #root.
   Author: interchained / Mark Evans Jr.
   ============================================================================= */
const { Icon: AIcon, Reveal: ARv } = window.PGUI;
const { SubsidyCurve, ScarcityChart, SubsidyStation, BLOCKS_PER_YEAR, DOMAIN, FLOOR_H, RAMP_H, PEAK_H, fmtYears } = window.SubLab;
const ADAA = window.DAA;

const SUB_ITC = ["#22d3ee", "#34d399", "#a78bfa", "#60a5fa"];

const SUB_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#22d3ee"
}/*EDITMODE-END*/;

/* ----------------------------- top bar ----------------------------- */
function SubTop() {
  const links = [["#curve", "The curve"], ["#truths", "The truths"], ["#scarcity", "Scarcity"], ["#source", "The code"], ["#grants", "Eco-grants"]];
  return (
    <div className="sc-top">
      <a className="brand" href="#top">
        <img src="playground/assets/itc-logo.png" alt="Interchained" />
        <span><b>Block Subsidy</b> <span className="s">· DGW3-Nova</span></span>
      </a>
      <span className="spacer" />
      <nav className="sc-nav">{links.map(([h, t]) => <a key={h} href={h}>{t}</a>)}</nav>
    </div>
  );
}

/* ----------------------------- hero ----------------------------- */
function SubHero() {
  return (
    <section className="container sc-hero" id="top">
      <ARv className="eyebrow-row">
        <span className="sc-badge"><span className="dot" /> Live · runs from the real GetBlockSubsidy</span>
        <span className="byline"><AIcon name="PenTool" size={13} /> by <b>interchained</b> · Mark Evans Jr.</span>
      </ARv>
      <ARv as="h1" delay={0.05}>
        The graceful decay —<br /><span className="run">and the truths inside it.</span>
      </ARv>
      <ARv as="p" className="lede" delay={0.1}>
        Interchained's issuance isn't a slogan; it's a function. Drag through the entire life of the chain and watch the
        block reward ramp, peak, and decay toward a floor it <em>never</em> crosses. Then meet three things the code does
        that its own comment doesn't admit.
      </ARv>
      <ARv className="sc-hero-ctas" delay={0.15}>
        <a className="btn btn-itc" style={{ padding: "0.85rem 1.5rem" }} href="#curve"><AIcon name="Activity" size={17} /> Scrub the curve</a>
        <a className="btn btn-ghost" href="#truths"><AIcon name="Eye" size={17} /> Reveal the truths</a>
      </ARv>
    </section>
  );
}

/* ----------------------------- centerpiece ----------------------------- */
function CurveSection({ height, setHeight }) {
  const phase = ADAA.subsidyPhase(height);
  return (
    <section className="container sc-section" id="curve">
      <ARv className="sc-kicker" as="span"><span className="idx">01</span> · The whole life of the chain</ARv>
      <ARv as="h2" className="sc-h" delay={0.05}>One function, <span className="itc">four phases</span>, drawn true.</ARv>
      <ARv as="p" className="sc-sub" delay={0.1} style={{ marginBottom: "1.6rem" }}>
        Every block since genesis pays a reward set purely by its height. Here's the real schedule — not a sketch of it.
        Drag the curve or the slider; the readout is computed live from the ported C++.
      </ARv>
      <ARv delay={0.12}><SubsidyStation height={height} setHeight={setHeight} /></ARv>
      <ARv className="chart-wrap" delay={0.14} style={{ marginTop: "1.1rem" }}>
        <div className="chart-head">
          <span className="chart-title">Block reward vs height — ITC per block</span>
          <div className="chart-legend">
            <span className="lk"><span className="swatch" style={{ background: "#22d3ee" }} /> reward</span>
            <span className="lk"><span className="swatch" style={{ background: "#f7931a" }} /> hidden cliff</span>
            <span className="lk"><span className="swatch" style={{ background: "#34d399" }} /> floor</span>
          </div>
        </div>
        <SubsidyCurve height={height} onScrub={setHeight} />
        <div className="curve-foot">
          <b className="ramp">Ramp-up</b> 0.678→2.178 · <b className="peak">Peak</b> flat 1.5 ·
          <b className="decay"> Decay</b> exponential · <b className="floor">Floor</b> 0.10301990 forever.
          You're in <b className={phase.key}>Phase {phase.n} — {phase.label}</b>: {phase.blurb}
        </div>
      </ARv>
    </section>
  );
}

/* ----------------------------- the truths ----------------------------- */
function TruthsSection({ setHeight }) {
  const truths = [
    {
      cls: "t-lie", tag: "Truth 01 · the comment lies", icon: "FileWarning",
      title: "Ramp-up isn't 0.5 → 1.5.",
      body: <>The source comment says the reward climbs <span style={{ color: "var(--muted-text)" }}>“0.5 → 1.5”</span>. The math says otherwise: it starts at <b style={{ color: "var(--ramp)" }}>0.678</b> and climbs to <b style={{ color: "var(--ramp)" }}>2.178 ITC</b> — the single richest block the chain ever mints sits at the <em>end</em> of ramp-up.</>,
      myth: ["0.5 → 1.5", "0.678 → 2.178"], jump: RAMP_H, btn: "Jump to the richest block",
    },
    {
      cls: "t-cliff", tag: "Truth 02 · before the grace, two cliffs", icon: "TrendingDown",
      title: "The “graceful” decay has a rough entrance.",
      body: <>Only phase three is smooth. Getting there takes two abrupt drops: <b style={{ color: "var(--btc)" }}>2.178 → 1.5</b> at block 259,200, then <b style={{ color: "var(--btc)" }}>1.5 → 1.103</b> at 518,400. The curve cliffs twice before it ever glides.</>,
      myth: null, jump: RAMP_H + 1, btn: "Stand on the first cliff",
    },
    {
      cls: "t-floor", tag: "Truth 03 · it never hits zero", icon: "Anchor",
      title: "The decay lands on a permanent floor.",
      body: <>Exponential decay would head for nothing — but a hard clamp catches it at <b style={{ color: "var(--floor)" }}>0.10301990 ITC</b> around block 1.14M (~2.2 years) and holds it there <em>forever</em>. The reward is small, but it is never zero.</>,
      myth: null, jump: FLOOR_H, btn: "Drop to the floor",
    },
    {
      cls: "t-cap", tag: "Truth 04 · no 21-million cap", icon: "Infinity",
      title: "Supply has no ceiling — on purpose.",
      body: <>Because the floor is permanent, the chain mints ~<b style={{ color: "var(--itc)" }}>54,184 ITC</b> every year, forever. There is no fixed cap like Bitcoin's 21M. Scarcity here is a <em>flow</em>, not a wall — and that flow is what keeps security and grants funded.</>,
      myth: null, jump: DOMAIN, btn: "See it still minting on the floor",
    },
  ];
  return (
    <section className="container sc-section" id="truths">
      <ARv className="sc-kicker" as="span"><span className="idx">02</span> · Read the fine print</ARv>
      <ARv as="h2" className="sc-h" delay={0.05}>Four things the code does that the <span className="btc">comment won't tell you</span>.</ARv>
      <ARv as="p" className="sc-sub" delay={0.1} style={{ marginBottom: "1.8rem" }}>
        Each one jumps the curve above to the exact height it happens. Verify it yourself.
      </ARv>
      <div className="truths">
        {truths.map((t, i) => (
          <ARv key={t.cls} delay={0.05 * i}>
            <div className={"truth " + t.cls}>
              <div className="tnum"><AIcon name={t.icon} size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />{t.tag}</div>
              <h3>{t.title}</h3>
              <p>{t.body}</p>
              {t.myth && (
                <div className="myth"><span>comment:</span><span className="was">{t.myth[0]}</span><span className="arrow">→</span><span>actual:</span><span className="is">{t.myth[1]}</span></div>
              )}
              <button className="tbtn" onClick={() => { setHeight(t.jump); document.getElementById("curve")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
                <AIcon name="CornerUpRight" size={13} /> {t.btn}
              </button>
            </div>
          </ARv>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------- scarcity contrast ----------------------------- */
function ScarcitySection() {
  return (
    <section className="container sc-section" id="scarcity">
      <ARv className="sc-kicker" as="span"><span className="idx">03</span> · Two philosophies of scarcity</ARv>
      <ARv as="h2" className="sc-h" delay={0.05}><span className="btc">Bitcoin</span> heads to zero. <span className="itc">Interchained</span> heads to a floor.</ARv>
      <ARv as="p" className="sc-sub" delay={0.1} style={{ marginBottom: "1.6rem" }}>
        Bitcoin halves its reward roughly every four years until it rounds to nothing and security must live on fees alone.
        Interchained taper-decays once, then pays a permanent floor. Each line is shown as a share of its own starting
        reward over 32 years.
      </ARv>
      <ARv className="chart-wrap" delay={0.12}>
        <ScarcityChart />
        <div className="scarcity-foot">
          <span className="lk"><span className="swatch" style={{ background: "#f7931a" }} /> Bitcoin — halving staircase → 0 (capped 21M)</span>
          <span className="lk"><span className="swatch" style={{ background: "#22d3ee" }} /> Interchained — ramp/peak/decay → permanent floor (uncapped)</span>
        </div>
      </ARv>
      <div className="compare" style={{ marginTop: "1.2rem" }}>
        <ARv className="cside btc" delay={0.05}>
          <div className="chead"><span className="tag">Bitcoin</span><span className="ctitle">Fixed supply, vanishing reward</span></div>
          <p className="sc-sub" style={{ fontSize: "0.95rem" }}>21,000,000 coins, then issuance ends. Elegant scarcity — but the security budget eventually rests entirely on transaction fees.</p>
        </ARv>
        <ARv className="cside itc" delay={0.1}>
          <div className="chead"><span className="tag">Interchained</span><span className="ctitle">Perpetual floor, funded forever</span></div>
          <p className="sc-sub" style={{ fontSize: "0.95rem" }}>Reward decays fast, then never stops. A small, predictable, perpetual issuance keeps miners paid and eco-grants flowing without depending on fee markets.</p>
        </ARv>
      </div>
    </section>
  );
}

/* ----------------------------- the real source ----------------------------- */
function SourceSection() {
  const CODE = [
    '<span class="c-key">CAmount</span> <span class="c-fn">GetBlockSubsidy</span>(int nHeight, const Consensus::Params&amp; params)',
    '{',
    '    static const int64_t COIN = <span class="c-num">100000000</span>;',
    '    static const int64_t rampUpEnd = <span class="c-num">259200</span>;',
    '    static const int64_t peakEnd   = <span class="c-num">518400</span>;',
    '    double reward;',
    '',
    '    if (nHeight &lt;= rampUpEnd) {',
    '        <span class="c-flag">// Linear ramp-up: 0.678 to 1.5 ITC   (comment says 0.5 \u2192 1.5)</span>',
    '        double progress = (double)nHeight / rampUpEnd;',
    '        reward = <span class="c-num">0.678</span> + (<span class="c-num">1.5</span> * progress);   <span class="c-com">// actually 0.678 \u2192 2.178</span>',
    '    } else if (nHeight &lt;= peakEnd) {',
    '        reward = <span class="c-num">1.5</span>;                       <span class="c-com">// flat peak</span>',
    '    } else {',
    '        double decayRate = <span class="c-num">0.0000038405</span>;',
    '        reward = <span class="c-num">1.10301990</span> * std::exp(-decayRate * (nHeight - peakEnd));',
    '    }',
    '    <span class="c-floor">if (reward &lt; 0.10301990) reward = 0.10301990;  // permanent floor</span>',
    '    return (CAmount)(reward * COIN);',
    '}',
  ].join("\n");
  return (
    <section className="container sc-section" id="source">
      <ARv className="sc-kicker" as="span"><span className="idx">04</span> · Not mocked — ported</ARv>
      <ARv as="h2" className="sc-h" delay={0.05}>The numbers above come from <span className="itc">this</span>.</ARv>
      <ARv as="p" className="sc-sub" delay={0.1} style={{ marginBottom: "1.6rem" }}>
        The same function, line for line. The highlighted comment is the one that misstates the ramp; the highlighted
        clamp is the permanent floor.
      </ARv>
      <ARv className="src-block" delay={0.12}>
        <div className="src-head">
          <span className="dots"><i style={{ background: "#f7574f" }} /><i style={{ background: "#febc2e" }} /><i style={{ background: "#2ace42" }} /></span>
          <span className="fname">consensus/subsidy.cpp</span>
          <span className="real"><AIcon name="CheckCircle2" size={13} /> running live in this page</span>
        </div>
        <pre className="src-pre"><code dangerouslySetInnerHTML={{ __html: CODE }} /></pre>
      </ARv>
      <ARv delay={0.16} style={{ marginTop: "0.8rem" }}>
        <p className="caption" style={{ fontSize: "0.78rem" }}>Faithful port: the curve, phases, cliffs, floor and supply counter are all evaluated from this logic in your browser. Block-time figures assume 60-second blocks.</p>
      </ARv>
    </section>
  );
}

/* ----------------------------- eco-grants payoff ----------------------------- */
function GrantsSection() {
  const perYear = ADAA.SUBSIDY.floor * BLOCKS_PER_YEAR;
  const grants = [
    { i: "Leaf", t: "Efficiency research", d: "Lowering the energy each secured block costs." },
    { i: "Cpu", t: "CPU-fair participation", d: "Keeping mining reachable without warehouses." },
    { i: "Users", t: "Builder-owned upkeep", d: "Paying the people who run and improve the net." },
  ];
  return (
    <section className="container sc-section" id="grants">
      <ARv className="sc-kicker" as="span"><span className="idx">05</span> · Why the floor matters</ARv>
      <ARv as="h2" className="sc-h" delay={0.05}>A floor that <span style={{ color: "var(--floor)" }}>funds the future</span>.</ARv>
      <ARv className="eco" delay={0.1} style={{ marginTop: "1.4rem" }}>
        <div className="eco-grid">
          <div>
            <p className="sc-sub" style={{ maxWidth: "54ch" }}>
              The permanent floor isn't leftover math — it's the budget line. A predictable
              <b style={{ color: "var(--floor)" }}> ~{Math.round(perYear).toLocaleString()} ITC/year</b>, forever, is what lets
              Interchained fund <b style={{ color: "var(--floor)" }}>eco-grants</b> and security long after a capped chain's
              issuance would have run dry. Decay with a floor is a choice to stay solvent in perpetuity.
            </p>
            <div style={{ display: "flex", gap: "clamp(1.4rem,4vw,2.6rem)", marginTop: "1.8rem", flexWrap: "wrap" }}>
              <div className="eco-stat"><span className="n">0.10301990</span><span className="d">ITC per block,<br />guaranteed forever</span></div>
              <div className="eco-stat"><span className="n">∞</span><span className="d">no hard cap —<br />perpetual security budget</span></div>
            </div>
          </div>
          <div className="eco-grants">
            {grants.map((g) => (
              <div className="grant-pill" key={g.t}>
                <span className="gi"><AIcon name={g.i} size={18} /></span>
                <span><div className="gt">{g.t}</div><div className="gd">{g.d}</div></span>
              </div>
            ))}
          </div>
        </div>
      </ARv>

      <div className="sc-cta-band">
        <ARv as="h2">Decay, with a promise to <span className="itc">never stop</span>.</ARv>
        <ARv className="ctas" delay={0.08}>
          <a className="btn btn-itc" style={{ padding: "0.9rem 1.6rem" }} href="https://daa.interchained.org" target="_blank" rel="noreferrer"><AIcon name="Activity" size={17} /> See difficulty react live</a>
          <a className="btn btn-ghost" href="https://labs.interchained.org" target="_blank" rel="noreferrer"><AIcon name="Pickaxe" size={17} /> Learn about mining</a>
        </ARv>
      </div>
    </section>
  );
}

function SubFooter() {
  return (
    <footer className="sc-footer">
      <div className="container">
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.4rem" }}>
          <img src="playground/assets/itc-logo.png" alt="" style={{ width: 28, height: 28, borderRadius: "50%" }} />
          <strong style={{ color: "var(--soft-white)", fontFamily: "var(--font-display)" }}>Interchained · Block Subsidy</strong>
        </div>
        <p style={{ maxWidth: "66ch" }}>
          An interactive, honest reading of Interchained's real <code>GetBlockSubsidy</code> issuance schedule — ramp,
          peak, graceful decay, and the permanent floor that funds eco-grants forever. Everything is computed client-side
          from a faithful port. Bitcoin is referenced factually for comparison. Not investment advice.
        </p>
        <div className="links">
          <span className="byline">Authored by <b>interchained</b> · Mark Evans Jr.</span>
          <a href="https://daa.interchained.org" target="_blank" rel="noreferrer">Difficulty simulator ↗</a>
          <a href="https://labs.interchained.org" target="_blank" rel="noreferrer">Playground ↗</a>
          <a href="https://pitchdeck.interchained.org" target="_blank" rel="noreferrer">Pitch deck ↗</a>
        </div>
      </div>
    </footer>
  );
}

/* ----------------------------- compose ----------------------------- */
function SubApp() {
  const [t, setTweak] = window.useTweaks(SUB_DEFAULTS);
  const [height, setHeight] = React.useState(Math.round(0.12 * DOMAIN));

  React.useEffect(() => { document.documentElement.style.setProperty("--itc", t.accent); }, [t.accent]);

  React.useEffect(() => {
    const rail = document.getElementById("sub-rail");
    const ids = ["curve", "truths", "scarcity", "source", "grants"];
    const navLinks = Array.from(document.querySelectorAll(".sc-nav a"));
    let ticking = false;
    const onScroll = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        if (rail) rail.style.setProperty("--sc-progress", (max > 0 ? Math.min(1, doc.scrollTop / max) : 0).toFixed(4));
        const mid = window.innerHeight * 0.4;
        let active = ids[0];
        for (const id of ids) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= mid) active = id; }
        navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + active));
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="sc-rail" id="sub-rail" />
      <SubTop />
      <SubHero />
      <CurveSection height={height} setHeight={setHeight} />
      <TruthsSection setHeight={setHeight} />
      <ScarcitySection />
      <SourceSection />
      <GrantsSection />
      <SubFooter />
      <SubTweaksPanel t={t} setTweak={setTweak} />
    </>
  );
}

function SubTweaksPanel({ t, setTweak }) {
  const { TweaksPanel, TweakSection, TweakColor } = window;
  if (!TweaksPanel) return null;
  return (
    <TweaksPanel>
      <TweakSection label="Accent" />
      <TweakColor label="Interchained" value={t.accent} options={SUB_ITC} onChange={(v) => setTweak("accent", v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<SubApp />);
