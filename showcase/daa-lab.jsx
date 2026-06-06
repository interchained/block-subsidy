/* =============================================================================
   daa-lab.jsx — the booth centerpiece: Difficulty Adjustment, side by side.
   Drives window.DAA.makeSim (faithful DGW3-Nova vs Bitcoin's 2016-block epoch),
   on the SAME hashrate. Yank the hashrate, fire preset shocks, and watch ITC
   re-target block-by-block while Bitcoin sits frozen for thousands of blocks.
   Plus the height-based Yespower -> SHA-256 migration scrubber.
   Exposed on window.DAALab.
   ============================================================================= */
const { Icon: DIcon, Reveal: DReveal } = window.PGUI;

/* ---- local formatters ---- */
function fmtDur(s) {
  if (s == null || !isFinite(s)) return "—";
  if (s < 90) return Math.round(s) + "s";
  if (s < 5400) return (s / 60).toFixed(1) + "m";
  if (s < 172800) return (s / 3600).toFixed(1) + "h";
  return (s / 86400).toFixed(1) + "d";
}
function fmtDiff(d) {
  if (d == null || !isFinite(d)) return "—";
  if (d >= 100) return d.toFixed(0);
  if (d >= 10) return d.toFixed(1);
  return d.toFixed(2);
}
function fmtCount(n) { return Math.round(n).toLocaleString("en-US"); }

/* slider position 0..1000  <->  hashrate multiplier 0.1x .. 20x (log) */
const HR_MIN = 0.1, HR_MAX = 20;
function posToHr(p) { return HR_MIN * Math.pow(HR_MAX / HR_MIN, p / 1000); }
function hrToPos(h) { return 1000 * Math.log(h / HR_MIN) / Math.log(HR_MAX / HR_MIN); }

/* ============================ the dual difficulty chart ===================== */
function DiffChart({ slice, btcDiff, hashrate, height }) {
  const W = 720, H = height || 240, padL = 8, padR = 8, padT = 14, padB = 22;
  if (!slice || slice.length < 2) return <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" />;
  const xs = slice.map((b) => b.height);
  const x0 = xs[0], x1 = xs[xs.length - 1];
  const itcVals = slice.map((b) => 1 / b.target);
  const maxV = Math.max(btcDiff, hashrate, ...itcVals) * 1.15;
  const minV = 0;
  const xOf = (h) => padL + (W - padL - padR) * ((h - x0) / Math.max(1, x1 - x0));
  const yOf = (v) => padT + (H - padT - padB) * (1 - (v - minV) / (maxV - minV));

  const itcPath = itcVals.map((v, i) => (i ? "L" : "M") + xOf(xs[i]).toFixed(1) + " " + yOf(v).toFixed(1)).join(" ");
  const itcArea = itcPath + ` L ${xOf(x1).toFixed(1)} ${yOf(0).toFixed(1)} L ${xOf(x0).toFixed(1)} ${yOf(0).toFixed(1)} Z`;
  const yBtc = yOf(btcDiff);
  const yFair = yOf(hashrate);
  // gridlines
  const gridY = [0.25, 0.5, 0.75].map((f) => padT + (H - padT - padB) * f);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" preserveAspectRatio="none" role="img"
      aria-label="Difficulty over recent blocks: Interchained tracks the fair level, Bitcoin stays flat.">
      <defs>
        <linearGradient id="itcFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridY.map((y, i) => <line key={i} x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(148,163,184,0.10)" strokeWidth="1" />)}
      {/* fair-difficulty guide (= current hashrate) */}
      <line x1={padL} y1={yFair} x2={W - padR} y2={yFair} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 5" opacity="0.7" />
      <text x={W - padR} y={yFair - 5} textAnchor="end" fontFamily="var(--mono)" fontSize="11" fill="#94a3b8">fair difficulty for this hashrate</text>
      {/* Bitcoin: flat */}
      <line x1={padL} y1={yBtc} x2={W - padR} y2={yBtc} stroke="#f7931a" strokeWidth="2.5" strokeDasharray="7 4" />
      <text x={padL + 4} y={yBtc - 6} fontFamily="var(--mono)" fontSize="11" fill="#f7931a">Bitcoin · frozen at {fmtDiff(btcDiff)}</text>
      {/* ITC: reacting */}
      <path d={itcArea} fill="url(#itcFill)" />
      <path d={itcPath} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={xOf(x1)} cy={yOf(itcVals[itcVals.length - 1])} r="4" fill="#22d3ee" />
      <text x={padL + 4} y={H - 6} fontFamily="var(--mono)" fontSize="11" fill="#64748b">block {fmtCount(x0)}</text>
      <text x={W - padR} y={H - 6} textAnchor="end" fontFamily="var(--mono)" fontSize="11" fill="#64748b">block {fmtCount(x1)}</text>
    </svg>
  );
}

