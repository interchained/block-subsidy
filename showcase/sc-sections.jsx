/* =============================================================================
   sc-sections.jsx — the narrative beats of the booth journey, BTC | ITC.
   Hero hook · shared PoW foundation (live real SHA-256) · the DAA centerpiece
   wrapper · the migration · by-the-numbers · eco / grants · why ITC · footer.
   Exposed on window.SC.
   ============================================================================= */
const { Icon: SIcon, Reveal: SReveal, shortHash: sShort, HashColored: SHash } = window.PGUI;

const SC_ITC_LOGO = "playground/assets/itc-logo.png";

/* ---------------- Top bar with live nav + ticker ---------------- */
function TopBar({ ticker }) {
  const links = [
    ["#foundation", "Foundation"], ["#daa", "Difficulty"], ["#migration", "Migration"],
    ["#numbers", "By the numbers"], ["#eco", "Energy"], ["#why", "Why ITC"],
  ];
  return (
    <div className="sc-top">
      <a className="brand" href="#top">
        <img src={SC_ITC_LOGO} alt="Interchained" />
        <span><b>Interchained</b> <span className="s">× Bitcoin</span></span>
      </a>
      <span className="spacer" />
      <nav className="sc-nav">{links.map(([h, t]) => <a key={h} href={h}>{t}</a>)}</nav>
      {ticker}
    </div>
  );
}

/* ---------------- Hero ---------------- */
function Hero() {
  return (
    <section className="container sc-hero" id="top">
      <SReveal className="eyebrow-row">
        <span className="sc-badge"><span className="dot" /> Live booth demo · runs entirely in this browser</span>
        <span className="sc-badge"><SIcon name="ShieldCheck" size={13} style={{ color: "var(--itc)" }} /> Real SHA-256 · faithful DGW3-Nova</span>
      </SReveal>
      <SReveal as="h1" delay={0.05}>
        Bitcoin <span className="walk">walked</span>.<br />Interchained <span className="run">runs.</span>
      </SReveal>
      <SReveal as="p" className="lede" delay={0.1}>
        Same idea — proof-of-work, a chain of hashed blocks, no central mint. But fourteen years of hindsight went
        into the engine. Put them side by side and yank the controls: you'll <em>feel</em> the difference a modern
        difficulty algorithm makes.
      </SReveal>
      <SReveal className="sc-hero-ctas" delay={0.15}>
        <a className="btn btn-itc" style={{ padding: "0.85rem 1.5rem" }} href="#daa"><SIcon name="Activity" size={17} /> Yank the hashrate</a>
        <a className="btn btn-ghost" href="#foundation"><SIcon name="BookOpen" size={17} /> Start the journey</a>
      </SReveal>

      <div className="vs-grid">
        <SReveal className="idcard btc">
          <div className="lab"><span className="glyph">₿</span><div><div className="nm">Bitcoin</div><div className="tk">BTC · 2009</div></div></div>
          <div className="role">The original. Proved a trustless, fixed-supply, proof-of-work ledger could exist — and then froze most of its rules in place on purpose.</div>
          <div className="props">
            <div className="prop"><span className="k">Block time</span><span className="v">10 minutes</span></div>
            <div className="prop"><span className="k">Difficulty</span><span className="v">every 2,016 blocks</span></div>
            <div className="prop"><span className="k">PoW</span><span className="v">SHA-256 (ASIC)</span></div>
          </div>
        </SReveal>
        <div className="vs-mark">VS</div>
        <SReveal className="idcard itc" delay={0.06}>
          <div className="lab"><span className="glyph">◈</span><div><div className="nm">Interchained</div><div className="tk">ITC · builder-owned</div></div></div>
          <div className="role">A Bitcoin-style chain rebuilt for resilience: difficulty that reacts every block, a fair CPU launch, and a height-based path to ASIC security.</div>
          <div className="props">
            <div className="prop"><span className="k">Block time</span><span className="v">60 seconds</span></div>
            <div className="prop"><span className="k">Difficulty</span><span className="v">every block · DGW3-Nova</span></div>
            <div className="prop"><span className="k">PoW</span><span className="v">Yespower → SHA-256</span></div>
          </div>
        </SReveal>
      </div>
    </section>
  );
}

