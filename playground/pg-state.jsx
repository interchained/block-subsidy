/* =============================================================================
   pg-state.jsx — useChain(): the live blockchain state machine.
   Holds wallets, blocks, mempool, the miner, and the async mining loop.
   All hashing/validation is real (delegates to window.PG). Exposed on window.PGState.
   ============================================================================= */
const { useState: useStateS, useRef: useRefS, useCallback: useCb, useMemo: useMemoS } = React;

const WALLET_PALETTE = ["#facc15", "#22d3ee", "#a78bfa", "#34d399", "#60a5fa", "#fb7185", "#f59e0b"];

function defaultConfig() {
  return {
    chainName: "Interchained",
    ticker: "ITC",
    reward: 0.1030199,
    wallets: [
      { name: "Treasury", premine: 500 },
      { name: "Alice", premine: 150 },
      { name: "Bob", premine: 90 },
      { name: "Carol", premine: 60 },
      { name: "Miner Pool", premine: 0 },
    ],
  };
}

function buildWallets(cfg) {
  return cfg.wallets.map((w, i) => ({
    id: "w" + i + "_" + PG.rnd(3),
    name: w.name,
    address: PG.makeAddress(),
    color: WALLET_PALETTE[i % WALLET_PALETTE.length],
    premine: Number(w.premine) || 0,
  }));
}

