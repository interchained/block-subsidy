/* =============================================================================
   shared.jsx — hooks, Icon, Section, GlassCard, Navigation,
   ProgressIndicator, PitchModeControls, NetworkGraph.
   ============================================================================= */
const { useState, useEffect, useRef, useCallback } = React;

/* ---------------- reduced motion ---------------- */
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/* ---------------- reveal on scroll ---------------- */
function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    const reveal = () => { if (!done) { done = true; setInView(true); cleanup(); } };
    const check = () => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.88 && r.bottom > 0) { reveal(); return true; }
      return false;
    };
    const onScroll = () => { check(); };
    const cleanup = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (io) io.disconnect();
    };
    // 1) immediate check (works even when IntersectionObserver doesn't fire)
    if (check()) return cleanup;
    // 2) IntersectionObserver when available
    let io = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(([e]) => { if (e.isIntersecting) reveal(); }, { threshold: 0.2 });
      io.observe(el);
    }
    // 3) scroll/resize fallback
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return cleanup;
  }, []);
  return [ref, inView];
}

/* Reveal: wraps children, adds .in when scrolled into view. Supports stagger. */
function Reveal({ children, delay = 0, as: Tag = "div", className = "", style = {}, ...rest }) {
  const [ref, inView] = useInView();
  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? "in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}s`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ---------------- scroll spy ---------------- */
function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const handler = () => {
      const mid = window.innerHeight * 0.38;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= mid) current = id;
      }
      setActive(current);
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler);
    return () => { window.removeEventListener("scroll", handler); window.removeEventListener("resize", handler); };
  }, [ids.join(",")]);
  return active;
}

/* ---------------- count up ---------------- */
function useCountUp(target, inView, reduced) {
  const [val, setVal] = useState(reduced ? target : 0);
  useEffect(() => {
    if (!inView) return;
    if (reduced) { setVal(target); return; }
    let raf, start;
    const dur = 1200;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, reduced]);
  return val;
}

/* ---------------- pitch mode ---------------- */
function usePitchMode(ids) {
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const idxRef = useRef(0);
  idxRef.current = index;
  const animating = useRef(false);

  const scrollToIdx = useCallback((clamped) => {
    const el = document.getElementById(ids[clamped]);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset;
    animating.current = true;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    window.clearTimeout(scrollToIdx._t);
    scrollToIdx._t = window.setTimeout(() => { animating.current = false; }, 700);
  }, [ids]);

  const goTo = useCallback((i) => {
    const clamped = Math.max(0, Math.min(ids.length - 1, i));
    idxRef.current = clamped;
    setIndex(clamped);
    scrollToIdx(clamped);
  }, [ids, scrollToIdx]);

  const enter = useCallback(() => {
    setActive(true);
    document.body.classList.add("pitch-locked");
    const mid = window.innerHeight * 0.4;
    let cur = 0;
    ids.forEach((id, i) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= mid) cur = i; });
    idxRef.current = cur;
    setIndex(cur);
    requestAnimationFrame(() => scrollToIdx(cur));
  }, [ids, scrollToIdx]);

  const exit = useCallback(() => {
    setActive(false);
    document.body.classList.remove("pitch-locked");
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      // ignore when typing in a field
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === "Escape") { e.preventDefault(); exit(); }
      else if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); goTo(idxRef.current + 1); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); goTo(idxRef.current - 1); }
      else if (e.key === "Home") { e.preventDefault(); goTo(0); }
      else if (e.key === "End") { e.preventDefault(); goTo(ids.length - 1); }
      // ArrowUp/Down, Space and the wheel are left alone so tall sections
      // can be read freely — navigation is via buttons / arrows / page keys.
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, goTo, exit, ids.length]);

  return { active, index, enter, exit, goTo };
}

/* ---------------- Icon (lucide UMD wrapper, defensive) ---------------- */
function Icon({ name, size = 22, strokeWidth = 2, className = "", style = {} }) {
  const L = window.lucide || {};
  let node = L[name] || (L.icons && L.icons[name]);
  // lucide may nest the icon array; normalize to array-of-children
  if (node && node.length && typeof node[0] === "string") node = null; // unexpected shape
  const children = Array.isArray(node) ? node : null;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style} aria-hidden="true"
    >
      {children
        ? children.map((c, i) => {
            const [tag, attrs] = c;
            return React.createElement(tag, { key: i, ...attrs });
          })
        : <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}

/* ---------------- Section wrapper ---------------- */
function Section({ id, children, className = "" }) {
  return (
    <section id={id} className={`section ${className}`} data-screen-label={id}>
      <div className="container">{children}</div>
    </section>
  );
}

/* ---------------- GlassCard (the one card primitive) ---------------- */
function GlassCard({ children, className = "", accent = "cyan", glow = false, style = {}, ...rest }) {
  const glowClass = glow ? (accent === "gold" ? "glow glow-gold" : "glow") : "";
  return (
    <div className={`glass ${glowClass} ${className}`} style={style} {...rest}>
      {children}
    </div>
  );
}

/* ---------------- LogoBadge (rounded glass tile holding a brand logo) ---------------- */
function LogoBadge({ src, alt, accent = "cyan", size = 52 }) {
  return (
    <span className={`logo-badge ${accent === "gold" ? "gold" : ""}`} style={{ width: size, height: size }}>
      <img src={src} alt={alt} />
    </span>
  );
}

window.Shared = {
  useReducedMotion, useInView, Reveal, useScrollSpy, useCountUp, usePitchMode,
  Icon, Section, GlassCard, LogoBadge,
};
