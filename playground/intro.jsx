/* =============================================================================
   intro.jsx — presentational beats around the lab.
   Header · Hero (+ live-hashing anatomy preview) · ConceptBeats ·
   GenesisLab (spin up your own chain) · Recap · Footer. On window.Intro.
   ============================================================================= */
const { Icon: IIcon, Reveal: IReveal, HashColored: IHash, shortHash: iShort, fmtCoin: iCoin } = window.PGUI;

const ITC_LOGO = "playground/assets/itc-logo.png";

/* ---------------- Header ---------------- */
function Header({ chain, difficulty }) {
  const { config, isValid, blocks, machineRate } = chain;
  return (
    <header className="pg-header">
      <a className="pg-brand" href="#top" style={{ textDecoration: "none" }}>
        <img src={ITC_LOGO} alt="Interchained coin" />
        <span><span className="b1">{config.chainName}</span> <span className="b2">Playground</span></span>
      </a>
      <span className="spacer" />
      {machineRate > 0 && (
        <span className="pg-stat" title="Your machine's measured SHA-256 throughput">
          <IIcon name="Zap" size={14} style={{ color: "var(--pg-accent)" }} /> <b>{window.PGUI.fmtRate(machineRate)}</b>
        </span>
      )}
      <span className="pg-stat" title="Blocks in the chain"><IIcon name="Boxes" size={14} /> <b>{blocks.length}</b> blocks</span>
      <span className="pg-stat" title="Proof-of-work difficulty"><IIcon name="Gauge" size={14} /> diff <b>{difficulty}</b></span>
      <span className="pg-stat">
        <span className={"pg-status-dot " + (isValid ? "ok" : "bad")} />
        <b style={{ color: isValid ? "var(--good)" : "var(--bad)" }}>{isValid ? "Chain valid" : "Chain broken"}</b>
      </span>
    </header>
  );
}

/* ---------------- live mini-miner: a real chain that keeps building ---------------- */
const DEMO_TXS = [
  "Alice → Bob · 25", "Bob → Carol · 12", "Treasury → Alice · 80",
  "Carol → Bob · 7", "Alice → Carol · 33", "Bob → Treasury · 19",
  "Treasury → Carol · 50", "Carol → Alice · 14",
];
function LiveAnatomy({ chain }) {
  const DIFF = 3;
  const reduced = React.useRef(typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [st, setSt] = React.useState({ block: 1, prev: "", tx: DEMO_TXS[0], nonce: 0, hash: "", found: false });
  const wrapRef = React.useRef(null);
  const visRef = React.useRef(true);
  const resumeRef = React.useRef(null);

  // pause the miner whenever the card is off-screen (saves CPU for the lab)
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
    const tgt = "0".repeat(DIFF);
    let alive = true, t1, t2;
    let block = 1;
    let prev = PG.hash("genesis|" + chain.config.chainName);
    let txIdx = 0;
    let nonce = 0, found = false;

    const startRound = () => {
      nonce = 0; found = false;
      const tx = DEMO_TXS[txIdx % DEMO_TXS.length];
      const ts = Date.now();
      const header = `${block}|${tx}|${prev}|t=${ts}`;
      const tick = () => {
        if (!alive || found) return;
        if (!visRef.current) { resumeRef.current = tick; return; }   // paused off-screen
        let h;
        for (let i = 0; i < 200; i++) {              // real SHA-256, throttled so the climb is visible
          h = PG.hash(header + "|" + nonce);
          if (h.slice(0, DIFF) === tgt) {
            found = true;
            setSt({ block, prev, tx, nonce, hash: h, found: true });
            t2 = setTimeout(() => {                   // solved → chain forward to the next block
              prev = h; block += 1; txIdx += 1;
              startRound();
            }, 1900);
            return;
          }
          nonce++;
        }
        setSt({ block, prev, tx, nonce, hash: h, found: false });
        t1 = setTimeout(tick, 55);
      };
      tick();
    };

    if (reduced.current) {
      const tx = DEMO_TXS[0];
      const header = `1|${tx}|${prev}|t=0`;
      let n = 0, h;
      do { h = PG.hash(header + "|" + n); n++; } while (h.slice(0, DIFF) !== tgt && n < 500000);
      setSt({ block: 1, prev, tx, nonce: n - 1, hash: h, found: true });
      return;
    }
    startRound();
    return () => { alive = false; resumeRef.current = null; clearTimeout(t1); clearTimeout(t2); };
  }, [chain.config.chainName]);

  return (
    <div className="glass glow anat" ref={wrapRef}>
      <div className="anat-block">
        <div className="anat-row"><span className="k">Block</span><span className="v">#{st.block}</span></div>
        <div className="anat-row"><span className="k">Txns</span><span className="v">{st.tx} {chain.config.ticker}</span></div>
        <div className="anat-row"><span className="k">Prev hash</span><span className="v">{iShort(st.prev, 10, 6)}</span></div>
        <div className="anat-row"><span className="k">Nonce</span><span className="v">{st.nonce.toLocaleString()}</span></div>
        <div className="anat-row"><span className="k">SHA-256</span>
          <span className="v hash"><IHash value={st.hash} difficulty={DIFF} /></span>
        </div>
        <div className="anat-row" style={{ background: st.found ? "rgba(52,211,153,0.08)" : "transparent" }}>
          <span className="k">Status</span>
          <span className="v" style={{ color: st.found ? "var(--good)" : "var(--muted-text)" }}>
            {st.found ? `✓ block #${st.block} solved at nonce ${st.nonce.toLocaleString()}` : `searching for 000…`}
          </span>
        </div>
      </div>
      <div className="anat-hint">↑ A real miner, not a mockup. Each solved block feeds its hash into the next as <code>prev hash</code>, with new transactions — so the winning nonce is different every time, exactly like a live chain.</div>
    </div>
  );
}