/* ============================ guided-step copy ============================== */
const STEPS = [
  { n: "01", t: "Steady state" },
  { n: "02", t: "Shock the hashrate" },
  { n: "03", t: "ITC re-targets" },
  { n: "04", t: "Bitcoin stays frozen" },
  { n: "05", t: "Cross the PoW fork" },
];
function stepDetail(step, v, shock) {
  const solve = v ? Math.round(v.itcRollingSolve) : 60;
  const btcLeft = v ? fmtCount(v.btcBlocksLeft) : "2,016";
  const btcDays = v ? fmtDur(v.btcSecondsToRetarget) : "—";
  const btcMean = v ? fmtDur(v.btcMean) : "10m";
  switch (step) {
    case 0: return <>Both chains share the same miners. <b>Interchained</b> runs DarkGravityWave3-Nova and re-computes difficulty <b>every single block</b> from a rolling 12-block window. <span className="btc-em">Bitcoin</span> only re-targets once every <span className="btc-em">2,016 blocks</span> — roughly every two weeks. At rest you can't tell them apart. Now disturb them.</>;
    case 1: return <>You changed the hashrate. The honest target block time is still <b>60s</b> for ITC and <span className="btc-em">10m</span> for Bitcoin — but the miners now solve blocks at the wrong speed. Watch what each chain does about it.</>;
    case 2: return <>ITC's block time spiked, but Nova is already pulling it back: the emergency trigger and weighted-window average move difficulty toward the new fair level <b>within ~12–24 blocks</b>. Current ITC block time: <b>{solve}s</b> (target 60s). The cyan line is climbing to meet the fair-difficulty guide.</>;
    case 3: return <>Meanwhile <span className="btc-em">Bitcoin does nothing</span>. It is mid-epoch and cannot adjust for another <span className="btc-em">{btcLeft} blocks</span> — about <span className="btc-em">{btcDays}</span> at the current pace of <span className="btc-em">{btcMean}/block</span>. And even then, one epoch can only move difficulty <span className="btc-em">4×</span>. That gap is the whole reason a custom DAA exists.</>;
    case 4: return <>Difficulty isn't ITC's only height-aware rule. The proof-of-work algorithm itself migrates by <b>block height</b>: Yespower in the bootstrap era, SHA-256 after the fork block — swapped in lockstep with no flag-day. Scrub the height below to watch it switch.</>;
    default: return null;
  }
}