function useChain(difficulty, batch) {
  const [config, setConfig] = useStateS(defaultConfig);
  const [wallets, setWallets] = useStateS(() => []);
  const [blocks, setBlocks] = useStateS(() => []);
  const [mempool, setMempool] = useStateS(() => []);
  const [miner, setMiner] = useStateS(null);
  const [mining, setMining] = useStateS(null);     // {kind, index, nonce, hashes, hashrate, sampleHash}
  const [lastMined, setLastMined] = useStateS(null);
  const [freshIndex, setFreshIndex] = useStateS(-1);
  const [machineRate, setMachineRate] = useStateS(0);

  /* benchmark this machine's real SHA-256 throughput once, after first paint */
  React.useEffect(() => {
    const id = setTimeout(() => {
      try {
        let best = 0;
        for (let i = 0; i < 2; i++) best = Math.max(best, PG.benchmark(180));
        setMachineRate(best);
      } catch (e) { /* ignore */ }
    }, 400);
    return () => clearTimeout(id);
  }, []);

  const stopRef = useRefS(false);
  const diffRef = useRefS(difficulty);
  diffRef.current = difficulty;
  const batchRef = useRefS(batch);
  batchRef.current = batch;
  const busyRef = useRefS(false);

  /* ---- create / reset chain: mine the genesis block from premine coinbases ---- */
  const reset = useCb(async (cfgIn) => {
    if (busyRef.current) return;
    const cfg = cfgIn || config;
    const ws = buildWallets(cfg);
    const coinbases = ws
      .filter((w) => w.premine > 0)
      .map((w) => ({ id: PG.txId(), from: "COINBASE", to: w.id, amount: w.premine, note: "genesis allocation" }));
    const genesis = {
      index: 0, ts: Date.now(), prevHash: PG.GENESIS_PREV,
      txs: coinbases, miner: null, nonce: 0, hash: "", difficulty: diffRef.current,
    };
    busyRef.current = true;
    stopRef.current = false;
    setConfig(cfg);
    setWallets(ws);
    setBlocks([]);
    setMempool([]);
    setMiner(ws[ws.length - 1].id);
    setLastMined(null);
    setMining({ kind: "genesis", index: 0, nonce: 0, hashes: 0, hashrate: 0, sampleHash: "" });
    try {
      const res = await PG.mineBlock(genesis, diffRef.current, {
        batch: batchRef.current,
        onProgress: (p) => setMining((m) => m && ({ ...m, nonce: p.nonce, hashes: p.hashes, hashrate: p.hashrate, sampleHash: p.sampleHash })),
        shouldStop: () => stopRef.current,
      });
      genesis.nonce = res.nonce; genesis.hash = res.hash;
      setBlocks([genesis]);
      setFreshIndex(0);
      setLastMined({ index: 0, hashes: res.hashes, ms: res.ms, hashrate: res.hashrate, genesis: true });
    } catch (e) { /* cancelled */ }
    setMining(null);
    busyRef.current = false;
  }, [config]);

  /* ---- balances (confirmed) ---- */
  const balances = useMemoS(() => PG.computeBalances(blocks, wallets), [blocks, wallets]);

  /* available = confirmed balance minus what's already queued as outgoing */
  const pendingOut = useMemoS(() => {
    const m = {};
    mempool.forEach((t) => { m[t.from] = (m[t.from] || 0) + t.amount; });
    return m;
  }, [mempool]);

  const available = useCb((id) => (balances[id] || 0) - (pendingOut[id] || 0), [balances, pendingOut]);

  /* ---- mempool ops ---- */
  const addTx = useCb((from, to, amount, note) => {
    setMempool((m) => [...m, { id: PG.txId(), from, to, amount: Number(amount), note: note || "" }]);
  }, []);
  const removeTx = useCb((id) => setMempool((m) => m.filter((t) => t.id !== id)), []);

  /* live rebrand (name/ticker) without disturbing wallets or blocks */
  const rebrand = useCb((name, ticker) => {
    setConfig((c) => ({ ...c, chainName: name != null ? name : c.chainName, ticker: ticker != null ? ticker : c.ticker }));
  }, []);

  /* ---- mine pending mempool into a new block ---- */
  const mine = useCb(async () => {
    if (busyRef.current || blocks.length === 0) return;
    const prev = blocks[blocks.length - 1];
    const reward = Number(config.reward) || 0;
    const coinbase = reward > 0 && miner
      ? [{ id: PG.txId(), from: "COINBASE", to: miner, amount: reward, note: "block reward" }]
      : [];
    const txs = [...coinbase, ...mempool];
    const candidate = {
      index: prev.index + 1, ts: Date.now(), prevHash: prev.hash,
      txs, miner, nonce: 0, hash: "", difficulty: diffRef.current,
    };
    busyRef.current = true;
    stopRef.current = false;
    setMining({ kind: "mine", index: candidate.index, nonce: 0, hashes: 0, hashrate: 0, sampleHash: "" });
    try {
      const res = await PG.mineBlock(candidate, diffRef.current, {
        batch: batchRef.current,
        onProgress: (p) => setMining((m) => m && ({ ...m, nonce: p.nonce, hashes: p.hashes, hashrate: p.hashrate, sampleHash: p.sampleHash })),
        shouldStop: () => stopRef.current,
      });
      candidate.nonce = res.nonce; candidate.hash = res.hash;
      setBlocks((b) => [...b, candidate]);
      setMempool([]);
      setFreshIndex(candidate.index);
      setLastMined({ index: candidate.index, hashes: res.hashes, ms: res.ms, hashrate: res.hashrate });
    } catch (e) { /* cancelled */ }
    setMining(null);
    busyRef.current = false;
  }, [blocks, mempool, miner, config]);

  /* ---- tamper: change a confirmed tx amount, recompute that block's hash ----
     This is genuine: the new data yields a new hash that (a) almost never still
     satisfies the PoW target, and (b) no longer matches the next block's prevHash.
     Everything from here on is now untrusted until re-mined. */
  const tamper = useCb((blockIndex, txIndex, newAmount) => {
    setBlocks((bs) => bs.map((b) => {
      if (b.index !== blockIndex) return b;
      const txs = b.txs.map((t, i) => (i === txIndex ? { ...t, amount: Number(newAmount) } : t));
      const nb = { ...b, txs, tampered: true };
      nb.hash = PG.hashBlock(nb);   // recompute → breaks PoW + downstream link
      return nb;
    }));
  }, []);

  /* ---- validation (per block) + first broken index ---- */
  const validation = useMemoS(() => PG.validateChain(blocks, difficulty), [blocks, difficulty]);
  const firstBad = useMemoS(() => {
    const idx = validation.findIndex((s) => !s.ok);
    return idx;
  }, [validation]);
  const isValid = firstBad === -1;

  /* ---- re-mine from the first broken block forward, fixing links + PoW ---- */
  const remine = useCb(async () => {
    if (busyRef.current || isValid) return;
    busyRef.current = true;
    stopRef.current = false;
    const start = firstBad;
    const work = blocks.map((b) => ({ ...b }));
    for (let j = start; j < work.length; j++) {
      work[j].prevHash = j === 0 ? PG.GENESIS_PREV : work[j - 1].hash;
      work[j].tampered = false;
      work[j].difficulty = diffRef.current;
      setMining({ kind: "remine", index: work[j].index, nonce: 0, hashes: 0, hashrate: 0, sampleHash: "" });
      try {
        const res = await PG.mineBlock(work[j], diffRef.current, {
          batch: batchRef.current,
          onProgress: (p) => setMining((m) => m && ({ ...m, nonce: p.nonce, hashes: p.hashes, hashrate: p.hashrate, sampleHash: p.sampleHash })),
          shouldStop: () => stopRef.current,
        });
        work[j].nonce = res.nonce; work[j].hash = res.hash;
        setFreshIndex(work[j].index);
      } catch (e) { busyRef.current = false; setMining(null); return; }
    }
    setBlocks(work);
    setMining(null);
    busyRef.current = false;
  }, [blocks, firstBad, isValid]);

  return {
    config, wallets, blocks, mempool, miner, mining, lastMined, freshIndex, machineRate,
    balances, available, validation, firstBad, isValid,
    setMiner, reset, addTx, removeTx, mine, tamper, remine, rebrand,
    walletById: (id) => wallets.find((w) => w.id === id),
  };
}

window.PGState = { useChain, defaultConfig, WALLET_PALETTE };