/* ---------------- Shared PoW foundation (a real, live SHA-256 miner) -------- */
const FOUND_TXS = ["Alice → Bob · 25", "Bob → Carol · 12", "Treasury → Alice · 80", "Carol → Bob · 7", "Alice → Carol · 33"];
function LiveHash() {
  const DIFF = 3;
  const [st, setSt] = React.useState({ block: 1, tx: FOUND_TXS[0], nonce: 0, hash: "", found: false, prev: "" });
  const wrapRef = React.useRef(null);
  const visRef = React.useRef(true);
  const resumeRef = React.useRef(null);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      visRef.current = e.isIntersecting;
      if (e.isIntersecting && resumeRef.current) { const f = resumeRef.current; resumeRef.current = null; f(); }
    }, { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tgt = "0".repeat(DIFF);
    let alive = true, t1, t2, block = 1, prev = PG.hash("genesis|interchained"), txIdx = 0, nonce = 0, found = false;
    const startRound = () => {
      nonce = 0; found = false;
      const tx = FOUND_TXS[txIdx % FOUND_TXS.length];
      const header = `${block}|${tx}|${prev}`;
      const tick = () => {
        if (!alive || found) return;
        if (!visRef.current) { resumeRef.current = tick; return; }
        let h;
        for (let i = 0; i < 180; i++) {
          h = PG.hash(header + "|" + nonce);
          if (h.slice(0, DIFF) === tgt) {
            found = true;
            setSt({ block, tx, nonce, hash: h, found: true, prev });
            t2 = setTimeout(() => { prev = h; block += 1; txIdx += 1; startRound(); }, 1800);
            return;
          }
          nonce++;
        }
        setSt({ block, tx, nonce, hash: h, found: false, prev });
        t1 = setTimeout(tick, 55);
      };
      tick();
    };
    if (reduced) {
      const header = `1|${FOUND_TXS[0]}|${prev}`; let n = 0, h;
      do { h = PG.hash(header + "|" + n); n++; } while (h.slice(0, DIFF) !== tgt && n < 400000);
      setSt({ block: 1, tx: FOUND_TXS[0], nonce: n - 1, hash: h, found: true, prev });
      return;
    }
    startRound();
    return () => { alive = false; resumeRef.current = null; clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="glass glow anat" ref={wrapRef} style={{ padding: "1.4rem" }}>
      <div className="anat-block">
        <div className="anat-row"><span className="k">Block</span><span className="v">#{st.block}</span></div>
        <div className="anat-row"><span className="k">Txns</span><span className="v">{st.tx}</span></div>
        <div className="anat-row"><span className="k">Prev hash</span><span className="v">{sShort(st.prev, 10, 6)}</span></div>
        <div className="anat-row"><span className="k">Nonce</span><span className="v">{st.nonce.toLocaleString()}</span></div>
        <div className="anat-row"><span className="k">SHA-256</span><span className="v hash"><SHash value={st.hash} difficulty={DIFF} /></span></div>
        <div className="anat-row" style={{ background: st.found ? "rgba(52,211,153,0.08)" : "transparent" }}>
          <span className="k">Status</span>
          <span className="v" style={{ color: st.found ? "var(--good)" : "var(--muted-text)" }}>
            {st.found ? `✓ solved at nonce ${st.nonce.toLocaleString()}` : "searching for 000…"}
          </span>
        </div>
      </div>
      <div className="anat-hint">↑ A real miner, not a mockup — genuine SHA-256, computed live. Both chains are built on exactly this.</div>
    </div>
  );
}