/* ============================ the DAA station =============================== */
function DAAStation({ speed }) {
  const simRef = React.useRef(null);
  if (!simRef.current) {
    simRef.current = window.DAA.makeSim({ hashrate: 1 });
    for (let i = 0; i < 60; i++) simRef.current.step(); // warm to equilibrium
  }
  const [view, setView] = React.useState(() => simRef.current.view(56));
  const [running, setRunning] = React.useState(true);
  const [hr, setHr] = React.useState(1);
  const [activeStep, setActiveStep] = React.useState(0);
  const [reached, setReached] = React.useState({ 0: true });
  const [flash, setFlash] = React.useState(null);    // 'itc' | 'btc'
  const [ffActive, setFfActive] = React.useState(false);
  const ffRef = React.useRef(false);
  const shockRef = React.useRef({ at: -999, from: 1, to: 1 });
  const runningRef = React.useRef(true);
  const visRef = React.useRef(true);
  const wrapRef = React.useRef(null);
  const tickRef = React.useRef(0);

  runningRef.current = running && visRef.current && !ffActive;

  /* pause when off-screen (booth-friendly, saves CPU) */
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => { visRef.current = e.isIntersecting; }, { threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* the loop */
  React.useEffect(() => {
    let alive = true, timer = null;
    const loop = () => {
      if (!alive) return;
      if (runningRef.current) {
        simRef.current.step();
        tickRef.current++;
        setView(simRef.current.view(56));
      }
      const interval = Math.max(60, 170 / (speed || 1));
      timer = setTimeout(loop, interval);
    };
    loop();
    return () => { alive = false; clearTimeout(timer); };
  }, [speed]);

  /* auto-advance the guided steps after a shock so education tracks the action */
  React.useEffect(() => {
    if (activeStep !== 1 && activeStep !== 2) return;
    const since = tickRef.current - shockRef.current.at;
    let id;
    if (activeStep === 1 && since > 2) id = setTimeout(() => bump(2), 1600 / (speed || 1));
    else if (activeStep === 2 && since > 14) id = setTimeout(() => bump(3), 2600 / (speed || 1));
    return () => clearTimeout(id);
  }, [activeStep, view, speed]);

  const bump = (s) => { setActiveStep(s); setReached((r) => ({ ...r, [s]: true })); };

  const applyHr = (h, stepTo) => {
    h = Math.max(HR_MIN, Math.min(HR_MAX, h));
    setHr(h);
    simRef.current.setHashrate(h);
    shockRef.current = { at: tickRef.current, from: hr, to: h };
    if (stepTo) bump(stepTo);
    setFlash("itc"); setTimeout(() => setFlash(null), 720 / (speed || 1));
  };

  /* fast-forward until Bitcoin finally retargets — ANIMATED + visible, so the
     long wait is legible instead of a frozen tab. Steps the sim in small rAF
     batches, accelerating, with a live "fast-forwarding…" overlay, then lands. */
  const ffToBtcRetarget = () => {
    if (ffRef.current) return;
    const sim = simRef.current;
    const before = sim.btc.retargets;
    if (sim.view().btcBlocksLeft < 1) return; // already at boundary
    ffRef.current = true;
    setFfActive(true);
    setRunning(false);
    let batch = 12, total = 0, alive = true;
    const run = () => {
      if (!alive || !ffRef.current) return;
      for (let i = 0; i < batch; i++) {
        sim.step(); total++; tickRef.current++;
        if (sim.btc.retargets > before) {
          setView(sim.view(56));
          finish();
          return;
        }
        if (total > 200000) { setView(sim.view(56)); finish(); return; } // hard safety
      }
      batch = Math.min(600, Math.round(batch * 1.18)); // accelerate the catch-up
      setView(sim.view(56));
      requestAnimationFrame(run);
    };
    const finish = () => {
      alive = false; ffRef.current = false;
      setFfActive(false);
      bump(3);
      setFlash("btc"); setTimeout(() => setFlash(null), 720 / (speed || 1));
    };
    requestAnimationFrame(run);
  };
  const cancelFf = () => { ffRef.current = false; setFfActive(false); };

  const v = view;
  const itcOnTarget = Math.abs(v.itcRollingSolve - simRef.current.params.spacing) < simRef.current.params.spacing * 0.25;
  const btcOnTarget = Math.abs(v.btcMean - simRef.current.params.btcSpacing) < simRef.current.params.btcSpacing * 0.25;
  const itcSolveCls = itcOnTarget ? "ok" : (v.itcRollingSolve < simRef.current.params.spacing ? "warn" : "bad");
  const btcSolveCls = btcOnTarget ? "ok" : "bad";

  return (
    <div className="daa" ref={wrapRef}>
      {/* control deck */}
      <div className="deck">
        <div className="deck-row">
          <div className="hr-control">
            <div className="hr-top">
              <span className="lbl">Network hashrate (shared by both chains)</span>
              <span className="val">{hr.toFixed(hr < 1 ? 2 : 1)}<small>×</small></span>
            </div>
            <input className="hr-slider" type="range" min="0" max="1000" step="1"
              value={hrToPos(hr)}
              onChange={(e) => applyHr(posToHr(Number(e.target.value)), activeStep < 2 ? 2 : null)}
              aria-label="Network hashrate multiplier" />
            <div className="hr-scale"><span>0.1× (miners flee)</span><span>1× baseline</span><span>20× (whale)</span></div>
          </div>
        </div>
        <div className="deck-row" style={{ marginTop: "1rem", justifyContent: "space-between" }}>
          <div className="daa-btns">
            <button className="daa-btn run" onClick={() => applyHr(10, 2)}><DIcon name="Zap" size={14} /> Whale plugs in 10×</button>
            <button className="daa-btn warn" onClick={() => applyHr(0.5, 2)}><DIcon name="BatteryLow" size={14} /> Half the miners leave</button>
            <button className="daa-btn" onClick={() => applyHr(1, 0)}><DIcon name="RotateCcw" size={14} /> Reset to steady</button>
          </div>
          <div className="daa-btns">
            <button className="daa-btn" onClick={() => setRunning((r) => !r)} disabled={ffActive} style={ffActive ? { opacity: 0.5 } : null}>
              <DIcon name={running ? "Pause" : "Play"} size={14} /> {running ? "Pause" : "Play"}
            </button>
            <button className={"daa-btn primary" + (ffActive ? " ff-on" : "")}
              onClick={ffActive ? cancelFf : ffToBtcRetarget}
              title="Step the sim until Bitcoin's 2016-block epoch ends">
              <DIcon name={ffActive ? "Square" : "FastForward"} size={14} />
              {ffActive
                ? <>Fast-forwarding… {fmtDur(v.btcSecondsToRetarget)} left</>
                : <>Fast-forward to Bitcoin's retarget</>}
            </button>
          </div>
        </div>
      </div>

      {/* live readouts, side by side */}
      <div className="daa-compare">
        {/* Bitcoin */}
        <div className={"daa-card btc " + (flash === "btc" ? "flash-btc" : "")}>
          <div className="dhead">
            <span className="chip-name">Bitcoin</span>
            <span className="algo">epoch retarget · every {fmtCount(simRef.current.params.btcEpoch)} blocks</span>
          </div>
          <div className="biglbl">Difficulty</div>
          <div className="big" style={{ color: "var(--btc)" }}>{fmtDiff(v.btcDiff)}</div>
          <div className="daa-stat-row">
            <div className="daa-stat"><div className="k">Block time</div><div className={"v " + btcSolveCls}>{fmtDur(v.btcMean)}</div></div>
            <div className="daa-stat"><div className="k">Target</div><div className="v">10m</div></div>
          </div>
          <div className="epoch-meter">
            <div className="epoch-bar"><span style={{ width: (v.btcEpochProgress * 100).toFixed(1) + "%" }} /></div>
            <div className="epoch-note">
              {v.btcBlocksLeft > 0
                ? <>next adjustment in <b>{fmtCount(v.btcBlocksLeft)}</b> blocks · ≈ <b>{fmtDur(v.btcSecondsToRetarget)}</b> away</>
                : <>retargeting now…</>}
            </div>
          </div>
          <div className="verdict">
            {btcOnTarget
              ? <>Blocks landing on schedule — nothing to do.</>
              : <>Blocks are running <b className="bad">{(v.btcMean / simRef.current.params.btcSpacing).toFixed(1)}× off target</b>, and Bitcoin <b className="bad">can't react</b> until the epoch ends.</>}
          </div>
        </div>

        {/* Interchained */}
        <div className={"daa-card itc " + (flash === "itc" ? "flash-itc" : "")}>
          <div className="dhead">
            <span className="chip-name">Interchained</span>
            <span className="algo">DGW3-Nova · every block</span>
          </div>
          <div className="biglbl">Difficulty</div>
          <div className="big" style={{ color: "var(--itc)" }}>{fmtDiff(v.itcDiff)}</div>
          <div className="daa-stat-row">
            <div className="daa-stat"><div className="k">Block time</div><div className={"v " + itcSolveCls}>{fmtDur(v.itcRollingSolve)}</div></div>
            <div className="daa-stat"><div className="k">Target</div><div className="v">60s</div></div>
          </div>
          <div className="epoch-meter">
            <div className="epoch-bar"><span style={{ width: "100%", background: "linear-gradient(90deg, color-mix(in srgb, var(--itc) 55%, transparent), var(--itc))" }} /></div>
            <div className="epoch-note" style={{ color: "var(--itc)" }}>re-targets on <b>every</b> block · window of 12</div>
          </div>
          <div className="verdict">
            {itcOnTarget
              ? <>Locked on its <b className="ok">60s</b> target. {Math.abs(hr - 1) > 0.05 ? <>Nova absorbed the {hr.toFixed(hr < 1 ? 2 : 1)}× shock.</> : null}</>
              : <>Block time drifted to <b className="warn">{fmtDur(v.itcRollingSolve)}</b> — Nova is already correcting it block-by-block.</>}
          </div>
        </div>
      </div>

      {/* the chart */}
      <div className="chart-wrap">
        <div className="chart-head">
          <span className="chart-title">Difficulty, last {v.slice.length} blocks</span>
          <div className="chart-legend">
            <span className="lk"><span className="swatch" style={{ background: "#22d3ee" }} /> Interchained</span>
            <span className="lk"><span className="swatch" style={{ background: "#f7931a" }} /> Bitcoin</span>
          </div>
        </div>
        <DiffChart slice={v.slice} btcDiff={v.btcDiff} hashrate={hr} />
        <div className="chart-foot">The cyan line chases the fair difficulty for the current hashrate; the orange line is what Bitcoin is stuck with until its next epoch boundary.</div>
      </div>

      {/* guided steps — education that coincides with the controls */}
      <div className="deck">
        <span className="lbl" style={{ display: "block", marginBottom: "0.7rem" }}>Follow the lesson</span>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div key={s.n}
              className={"step " + (activeStep === i ? "active " : "") + (reached[i] && activeStep !== i ? "done " : "")}
              onClick={() => bump(i)}>
              <div className="sn">{reached[i] && activeStep !== i ? "✓ " : ""}{s.n}</div>
              <div className="st">{s.t}</div>
            </div>
          ))}
        </div>
        <div className="step-detail">{stepDetail(activeStep, v, shockRef.current)}</div>
      </div>
    </div>
  );
}

