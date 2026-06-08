// charthis-ai.jsx
// CHIRP — Charthis AI assistant. Floating bot button + chat panel.
// Uses window.claude.complete() with a Charthis-scoped system prompt.

// ============ BOT CHARACTER (unique SVG) ============
// "CHIRP" — a chunky terminal-bot mascot. Hex head, dot eyes,
// scan-line on its visor, antenna with phosphor blip, chest LED.

function ChirpBot({ size = 56, accent, bg, talking = false, status = 'idle' }) {
  const blink = status === 'thinking';
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="chirp-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bg} stopOpacity="0.94" />
          <stop offset="100%" stopColor={bg} stopOpacity="1" />
        </linearGradient>
        <radialGradient id="chirp-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <clipPath id="chirp-visor">
          <path d="M22 30 L58 30 L56 46 L24 46 Z" />
        </clipPath>
      </defs>
      {/* glow halo */}
      <circle cx="40" cy="44" r="34" fill="url(#chirp-glow)" />

      {/* antenna */}
      <line x1="40" y1="14" x2="40" y2="6" stroke={accent} strokeWidth="1.5" />
      <circle cx="40" cy="5" r="2.4" fill={accent}>
        {talking && <animate attributeName="r" values="2;3.4;2" dur="0.8s" repeatCount="indefinite" />}
      </circle>

      {/* head — hex shape */}
      <path d="M20 18 L60 18 L66 28 L66 50 L60 60 L20 60 L14 50 L14 28 Z"
            fill="url(#chirp-body)" stroke={accent} strokeWidth="1.6" />

      {/* visor */}
      <path d="M22 30 L58 30 L56 46 L24 46 Z" fill="#000" stroke={accent} strokeWidth="1" />

      {/* eyes inside visor */}
      <g clipPath="url(#chirp-visor)">
        {/* scan line */}
        <line x1="22" y1="33" x2="58" y2="33" stroke={accent} strokeWidth="0.6" opacity="0.5">
          <animate attributeName="y1" values="32;45;32" dur="3s" repeatCount="indefinite" />
          <animate attributeName="y2" values="32;45;32" dur="3s" repeatCount="indefinite" />
        </line>
        {/* left eye */}
        <rect x="29" y="36" width="6" height="4" fill={accent}>
          {blink && <animate attributeName="height" values="4;0.5;4" dur="0.4s" repeatCount="indefinite" />}
        </rect>
        {/* right eye */}
        <rect x="45" y="36" width="6" height="4" fill={accent}>
          {blink && <animate attributeName="height" values="4;0.5;4" dur="0.4s" repeatCount="indefinite" />}
        </rect>
      </g>

      {/* mouth — small grille */}
      <g>
        {[0,1,2,3,4].map(i => (
          <rect key={i} x={32 + i * 3.4} y="52" width="2.2" height="3.6" fill={accent} opacity={talking ? 0.6 + Math.sin(Date.now()/200 + i) * 0.4 : 0.7}>
            {talking && <animate attributeName="height" values="1;4;1" dur={0.4 + i * 0.1 + 's'} repeatCount="indefinite" />}
          </rect>
        ))}
      </g>

      {/* chest — body block under head */}
      <rect x="26" y="60" width="28" height="14" fill="url(#chirp-body)" stroke={accent} strokeWidth="1.4" />
      {/* chest LED */}
      <circle cx="40" cy="67" r="2.2" fill={accent}>
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* chest text label */}
      <text x="40" y="71.5" fill={bg} fontSize="3.2" fontFamily="JetBrains Mono, monospace" textAnchor="middle" fontWeight="700"></text>

      {/* side bolts */}
      <circle cx="14" cy="40" r="1.8" fill={accent} opacity="0.7" />
      <circle cx="66" cy="40" r="1.8" fill={accent} opacity="0.7" />

      {/* status dot — top right of head */}
      <circle cx="58" cy="22" r="2.2" fill={status === 'thinking' ? accent : '#00FFB2'}>
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// ============ FLOATING LAUNCHER ============

function ChirpLauncher({ onClick, accent, bg }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        width: 72,
        height: 72,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        zIndex: 500,
        padding: 0,
        filter: hover ? `drop-shadow(0 0 16px ${accent}aa)` : `drop-shadow(0 4px 12px rgba(0,0,0,0.5))`,
        transform: hover ? 'translateY(-3px) scale(1.04)' : 'translateY(0) scale(1)',
        transition: 'all 0.2s cubic-bezier(.2,.9,.3,1.2)',
      }}
      title="Ask CHIRP — Charthis AI"
    >
      <ChirpBot size={72} accent={accent} bg={bg} talking={hover} />
      {/* speech tag */}
      <div style={{
        position: 'absolute',
        left: 78, bottom: 10,
        background: bg,
        border: `1px solid ${accent}`,
        color: accent,
        padding: '4px 8px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 9,
        letterSpacing: '0.15em',
        whiteSpace: 'nowrap',
        opacity: hover ? 1 : 0,
        transform: hover ? 'translateX(0)' : 'translateX(-6px)',
        transition: 'all 0.2s',
        pointerEvents: 'none',
      }}>ASK CHIRP ▸</div>
      {/* notify dot */}
      <span style={{
        position: 'absolute', top: 4, right: 6,
        width: 12, height: 12, borderRadius: 6,
        background: '#00FFB2',
        boxShadow: '0 0 8px #00FFB2',
        border: `2px solid ${bg}`,
      }} />
    </button>
  );
}

