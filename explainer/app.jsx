/* =============================================================================
   app.jsx — root App: wires registry -> nav, scroll-spy, progress, pitch mode.
   ============================================================================= */
const { useMemo: useMemoA } = React;
const { useScrollSpy: useSpyA, usePitchMode: usePitchA, useReducedMotion: useRMA } = window.Shared;
const { Navigation: NavA, ProgressIndicator: ProgA, PitchModeControls: PitchCtlA } = window.Chrome;
const { Hero, ProblemSection, AiASSolution, ITCLayer } = window.Sections1;
const { EcosystemDiagram, UseCases, WhyNow, PitchSection, ClosingVision, Footer } = window.Sections2;

function App() {
  const D = window.DATA;
  const ids = useMemoA(() => D.sections.map((s) => s.id), []);
  const active = useSpyA(ids);
  const pitch = usePitchA(ids);

  return (
    <React.Fragment>
      <div className="bg-field"></div>
      <div className="bg-grid"></div>

      <NavA sections={D.sections} active={active} onJump={(id) => { const e = document.getElementById(id); if (e) e.scrollIntoView({ behavior: "smooth" }); }} onPitch={pitch.enter} hidden={pitch.active} />
      <ProgA sections={D.sections} active={pitch.active ? D.sections[pitch.index].id : active} onJump={(id) => { const e = document.getElementById(id); if (e) e.scrollIntoView({ behavior: "smooth" }); }} hidden={pitch.active} />

      <main className={pitch.active ? "is-pitch" : ""}>
        <Hero data={D.hero} summaryLine={D.siteConfig.summaryLine} />
        <ProblemSection data={D.problem} />
        <AiASSolution data={D.aias} />
        <ITCLayer data={D.itc} disclaimer={D.siteConfig.disclaimer} />
        <EcosystemDiagram data={D.ecosystem} />
        <UseCases data={D.useCases} />
        <WhyNow data={D.whyNow} />
        <PitchSection data={D.pitch} />
        <ClosingVision data={D.closing} summaryLine={D.siteConfig.summaryLine} />
      </main>

      <Footer siteConfig={D.siteConfig} />

      {pitch.active && (
        <PitchCtlA
          sections={D.sections}
          index={pitch.index}
          onPrev={() => pitch.goTo(pitch.index - 1)}
          onNext={() => pitch.goTo(pitch.index + 1)}
          onExit={pitch.exit}
        />
      )}
    </React.Fragment>
  );
}

const rootEl = document.getElementById("root");
ReactDOM.createRoot(rootEl).render(<App />);
