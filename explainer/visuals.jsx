/* =============================================================================
   visuals.jsx — upgraded dimensional, story-driven visuals:
     • NetworkGlobe   (hero)  — canvas 3D node sphere that implodes from
                                 scattered fragments into a unified mesh.
     • BlockchainRail (itc)   — CSS-3D chained cubes with a settlement pulse.
   All reduced-motion aware (render a single static, fully-formed frame).
   ============================================================================= */
const { useRef: useRefV, useEffect: useEffectV, useState: useStateV } = React;

/* ---------- mouse / pointer parallax (returns -1..1 on each axis) ---------- */
function usePointer(ref, reduced) {
  const pos = useRefV({ x: 0, y: 0, tx: 0, ty: 0 });
  useEffectV(() => {
    if (reduced) return;
    const el = ref.current; if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = e.clientX - (r.left + r.width / 2);
      const cy = e.clientY - (r.top + r.height / 2);
      pos.current.tx = Math.max(-1, Math.min(1, cx / (r.width / 2)));
      pos.current.ty = Math.max(-1, Math.min(1, cy / (r.height / 2)));
    };
    const onLeave = () => { pos.current.tx = 0; pos.current.ty = 0; };
    window.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => { window.removeEventListener("pointermove", onMove); el.removeEventListener("pointerleave", onLeave); };
  }, [reduced]);
  return pos;
}

/* =====================================================================
   NetworkGlobe — the hero centerpiece.
   28 nodes on a Fibonacci sphere. On mount they animate from a large
   "scattered/exploded" radius inward to a coherent rotating mesh.
   Depth drives size, opacity, glow. Edges connect near neighbours.
   ===================================================================== */
