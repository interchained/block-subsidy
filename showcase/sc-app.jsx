/* =============================================================================
   sc-app.jsx — composes the ITC Showcase booth journey and wires Tweaks.
   Adds scroll-spy nav highlighting + a top progress rail. Mounts to #root.
   ============================================================================= */
const { TopBar, Hero, Foundation, DAASection, MigrationSection, Numbers, Eco, WhyITC, SCFooter } = window.SC;

const ITC_ACCENTS = ["#22d3ee", "#34d399", "#a78bfa", "#60a5fa"];
const BTC_ACCENTS = ["#f7931a", "#fb923c", "#f59e0b", "#eab308"];

const SC_DEFAULTS = /*EDITMODE-BEGIN*/{
  "speed": 1,
  "itc": "#22d3ee",
  "btc": "#f7931a"
}/*EDITMODE-END*/;

function setVar(name, val) { document.documentElement.style.setProperty(name, val); }

function ScTicker() {
  return (
    <span className="sc-ticker">
      <span className="pip btc"><b>BTC</b> · 2,016-block epoch</span>
      <span className="pip itc"><b>ITC</b> · re-targets every block</span>
    </span>
  );
}

function ScApp() {
  const [t, setTweak] = window.useTweaks(SC_DEFAULTS);

  React.useEffect(() => { setVar("--itc", t.itc); }, [t.itc]);
  React.useEffect(() => { setVar("--btc", t.btc); }, [t.btc]);
  React.useEffect(() => { setVar("--sc-speed", String(t.speed)); }, [t.speed]);

  /* scroll-spy + progress rail */
  React.useEffect(() => {
    const rail = document.getElementById("sc-rail");
    const ids = ["foundation", "daa", "migration", "numbers", "eco", "why"];
    const navLinks = Array.from(document.querySelectorAll(".sc-nav a"));
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        const p = max > 0 ? Math.min(1, doc.scrollTop / max) : 0;
        if (rail) rail.style.setProperty("--sc-progress", p.toFixed(4));
        // active section = last whose top is above mid-viewport
        const mid = window.innerHeight * 0.4;
        let active = ids[0];
        for (const id of ids) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= mid) active = id;
        }
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
      <div className="sc-rail" id="sc-rail" />
      <TopBar ticker={<ScTicker />} />
      <Hero />
      <Foundation />
      <DAASection speed={t.speed} />
      <MigrationSection />
      <Numbers />
      <Eco />
      <WhyITC />
      <SCFooter />
      <ScTweaks t={t} setTweak={setTweak} />
    </>
  );
}

function ScTweaks({ t, setTweak }) {
  const { TweaksPanel, TweakSection, TweakSlider, TweakColor } = window;
  if (!TweaksPanel) return null;
  return (
    <TweaksPanel>
      <TweakSection label="Booth" />
      <TweakSlider label="Sim & animation speed" value={t.speed} min={0.5} max={3} step={0.1} unit="×"
        onChange={(v) => setTweak("speed", v)} />
      <TweakSection label="Accents" />
      <TweakColor label="Interchained" value={t.itc} options={ITC_ACCENTS} onChange={(v) => setTweak("itc", v)} />
      <TweakColor label="Bitcoin" value={t.btc} options={BTC_ACCENTS} onChange={(v) => setTweak("btc", v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ScApp />);
