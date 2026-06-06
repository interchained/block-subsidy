# Interchained Playground — a blockchain in your browser

A genuine, in-browser blockchain you can run, mine, and learn from. No Ethereum, no node, no install, no backend — every hash is real SHA‑256 computed live in the tab. It's built as a **Bitcoin‑style educator**: send tokens, watch them collect in the mempool, mine them into blocks with real proof‑of‑work, and see why confirmed history is hard to rewrite.

**Live file:** `Blockchain Playground.html`

---

## What it does

- **Real SHA‑256 + proof‑of‑work.** A synchronous SHA‑256 implementation hashes `block + nonce` in a tight loop until the digest starts with N zeros. The hashing is genuine (it self‑tests against the standard `abc` and empty‑string vectors on load).
- **Hashpower benchmark.** On load it measures your machine's actual SHA‑256 throughput and shows it in the header, plus an estimate of how long a block will take at the current difficulty.
- **Transactions & mempool.** Move tokens between wallets; pending transfers sit in the mempool until a miner bundles them into a block. New coins only ever enter through the block reward (the coinbase) — just like Bitcoin.
- **Live chain view.** Blocks render as a linked column showing index, transactions, nonce, hash (leading zeros highlighted), and the previous block's hash. Each new block animates in.
- **Inspect internals.** Expand any block to see the exact string that gets hashed and a per‑block validity breakdown (hash matches data / meets difficulty / links to previous).
- **Immutability lesson.** Confirmed amounts are editable so you can play the attacker. Editing one changes that block's hash, which stops clearing the proof‑of‑work target and breaks the link to the next block — so honest nodes reject it. "Re‑mine" redoes the work from the break forward, so you feel exactly how expensive rewriting history is.
- **Spin up your own chain.** Name it, pick a ticker, set the block reward, seed genesis balances, and create a fresh genesis block.

## Educational framing — what's real vs. simplified

The mechanics are genuine: a mempool, a coinbase reward, a real nonce search, and blocks linked by SHA‑256. For clarity the model simplifies a few things versus Bitcoin:

| Concept | This playground | Bitcoin |
|---|---|---|
| Hash | single SHA‑256 | double SHA‑256 |
| Difficulty target | "hash starts with N zeros" | full 256‑bit target number |
| Accounting | account balances | UTXOs |

Amounts support decimals (the default reward is `0.1030199 ITC`).

---

## How it works

### The engine (`playground/engine.js`)
Plain JS, exposed on `window.PG`. No framework dependencies.

- `sha256(str)` / `hash(str)` — genuine synchronous SHA‑256 (UTF‑8 normalized).
- `mineBlock(block, difficulty, opts)` — async PoW search. Runs in batches via `setTimeout` (not `requestAnimationFrame`, so mining keeps going even when the tab is backgrounded) and throttles progress callbacks to ~10/sec so the loop spends its time hashing, not re‑rendering.
- `validateChain(blocks, difficulty)` — recomputes every hash and checks PoW + prev‑hash links per block (each block validates against the difficulty it was mined at).
- `computeBalances(blocks, wallets)` — balances aren't stored; they're replayed from every coinbase + transfer.
- `benchmark(ms)` — measures real hashes/sec for the hashpower readout.

### The UI (React + Babel, in‑browser)
- `pg-shared.jsx` — `Icon`, `Reveal`, formatters (`fmtCoin`, `fmtRate`, `HashColored`).
- `pg-state.jsx` — `useChain()`, the state machine: wallets, blocks, mempool, the miner, and the async mine / re‑mine / tamper actions.
- `lab.jsx` — wallets, transaction form, mempool, mining HUD, chain + block cards.
- `intro.jsx` — header, hero (a live self‑building mini‑chain), concept beats, genesis lab, recap, footer.
- `app.jsx` — composes everything and wires the Tweaks panel.
- `pg-styles.css` — playground styles layered on the Interchained design tokens (`explainer/styles.css`).
- `tweaks-panel.jsx` — the Tweaks shell.

## Tweaks

Open the Tweaks panel to adjust, live:

- **Difficulty** (2–5 leading zeros) — each extra zero multiplies the work by ~16. Drop to 2–3 for near‑instant blocks; raise for a longer, more dramatic search.
- **Animation speed**
- **Immutability lesson** — show/hide the tamper section.
- **Chain name** and **token ticker** — rebrands live.
- **Accent color**

## Running it

Open `Blockchain Playground.html`. It loads React, Babel, and Lucide from CDN; everything else is local. Because it transpiles JSX in the browser, the very first paint takes a moment, and on a flaky connection a script can occasionally fail to load (refresh fixes it). For a fully offline, single‑file version, the project can be bundled into one self‑contained HTML file.

## Notes

- Mining time is **real**, so at difficulty 4 a block averages ~1 second but has honest variance — the HUD counts the whole time.
- Everything runs 100% client‑side. There is no network, no wallet, and no real asset involved — it's a teaching tool.