function Foundation() {
  return (
    <section className="container sc-section" id="foundation">
      <div className="compare" style={{ gridTemplateColumns: "1fr 0.9fr", alignItems: "center", gap: "clamp(1.5rem,4vw,3.5rem)" }}>
        <div>
          <SReveal className="sc-kicker" as="span"><span className="idx">01</span> · The shared foundation</SReveal>
          <SReveal as="h2" className="sc-h" delay={0.05}>They agree on the <span className="itc">hard part</span>.</SReveal>
          <SReveal as="p" className="sc-sub" delay={0.1}>
            A block bundles transactions and the previous block's hash, then miners grind nonces through SHA-256 until
            the digest clears a target. No shortcut but guessing — that wasted work is what makes history expensive to
            rewrite. Bitcoin and Interchained run this identical search; ITC simply changes the rules <em>around</em> it.
          </SReveal>
          <SReveal delay={0.15} style={{ marginTop: "1.6rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <span className="chip"><SIcon name="Hash" size={14} /> Single SHA-256 fingerprint</span>
            <span className="chip"><SIcon name="Link2" size={14} /> Linked by prev-hash</span>
            <span className="chip"><SIcon name="Pickaxe" size={14} /> Nonce search = proof of work</span>
          </SReveal>
          <SReveal delay={0.2} style={{ marginTop: "1.6rem" }}>
            <a className="btn btn-ghost" href="Blockchain Playground.html"><SIcon name="FlaskConical" size={16} /> Mine real blocks in the full playground →</a>
          </SReveal>
        </div>
        <SReveal delay={0.12}><LiveHash /></SReveal>
      </div>
    </section>
  );
}

/* ---------------- DAA centerpiece wrapper ---------------- */
function DAASection({ speed }) {
  const { DAAStation } = window.DAALab;
  return (
    <section className="container sc-section" id="daa">
      <SReveal className="sc-kicker" as="span"><span className="idx">02</span> · The centerpiece</SReveal>
      <SReveal as="h2" className="sc-h" delay={0.05}>
        When the hashrate moves, <span className="itc">ITC reacts</span> — <span className="btc">Bitcoin can't</span>.
      </SReveal>
      <SReveal as="p" className="sc-sub" delay={0.1} style={{ marginBottom: "1.8rem" }}>
        Difficulty has one job: keep blocks arriving on schedule no matter how much mining power shows up or leaves.
        Bitcoin only re-checks every 2,016 blocks. Interchained's <b>DarkGravityWave3-Nova</b> re-checks every single
        block. Same miners, same shock — watch the two responses diverge.
      </SReveal>
      <SReveal delay={0.12}><DAAStation speed={speed} /></SReveal>
    </section>
  );
}

/* ---------------- Migration ---------------- */
function MigrationSection() {
  const { MigrationStation } = window.DAALab;
  return (
    <section className="container sc-section" id="migration">
      <SReveal className="sc-kicker" as="span"><span className="idx">03</span> · Height-based migration</SReveal>
      <SReveal as="h2" className="sc-h" delay={0.05}>One chain, <span className="itc">two proof-of-work eras</span>.</SReveal>
      <SReveal as="p" className="sc-sub" delay={0.1} style={{ marginBottom: "1.8rem" }}>
        Interchained launched on Yespower — a memory-hard, CPU-friendly algorithm, so anyone could mine fairly from day
        one with no ASIC head-start. At a pre-set block height it migrates to SHA-256 for industrial-grade security.
        Because the switch is keyed to height, every node flips at the same block with zero flag-day coordination.
        Scrub across the fork:
      </SReveal>
      <SReveal delay={0.12}><MigrationStation /></SReveal>
    </section>
  );
}

/* ---------------- By the numbers ---------------- */
const NUM_ROWS = [
  { m: "Target block time", sub: "How often a block should land", btc: ["10 min", ""], itc: ["60 sec", "10× faster settlement"] },
  { m: "Difficulty retarget", sub: "How often the rules re-balance", btc: ["every 2,016 blocks", "≈ 2 weeks"], itc: ["every block", "DGW3-Nova, 12-block window"] },
  { m: "Recovery from a hashrate shock", sub: "Time to get blocks back on schedule", btc: ["up to an epoch", "and max 4× per epoch"], itc: ["~12–24 blocks", "minutes, not weeks"] },
  { m: "PoW algorithm", sub: "What miners actually compute", btc: ["SHA-256", "ASIC from the start"], itc: ["Yespower → SHA-256", "height-based fork"] },
  { m: "Launch fairness", sub: "Who could mine on day one", btc: ["CPU → GPU → ASIC", "early arms race"], itc: ["CPU-fair bootstrap", "memory-hard Yespower"] },
  { m: "Block reward", sub: "New coins per block (coinbase)", btc: ["3.125 BTC", "halving every 210k blocks"], itc: ["0.1030199 ITC", "builder-owned issuance"] },
];
function Numbers() {
  return (
    <section className="container sc-section" id="numbers">
      <SReveal className="sc-kicker" as="span"><span className="idx">04</span> · By the numbers</SReveal>
      <SReveal as="h2" className="sc-h" delay={0.05}>The spec sheet, <span className="itc">side by side</span>.</SReveal>
      <SReveal as="p" className="sc-sub" delay={0.1} style={{ marginBottom: "1.8rem" }}>
        Same DNA, different tuning. Where Bitcoin optimized for "never change," Interchained optimized for "stay healthy
        under stress."
      </SReveal>
      <SReveal className="numbers" delay={0.12}>
        <div className="nrow head">
          <span className="h metric-h">Metric</span>
          <span className="h btc">Bitcoin</span>
          <span className="h itc">Interchained</span>
        </div>
        {NUM_ROWS.map((r) => (
          <div className="nrow" key={r.m}>
            <span className="metric">{r.m}<small>{r.sub}</small></span>
            <span className="cell btc"><span className="big">{r.btc[0]}</span>{r.btc[1] && <span className="sm"> · {r.btc[1]}</span>}</span>
            <span className="cell itc"><span className="big">{r.itc[0]}</span>{r.itc[1] && <span className="sm"> · {r.itc[1]}</span>}</span>
          </div>
        ))}
      </SReveal>
      <SReveal delay={0.16} style={{ marginTop: "0.9rem" }}>
        <p className="caption" style={{ fontSize: "0.78rem" }}>Bitcoin figures are consensus facts (post-2024 halving). Interchained parameters reflect its DGW3-Nova retarget and Yespower→SHA-256 design; some are shown rounded for teaching.</p>
      </SReveal>
    </section>
  );
}

/* ---------------- Eco / grants ---------------- */
function Eco() {
  const grants = [
    { i: "Leaf", t: "Efficiency grants", d: "Funding work that lowers the energy-per-secured-block." },
    { i: "Cpu", t: "CPU-fair mining", d: "Yespower keeps the launch on commodity hardware, not warehouses." },
    { i: "Users", t: "Builder-owned infra", d: "Grants flow to the people running and improving the network." },
  ];
  return (
    <section className="container sc-section" id="eco">
      <SReveal className="sc-kicker" as="span"><span className="idx">05</span> · The energy question</SReveal>
      <SReveal as="h2" className="sc-h" delay={0.05}>Proof-of-work, <span style={{ color: "var(--good)" }}>without the warehouse</span>.</SReveal>
      <SReveal className="eco" delay={0.1} style={{ marginTop: "1.4rem" }}>
        <div className="eco-grid">
          <div>
            <p className="sc-sub" style={{ maxWidth: "52ch" }}>
              Bitcoin's security now leans on nation-scale electricity and purpose-built ASIC farms. Interchained takes a
              different posture: a CPU-fair start, faster blocks so less work is wasted on orphans, and an
              <b style={{ color: "var(--good)" }}> eco-grants</b> program that funds efficiency directly — security you can run
              from a laptop, not a substation.
            </p>
            <div style={{ display: "flex", gap: "clamp(1.4rem,4vw,2.6rem)", marginTop: "1.8rem", flexWrap: "wrap" }}>
              <div className="eco-stat"><span className="n">~150 TWh/yr</span><span className="d">Bitcoin network energy<br />(country-scale, est.)</span></div>
              <div className="eco-stat"><span className="n">CPU-class</span><span className="d">Interchained's fair-launch<br />hardware floor</span></div>
            </div>
          </div>
          <div className="eco-grants">
            {grants.map((g) => (
              <div className="grant-pill" key={g.t}>
                <span className="gi"><SIcon name={g.i} size={18} /></span>
                <span><div className="gt">{g.t}</div><div className="gd">{g.d}</div></span>
              </div>
            ))}
          </div>
        </div>
      </SReveal>
    </section>
  );
}

/* ---------------- Why ITC + closing ---------------- */
const WHY = [
  { i: "Activity", t: "It stays alive under stress", d: "When miners stampede in or flee, DGW3-Nova keeps blocks on a 60-second heartbeat instead of stalling for weeks. That's a real solved problem, not a reskin." },
  { i: "Scale", t: "It launched fair", d: "Yespower meant no ASIC head start — a CPU and a clone of the repo were enough on day one. Security scales up later, by height, on schedule." },
  { i: "Wrench", t: "It's engineered, not forked", d: "Every-block retargeting, emergency triggers, median smoothing, height-based PoW migration — deliberate mechanisms you just drove yourself." },
];
function WhyITC() {
  return (
    <section className="container sc-section" id="why">
      <SReveal className="sc-kicker" as="span"><span className="idx">06</span> · So what?</SReveal>
      <SReveal as="h2" className="sc-h" delay={0.05}>Why Interchained <span className="itc">earns its own chain</span>.</SReveal>
      <SReveal as="p" className="sc-sub" delay={0.1} style={{ marginBottom: "2rem" }}>
        You just watched it absorb shocks Bitcoin would shrug off for two weeks. That resilience is the point.
      </SReveal>
      <div className="why-grid">
        {WHY.map((w, i) => (
          <SReveal key={w.t} delay={0.05 * i}>
            <div className="why-card">
              <SIcon name={w.i} size={24} className="wi" />
              <h3>{w.t}</h3>
              <p>{w.d}</p>
            </div>
          </SReveal>
        ))}
      </div>

      <div className="sc-cta-band">
        <SReveal as="h2">Bitcoin walked. <span className="itc">Now go run.</span></SReveal>
        <SReveal className="ctas" delay={0.08}>
          <a className="btn btn-itc" style={{ padding: "0.9rem 1.6rem" }} href="Blockchain Playground.html"><SIcon name="Pickaxe" size={17} /> Mine your own chain</a>
          <a className="btn btn-ghost" href="Interchained Explainer.html"><SIcon name="BookOpen" size={17} /> Read the full explainer</a>
        </SReveal>
      </div>
    </section>
  );
}

function SCFooter() {
  return (
    <footer className="sc-footer">
      <div className="container">
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.4rem" }}>
          <img src={SC_ITC_LOGO} alt="" style={{ width: 28, height: 28, borderRadius: "50%" }} />
          <strong style={{ color: "var(--soft-white)", fontFamily: "var(--font-display)" }}>Interchained × Bitcoin · Showcase</strong>
        </div>
        <p style={{ maxWidth: "66ch" }}>
          An interactive booth comparing a Bitcoin-style chain with Interchained's DarkGravityWave3-Nova difficulty
          algorithm and height-based Yespower→SHA-256 migration. Everything runs client-side — real SHA-256 and a
          faithful port of the retarget logic. Not connected to any live network; not investment advice. Bitcoin is
          referenced factually for comparison.
        </p>
        <div className="links">
          <a href="https://interchained.org" target="_blank" rel="noreferrer">Interchained ↗</a>
          <a href="https://aiassist.net" target="_blank" rel="noreferrer">AiAssist Secure ↗</a>
          <a href="Blockchain Playground.html">Playground →</a>
          <a href="Interchained Explainer.html">Explainer →</a>
        </div>
      </div>
    </footer>
  );
}

window.SC = { TopBar, Hero, Foundation, DAASection, MigrationSection, Numbers, Eco, WhyITC, SCFooter };
