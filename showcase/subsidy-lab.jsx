/* =============================================================================
   subsidy-lab.jsx — the Block Subsidy portal centerpiece.
   Drives window.DAA.blockSubsidyITC (a faithful port of the real GetBlockSubsidy)
   to teach the issuance curve honestly: a lifetime height scrubber, a live reward
   readout + four-phase ribbon, the curve chart (with the two hidden cliffs and the
   permanent floor drawn true to the math), a BTC-vs-ITC scarcity contrast, and the
   "truth" reveals. Exposed on window.SubLab.
   ============================================================================= */
const { Icon: SubIcon, Reveal: SubReveal, fmtCoin: subCoin } = window.PGUI;

const BLOCKS_PER_YEAR = 525960;            // 60-second blocks
const DOMAIN = 2000000;                    // chart/scrubber height domain (reaches past the 1.1M supply milestone)
const MAIN_SUPPLY = 1100000;               // builder's projected "main supply" from genesis
const D = window.DAA;
const FLOOR_H = D.subsidyFloorHeight();    // ~1,135,738
const MAXR = 2.178;                        // peak reward (ramp-up end)
const PEAK_H = D.SUBSIDY.peakEnd;          // 518400
const RAMP_H = D.SUBSIDY.rampUpEnd;        // 259200

const yearsAt = (h) => h / BLOCKS_PER_YEAR;
function fmtYears(h) {
  const y = yearsAt(h);
  if (y < 1) return (y * 12).toFixed(1) + " mo";
  return y.toFixed(2) + " yr";
}
function fmtBig(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "k";
  return String(Math.round(n));
}