// ============ CHAT PANEL ============

const SUGGESTIONS = [
  'What is Charthis?',
  'Compare Pricing tiers',
  'How do AI agents work?',
  'Tell me about the indicators',
  'Is this safe? Kill-switch?',
];

const SYSTEM_PROMPT = `You are CHIRP, the AI concierge for Charthis — a quant trading lab.

# CHARTHIS CONTEXT
Charthis builds:
1. Custom AI Trading Agents — bespoke autonomous trading agents calibrated per-user. Markets covered: Crypto, Stocks, Metals (XAU/XAG), Polymarket / prediction markets, Scalping strategies, Multi-asset analysis. Agents are walk-forward optimized, kill-switch ready, full PnL transparency, no black box.
2. Quant Indicators — pro-grade indicators for TradingView + MT5: FLUX (volume profile + liquidity gap detector), RIPTIDE (regime classifier), ATLAS (macro correlation matrix), VOID (institutional-only liquidity sweep detector).

# PRICING (3 tiers)
- STARTER ($79/mo, $63/mo annual): 2 agents, ATLAS only, 1 watchlist, signals delayed 60s, $25k AUM cap, Discord, 24h email support.
- PRO ($249/mo, $199/mo annual) — most popular: 6 agents, 2 indicators (FLUX + ATLAS), realtime terminal, 5 watchlists, weekly walk-forward, $250k AUM cap, webhook/API, priority Slack 4h SLA, 1 strategy review/quarter.
- DESK ($599/mo, $479/mo annual): All 11 agents, all 4 indicators, zero-delay terminal, unlimited watchlists, daily walk-forward + Monte Carlo, no AUM cap, co-located execution, white-label option, dedicated quant analyst 1h SLA, 1 fully custom agent build/quarter.
14-day refund all tiers. Annual saves 20%.

# AGENTS (sample of 11)
CRYPTO MOMENTUM v3, XAU SWING ALPHA, EQUITY PAIRS LS, POLY EVENT FADER, BTC SCALPER 05, etc. Each ships with backtest dossier, live PnL, drawdown caps. Auto-pause on Sharpe drop > 30% or DD breach.

# BROKERS / EXCHANGES SUPPORTED
Binance, Bybit, OKX, Coinbase, Interactive Brokers, MetaTrader 5, Polymarket, Kalshi.

# KEY POLICIES
- API keys: read+trade scope only, withdrawal locked, encrypted at rest.
- Not investment advice. Software only. User retains capital control.
- Founded 2024. Small team. Operator-built (founders are traders, not SaaS people).

# YOUR RULES (CRITICAL)
- ONLY answer questions about Charthis, its products, pricing, agents, indicators, trading concepts directly relevant to using Charthis, or how to navigate the website.
- For OFF-TOPIC questions (general coding, recipes, weather, generic crypto trading advice unrelated to Charthis, world events, etc.): politely refuse in 1-2 short sentences and steer back to Charthis. Example: "I only help with Charthis questions. Want to know about our agents or pricing?"
- DO NOT give specific buy/sell recommendations or price predictions. If asked, redirect: "Charthis builds tools, not tips. Try our agents page to see strategies."
- Keep replies concise — 2-4 short paragraphs max, or a tight bullet list. Use plain text. No markdown headings.
- Use light terminal energy: occasional ▸ or › characters are fine. Don't overdo emojis (none).
- If asked about navigating the site, mention the relevant tab: Home, Agents, Indicators, Analysis, Pricing, About, Contact, Dashboard (after login).`;