function NetworkGlobe({ reduced }) {
  const wrapRef = useRefV(null);
  const canvasRef = useRefV(null);
  const pointer = usePointer(wrapRef, reduced);

  useEffectV(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    let raf, W, H, DPR;
    const N = 28;
    const PALETTE = { cyan: [34, 211, 238], blue: [37, 99, 235], gold: [250, 204, 21] };

    // Fibonacci sphere -> base unit positions
    const nodes = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const theta = golden * i;
      // accent: a few nodes are gold (ITC), one is the bright core-ish hub
      const tone = i % 7 === 0 ? "gold" : (i % 3 === 0 ? "blue" : "cyan");
      nodes.push({
        x: Math.cos(theta) * rad, y, z: Math.sin(theta) * rad,
        // scattered start position (exploded outward, randomised)
        sx: (Math.random() * 2 - 1) * 1.7,
        sy: (Math.random() * 2 - 1) * 1.7,
        sz: (Math.random() * 2 - 1) * 1.7,
        tone, pulse: Math.random() * Math.PI * 2,
      });
    }
    // precompute edges: nearest neighbours on the sphere
    const edges = [];
    for (let i = 0; i < N; i++) {
      const dists = [];
      for (let j = 0; j < N; j++) if (j !== i) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y, dz = nodes[i].z - nodes[j].z;
        dists.push([j, dx * dx + dy * dy + dz * dz]);
      }
      dists.sort((a, b) => a[1] - b[1]);
      for (let k = 0; k < 3; k++) { const j = dists[k][0]; if (i < j) edges.push([i, j]); else edges.push([j, i]); }
    }
    const edgeSet = Array.from(new Set(edges.map((e) => e.join("-")))).map((s) => s.split("-").map(Number));

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const r = wrap.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);

    let t0 = null;
    let rotX = 0, rotY = 0;

    function project(p, R, cx, cy) {
      const persp = 2.6;
      const zc = p.z + persp;
      const scale = persp / zc;
      return { X: cx + p.x * R * scale, Y: cy + p.y * R * scale, depth: scale, z: p.z };
    }

    function frame(ts) {
      if (t0 == null) t0 = ts;
      const elapsed = (ts - t0) / 1000;
      // intro implosion: 0..1 over ~1.6s, eased
      const introT = Math.min(elapsed / 1.6, 1);
      const intro = 1 - Math.pow(1 - introT, 3); // 0 scattered -> 1 formed

      // smooth pointer follow
      pointer.current.x += (pointer.current.tx - pointer.current.x) * 0.06;
      pointer.current.y += (pointer.current.ty - pointer.current.y) * 0.06;

      // auto-rotate + pointer parallax
      rotY += 0.0032;
      const px = pointer.current.x, py = pointer.current.y;
      const ax = rotX + py * 0.5;            // tilt with vertical mouse
      const ay = rotY + px * 0.6;            // spin with horizontal mouse

      const cosY = Math.cos(ay), sinY = Math.sin(ay);
      const cosX = Math.cos(ax), sinX = Math.sin(ax);

      const cx = W / 2, cy = H / 2;
      const R = Math.min(W, H) * 0.36;

      ctx.clearRect(0, 0, W, H);

      // compute transformed positions
      const tp = nodes.map((n) => {
        // interpolate scattered -> sphere
        let x = n.sx + (n.x - n.sx) * intro;
        let y = n.sy + (n.y - n.sy) * intro;
        let z = n.sz + (n.z - n.sz) * intro;
        // rotate Y
        let x1 = x * cosY - z * sinY;
        let z1 = x * sinY + z * cosY;
        // rotate X
        let y1 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;
        const pr = project({ x: x1, y: y1, z: z2 }, R, cx, cy);
        return { ...pr, tone: n.tone, pulse: n.pulse };
      });

      // edges first (behind nodes), alpha by depth + intro fade-in
      ctx.lineWidth = 1;
      for (const [i, j] of edgeSet) {
        const a = tp[i], b = tp[j];
        const d = (a.depth + b.depth) / 2;
        const alpha = Math.max(0, (d - 0.62)) * 0.9 * intro;
        if (alpha <= 0.01) continue;
        const grad = ctx.createLinearGradient(a.X, a.Y, b.X, b.Y);
        grad.addColorStop(0, `rgba(34,211,238,${alpha})`);
        grad.addColorStop(1, `rgba(37,99,235,${alpha * 0.7})`);
        ctx.strokeStyle = grad;
        ctx.beginPath(); ctx.moveTo(a.X, a.Y); ctx.lineTo(b.X, b.Y); ctx.stroke();
      }

      // depth sort nodes (far first)
      const order = tp.map((_, i) => i).sort((i, j) => tp[i].z - tp[j].z);
      for (const i of order) {
        const p = tp[i];
        const c = PALETTE[p.tone];
        const pulse = reduced ? 0.5 : (0.5 + 0.5 * Math.sin(elapsed * 1.8 + p.pulse));
        const r = (1.6 + 3.4 * p.depth) * (0.85 + pulse * 0.3);
        const alpha = Math.max(0.15, (p.depth - 0.45) * 1.6);
        // glow
        ctx.beginPath();
        const glowR = r * 3.4;
        const g = ctx.createRadialGradient(p.X, p.Y, 0, p.X, p.Y, glowR);
        g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${0.28 * alpha})`);
        g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        ctx.fillStyle = g;
        ctx.arc(p.X, p.Y, glowR, 0, Math.PI * 2); ctx.fill();
        // node
        ctx.beginPath();
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${Math.min(1, alpha + 0.2)})`;
        ctx.arc(p.X, p.Y, r, 0, Math.PI * 2); ctx.fill();
        // core ring on brightest near nodes
        if (p.depth > 1.05) {
          ctx.beginPath(); ctx.lineWidth = 1.2;
          ctx.strokeStyle = `rgba(248,250,252,${0.5 * alpha})`;
          ctx.arc(p.X, p.Y, r + 2.5, 0, Math.PI * 2); ctx.stroke();
        }
      }

      // central glowing hub
      const coreR = R * 0.16 * (reduced ? 1 : (0.96 + 0.04 * Math.sin(elapsed * 2)));
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.6);
      cg.addColorStop(0, `rgba(34,211,238,${0.5 * intro})`);
      cg.addColorStop(0.5, `rgba(37,99,235,${0.18 * intro})`);
      cg.addColorStop(1, "rgba(37,99,235,0)");
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(cx, cy, coreR * 2.6, 0, Math.PI * 2); ctx.fill();

      if (!reduced) raf = requestAnimationFrame(frame);
    }

    if (reduced) {
      // single formed frame
      t0 = -1600; // force intro=1
      requestAnimationFrame((ts) => { t0 = ts - 2000; frame(ts); });
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [reduced]);

  return (
    <div className="globe" ref={wrapRef}>
      <canvas ref={canvasRef} aria-hidden="true"></canvas>
      <div className="globe-core-mark" aria-hidden="true">
        <img className="globe-core-logo" src={window.DATA.siteConfig.logos.aias} alt="" />
        <img className="globe-core-logo" src={window.DATA.siteConfig.logos.itc} alt="" />
      </div>
      <div className="globe-vignette" aria-hidden="true"></div>
    </div>
  );
}