/* ============================ the issuance curve =========================== */
function SubsidyCurve({ height, onScrub }) {
  const W = 760, H = 340, padL = 54, padR = 16, padT = 22, padB = 40;
  const x0 = 0, x1 = DOMAIN, y0 = 0, y1 = 2.35;
  const xOf = (h) => padL + (W - padL - padR) * ((h - x0) / (x1 - x0));
  const yOf = (v) => padT + (H - padT - padB) * (1 - (v - y0) / (y1 - y0));

  // build the path true to the piecewise math, with crisp cliffs
  const pts = [];
  const push = (h, v) => pts.push([xOf(h), yOf(v)]);
  for (let h = 0; h <= RAMP_H; h += RAMP_H / 60) push(h, D.blockSubsidyITC(h));      // ramp
  push(RAMP_H, D.blockSubsidyITC(RAMP_H));                                            // 2.178
  push(RAMP_H, 1.5);                                                                  // cliff 1
  push(PEAK_H, 1.5);                                                                  // peak plateau
  push(PEAK_H, D.blockSubsidyITC(PEAK_H + 1));                                         // cliff 2 -> 1.103
  for (let h = PEAK_H + 1; h <= FLOOR_H; h += (FLOOR_H - PEAK_H) / 80) push(h, D.blockSubsidyITC(h)); // decay
  push(FLOOR_H, D.SUBSIDY.floor);
  push(DOMAIN, D.SUBSIDY.floor);                                                       // perpetual floor

  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L ${xOf(DOMAIN).toFixed(1)} ${yOf(0).toFixed(1)} L ${xOf(0).toFixed(1)} ${yOf(0).toFixed(1)} Z`;

  const curRew = D.blockSubsidyITC(height);
  const px = xOf(height), py = yOf(curRew);
  const yFloor = yOf(D.SUBSIDY.floor);

  // gridlines (reward)
  const yTicks = [0.5, 1.0, 1.5, 2.0];
  // phase region x-bounds
  const reg = [
    { a: 0, b: RAMP_H, c: "var(--ramp)" },
    { a: RAMP_H, b: PEAK_H, c: "var(--peak)" },
    { a: PEAK_H, b: FLOOR_H, c: "var(--decay)" },
    { a: FLOOR_H, b: DOMAIN, c: "var(--floor)" },
  ];

  const onMove = (e) => {
    if (!onScrub) return;
    const svg = e.currentTarget;
    const r = svg.getBoundingClientRect();
    const cx = ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width * W;
    const h = Math.max(0, Math.min(DOMAIN, x0 + (cx - padL) / (W - padL - padR) * (x1 - x0)));
    onScrub(Math.round(h));
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" preserveAspectRatio="none"
      style={{ cursor: "ew-resize", touchAction: "none" }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); onMove(e); }}
      onPointerMove={(e) => { if (e.buttons) onMove(e); }}
      role="img" aria-label="Block reward over the life of the chain, in ITC per block.">
      <defs>
        <linearGradient id="subFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* phase background bands */}
      {reg.map((rg, i) => (
        <rect key={i} x={xOf(rg.a)} y={padT} width={xOf(rg.b) - xOf(rg.a)} height={H - padT - padB}
          fill={rg.c} opacity={height >= rg.a && height < rg.b ? 0.08 : 0.03} />
      ))}
      {/* reward gridlines */}
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={padL} y1={yOf(v)} x2={W - padR} y2={yOf(v)} stroke="rgba(148,163,184,0.10)" />
          <text x={padL - 10} y={yOf(v) + 5} textAnchor="end" fontFamily="var(--mono)" fontSize="15" fill="#64748b">{v.toFixed(1)}</text>
        </g>
      ))}
      {/* permanent floor line */}
      <line x1={padL} y1={yFloor} x2={W - padR} y2={yFloor} stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 5" opacity="0.8" />
      <text x={W - padR} y={yFloor - 8} textAnchor="end" fontFamily="var(--mono)" fontSize="15" fill="#34d399">floor 0.10301990 — never zero</text>
      {/* the curve */}
      <path d={area} fill="url(#subFill)" />
      <path d={line} fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {/* cliff markers */}
      <circle cx={xOf(RAMP_H)} cy={yOf(MAXR)} r="4" fill="#f7931a" />
      <circle cx={xOf(PEAK_H)} cy={yOf(1.5)} r="4" fill="#f7931a" />
      {/* playhead */}
      <line x1={px} y1={padT} x2={px} y2={H - padB} stroke="#fff" strokeWidth="1.2" opacity="0.5" />
      <circle cx={px} cy={py} r="6.5" fill="#fff" stroke="#22d3ee" strokeWidth="3" />
      {/* x labels */}
      <text x={padL} y={H - 10} fontFamily="var(--mono)" fontSize="15" fill="#64748b">#0</text>
      <text x={xOf(RAMP_H)} y={H - 10} textAnchor="middle" fontFamily="var(--mono)" fontSize="14" fill="#64748b">#260k</text>
      <text x={xOf(PEAK_H)} y={H - 10} textAnchor="middle" fontFamily="var(--mono)" fontSize="14" fill="#64748b">#518k</text>
      <text x={xOf(FLOOR_H)} y={H - 10} textAnchor="middle" fontFamily="var(--mono)" fontSize="14" fill="#64748b">#1.14M</text>
      <text x={W - padR} y={H - 10} textAnchor="end" fontFamily="var(--mono)" fontSize="15" fill="#64748b">#2.0M · ITC/block</text>
    </svg>
  );
}

/* ================== BTC vs ITC scarcity contrast (two philosophies) ========= */
function ScarcityChart() {
  const W = 760, H = 240, padL = 14, padR = 14, padT = 16, padB = 28;
  const YEARS = 32;
  const xOf = (yr) => padL + (W - padL - padR) * (yr / YEARS);
  const yOf = (f) => padT + (H - padT - padB) * (1 - f);   // f = fraction of own max

  // ITC: reward(height)/maxReward over years
  const itc = [];
  for (let yr = 0; yr <= YEARS; yr += 0.2) {
    const h = yr * BLOCKS_PER_YEAR;
    itc.push([xOf(yr), yOf(D.blockSubsidyITC(Math.min(h, DOMAIN * 4)) / MAXR)]);
  }
  const itcLine = itc.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");

  // BTC: 50 -> halving every ~4 yrs, staircase; fraction of 50
  const btcPts = [];
  for (let yr = 0; yr <= YEARS; yr += 0.05) {
    const halvings = Math.floor(yr / 4);
    btcPts.push([xOf(yr), yOf(1 / Math.pow(2, halvings))]);
  }
  const btcLine = btcPts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const itcFloorY = yOf(D.SUBSIDY.floor / MAXR);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" preserveAspectRatio="none" role="img"
      aria-label="Reward decline over 32 years: Bitcoin halves toward zero; Interchained settles on a permanent floor.">
      {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1={padL} y1={yOf(f)} x2={W - padR} y2={yOf(f)} stroke="rgba(148,163,184,0.08)" />)}
      {/* ITC floor */}
      <line x1={padL} y1={itcFloorY} x2={W - padR} y2={itcFloorY} stroke="#34d399" strokeWidth="1.2" strokeDasharray="3 5" opacity="0.7" />
      <text x={W - padR} y={itcFloorY - 5} textAnchor="end" fontFamily="var(--mono)" fontSize="10" fill="#34d399">ITC floor — holds forever</text>
      {/* BTC staircase */}
      <path d={btcLine} fill="none" stroke="#f7931a" strokeWidth="2.5" strokeLinejoin="miter" />
      <text x={xOf(28)} y={yOf(0.02) - 6} textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill="#f7931a">→ 0</text>
      {/* ITC curve */}
      <path d={itcLine} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinejoin="round" />
      {/* year ticks */}
      {[0, 8, 16, 24, 32].map((yr) => <text key={yr} x={xOf(yr)} y={H - 8} textAnchor={yr === 0 ? "start" : yr === 32 ? "end" : "middle"} fontFamily="var(--mono)" fontSize="11" fill="#64748b">{yr}y</text>)}
    </svg>
  );
}

/* ============================== phase helpers ============================== */
const PHASE_CLASS = { ramp: "ramp", peak: "peak", decay: "decay", floor: "floor" };
const RIBBON = [
  { key: "ramp", label: "Ramp-up", a: 0, b: RAMP_H },
  { key: "peak", label: "Peak", a: RAMP_H, b: PEAK_H },
  { key: "decay", label: "Decay", a: PEAK_H, b: FLOOR_H },
  { key: "floor", label: "Floor ∞", a: FLOOR_H, b: DOMAIN },
];

/* =============================== the station =============================== */
const JUMPS = [
  { label: "Genesis", h: 0 },
  { label: "Ramp peak (truth!)", h: RAMP_H },
  { label: "Cliff → peak", h: RAMP_H + 1 },
  { label: "Decay begins", h: PEAK_H + 1 },
  { label: "Hits the floor", h: FLOOR_H },
  { label: "Crosses 1.1M supply", h: 1918875 },
  { label: "Floor forever", h: DOMAIN },
];

function SubsidyStation({ height, setHeight, onTruth }) {
  const [playing, setPlaying] = React.useState(false);
  const rafRef = React.useRef(null);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  React.useEffect(() => {
    if (!playing) return;
    let start = null, from = height >= DOMAIN - 1 ? 0 : height;
    const dur = 11000;
    const tick = (ts) => {
      if (start == null) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      const h = Math.round(from + (DOMAIN - from) * p);
      setHeight(h);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  const phase = D.subsidyPhase(height);
  const reward = D.blockSubsidyITC(height);
  const supply = D.cumulativeSupply(height);
  const pcls = PHASE_CLASS[phase.key];

  return (
    <div className="sub-deck">
      {/* readout */}
      <div className="sub-readout">
        <div className="ro-reward">
          <div className="ro-lbl">Block reward</div>
          <div className="num">{reward.toFixed(reward < 1 ? 8 : 4).replace(/0+$/, "").replace(/\.$/, "")}<small> ITC</small></div>
          <div style={{ marginTop: "0.7rem" }}>
            <span className={"phase-badge " + pcls}><span className="pdot" />Phase {phase.n} · {phase.label}</span>
          </div>
        </div>
        <div className="ro-stat">
          <div className="ro-lbl">Block height</div>
          <div className="v accent">#{height.toLocaleString()}</div>
          <div className="sub">≈ {fmtYears(height)} after launch</div>
        </div>
        <div className="ro-stat">
          <div className="ro-lbl">Total minted by here</div>
          <div className="v">{fmtBig(supply)} <span style={{ fontSize: "0.6em", color: "var(--muted-text)" }}>ITC</span></div>
          <div className="sub">≈ {(supply / MAIN_SUPPLY * 100).toFixed(0)}% of projected 1.1M · no cap</div>
        </div>
      </div>

      {/* phase ribbon */}
      <div className="ribbon">
        <div className="ribbon-track">
          {RIBBON.map((s) => (
            <div key={s.key} className={"ribbon-seg " + s.key + (phase.key === s.key ? "" : " dim")}
              style={{ flex: (s.b - s.a) }} title={s.label} />
          ))}
        </div>
        <div className="ribbon-labels">
          {RIBBON.map((s) => <span key={s.key} style={{ flex: (s.b - s.a) }}>{s.label}</span>)}
        </div>
      </div>

      {/* slider */}
      <div className="sub-slider-wrap">
        <input className="sub-slider" type="range" min="0" max={DOMAIN} step="200" value={height}
          onChange={(e) => { setPlaying(false); setHeight(Number(e.target.value)); }}
          aria-label="Block height across the life of the chain" />
        <div className="sub-scale"><span>genesis</span><span>#{fmtBig(FLOOR_H)} · floor</span><span>#{fmtBig(DOMAIN)}</span></div>
      </div>

      {/* jumps + play */}
      <div className="sub-jumps">
        <button className={"sub-jump " + (playing ? "playing" : "")} onClick={() => setPlaying((p) => !p)}>
          <SubIcon name={playing ? "Pause" : "Play"} size={13} /> {playing ? "Pause" : reduced ? "Step to end" : "Play the chain's life"}
        </button>
        {JUMPS.map((j) => (
          <button key={j.label} className="sub-jump" onClick={() => { setPlaying(false); setHeight(j.h); }}>{j.label}</button>
        ))}
      </div>
    </div>
  );
}

window.SubLab = { SubsidyCurve, ScarcityChart, SubsidyStation, BLOCKS_PER_YEAR, DOMAIN, FLOOR_H, RAMP_H, PEAK_H, fmtYears };