/* ============================ migration scrubber =========================== */
function MigrationStation() {
  const params = window.DAA.defaultParams();
  const fork = params.sha256ForkHeight;
  const lo = fork - 60, hi = fork + 60;
  const [h, setH] = React.useState(fork - 30);
  const info = window.DAA.powInfoForHeight(h, params);
  const post = info.post;
  const forkPct = ((fork - lo) / (hi - lo)) * 100;
  const valPct = ((h - lo) / (hi - lo)) * 100;

  return (
    <div className="scrub">
      <div className="deck-row" style={{ justifyContent: "space-between" }}>
        <span className="lbl">Block height</span>
        <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: "1.3rem", color: post ? "var(--btc)" : "#a78bfa" }}>
          #{fmtCount(h)}
        </span>
      </div>
      <div className="scrub-track">
        <span className="fork-flag" style={{ left: forkPct + "%" }}>fork · #{fmtCount(fork)}</span>
        <input className="scrub-input" type="range" min={lo} max={hi} step="1" value={h}
          style={{ "--fork": forkPct + "%" }}
          onChange={(e) => setH(Number(e.target.value))} aria-label="Block height" />
        <div className="scrub-marks"><span>#{fmtCount(lo)}</span><span>#{fmtCount(hi)}</span></div>
      </div>
      <div className="algo-panel">
        <div className={"algo-box yespower " + (post ? "dim" : "")}>
          <div className="an"><DIcon name="Cpu" size={18} /> Yespower {!post && <span className="active-pill">● LIVE</span>}</div>
          <div className="ab">{window.DAA.powInfoForHeight(lo, params).blurb}</div>
        </div>
        <div className={"algo-box sha " + (!post ? "dim" : "")}>
          <div className="an"><DIcon name="Server" size={18} /> SHA-256 {post && <span className="active-pill">● LIVE</span>}</div>
          <div className="ab">{window.DAA.powInfoForHeight(hi, params).blurb}</div>
        </div>
      </div>
      <div className="step-detail" style={{ marginTop: "1.2rem" }}>
        {post
          ? <>At height <b>#{fmtCount(h)}</b> you're <b>past the fork</b>. Every node is now validating <b>SHA-256</b> proof-of-work. The retarget code even swaps its <code>powLimit</code> band ({info.powLimit}) so difficulty stays representable across the switch.</>
          : <>At height <b>#{fmtCount(h)}</b> the chain is still on <span style={{ color: "#a78bfa" }}><b>Yespower</b></span> — CPU-mineable, ASIC-resistant. Drag past <b>#{fmtCount(fork)}</b> to trip the height-based fork and watch the algorithm hand off with zero coordination.</>}
      </div>
    </div>
  );
}

window.DAALab = { DAAStation, MigrationStation, DiffChart };
