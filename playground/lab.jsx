/* =============================================================================
   lab.jsx — the interactive playground UI.
   WalletsPanel · TxForm · Mempool · MiningPanel · ChainView (+ BlockCard tamper)
   Reads everything from a `chain` object (see pg-state.jsx useChain). On window.Lab.
   ============================================================================= */
const { Icon: LIcon, Reveal: LReveal, shortHash, fmtNum, fmtCoin, fmtRate, fmtTime, HashColored } = window.PGUI;

/* resolve a tx party id to a display name */
function partyName(id, chain) {
  if (id === "COINBASE") return "COINBASE";
  const w = chain.walletById(id);
  return w ? w.name : "—";
}

/* ---------------- Wallets ---------------- */
function WalletsPanel({ chain }) {
  const { wallets, balances, config } = chain;
  return (
    <div className="panel glass">
      <h4><LIcon name="Wallet" size={15} /> Wallets <span className="count">{config.ticker}</span></h4>
      {wallets.map((w) => (
        <div className="wallet" key={w.id}>
          <span className="avatar" style={{ background: w.color }}>{w.name[0]}</span>
          <span className="info">
            <div className="nm">{w.name}</div>
            <div className="addr">{w.address}</div>
          </span>
          <span className="bal">{fmtCoin(balances[w.id] || 0)} <small>{config.ticker}</small></span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- New transaction ---------------- */
function TxForm({ chain }) {
  const { wallets, config, addTx, available } = chain;
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [note, setNote] = React.useState("");
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    if (wallets.length && !from) { setFrom(wallets[1] ? wallets[1].id : wallets[0].id); }
    if (wallets.length && !to) { setTo(wallets[2] ? wallets[2].id : wallets[0].id); }
  }, [wallets]);

  const submit = () => {
    setErr("");
    const amt = Number(amount);
    if (!from || !to) return setErr("Pick both wallets.");
    if (from === to) return setErr("Sender and recipient must differ.");
    if (!amt || amt <= 0) return setErr("Enter an amount above zero.");
    if (amt > available(from)) return setErr(`${partyName(from, chain)} only has ${fmtCoin(available(from))} ${config.ticker} available.`);
    addTx(from, to, amt, note.trim());
    setAmount(""); setNote("");
  };

  return (
    <div className="panel glass">
      <h4><LIcon name="ArrowLeftRight" size={15} /> New Transaction</h4>
      <div className="row2">
        <div className="field">
          <label>From</label>
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>To</label>
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      </div>
      <div className="row2">
        <div className="field">
          <label>Amount</label>
          <input type="number" min="0" step="any" placeholder="0" value={amount}
            onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        <div className="field">
          <label>Note <span style={{ textTransform: "none", opacity: 0.6 }}>(optional)</span></label>
          <input type="text" placeholder="coffee" value={note} maxLength={24}
            onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
      </div>
      <div className="form-err">{err}</div>
      <button className="btn btn-accent" onClick={submit}>
        <LIcon name="PenLine" size={16} /> Sign &amp; add to mempool
      </button>
    </div>
  );
}

/* ---------------- Mempool ---------------- */
function MempoolPanel({ chain }) {
  const { mempool, removeTx, config } = chain;
  return (
    <div className="panel glass">
      <h4><LIcon name="Clock" size={15} /> Mempool <span className="count">{mempool.length} pending</span></h4>
      {mempool.length === 0
        ? <div className="mempool-empty">No pending transactions. Add one above, then mine a block to confirm it.</div>
        : mempool.map((t) => (
          <div className="memtx" key={t.id}>
            <span>{partyName(t.from, chain)}</span>
            <span className="arrow">→</span>
            <span>{partyName(t.to, chain)}</span>
            <span className="amt">{fmtCoin(t.amount)} {config.ticker}</span>
            <button className="x" title="Discard" onClick={() => removeTx(t.id)}><LIcon name="X" size={14} /></button>
          </div>
        ))}
    </div>
  );
}

/* ---------------- Mining panel (HUD + button) ---------------- */
function MiningPanel({ chain, difficulty }) {
  const { mining, mempool, mine, lastMined, miner, setMiner, wallets, config, blocks, machineRate } = chain;
  const active = !!mining;
  const target = "0".repeat(difficulty);
  const sample = mining && mining.sampleHash ? mining.sampleHash : "";
  const expected = Math.pow(16, difficulty);          // avg hashes to find a block
  const estSec = machineRate > 0 ? expected / machineRate : 0;

  const labelFor = (k) => k === "genesis" ? "Mining genesis block" : k === "remine" ? "Re-mining the chain" : "Mining block";

  return (
    <div className={"panel glass " + (active ? "mining-flash" : "")} style={{ marginBottom: "1.25rem" }}>
      <div className="mine-bar">
        <div className="mine-head">
          <div className="mine-title">
            {active ? `${labelFor(mining.kind)} #${mining.index}` : "Proof of Work"}
            <span className="sub">
              {active
                ? <>Trying nonces until the hash starts with <b style={{ color: "var(--pg-accent)" }}>{difficulty}</b> zero{difficulty > 1 ? "s" : ""}…</>
                : <>Bundle the mempool into a block and find a winning nonce. Difficulty: hash must start with <b style={{ color: "var(--pg-accent)" }}>{target}</b></>}
            </span>
          </div>
          {!active && blocks.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <div className="field" style={{ margin: 0 }}>
                <select value={miner || ""} onChange={(e) => setMiner(e.target.value)}
                  title="Who receives the block reward" style={{ minWidth: 130 }}>
                  {wallets.map((w) => <option key={w.id} value={w.id}>⛏ {w.name}</option>)}
                </select>
              </div>
              <button className="btn btn-accent" style={{ width: "auto", padding: "0.7rem 1.3rem" }} onClick={mine}>
                <LIcon name="Pickaxe" size={16} /> Mine block #{blocks[blocks.length - 1].index + 1}
              </button>
            </div>
          )}
        </div>

        {active ? (
          <>
            <div className="hashview">
              {sample
                ? <><HashColored value={sample} difficulty={difficulty} /></>
                : <span className="rest">hashing…</span>}
              <div style={{ marginTop: "0.4rem", fontSize: "0.78rem" }}>
                <span className="rest">target&nbsp;</span>
                <span className="target">{target}</span><span className="rest">…………………………………………………</span>
              </div>
            </div>
            <div className="hud">
              <div className="cell"><div className="lbl">Nonce</div><div className="num accent">{fmtNum(mining.nonce)}</div></div>
              <div className="cell"><div className="lbl">Hashes tried</div><div className="num">{fmtNum(mining.hashes)}</div></div>
              <div className="cell"><div className="lbl">Hashrate</div><div className="num">{fmtRate(mining.hashrate)}</div></div>
              <div className="cell"><div className="lbl">Target</div><div className="num">{difficulty} zero{difficulty > 1 ? "s" : ""}</div></div>
            </div>
          </>
        ) : (
          <div className="hashpower">
            <div className="hp-meter">
              <div className="hp-head">
                <span><LIcon name="Zap" size={14} style={{ color: "var(--pg-accent)", verticalAlign: "-2px" }} /> Your hashpower</span>
                <b>{machineRate > 0 ? fmtRate(machineRate) : "measuring…"}</b>
              </div>
              <div className="hp-bar"><span style={{ width: machineRate > 0 ? Math.min(100, Math.log10(machineRate) / 6 * 100) + "%" : "8%" }} /></div>
              <div className="hp-note">
                {machineRate > 0
                  ? <>At difficulty <b>{difficulty}</b>, a block averages <b>~{fmtNum(expected)}</b> hashes — about <b>{estSec < 1 ? (estSec * 1000).toFixed(0) + "ms" : estSec.toFixed(1) + "s"}</b> of real work on this machine. Each extra zero multiplies that by 16.</>
                  : <>Benchmarking this machine's SHA-256 throughput…</>}
              </div>
            </div>
            {lastMined && (
              <div className="hud" style={{ marginTop: "0.7rem" }}>
                <div className="cell"><div className="lbl">{lastMined.genesis ? "Genesis in" : `Block #${lastMined.index} in`}</div><div className="num accent">{(lastMined.ms / 1000).toFixed(2)}s</div></div>
                <div className="cell"><div className="lbl">Winning nonce</div><div className="num">{fmtNum(lastMined.hashes - 1)}</div></div>
                <div className="cell"><div className="lbl">Hashes done</div><div className="num">{fmtNum(lastMined.hashes)}</div></div>
                <div className="cell"><div className="lbl">Avg hashrate</div><div className="num">{fmtRate(lastMined.hashrate)}</div></div>
              </div>
            )}
            <div className="hashview" style={{ marginTop: "0.7rem" }}>
              <span className="rest">Ready · {mempool.length} transaction{mempool.length === 1 ? "" : "s"} in the mempool{config.reward > 0 ? ` + ${fmtCoin(config.reward)} ${config.ticker} reward` : ""}.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- A single block card ---------------- */
function BlockCard({ block, status, chain, difficulty, fresh, broken, tamperEnabled }) {
  const [open, setOpen] = React.useState(false);
  const { config } = chain;
  const isGenesis = block.index === 0;
  const ok = status && status.ok && !broken;
  const realTxs = block.txs.filter((t) => t.from !== "COINBASE");

  const tag = isGenesis
    ? <span className="btag genesis">GENESIS</span>
    : ok ? <span className="btag ok">VALID</span> : <span className="btag bad">INVALID</span>;

  return (
    <div className={"glass bcard " + (ok ? "" : "invalid ") + (fresh ? "fresh" : "")}>
      {!isGenesis && (
        <span className="link-badge">↑ prevHash → block #{block.index - 1}</span>
      )}
      <div className="bhead">
        <span className="bnum"><span className="hash-glyph">#</span>{block.index}</span>
        {tag}
        {!ok && status && (
          <span className="btag bad" title="failing checks">
            {!status.powValid ? "PoW ✗" : !status.linkValid ? "link ✗" : "hash ✗"}
          </span>
        )}
        <span className="when">{fmtTime(block.ts)}</span>
      </div>

      {/* transactions */}
      <div className="btxs">
        {block.txs.length === 0 && <div className="btx-empty">empty block — reward only</div>}
        {block.txs.map((t, i) => {
          const cb = t.from === "COINBASE";
          const canTamper = tamperEnabled && !cb;
          return (
            <div className={"btx " + (cb ? "coinbase" : "")} key={t.id || i}>
              <span className="who">{cb ? "⛏ COINBASE" : partyName(t.from, chain)}</span>
              <span className="arrow">→</span>
              <span className="who">{partyName(t.to, chain)}</span>
              {canTamper ? (
                <span className="amt" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <input className="btx-edit" type="number" step="any" defaultValue={t.amount}
                    title="Edit this confirmed amount to tamper with history"
                    onChange={(e) => chain.tamper(block.index, i, e.target.value)} />
                  {config.ticker}
                </span>
              ) : (
                <span className="amt">{cb ? "+" : ""}{fmtCoin(t.amount)} {config.ticker}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* meta */}
      <div className="bmeta">
        <div className="mrow"><span className="mk">Nonce</span><span className="mv">{fmtNum(block.nonce)}</span></div>
        <div className="mrow"><span className="mk">Hash</span><span className={"mv hash " + (ok ? "" : "bad")}><HashColored value={block.hash} difficulty={difficulty} /></span></div>
        {!isGenesis && <div className="mrow"><span className="mk">Prev</span><span className="mv prev">{shortHash(block.prevHash, 14, 8)}</span></div>}
      </div>

      <div className="expand">
        <button className="btn-tiny" onClick={() => setOpen((o) => !o)}>
          <LIcon name={open ? "ChevronUp" : "ChevronDown"} size={14} /> {open ? "Hide" : "Inspect"} internals
        </button>
        {open && status && (
          <div style={{ marginTop: "0.8rem" }}>
            <div className="caption" style={{ marginBottom: "0.5rem" }}>This exact string is what gets SHA-256 hashed:</div>
            <div className="hashview" style={{ fontSize: "0.74rem" }}>
              <span className="rest">{PG.blockBody(block)}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.8rem" }}>
              <CheckCell ok={status.hashValid} label="Hash matches data" />
              <CheckCell ok={status.powValid} label={`Meets difficulty (${status.difficulty})`} />
              <CheckCell ok={status.linkValid} label="Links to previous" />
            </div>
            {!status.hashValid && (
              <div className="caption" style={{ marginTop: "0.6rem", color: "var(--bad)" }}>
                Stored hash ≠ recomputed hash {shortHash(status.recomputed, 10, 6)} — the data was changed after mining.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CheckCell({ ok, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.78rem",
      color: ok ? "var(--good)" : "var(--bad)" }}>
      <LIcon name={ok ? "CheckCircle2" : "XCircle"} size={16} /> {label}
    </div>
  );
}

/* ---------------- Chain view + invalid banner ---------------- */
function ChainView({ chain, difficulty, tamperEnabled }) {
  const { blocks, validation, firstBad, isValid, freshIndex, remine, mining } = chain;
  return (
    <div>
      {!isValid && !mining && (
        <div className="chain-alert">
          <LIcon name="ShieldAlert" size={22} style={{ color: "var(--bad)", flex: "none" }} />
          <span className="txt">
            <b>Block #{firstBad} no longer validates.</b> Editing confirmed data changed its hash, so it stops clearing
            the proof-of-work target and stops matching the next block's back-reference — an honest node would reject the
            chain from here. Re-mining redoes the proof of work for every block from this point forward, so you can feel
            how much an attacker would have to out-compute.
          </span>
          <button className="btn-remine" onClick={remine}><LIcon name="Hammer" size={15} style={{ verticalAlign: "-2px" }} /> Re-mine chain</button>
        </div>
      )}
      <div className="chain">
        {blocks.map((b) => (
          <BlockCard
            key={b.index}
            block={b}
            status={validation[b.index]}
            chain={chain}
            difficulty={difficulty}
            fresh={b.index === freshIndex}
            broken={firstBad !== -1 && b.index > firstBad}
            tamperEnabled={tamperEnabled}
          />
        ))}
        {blocks.length === 0 && !mining && (
          <div className="glass panel" style={{ textAlign: "center", color: "var(--muted-text)" }}>
            No genesis block yet. Create one below to start the chain.
          </div>
        )}
      </div>
    </div>
  );
}

window.Lab = { WalletsPanel, TxForm, MempoolPanel, MiningPanel, ChainView, BlockCard };
