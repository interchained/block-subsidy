/* =============================================================================
   pg-shared.jsx — small shared primitives for the playground UI.
   Icon (lucide wrapper), Reveal (scroll-in), and formatting helpers.
   Exposed on window.PGUI.
   ============================================================================= */
const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ---- lucide icon wrapper (defensive, same approach as the explainer) ---- */
function Icon({ name, size = 20, strokeWidth = 2, className = "", style = {} }) {
  const L = window.lucide || {};
  let node = L[name] || (L.icons && L.icons[name]);
  // lucide ships icons in two shapes across versions:
  //   legacy: [[tag, attrs], ...]                  (node[0] is an array)
  //   0.4xx : ["svg", svgAttrs, [[tag, attrs], ...]] (node[0] is the string "svg")
  let children = null;
  if (Array.isArray(node)) {
    if (typeof node[0] === "string" && Array.isArray(node[2])) children = node[2];
    else if (Array.isArray(node[0])) children = node;
  }
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
      strokeLinejoin="round" className={className} style={style} aria-hidden="true"
    >
      {children
        ? children.map((c, i) => React.createElement(c[0], { key: i, ...c[1] }))
        : <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}

/* ---- reveal on scroll ---- */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [state, setState] = useState({ inView: false, animate: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Already on screen at mount → show immediately, no entrance animation
    // (avoids animations being stranded while the genesis miner jams the thread).
    if (r.top < window.innerHeight * 0.92 && r.bottom > 0) { setState({ inView: true, animate: false }); return; }
    if (typeof IntersectionObserver === "undefined") { setState({ inView: true, animate: false }); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setState({ inView: true, animate: true }); io.disconnect(); }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, state.inView, state.animate];
}
function Reveal({ children, delay = 0, as: Tag = "div", className = "", style = {}, ...rest }) {
  const [ref, inView, animate] = useInView();
  return (
    <Tag ref={ref} className={className}
      style={{
        opacity: inView ? 1 : 0,
        animation: animate ? `pgRise .6s ${delay}s both cubic-bezier(.22,1,.36,1)` : "none",
        ...style,
      }} {...rest}>
      {children}
    </Tag>
  );
}

/* ---- formatting ---- */
function shortHash(h, head = 10, tail = 6) {
  if (!h) return "";
  if (h.length <= head + tail + 1) return h;
  return h.slice(0, head) + "…" + h.slice(-tail);
}
function fmtNum(n) {
  if (n == null) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return String(Math.round(n));
}
/* token amounts — shows up to 7 decimals, trims trailing zeros, groups thousands */
function fmtCoin(n) {
  if (n == null || isNaN(n)) return "0";
  const neg = n < 0;
  let r = Math.round(Math.abs(n) * 1e7) / 1e7;
  let s;
  if (Number.isInteger(r)) {
    s = r.toLocaleString("en-US");
  } else {
    const fixed = r.toFixed(7).replace(/0+$/, "").replace(/\.$/, "");
    const [i, d] = fixed.split(".");
    s = Number(i).toLocaleString("en-US") + (d ? "." + d : "");
  }
  return (neg ? "-" : "") + s;
}
function fmtRate(r) {
  if (!r || !isFinite(r)) return "0 H/s";
  if (r >= 1e6) return (r / 1e6).toFixed(2) + " MH/s";
  if (r >= 1e3) return (r / 1e3).toFixed(1) + " kH/s";
  return Math.round(r) + " H/s";
}
function fmtTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/* split a hash into its leading-zero run + the rest, for colored rendering */
function HashColored({ value, difficulty, className = "" }) {
  if (!value) return null;
  let z = 0;
  while (z < value.length && value[z] === "0") z++;
  const lead = value.slice(0, z);
  const rest = value.slice(z);
  return (
    <span className={className}>
      <span className="zeros">{lead}</span><span>{rest}</span>
    </span>
  );
}

window.PGUI = { Icon, Reveal, useInView, shortHash, fmtNum, fmtCoin, fmtRate, fmtTime, HashColored };