/* ---------------- Hero ---------------- */
function Hero({ chain }) {
  return (
    <section className="container pg-hero" id="top">
      <div className="pg-hero-grid">
        <div>
          <IReveal className="eyebrow" as="span">Interchained Playground</IReveal>
          <IReveal as="h1" delay={0.05}>
            Blockchain in a browser.<br /><span className="accent">Make your own.</span>
          </IReveal>
          <IReveal as="p" className="lead" delay={0.1}>
            Learn how Bitcoin-style blockchains actually work — by running one. Send tokens between wallets, watch them
            collect in the mempool, then mine them into blocks with genuine SHA-256 proof-of-work. Every hash is real,
            computed live in this tab.
          </IReveal>
          <IReveal className="pg-hero-ctas" delay={0.15}>
            <a className="btn btn-accent" style={{ width: "auto", padding: "0.85rem 1.5rem" }} href="#lab"><IIcon name="Pickaxe" size={17} /> Start mining</a>
            <a className="btn btn-ghost" href="#how"><IIcon name="BookOpen" size={17} /> How it works</a>
          </IReveal>
          <IReveal className="pg-hero-meta" delay={0.2}>
            <span className="chip"><IIcon name="ShieldCheck" size={14} /> Real SHA-256</span>
            <span className="chip"><IIcon name="Cpu" size={14} /> Runs 100% in your browser</span>
            <span className="chip"><IIcon name="Bitcoin" size={14} /> Bitcoin-style mechanics</span>
          </IReveal>
        </div>
        <IReveal delay={0.1}><LiveAnatomy chain={chain} /></IReveal>
      </div>
    </section>
  );
}