/* =====================================================================
   BlockchainRail — chained 3D cubes with a settlement pulse travelling
   block to block. Each block = a CSS-3D cube (front/top/side faces).
   ===================================================================== */
function BlockchainRail({ nodes, reduced }) {
  const [lit, setLit] = useStateV(0);
  useEffectV(() => {
    if (reduced) return;
    const id = setInterval(() => setLit((l) => (l + 1) % nodes.length), 900);
    return () => clearInterval(id);
  }, [reduced, nodes.length]);

  return (
    <div className="chain3d" role="img" aria-label="Blockchain settlement layer connecting ecosystem participants">
      <div className="chain3d-scene">
        {nodes.map((label, i) => (
          <React.Fragment key={label}>
            <div className={`block3d ${lit === i ? "lit" : ""}`}>
              <span className="block3d-face front">
                <img className="block3d-logo" src={window.DATA.siteConfig.logos.itc} alt="" aria-hidden="true" />
                <span className="block3d-idx">#{String(i + 1).padStart(2, "0")}</span>
                <span className="block3d-label">{label}</span>
              </span>
              <span className="block3d-face top"></span>
              <span className="block3d-face side"></span>
            </div>
            {i < nodes.length - 1 && (
              <div className={`chain3d-link ${lit === i || lit === i + 1 ? "lit" : ""}`} aria-hidden="true">
                <span className="chain3d-spark"></span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="chain3d-rail" aria-hidden="true"></div>
    </div>
  );
}

/* =====================================================================
   EcoFlowCanvas — living ecosystem hub. Draws spokes + continuous
   particle flows: cyan OUT (center→participant = AiAS utility) and
   gold IN (participant→center = ITC coordination). The selected spoke
   intensifies. A breathing energy core anchors the centre.
   ===================================================================== */
function EcoFlowCanvas({ count, activeIndex, reduced }) {
  const wrapRef = useRefV(null), canvasRef = useRefV(null);
  const activeRef = useRefV(activeIndex);
  activeRef.current = activeIndex;

  useEffectV(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    let raf, W, H, DPR;

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const r = wrap.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);

    const dot = (x, y, r, col, a) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      g.addColorStop(0, `rgba(${col},${a})`);
      g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(${col},${Math.min(1, a + 0.3)})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    };
    const CYAN = "34,211,238", GOLD = "250,204,21";

    let t0 = null;
    function frame(ts) {
      if (t0 == null) t0 = ts;
      const el = (ts - t0) / 1000;
      const cx = W / 2, cy = H / 2;
      const R = Math.min(W, H) * 0.40;
      ctx.clearRect(0, 0, W, H);

      const act = activeRef.current;
      const nodes = [];
      for (let i = 0; i < count; i++) {
        const ang = (-90 + (360 / count) * i) * Math.PI / 180;
        nodes.push({ x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) });
      }

      // spokes
      for (let i = 0; i < count; i++) {
        const isAct = act === i;
        ctx.strokeStyle = isAct ? "rgba(34,211,238,0.35)" : "rgba(148,163,184,0.12)";
        ctx.lineWidth = isAct ? 1.4 : 0.8;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nodes[i].x, nodes[i].y); ctx.stroke();
      }

      // particles along each spoke
      const speed = reduced ? 0 : 0.32;
      for (let i = 0; i < count; i++) {
        const n = nodes[i];
        const isAct = act === i;
        const nCyan = isAct ? 4 : 2, nGold = isAct ? 3 : 2;
        // cyan OUT
        for (let k = 0; k < nCyan; k++) {
          const ph = reduced ? (k + 1) / (nCyan + 1) : ((el * speed + k / nCyan + i * 0.13) % 1);
          const x = cx + (n.x - cx) * ph, y = cy + (n.y - cy) * ph;
          const a = Math.sin(ph * Math.PI) * (isAct ? 0.95 : 0.6);
          dot(x, y, isAct ? 1.7 : 1.3, CYAN, a);
        }
        // gold IN
        for (let k = 0; k < nGold; k++) {
          const ph = reduced ? (k + 1) / (nGold + 1) : ((el * speed * 0.9 + k / nGold + i * 0.21) % 1);
          const x = n.x + (cx - n.x) * ph, y = n.y + (cy - n.y) * ph;
          const a = Math.sin(ph * Math.PI) * (isAct ? 0.9 : 0.5);
          dot(x, y, isAct ? 1.6 : 1.2, GOLD, a);
        }
      }

      // breathing energy core
      const pulse = reduced ? 0.7 : (0.6 + 0.4 * Math.sin(el * 1.6));
      const coreR = R * 0.30;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      cg.addColorStop(0, `rgba(34,211,238,${0.30 * pulse})`);
      cg.addColorStop(0.6, `rgba(37,99,235,${0.10 * pulse})`);
      cg.addColorStop(1, "rgba(37,99,235,0)");
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2); ctx.fill();
      // rotating ring arcs
      if (!reduced) {
        const rr = R * 0.22, rot = el * 0.6;
        for (let s = 0; s < 3; s++) {
          ctx.strokeStyle = `rgba(34,211,238,${0.25 - s * 0.05})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, rr + s * 4, rot + s * 2, rot + s * 2 + 1.7);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [count, reduced]);

  return <div className="eco-flow-canvas" ref={wrapRef}><canvas ref={canvasRef} aria-hidden="true"></canvas></div>;
}

/* =====================================================================
   LoopOrbitCanvas — an ITC value token orbits the closed loop with a
   comet trail, returning to start (loop, not funnel). Reports the
   currently-passed node via onActive so HTML nodes light in sequence.
   ===================================================================== */
function LoopOrbitCanvas({ count, onActive, reduced }) {
  const wrapRef = useRefV(null), canvasRef = useRefV(null);
  const lastIdx = useRefV(-1);

  useEffectV(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    let raf, W, H, DPR;
    const T = 8.4; // seconds per full loop

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const r = wrap.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);

    const posAt = (frac, cx, cy, R) => {
      const a = (-90 + frac * 360) * Math.PI / 180;
      return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
    };

    let t0 = null;
    function frame(ts) {
      if (t0 == null) t0 = ts;
      const el = (ts - t0) / 1000;
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.42;
      ctx.clearRect(0, 0, W, H);

      // faint track
      ctx.strokeStyle = "rgba(148,163,184,0.14)"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

      const frac = reduced ? 0 : ((el / T) % 1);

      // lit arc behind the comet (progress glow)
      ctx.strokeStyle = "rgba(34,211,238,0.5)"; ctx.lineWidth = 2.4; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cx, cy, R, (-90 + (frac - 0.16) * 360) * Math.PI / 180, (-90 + frac * 360) * Math.PI / 180);
      ctx.stroke();

      // comet trail
      const TRAIL = reduced ? 0 : 14;
      for (let i = TRAIL; i >= 0; i--) {
        const f = frac - i * 0.006;
        const [x, y] = posAt((f + 1) % 1, cx, cy, R);
        const a = (1 - i / (TRAIL + 1)) * 0.5;
        const col = i < TRAIL / 2 ? "34,211,238" : "250,204,21";
        ctx.fillStyle = `rgba(${col},${a})`;
        ctx.beginPath(); ctx.arc(x, y, 2.2 * (1 - i / (TRAIL + 2)), 0, Math.PI * 2); ctx.fill();
      }
      // comet head (the ITC token)
      const [hx, hy] = posAt(frac, cx, cy, R);
      const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 16);
      hg.addColorStop(0, "rgba(250,204,21,0.9)");
      hg.addColorStop(0.4, "rgba(34,211,238,0.45)");
      hg.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hx, hy, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(hx, hy, 3.4, 0, Math.PI * 2); ctx.fill();

      // active node detection
      const idx = ((Math.round(frac * count) % count) + count) % count;
      if (idx !== lastIdx.current) { lastIdx.current = idx; if (onActive) onActive(idx); }

      raf = requestAnimationFrame(frame);
    }
    if (reduced && onActive) onActive(-1);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [count, reduced]);

  return <div className="loop-orbit-canvas" ref={wrapRef}><canvas ref={canvasRef} aria-hidden="true"></canvas></div>;
}

/* =====================================================================
   StackDiagram — the pivotal "Current Stack" → "Interchained + AiAS"
   transformation. Animates a single p value (0 current → 1 fixed):
     • modules fly from a scattered mess into an even owned ring
     • red broken connectors heal into solid cyan spokes
     • CURRENT: red data leaks OUT to cloud nodes (exposure) + cost cues
     • FIXED:   cyan data flows IN to the owned core (unified, private)
   Reduced-motion: renders the target state statically.
   ===================================================================== */
function StackDiagram({ mode, reduced }) {
  const wrapRef = useRefV(null), canvasRef = useRefV(null);
  const targetRef = useRefV(mode === "fixed" ? 1 : 0);
  targetRef.current = mode === "fixed" ? 1 : 0;

  useEffectV(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    let raf, W, H, DPR;

    // virtual layout (360 x 250) scaled to canvas
    const VW = 360, VH = 250, core = { x: 180, y: 130 };
    const mods = [
      { t: "CRM",       fx: 180, fy: 30,  cx: 150, cy: 24,  cloud: "R" },
      { t: "Chatbot",   fx: 264, fy: 82,  cx: 304, cy: 56,  cloud: "R" },
      { t: "Support",   fx: 264, fy: 178, cx: 296, cy: 200, cloud: "R" },
      { t: "Agents",    fx: 180, fy: 230, cx: 150, cy: 232, cloud: "L" },
      { t: "Portal",    fx: 96,  fy: 178, cx: 52,  cy: 204, cloud: "L" },
      { t: "Analytics", fx: 96,  fy: 82,  cx: 60,  cy: 52,  cloud: "L" },
    ];
    const clouds = { L: { x: 42, y: 26 }, R: { x: 318, y: 26 } };

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const r = wrap.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);

    const lerp = (a, b, t) => a + (b - a) * t;
    const mix = (c1, c2, t) => [Math.round(lerp(c1[0], c2[0], t)), Math.round(lerp(c1[1], c2[1], t)), Math.round(lerp(c1[2], c2[2], t))];
    const RED = [239, 68, 68], CYAN = [34, 211, 238], GOLD = [250, 204, 21];

    let p = targetRef.current; // animated state
    let t0 = null;

    function frame(ts) {
      if (t0 == null) t0 = ts;
      const el = (ts - t0) / 1000;
      // ease p toward target
      const tgt = targetRef.current;
      p += (tgt - p) * (reduced ? 1 : 0.08);
      if (reduced) p = tgt;
      const e = p; // already smoothed

      const sx = W / VW, sy = H / VH, s = Math.min(sx, sy);
      const ox = (W - VW * s) / 2, oy = (H - VH * s) / 2;
      const TX = (x) => ox + x * s, TY = (y) => oy + y * s;
      ctx.clearRect(0, 0, W, H);

      const cInv = 1 - e;
      const coreX = TX(core.x), coreY = TY(core.y);

      // ---- clouds + cost cues (current only) ----
      const cloudA = cInv;
      if (cloudA > 0.01) {
        for (const key of ["L", "R"]) {
          const c = clouds[key], x = TX(c.x), y = TY(c.y);
          ctx.fillStyle = `rgba(239,68,68,${0.10 * cloudA})`;
          ctx.strokeStyle = `rgba(239,68,68,${0.55 * cloudA})`;
          ctx.lineWidth = 1.2;
          const w = 50 * s, h = 26 * s;
          roundRect(ctx, x - w / 2, y - h / 2, w, h, 7 * s); ctx.fill(); ctx.stroke();
          ctx.fillStyle = `rgba(248,250,252,${0.7 * cloudA})`;
          ctx.font = `${10 * s}px "Space Grotesk", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("3rd-party cloud", x, y);
        }
      }

      // ---- connectors ----
      for (const m of mods) {
        const mx = TX(lerp(m.cx, m.fx, e)), my = TY(lerp(m.cy, m.fy, e));
        // far endpoint: 62% toward core (broken) at current -> core at fixed
        const fx = lerp(mx + (coreX - mx) * 0.62, coreX, e);
        const fy = lerp(my + (coreY - my) * 0.62, coreY, e);
        const col = mix(RED, CYAN, e);
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${0.35 + 0.4 * e})`;
        ctx.lineWidth = lerp(1.4, 2.2, e) * s;
        ctx.setLineDash([6 * s, lerp(7, 0.5, e) * s]);
        ctx.lineDashOffset = reduced ? 0 : -el * 30 * s;
        ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(fx, fy); ctx.stroke();
      }
      ctx.setLineDash([]);

      // ---- leak particles (current): module -> cloud, red ----
      if (cInv > 0.02) {
        for (let i = 0; i < mods.length; i++) {
          const m = mods[i];
          const mx = TX(lerp(m.cx, m.fx, e)), my = TY(lerp(m.cy, m.fy, e));
          const cl = clouds[m.cloud], gx = TX(cl.x), gy = TY(cl.y);
          for (let k = 0; k < 2; k++) {
            const ph = reduced ? 0.5 : ((el * 0.5 + k * 0.5 + i * 0.17) % 1);
            const x = lerp(mx, gx, ph), y = lerp(my, gy, ph);
            const a = Math.sin(ph * Math.PI) * 0.85 * cInv;
            glowDot(ctx, x, y, 1.6 * s, RED, a);
          }
        }
      }

      // ---- unify particles (fixed): module -> core, cyan/gold ----
      if (e > 0.02) {
        for (let i = 0; i < mods.length; i++) {
          const m = mods[i];
          const mx = TX(lerp(m.cx, m.fx, e)), my = TY(lerp(m.cy, m.fy, e));
          for (let k = 0; k < 2; k++) {
            const ph = reduced ? 0.5 : ((el * 0.55 + k * 0.5 + i * 0.13) % 1);
            const x = lerp(mx, coreX, ph), y = lerp(my, coreY, ph);
            const a = Math.sin(ph * Math.PI) * 0.85 * e;
            glowDot(ctx, x, y, 1.6 * s, i % 3 === 0 ? GOLD : CYAN, a);
          }
        }
      }

      // ---- module nodes ----
      for (const m of mods) {
        const mx = TX(lerp(m.cx, m.fx, e)), my = TY(lerp(m.cy, m.fy, e));
        const col = mix(RED, CYAN, e);
        const r = 19 * s;
        ctx.fillStyle = "rgba(14,20,48,0.95)";
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${0.5 + 0.4 * e})`;
        ctx.lineWidth = 1.4 * s;
        ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = `rgba(248,250,252,${0.7 + 0.3 * e})`;
        ctx.font = `${9.5 * s}px "Space Grotesk", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(m.t, mx, my);
      }

      // ---- core ----
      const ccol = mix(RED, CYAN, e);
      const cr = 26 * s;
      const cg = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, cr * 2.4);
      cg.addColorStop(0, `rgba(${ccol[0]},${ccol[1]},${ccol[2]},${0.35 + 0.3 * e})`);
      cg.addColorStop(1, `rgba(${ccol[0]},${ccol[1]},${ccol[2]},0)`);
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(coreX, coreY, cr * 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(11,16,36,0.95)";
      ctx.strokeStyle = `rgba(${ccol[0]},${ccol[1]},${ccol[2]},${0.7 + 0.3 * e})`;
      ctx.lineWidth = 1.8 * s;
      ctx.beginPath(); ctx.arc(coreX, coreY, cr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#f8fafc";
      ctx.font = `600 ${10 * s}px "Space Grotesk", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(e > 0.5 ? "Owned" : "Your", coreX, coreY - 5 * s);
      ctx.fillText(e > 0.5 ? "Core" : "Stack", coreX, coreY + 6 * s);

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [reduced]);

  return <div className="stack-canvas" ref={wrapRef}><canvas ref={canvasRef} aria-hidden="true"></canvas></div>;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function glowDot(ctx, x, y, r, col, a) {
  if (a <= 0.01) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
  g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${a})`);
  g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${Math.min(1, a + 0.3)})`;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

window.Visuals = { NetworkGlobe, BlockchainRail, EcoFlowCanvas, LoopOrbitCanvas, StackDiagram, usePointer };