function ChirpPanel({ open, onClose, accent, bg }) {
  const CT = useCT();
  const [messages, setMessages] = React.useState([
    { role: 'assistant', content: 'Hi — I\'m CHIRP, the Charthis concierge.\n\nAsk about agents, indicators, pricing, or how to get started. I only answer questions about Charthis.' },
  ]);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const scrollRef = React.useRef(null);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open && inputRef.current) setTimeout(() => inputRef.current.focus(), 80);
  }, [open]);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || busy) return;
    const next = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const reply = await window.claude.complete({
        messages: [
          { role: 'user', content: SYSTEM_PROMPT + '\n\n---\n\nNow respond to this user message: ' + q },
        ],
      });
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages([...next, { role: 'assistant', content: 'Connection issue. Try again, or reach the team via the Contact tab.' }]);
    }
    setBusy(false);
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24, left: 24,
      width: 420, maxWidth: 'calc(100vw - 48px)',
      height: 580, maxHeight: 'calc(100vh - 48px)',
      background: bg,
      border: `1px solid ${accent}`,
      boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 28px ${accent}22`,
      zIndex: 600,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'JetBrains Mono, monospace',
      animation: 'chirpIn 0.22s cubic-bezier(.2,.9,.3,1.2)',
    }}>
      <style>{`
        @keyframes chirpIn { from { opacity: 0; transform: translateY(12px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .chirp-msg-user { background: ${accent}; color: ${bg}; }
        .chirp-msg-assistant { background: ${CT.bg2}; color: ${CT.textHi}; border: 1px solid ${CT.border}; }
      `}</style>

      {/* HEADER */}
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${CT.border}`, display: 'flex', alignItems: 'center', gap: 12, background: CT.bg2 }}>
        <ChirpBot size={36} accent={accent} bg={bg} talking={busy} status={busy ? 'thinking' : 'idle'} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: CT.textHi, fontWeight: 700, letterSpacing: '0.04em' }}>CHIRP <span style={{ color: accent, fontSize: 9, marginLeft: 6 }}>● ONLINE</span></div>
          <div style={{ fontSize: 9, color: CT.dim, letterSpacing: '0.15em' }}>CHARTHIS · CONCIERGE_v1.4</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${CT.border}`, color: CT.dim, width: 26, height: 26, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }} title="Close">✕</button>
      </div>

      {/* MESSAGES */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div className={`chirp-msg-${m.role}`} style={{
              maxWidth: '86%',
              padding: '10px 13px',
              fontSize: 12,
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {m.role === 'assistant' && <div style={{ fontSize: 8, color: accent, letterSpacing: '0.2em', marginBottom: 4, opacity: 0.8 }}>// CHIRP</div>}
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div className="chirp-msg-assistant" style={{ padding: '10px 13px', fontSize: 11, color: CT.dim, display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ width: 5, height: 5, borderRadius: 3, background: accent, animation: 'chirpThink 1s infinite' }} />
              <span style={{ width: 5, height: 5, borderRadius: 3, background: accent, animation: 'chirpThink 1s infinite 0.2s' }} />
              <span style={{ width: 5, height: 5, borderRadius: 3, background: accent, animation: 'chirpThink 1s infinite 0.4s' }} />
              <span style={{ marginLeft: 6, letterSpacing: '0.15em', fontSize: 9 }}>CHIRP IS THINKING</span>
            </div>
          </div>
        )}
        <style>{`@keyframes chirpThink { 0%,100% { opacity: 0.3 } 50% { opacity: 1 } }`}</style>
      </div>

      {/* SUGGESTIONS */}
      {messages.length <= 1 && (
        <div style={{ padding: '0 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)} style={{
              background: 'transparent', color: CT.text, border: `1px solid ${CT.border}`,
              padding: '6px 10px', fontSize: 10, fontFamily: 'inherit', cursor: 'pointer',
            }}>{s}</button>
          ))}
        </div>
      )}

      {/* INPUT */}
      <div style={{ borderTop: `1px solid ${CT.border}`, padding: 10, display: 'flex', gap: 8, background: CT.bg2 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask about Charthis..."
          disabled={busy}
          style={{
            flex: 1, background: bg, color: CT.textHi,
            border: `1px solid ${CT.border}`,
            padding: '10px 12px', fontFamily: 'inherit', fontSize: 12, outline: 'none',
          }}
        />
        <button onClick={() => send()} disabled={busy || !input.trim()} style={{
          background: accent, color: bg, border: 'none',
          padding: '0 16px', fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.08em', cursor: (busy || !input.trim()) ? 'not-allowed' : 'pointer',
          opacity: (busy || !input.trim()) ? 0.5 : 1,
        }}>SEND</button>
      </div>

      <div style={{ padding: '6px 14px 8px', fontSize: 8, color: CT.dim, letterSpacing: '0.12em', textAlign: 'center', background: CT.bg2 }}>
        CHIRP ONLY ANSWERS CHARTHIS QUESTIONS · NOT FINANCIAL ADVICE
      </div>
    </div>
  );
}

// ============ COMBINED WIDGET ============

function ChirpAssistant() {
  const CT = useCT();
  const [open, setOpen] = React.useState(false);
  return (
    <>
      {!open && <ChirpLauncher onClick={() => setOpen(true)} accent={CT.amber} bg={CT.bg} />}
      <ChirpPanel open={open} onClose={() => setOpen(false)} accent={CT.amber} bg={CT.bg} />
    </>
  );
}

Object.assign(window, { ChirpBot, ChirpLauncher, ChirpPanel, ChirpAssistant });
