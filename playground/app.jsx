/* =============================================================================
   app.jsx — composes the playground + wires Tweaks (difficulty, accent, speed,
   chain name/ticker, tamper demo). Mounts to #root.
   ============================================================================= */
const { Header, Hero, ConceptBeats, GenesisLab, Recap, Footer } = window.Intro;
const { WalletsPanel, TxForm, MempoolPanel, MiningPanel, ChainView } = window.Lab;
const { useChain } = window.PGState;
const { Icon: AIcon } = window.PGUI;

const ACCENTS = ["#22d3ee", "#facc15", "#34d399", "#a78bfa", "#60a5fa"];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "difficulty": 4,
  "accent": "#22d3ee",
  "speed": 1,
  "chainName": "Interchained",
  "ticker": "ITC",
  "showTamper": true
}/*EDITMODE-END*/;

function applyAccent(hex) {
  document.documentElement.style.setProperty("--pg-accent", hex || "#22d3ee");
}

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const difficulty = Math.round(t.difficulty);
  const chain = useChain(difficulty, 3000);

  /* mine the genesis block once on first mount */
  const started = React.useRef(false);
  React.useEffect(() => {
    if (started.current) return;
    started.current = true;
    chain.reset({ ...window.PGState.defaultConfig(), chainName: t.chainName, ticker: t.ticker });
  }, []);

  /* tweak side effects */
  React.useEffect(() => applyAccent(t.accent), [t.accent]);
  React.useEffect(() => { document.documentElement.style.setProperty("--pg-speed", String(t.speed)); }, [t.speed]);
  React.useEffect(() => { chain.rebrand(t.chainName, t.ticker); }, [t.chainName, t.ticker]);

  return (
    <>
      <Header chain={chain} difficulty={difficulty} />
      <Hero chain={chain} />
      <ConceptBeats />

      <section className="container section" id="lab" style={{ paddingTop: "1rem" }}>
        <span className="eyebrow">The lab</span>
        <h2 className="h-2" style={{ margin: "0.8rem 0 0.5rem" }}>Run the chain yourself.</h2>
        <p className="lead" style={{ maxWidth: "62ch", marginBottom: "2rem" }}>
          Move tokens between wallets to fill the mempool, then mine a block to confirm them. Every hash here is real —
          watch the nonce climb until the target is hit.
        </p>
        <div className="lab">
          <aside className="lab-aside">
            <WalletsPanel chain={chain} />
            <TxForm chain={chain} />
            <MempoolPanel chain={chain} />
          </aside>
          <main>
            <MiningPanel chain={chain} difficulty={difficulty} />
            <ChainView chain={chain} difficulty={difficulty} tamperEnabled={t.showTamper} />
          </main>
        </div>

        {t.showTamper && (
          <div className="glass panel" style={{ marginTop: "1.5rem", borderColor: "var(--pg-accent-line)" }}>
            <h4 style={{ color: "var(--pg-accent)" }}><AIcon name="ShieldCheck" size={15} /> Immutability — why the past is hard to rewrite</h4>
            <p className="body" style={{ maxWidth: "78ch" }}>
              Each confirmed amount in the blocks above is editable, so you can play the attacker. Change one and you'll
              see why it doesn't work: the edit changes that block's hash, which no longer clears the proof-of-work target
              and no longer matches the next block's back-reference — so honest nodes reject it on sight. To make a forged
              history actually stick, an attacker would have to redo the proof of work for that block <em>and every block
              after it</em>, faster than the rest of the network keeps extending the honest chain. That race is the whole
              security model — re-mining below lets you feel exactly how much work it takes.
            </p>
          </div>
        )}
      </section>

      <GenesisLab chain={chain} />
      <Recap chain={chain} />
      <Footer chain={chain} />

      <TweaksUI t={t} setTweak={setTweak} chain={chain} />
    </>
  );
}

/* ---------------- Tweaks panel ---------------- */
function TweaksUI({ t, setTweak }) {
  const { TweaksPanel, TweakSection, TweakSlider, TweakToggle, TweakColor, TweakText } = window;
  if (!TweaksPanel) return null;
  return (
    <TweaksPanel>
      <TweakSection label="Mining" />
      <TweakSlider label="Difficulty (leading zeros)" value={t.difficulty} min={2} max={5} step={1}
        onChange={(v) => setTweak("difficulty", v)} />
      <TweakSlider label="Animation speed" value={t.speed} min={0.5} max={2} step={0.1} unit="×"
        onChange={(v) => setTweak("speed", v)} />
      <TweakToggle label="Immutability lesson" value={t.showTamper} onChange={(v) => setTweak("showTamper", v)} />

      <TweakSection label="Branding" />
      <TweakText label="Chain name" value={t.chainName} onChange={(v) => setTweak("chainName", v)} />
      <TweakText label="Token ticker" value={t.ticker} onChange={(v) => setTweak("ticker", (v || "").toUpperCase().slice(0, 5))} />
      <TweakColor label="Accent" value={t.accent} options={ACCENTS}
        onChange={(v) => setTweak("accent", v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