/* ---------------- Concept beats ---------------- */
const BEATS = [
  { n: "01", icon: "ArrowLeftRight", title: "Transactions wait in the mempool", body: "A payment is just a message: who pays whom, and how much. New transactions sit in the mempool until a miner picks them up. New coins only ever enter through a block's reward — the coinbase — exactly like Bitcoin." },
  { n: "02", icon: "Box", title: "A block is hashed into one fingerprint", body: "A block packs its transactions, a timestamp, and the previous block's hash, then runs the whole thing through SHA-256 to get a single 64-character fingerprint. Change one character anywhere and the fingerprint changes completely." },
  { n: "03", icon: "Pickaxe", title: "Proof of work makes it count", body: "Miners try nonce after nonce until the block's hash clears a target. We render that target as “starts with N zeros” so you can watch the search — but the real lever is the target itself. Bitcoin freezes it for 2,016 blocks; Interchained retunes it every block with DarkGravityWave3-Nova." },
];
function ConceptBeats() {
  return (
    <section className="container section" id="how">
      <IReveal className="eyebrow" as="span">How mining works</IReveal>
      <IReveal as="h2" className="h-2" delay={0.05} style={{ margin: "0.8rem 0 2rem", maxWidth: "18ch" }}>
        The same machinery as Bitcoin.
      </IReveal>
      <div className="beats">
        {BEATS.map((b, i) => (
          <IReveal key={b.n} delay={0.05 * i}>
            <div className="glass beat" style={{ height: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="num">{b.n}</span>
                <IIcon name={b.icon} size={22} style={{ color: "var(--pg-accent)" }} />
              </div>
              <h3>{b.title}</h3>
              <p className="body">{b.body}</p>
            </div>
          </IReveal>
        ))}
      </div>
      <IReveal delay={0.1} style={{ marginTop: "1.1rem" }}>
        <p className="caption" style={{ maxWidth: "82ch", lineHeight: 1.6 }}>
          <b style={{ color: "var(--soft-white)" }}>What's real vs. simplified:</b> the mechanics here are genuine — a mempool, a coinbase reward,
          a real nonce search, and blocks linked by SHA-256. For clarity this model uses a single SHA-256 (Bitcoin hashes twice),
          a “leading zeros” target you can read at a glance instead of the full 256-bit number that Interchained's
          <b style={{ color: "var(--pg-accent)" }}> DarkGravityWave3-Nova</b> retargets every block — and account balances instead of UTXOs.
        </p>
        <p className="caption" style={{ marginTop: "0.7rem" }}>
          <a href="ITC Showcase.html#daa" style={{ color: "var(--pg-accent)" }}>See DGW3-Nova react to a hashrate shock, live →</a>
        </p>
      </IReveal>
    </section>
  );
}

/* ---------------- Spin up your own chain ---------------- */
function GenesisLab({ chain, defaultName, defaultTicker }) {
  const [name, setName] = React.useState(chain.config.chainName);
  const [ticker, setTicker] = React.useState(chain.config.ticker);
  const [reward, setReward] = React.useState(chain.config.reward);
  const [premines, setPremines] = React.useState(() => chain.config.wallets.map((w) => ({ name: w.name, premine: w.premine })));
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--pg-accent") || "#22d3ee";

  const setPre = (i, v) => setPremines((p) => p.map((w, j) => (j === i ? { ...w, premine: v } : w)));
  const total = premines.reduce((s, w) => s + (Number(w.premine) || 0), 0);

  const create = () => {
    chain.reset({
      chainName: name.trim() || "MyChain",
      ticker: (ticker.trim() || "MYC").toUpperCase().slice(0, 5),
      reward: Number(reward) || 0,
      wallets: premines.map((w) => ({ name: w.name, premine: Number(w.premine) || 0 })),
    });
    document.getElementById("lab").scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="container section" id="genesis">
      <IReveal className="eyebrow gold" as="span">Genesis</IReveal>
      <IReveal as="h2" className="h-2" delay={0.05} style={{ margin: "0.8rem 0 0.6rem" }}>Spin up your own chain.</IReveal>
      <IReveal as="p" className="lead" delay={0.1} style={{ maxWidth: "60ch", marginBottom: "2rem" }}>
        Name it, pick a ticker, set the block reward, and seed the genesis block with starting balances. Creating it
        mines block&nbsp;#0 from scratch and resets everything below.
      </IReveal>
      <div className="genesis-grid">
        <IReveal className="glass panel">
          <h4><IIcon name="Settings2" size={15} /> Chain settings</h4>
          <div className="preview-coin">
            <span className="disc" style={{ background: accent }}>{(ticker || "?")[0]}</span>
            <div>
              <div style={{ fontWeight: 600, fontFamily: "var(--font-display)" }}>{name || "Untitled chain"}</div>
              <div className="caption">Native token: {(ticker || "—").toUpperCase()} · reward {iCoin(Number(reward) || 0)} / block</div>
            </div>
          </div>
          <div className="row2">
            <div className="field"><label>Chain name</label>
              <input type="text" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} style={{ fontFamily: "var(--font-body)" }} /></div>
            <div className="field"><label>Ticker</label>
              <input type="text" value={ticker} maxLength={5} onChange={(e) => setTicker(e.target.value.toUpperCase())} /></div>
          </div>
          <div className="field"><label>Block reward (coinbase)</label>
            <input type="number" min="0" step="any" value={reward} onChange={(e) => setReward(e.target.value)} /></div>
        </IReveal>

        <IReveal className="glass panel" delay={0.05}>
          <h4><IIcon name="Coins" size={15} /> Genesis allocations <span className="count">{iCoin(total)} total</span></h4>
          {premines.map((w, i) => (
            <div className="premine" key={i}>
              <span className="nm">{w.name}</span>
              <input className="field" style={{ padding: "0.5rem 0.6rem" }} type="number" min="0" step="any" value={w.premine}
                onChange={(e) => setPre(i, e.target.value)} />
              <span className="caption" style={{ width: 42 }}>{(ticker || "").toUpperCase()}</span>
            </div>
          ))}
          <button className="btn btn-accent" style={{ marginTop: "0.9rem" }} onClick={create}>
            <IIcon name="Sparkles" size={16} /> Create genesis &amp; reset chain
          </button>
        </IReveal>
      </div>
    </section>
  );
}

/* ---------------- Recap + footer ---------------- */
const RECAP = [
  { icon: "Hash", t: "Hashing", d: "SHA-256 turns any input into a fixed 64-character fingerprint. It's one-way and deterministic: the same data always hashes the same, but flip a single character and the entire hash changes unpredictably." },
  { icon: "Link2", t: "Linking", d: "Each block stores the previous block's hash inside its own hashed data. That back-reference chains the blocks in order, so editing any past block is detectable from every block after it." },
  { icon: "Pickaxe", t: "Proof of work", d: "A valid block's hash must start with N zeros, found only by trying nonce after nonce. The electricity and time that search costs are what make rewriting confirmed history impractical." },
  { icon: "Wallet", t: "Balances", d: "No balance is stored anywhere. Each wallet's total is recomputed on the fly by replaying every coinbase reward and transfer in the chain — the blocks are the only source of truth." },
];
function Recap({ chain }) {
  return (
    <section className="container section" id="recap">
      <IReveal className="eyebrow" as="span">What you just built</IReveal>
      <IReveal as="h2" className="h-2" delay={0.05} style={{ margin: "0.8rem 0 2rem" }}>The whole idea, in four moves.</IReveal>
      <div className="recap">
        {RECAP.map((r, i) => (
          <IReveal key={r.t} delay={0.04 * i}>
            <div className="glass panel" style={{ height: "100%" }}>
              <div className="item">
                <IIcon name={r.icon} size={22} className="dot" />
                <div>
                  <div style={{ fontWeight: 600, fontFamily: "var(--font-display)", marginBottom: "0.3rem" }}>{r.t}</div>
                  <p className="body">{r.d}</p>
                </div>
              </div>
            </div>
          </IReveal>
        ))}
      </div>
    </section>
  );
}

function Footer({ chain }) {
  return (
    <footer className="pg-footer">
      <div className="container">
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.4rem" }}>
          <img src={ITC_LOGO} alt="" style={{ width: 28, height: 28, borderRadius: "50%" }} />
          <strong style={{ color: "var(--soft-white)", fontFamily: "var(--font-display)" }}>{chain.config.chainName} Playground</strong>
        </div>
        <p style={{ maxWidth: "62ch" }}>
          A teaching toy that runs a genuine proof-of-work blockchain entirely in your browser. It is not connected to
          any live network. Interchained is a digital asset and coordination layer for builder-owned infrastructure.
        </p>
        <div className="links">
          <a href="https://interchained.org" target="_blank" rel="noreferrer">Interchained ↗</a>
          <a href="https://aiassist.net" target="_blank" rel="noreferrer">AiAssist Secure ↗</a>
          <a href="https://github.com/interchained" target="_blank" rel="noreferrer">GitHub ↗</a>
          <a href="Interchained Explainer.html">Back to the explainer →</a>
        </div>
      </div>
    </footer>
  );
}

window.Intro = { Header, Hero, ConceptBeats, GenesisLab, Recap, Footer };
