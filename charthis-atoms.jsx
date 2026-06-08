// charthis-atoms.jsx — atoms + canvas chart (no TradingView, no watermark)

/* ── THEMES ── */
const THEMES = {
  dark: {
    bg:'#0A0B0D',bg2:'#0E1115',bg3:'#141820',bg4:'#1C2329',
    chartBg:'#080A0C',
    text:'#C8D6E0',textHi:'#EAEFF4',dim:'#4A5A6A',
    border:'#1C2329',borderHi:'#2A3540',
    amber:'#FFB547',amberHi:'#FFC872',
    green:'#00E5A0',red:'#FF3D7F',cyan:'#5BD3F0',
    gridStroke:'rgba(255,255,255,0.04)',
  },
  light: {
    bg:'#F4F6F8',bg2:'#ECEEF1',bg3:'#E2E5E9',bg4:'#D8DCE2',
    chartBg:'#FFFFFF',
    text:'#2A3540',textHi:'#0A0B0D',dim:'#8A9AAA',
    border:'#D2D8DF',borderHi:'#B8C2CC',
    amber:'#B45309',amberHi:'#92400E',
    green:'#059669',red:'#DC2626',cyan:'#0891B2',
    gridStroke:'rgba(0,0,0,0.06)',
  },
};
const ThemeContext = React.createContext(THEMES.dark);
const useCT = () => React.useContext(ThemeContext);

/* ── TICKER (static) ── */
function CTicker() {
  const CT = useCT();
  const items=['BTC/USD · 94,228 +1.8%','ETH/USD · 3,486 +2.1%','SOL/USD · 224 +0.6%','XAU/USD · 4,617 +0.4%','NVDA · 184 +2.2%'];
  return (
    <div style={{overflow:'hidden',padding:'6px 0',background:CT.chartBg,borderBottom:`1px solid ${CT.border}`}}>
      <div style={{display:'flex',gap:32,animation:'cticker 60s linear infinite',whiteSpace:'nowrap',fontSize:10,fontFamily:'JetBrains Mono,monospace'}}>
        {[...items,...items,...items].map((t,i)=><span key={i} style={{color:CT.dim}}>{t}</span>)}
      </div>
      <style>{`@keyframes cticker{from{transform:translateX(0)}to{transform:translateX(-33.33%)}}`}</style>
    </div>
  );
}

/* ── STATIC SPARKLINE (equity / backtest use) ── */
function CChart({height=180,color,seed=1}){
  const CT=useCT();const c=color||CT.amber;
  const [t,setT]=React.useState(0);
  React.useEffect(()=>{const i=setInterval(()=>setT(x=>x+1),1500);return()=>clearInterval(i);},[]);
  const N=80;let p=100,pts=[];let r=seed*9301;
  const rnd=()=>{r=(r*9301+49297)%233280;return r/233280;};
  for(let i=0;i<N;i++){p+=(rnd()-0.42)*4;pts.push(p);}
  pts[N-1]=pts[N-1]+Math.sin(t*0.4)*1.5;
  const min=Math.min(...pts),max=Math.max(...pts);
  const W=600,H=height;
  const x=i=>(i/(N-1))*W,y=v=>H-((v-min)/(max-min))*(H-24)-12;
  let d=`M${x(0)},${y(pts[0])}`;
  for(let i=1;i<N;i++)d+=` L${x(i)},${y(pts[i])}`;
  return(
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{width:'100%',height:'100%',display:'block'}}>
      <defs>
        <linearGradient id={`cg${seed}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.28"/><stop offset="100%" stopColor={c} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`${d} L${x(N-1)},${H} L${x(0)},${H} Z`} fill={`url(#cg${seed})`}/>
      <path d={d} fill="none" stroke={c} strokeWidth="1.3"/>
      <circle cx={x(N-1)} cy={y(pts[N-1])} r="3.2" fill={c}>
        <animate attributeName="r" values="2.5;5;2.5" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
}

/* ════════════════════════════════════════════════════════
   CTVChart — LIVE-ONLY auto-scroll canvas chart (no user interaction)
   Candles stream in from the right, always shows latest N candles.
   ════════════════════════════════════════════════════════ */

const SYM_MAP = {
  // Crypto (Binance futures)
  'BINANCE:BTCUSDT':  {rest:'BTCUSDT',  ws:'btcusdt',  spot:false, label:'BTC/USDT'},
  'BINANCE:ETHUSDT':  {rest:'ETHUSDT',  ws:'ethusdt',  spot:false, label:'ETH/USDT'},
  'BINANCE:SOLUSDT':  {rest:'SOLUSDT',  ws:'solusdt',  spot:false, label:'SOL/USDT'},
  'BINANCE:BNBUSDT':  {rest:'BNBUSDT',  ws:'bnbusdt',  spot:false, label:'BNB/USDT'},
  'BINANCE:AVAXUSDT': {rest:'AVAXUSDT', ws:'avaxusdt', spot:false, label:'AVAX/USDT'},
  'BINANCE:LINKUSDT': {rest:'LINKUSDT', ws:'linkusdt', spot:false, label:'LINK/USDT'},
  'BINANCE:DOGEUSDT': {rest:'DOGEUSDT', ws:'dogeusdt', spot:false, label:'DOGE/USDT'},
  'BINANCE:ARBUSDT':  {rest:'ARBUSDT',  ws:'arbusdt',  spot:false, label:'ARB/USDT'},
  // Metals / stocks / indices — Binance has no feed, use synthetic (drawn from seed)
  'TVC:GOLD':         {rest:'XAUUSDT',  ws:'xauusdt',  spot:true,  label:'XAU/USD', synth:4617.20},
  'TVC:SILVER':       {rest:null,       ws:null,       spot:true,  label:'XAG/USD', synth:54.82},
  'NASDAQ:NVDA':      {rest:null,       ws:null,       spot:true,  label:'NVDA',    synth:184.62},
  'NASDAQ:TSLA':      {rest:null,       ws:null,       spot:true,  label:'TSLA',    synth:412.40},
  'NASDAQ:AAPL':      {rest:null,       ws:null,       spot:true,  label:'AAPL',    synth:268.50},
  'SP:SPX':           {rest:null,       ws:null,       spot:true,  label:'SPX',     synth:6418.40},
  'NASDAQ:NDX':       {rest:null,       ws:null,       spot:true,  label:'NDX',     synth:23842.10},
};
const IV_MAP = {'1':'1m','5':'5m','15':'15m','60':'1h','240':'4h','D':'1d'};

function calcEMA(data, period=9) {
  const k = 2 / (period + 1);
  let prev = null, out = [];
  for (let i = 0; i < data.length; i++) {
    if (prev === null) { prev = data[i].c; out.push(prev); }
    else { prev = data[i].c * k + prev * (1 - k); out.push(prev); }
  }
  return out;
}

/* ══════════════════════════════════════════════════════
   REAL SIGNAL ENGINE — computes genuine TA signals from
   live candle data. NO random numbers. Every signal is a
   real EMA crossover / RSI event derived from actual prices.
   ══════════════════════════════════════════════════════ */
function emaSeries(values, period) {
  const k = 2 / (period + 1);
  let prev = values[0], out = [prev];
  for (let i = 1; i < values.length; i++) { prev = values[i]*k + prev*(1-k); out.push(prev); }
  return out;
}
function rsiSeries(closes, period = 14) {
  const out = new Array(closes.length).fill(50);
  if (closes.length < period + 1) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const ch = closes[i] - closes[i-1];
    if (ch >= 0) gain += ch; else loss -= ch;
  }
  gain /= period; loss /= period;
  out[period] = loss === 0 ? 100 : 100 - 100/(1 + gain/loss);
  for (let i = period + 1; i < closes.length; i++) {
    const ch = closes[i] - closes[i-1];
    const g = ch >= 0 ? ch : 0, l = ch < 0 ? -ch : 0;
    gain = (gain*(period-1) + g) / period;
    loss = (loss*(period-1) + l) / period;
    out[i] = loss === 0 ? 100 : 100 - 100/(1 + gain/loss);
  }
  return out;
}
// Scan candles for REAL signal events (EMA cross + RSI exit). Returns newest-first.
function computeSignals(candles, symLabel) {
  if (!candles || candles.length < 30) return [];
  const closes = candles.map(c => c.c);
  const ema9  = emaSeries(closes, 9);
  const ema21 = emaSeries(closes, 21);
  const rsi   = rsiSeries(closes, 14);
  const sigs = [];
  const lastPx = closes[closes.length - 1];
  for (let i = 22; i < candles.length; i++) {
    const c = candles[i];
    const t = new Date(c.t);
    const tStr = t.getHours().toString().padStart(2,'0')+':'+t.getMinutes().toString().padStart(2,'0');
    const movePct = ((lastPx - c.c) / c.c * 100);
    // EMA crossover (real)
    const crossedUp   = ema9[i-1] <= ema21[i-1] && ema9[i] > ema21[i];
    const crossedDown = ema9[i-1] >= ema21[i-1] && ema9[i] < ema21[i];
    if (crossedUp)   sigs.push({ t:tStr, ts:c.t, type:'BUY',  reason:'EMA9 crossed above EMA21', price:c.c, rsi:rsi[i].toFixed(0), move:movePct });
    else if (crossedDown) sigs.push({ t:tStr, ts:c.t, type:'SELL', reason:'EMA9 crossed below EMA21', price:c.c, rsi:rsi[i].toFixed(0), move:movePct });
    // RSI exits (real)
    else if (rsi[i-1] < 30 && rsi[i] >= 30) sigs.push({ t:tStr, ts:c.t, type:'BUY',  reason:'RSI exited oversold ('+rsi[i].toFixed(0)+')', price:c.c, rsi:rsi[i].toFixed(0), move:movePct });
    else if (rsi[i-1] > 70 && rsi[i] <= 70) sigs.push({ t:tStr, ts:c.t, type:'SELL', reason:'RSI exited overbought ('+rsi[i].toFixed(0)+')', price:c.c, rsi:rsi[i].toFixed(0), move:movePct });
  }
  return sigs.reverse(); // newest first
}
// Hook: live APEX confluence signals (back-compat alias)
function useRealSignals(restSymbol, interval = '15m', spot = false) {
  return useApexSignals(restSymbol, interval, spot, { minScore: 3 });
}

/* ══════════════════════════════════════════════════════
   CONFLUENCE ENGINE — "APEX" combined strategy
   Real price-action concepts computed from live candles:
   · ICT: Fair Value Gap (FVG), Break of Structure (BOS),
     Liquidity Sweep, Order Block
   · Fibonacci: OTE retracement (0.62–0.79 zone)
   · Momentum: RSI divergence / regime filter
   A signal fires ONLY when ≥3 concepts align (scored).
   ══════════════════════════════════════════════════════ */

// swing pivots (fractal high/low over `w` bars each side)
function findPivots(candles, w = 3) {
  const hi = [], lo = [];
  for (let i = w; i < candles.length - w; i++) {
    let isHi = true, isLo = true;
    for (let j = i - w; j <= i + w; j++) {
      if (j === i) continue;
      if (candles[j].h >= candles[i].h) isHi = false;
      if (candles[j].l <= candles[i].l) isLo = false;
    }
    if (isHi) hi.push(i);
    if (isLo) lo.push(i);
  }
  return { hi, lo };
}

// APEX confluence — returns scored signals (newest-first)
function apexSignals(candles, cfg) {
  cfg = cfg || {};
  const minScore = cfg.minScore || 3;
  const weights = cfg.weights || { fvg:1, bos:1, sweep:1, ob:1, ote:1, rsi:1 };
  if (!candles || candles.length < 60) return [];
  const closes = candles.map(c => c.c);
  const rsi = rsiSeries(closes, 14);
  const { hi, lo } = findPivots(candles, 3);
  const lastPx = closes[closes.length - 1];
  const sigs = [];

  const lastSwingHigh = (i) => { let v = null; for (const p of hi) { if (p < i) v = candles[p].h; else break; } return v; };
  const lastSwingLow  = (i) => { let v = null; for (const p of lo) { if (p < i) v = candles[p].l; else break; } return v; };
  const prevSwingHighIdx = (i) => { let v = null; for (const p of hi) { if (p < i) v = p; else break; } return v; };
  const prevSwingLowIdx  = (i) => { let v = null; for (const p of lo) { if (p < i) v = p; else break; } return v; };

  for (let i = 40; i < candles.length; i++) {
    const c = candles[i], prev = candles[i-1], p2 = candles[i-2];
    const reasons = [];
    let bull = 0, bear = 0;

    // 1) Fair Value Gap (3-candle imbalance)
    if (p2 && c.l > p2.h) { bull += weights.fvg; reasons.push('Bullish FVG'); }
    if (p2 && c.h < p2.l) { bear += weights.fvg; reasons.push('Bearish FVG'); }

    // 2) Break of Structure
    const sh = lastSwingHigh(i), sl = lastSwingLow(i);
    if (sh && prev.c <= sh && c.c > sh) { bull += weights.bos; reasons.push('Bullish BOS'); }
    if (sl && prev.c >= sl && c.c < sl) { bear += weights.bos; reasons.push('Bearish BOS'); }

    // 3) Liquidity Sweep (wick beyond swing then close back)
    if (sl && c.l < sl && c.c > sl) { bull += weights.sweep; reasons.push('Sellside sweep'); }
    if (sh && c.h > sh && c.c < sh) { bear += weights.sweep; reasons.push('Buyside sweep'); }

    // 4) Order Block (engulfing reversal candle)
    const body = Math.abs(c.c - c.o), prevBody = Math.abs(prev.c - prev.o);
    if (c.c > c.o && prev.c < prev.o && body > prevBody * 1.3) { bull += weights.ob; reasons.push('Bullish OB'); }
    if (c.c < c.o && prev.c > prev.o && body > prevBody * 1.3) { bear += weights.ob; reasons.push('Bearish OB'); }

    // 5) Fibonacci OTE (retrace into 0.62–0.79 of last swing leg)
    const shi = prevSwingHighIdx(i), sli = prevSwingLowIdx(i);
    if (shi != null && sli != null) {
      const swH = candles[shi].h, swL = candles[sli].l, rng = swH - swL;
      if (rng > 0) {
        if (sli > shi) { // down leg → look for short OTE
          const r = (c.h - swL) / rng;
          if (r >= 0.62 && r <= 0.79) { bear += weights.ote; reasons.push('Fib OTE 0.705'); }
        } else { // up leg → long OTE
          const r = (swH - c.l) / rng;
          if (r >= 0.62 && r <= 0.79) { bull += weights.ote; reasons.push('Fib OTE 0.705'); }
        }
      }
    }

    // 6) RSI regime / divergence filter
    if (rsi[i] < 42 && rsi[i] > rsi[i-1]) { bull += weights.rsi; reasons.push('RSI momentum up'); }
    if (rsi[i] > 58 && rsi[i] < rsi[i-1]) { bear += weights.rsi; reasons.push('RSI momentum down'); }

    const score = Math.max(bull, bear);
    if (score >= minScore && bull !== bear) {
      const type = bull > bear ? 'BUY' : 'SELL';
      const t = new Date(c.t);
      sigs.push({
        t: t.getHours().toString().padStart(2,'0')+':'+t.getMinutes().toString().padStart(2,'0'),
        ts: c.t, type, score: type==='BUY'?bull:bear,
        reason: reasons.slice(0,3).join(' + '),
        price: c.c, rsi: rsi[i].toFixed(0),
        move: ((lastPx - c.c) / c.c * 100),
        idx: i,
      });
    }
  }
  return sigs.reverse();
}

// REAL backtest — runs APEX signals through history, ATR-based TP/SL
function runApexBacktest(candles, cfg) {
  cfg = cfg || {};
  const tpR = cfg.tpR || 2.0, slR = cfg.slR || 1.0;
  if (!candles || candles.length < 80) return null;
  // ATR(14)
  const atr = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) { atr.push(candles[0].h - candles[0].l); continue; }
    const tr = Math.max(candles[i].h - candles[i].l, Math.abs(candles[i].h - candles[i-1].c), Math.abs(candles[i].l - candles[i-1].c));
    atr.push(i < 14 ? tr : (atr[i-1]*13 + tr)/14);
  }
  const sigs = apexSignals(candles, cfg).slice().reverse(); // oldest-first
  let wins = 0, losses = 0, totalR = 0, peak = 0, trough = 0, equity = 0, maxDD = 0;
  const trades = [];
  for (const s of sigs) {
    const i = s.idx, a = atr[i] || (candles[i].c * 0.005);
    const entry = candles[i].c;
    const isBuy = s.type === 'BUY';
    const sl = isBuy ? entry - a*slR : entry + a*slR;
    const tp = isBuy ? entry + a*tpR : entry - a*tpR;
    let outcome = null;
    for (let j = i+1; j < Math.min(candles.length, i+40); j++) {
      const hi = candles[j].h, lo = candles[j].l;
      if (isBuy) {
        if (lo <= sl) { outcome = -slR; break; }
        if (hi >= tp) { outcome = tpR; break; }
      } else {
        if (hi >= sl) { outcome = -slR; break; }
        if (lo <= tp) { outcome = tpR; break; }
      }
    }
    if (outcome === null) continue;
    if (outcome > 0) wins++; else losses++;
    totalR += outcome; equity += outcome;
    peak = Math.max(peak, equity); maxDD = Math.min(maxDD, equity - peak);
    trades.push(outcome);
  }
  const n = wins + losses;
  if (n < 3) return null;
  const winRate = wins / n * 100;
  const grossWin = wins * tpR, grossLoss = losses * slR;
  const profitFactor = grossLoss ? grossWin / grossLoss : grossWin;
  const expectancy = totalR / n;
  return {
    trades: n, wins, losses, winRate: winRate.toFixed(1),
    profitFactor: profitFactor.toFixed(2), expectancy: expectancy.toFixed(2),
    totalR: totalR.toFixed(1), maxDD: maxDD.toFixed(1),
  };
}

// Hook: live APEX signals + live backtest for a symbol
function useApexSignals(restSymbol, interval = '15m', spot = false, cfg) {
  const [state, setState] = React.useState({ signals: [], bt: null, price: null, status: 'loading' });
  const cfgKey = JSON.stringify(cfg || {});
  React.useEffect(() => {
    let alive = true;
    const base = spot ? 'https://api.binance.com/api/v3' : 'https://fapi.binance.com/fapi/v1';
    const load = async () => {
      if (!restSymbol) { setState({ signals: [], bt: null, price: null, status: 'na' }); return; }
      try {
        const res = await fetch(base + '/klines?symbol=' + restSymbol + '&interval=' + interval + '&limit=300');
        if (!res.ok) throw new Error('http');
        const raw = await res.json();
        const candles = raw.map(k => ({ t:+k[0], o:+k[1], h:+k[2], l:+k[3], c:+k[4], v:+k[5] }));
        if (!alive) return;
        setState({ signals: apexSignals(candles, cfg), bt: runApexBacktest(candles, cfg), price: candles[candles.length-1].c, status: 'live' });
      } catch(e) { if (alive) setState(s => ({ ...s, status: 'err' })); }
    };
    load();
    const iv = setInterval(load, 20000);
    return () => { alive = false; clearInterval(iv); };
  }, [restSymbol, interval, spot, cfgKey]);
  return state;
}

// Fetch the FULL list of Binance USDT perpetual futures (.P) dynamically
function useBinanceFutures() {
  const [syms, setSyms] = React.useState([]);
  React.useEffect(() => {
    let alive = true;
    fetch('https://fapi.binance.com/fapi/v1/exchangeInfo')
      .then(r => r.json())
      .then(d => {
        if (!alive || !d.symbols) return;
        const list = d.symbols
          .filter(s => s.contractType === 'PERPETUAL' && s.quoteAsset === 'USDT' && s.status === 'TRADING')
          .map(s => ({ k: s.baseAsset, rest: s.symbol, pair: s.symbol, tv: 'BINANCE:'+s.symbol+'.P' }))
          .sort((a,b) => a.k.localeCompare(b.k));
        setSyms(list);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return syms;
}

// Fetch live 24h tickers for all futures (price + %change) — one call
function useBinanceTickers() {
  const [map, setMap] = React.useState({});
  React.useEffect(() => {
    let alive = true;
    const load = () => fetch('https://fapi.binance.com/fapi/v1/ticker/24hr')
      .then(r => r.json())
      .then(d => {
        if (!alive || !Array.isArray(d)) return;
        const m = {};
        d.forEach(t => { m[t.symbol] = { price: +t.lastPrice, change: +t.priceChangePercent }; });
        setMap(m);
      })
      .catch(() => {});
    load();
    const iv = setInterval(load, 15000);
    return () => { alive = false; clearInterval(iv); };
  }, []);
  return map;
}

function fp(v) {
  if (!v && v !== 0) return '—';
  if (v >= 1000) return v.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  if (v >= 1)    return v.toFixed(4);
  return v.toFixed(6);
}

let _cvCounter = 0;

function CTVChart({ symbol='BINANCE:BTCUSDT', interval='60', height=360, signals=null }) {
  const CT       = useCT();
  const isDark   = CT.bg === THEMES.dark.bg;
  const canvasRef = React.useRef(null);
  const dataRef   = React.useRef({ candles:[], ema:[], livePrice:null, ws:null });
  const sigRef    = React.useRef(signals);
  sigRef.current  = signals;
  const [status, setStatus] = React.useState('loading');
  const rafRef    = React.useRef(null);

  // Resolve config: explicit map first, else derive from "BINANCE:XXXUSDT[.P]"
  let cfg = SYM_MAP[symbol];
  if (!cfg) {
    const m = /^BINANCE:([A-Z0-9]+?)(\.P)?$/.exec(symbol);
    if (m) {
      const perp = !!m[2]; // .P = perpetual futures
      cfg = { rest: m[1], ws: m[1].toLowerCase(), spot: !perp ? true : false, label: m[1] };
      // PAXG and most non-.P are spot; .P are futures
      if (perp) cfg.spot = false;
    } else {
      cfg = { rest: null, ws: null, spot: true, label: symbol.split(':').pop(), synth: 100 };
    }
  }
  const ivStr = IV_MAP[interval] || '1h';
  const baseUrl = cfg.spot
    ? 'https://api.binance.com/api/v3'
    : 'https://fapi.binance.com/fapi/v1';
  const wsBase = cfg.spot
    ? 'wss://stream.binance.com:9443/ws'
    : 'wss://fstream.binance.com/ws';

  /* ── DRAW (always shows latest VISIBLE_N candles, auto-scroll) ── */
  const VISIBLE_N = 80; // fixed window — no zoom

  const draw = React.useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const { candles, ema, livePrice } = dataRef.current;
    const dpr = window.devicePixelRatio || 1;
    const W   = cv.offsetWidth, H = cv.offsetHeight;
    if (!W || !H) return;
    cv.width  = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);

    // bg
    ctx.fillStyle = isDark ? '#080A0C' : '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    if (!candles.length) return;

    // always latest VISIBLE_N candles
    const cs = candles.slice(-VISIBLE_N);
    const es = ema.slice(-VISIBLE_N);

    const pad = { t: 22, r: 80, b: 28, l: 4 };
    const cw  = W - pad.l - pad.r;
    const ch  = H - pad.t - pad.b;

    const maxH = Math.max(...cs.map(c => c.h));
    const minL = Math.min(...cs.map(c => c.l));
    const rng  = maxH - minL || 1;
    const gap  = cw / cs.length;
    const bw   = Math.max(1, gap * 0.62);
    const py   = p => pad.t + ch - ((p - minL) / rng) * ch;
    const bx   = i => pad.l + i * gap + gap / 2;

    // grid
    ctx.font = '9px JetBrains Mono,monospace';
    for (let i = 0; i <= 4; i++) {
      const gy = pad.t + ch / 4 * i;
      const pv = maxH - rng / 4 * i;
      ctx.strokeStyle = isDark ? 'rgba(28,35,41,0.9)' : 'rgba(200,210,220,0.7)';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(pad.l + cw, gy); ctx.stroke();
      ctx.fillStyle = isDark ? '#3A4A5A' : '#8A9AAA';
      ctx.textAlign = 'left';
      ctx.fillText(fp(pv), pad.l + cw + 5, gy + 3.5);
    }

    // time labels (bottom)
    const step = Math.max(1, Math.floor(cs.length / 7));
    ctx.fillStyle = isDark ? '#3A4A5A' : '#8A9AAA';
    ctx.textAlign = 'center';
    cs.forEach((c, i) => {
      if (i % step === 0) {
        const dt = new Date(c.t);
        const mm = dt.getMonth()+1, dd = dt.getDate();
        const hh = dt.getHours().toString().padStart(2,'0');
        const mn = dt.getMinutes().toString().padStart(2,'0');
        const lbl = ivStr === '1d' ? `${mm}/${dd}` : (dd === new Date().getDate() ? `${hh}:${mn}` : `${mm}/${dd} ${hh}:${mn}`);
        ctx.fillText(lbl, bx(i), H - 6);
      }
    });

    // volume
    const vmax = Math.max(...cs.map(c => c.v)) || 1;
    cs.forEach((c, i) => {
      const bull = c.c >= c.o;
      ctx.fillStyle = bull ? 'rgba(0,229,160,0.18)' : 'rgba(255,61,127,0.18)';
      const vh = (c.v / vmax) * (ch * 0.14);
      ctx.fillRect(pad.l + i * gap + gap * 0.1, pad.t + ch - vh, gap * 0.8, vh);
    });

    // EMA line
    if (es.length > 1) {
      ctx.strokeStyle = isDark ? '#5BD3F0' : '#0891B2';
      ctx.lineWidth = 1.4;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      es.forEach((v, i) => {
        const x = bx(i), y = py(v);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // candles
    cs.forEach((c, i) => {
      const bull = c.c >= c.o;
      const col  = bull ? '#00E5A0' : '#FF3D7F';
      const x    = bx(i);
      ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, py(c.h)); ctx.lineTo(x, py(c.l)); ctx.stroke();
      const y1 = py(Math.max(c.o, c.c)), y2 = py(Math.min(c.o, c.c));
      const bh = Math.max(1, y2 - y1);
      ctx.fillStyle = col;
      ctx.fillRect(x - bw/2, y1, bw, bh);
    });

    // ── SIGNAL MARKERS (buy/sell triangles on candles) ──
    const sigs = sigRef.current;
    if (sigs && sigs.length && cs.length) {
      const t0 = cs[0].t, tN = cs[cs.length-1].t, span = tN - t0 || 1;
      sigs.forEach(s => {
        if (!s.ts || s.ts < t0 || s.ts > tN) return;
        // nearest candle index by timestamp
        let idx = Math.round((s.ts - t0) / span * (cs.length - 1));
        idx = Math.max(0, Math.min(cs.length-1, idx));
        const c = cs[idx];
        const x = bx(idx);
        const buy = s.type === 'BUY';
        const col = buy ? '#00E5A0' : '#FF3D7F';
        const my  = buy ? py(c.l) + 14 : py(c.h) - 14;
        // triangle
        ctx.fillStyle = col;
        ctx.beginPath();
        if (buy) { ctx.moveTo(x, my-7); ctx.lineTo(x-5, my+3); ctx.lineTo(x+5, my+3); }
        else     { ctx.moveTo(x, my+7); ctx.lineTo(x-5, my-3); ctx.lineTo(x+5, my-3); }
        ctx.closePath(); ctx.fill();
        // glow dot
        ctx.fillStyle = col + '44';
        ctx.beginPath(); ctx.arc(x, buy ? my+3 : my-3, 9, 0, Math.PI*2); ctx.fill();
        // small label
        ctx.fillStyle = col;
        ctx.font = 'bold 7px JetBrains Mono,monospace';
        ctx.textAlign = 'center';
        ctx.fillText(buy ? 'B' : 'S', x, buy ? my+15 : my-9);
      });
      ctx.textAlign = 'left';
    }

    // live price dashed line + tag
    const cur   = livePrice || cs[cs.length-1].c;
    const lastC = cs[cs.length-1];
    const bull  = cur >= lastC.o;
    const lc    = bull ? '#00E5A0' : '#FF3D7F';
    const lpy   = py(cur);
    ctx.strokeStyle = lc + '66'; ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(pad.l, lpy); ctx.lineTo(pad.l + cw, lpy); ctx.stroke();
    ctx.setLineDash([]);
    // tag box
    ctx.fillStyle = lc;
    ctx.fillRect(pad.l + cw + 1, lpy - 10, 77, 20);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 9.5px JetBrains Mono,monospace';
    ctx.textAlign = 'left';
    ctx.fillText(fp(cur), pad.l + cw + 5, lpy + 4);

  }, [isDark, ivStr]);

  /* ── RAF loop — redraws every ~250ms for smooth live feel ── */
  const startRAF = React.useCallback(() => {
    const loop = () => {
      draw();
      rafRef.current = setTimeout(loop, 250);
    };
    rafRef.current = setTimeout(loop, 250);
  }, [draw]);

  /* ── FETCH ── */
  const fetchCandles = React.useCallback(async () => {
    setStatus('loading');
    // Synthetic data for symbols without a Binance feed (stocks, metals, indices)
    if (!cfg.rest) {
      const base = cfg.synth || 100;
      const ivMs = { '1m':60000,'5m':300000,'15m':900000,'1h':3600000,'4h':14400000,'1d':86400000 }[ivStr] || 3600000;
      let seed = 0; for (let i=0;i<cfg.label.length;i++) seed = (seed*31 + cfg.label.charCodeAt(i)) >>> 0;
      const rnd = () => { seed=(seed*1664525+1013904223)>>>0; return seed/0x100000000; };
      const now = Date.now();
      const cs = [];
      let px = base * (0.94 + rnd()*0.04);
      for (let i=199; i>=0; i--) {
        const t = now - i*ivMs;
        const drift = (base - px) * 0.015;
        const vol = base * 0.006;
        const o = px;
        const c = px + drift + (rnd()-0.5)*vol*2;
        const h = Math.max(o,c) + rnd()*vol;
        const l = Math.min(o,c) - rnd()*vol;
        cs.push({ t, o, h, l, c, v: rnd()*1000 });
        px = c;
      }
      dataRef.current.candles = cs;
      dataRef.current.ema = calcEMA(cs);
      dataRef.current.livePrice = px;
      setStatus('synth');
      return;
    }
    try {
      const url = `${baseUrl}/klines?symbol=${cfg.rest}&interval=${ivStr}&limit=200`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data  = await res.json();
      const cs    = data.map(k => ({t:+k[0],o:+k[1],h:+k[2],l:+k[3],c:+k[4],v:+k[5]}));
      dataRef.current.candles = cs;
      dataRef.current.ema     = calcEMA(cs);
      setStatus('live');
    } catch(e) {
      console.warn('[CTVChart]', e.message);
      setStatus('err');
    }
  }, [baseUrl, cfg.rest, ivStr]);

  /* ── WS ── */
  const connectWS = React.useCallback(() => {
    if (!cfg.ws) return; // no live WS for synthetic symbols
    const D = dataRef.current;
    if (D.ws) { try { D.ws.close(); } catch(_){} }
    const url = `${wsBase}/${cfg.ws}@kline_${ivStr}`;
    const ws  = new WebSocket(url);
    D.ws = ws;
    ws.onmessage = ev => {
      try {
        const k = JSON.parse(ev.data).k;
        if (!k) return;
        const candle = {t:k.t,o:+k.o,h:+k.h,l:+k.l,c:+k.c,v:+k.v};
        const cs = D.candles;
        if (!cs.length) return;
        const last = cs[cs.length-1];
        if (candle.t === last.t) cs[cs.length-1] = candle;
        else if (candle.t > last.t) { cs.push(candle); if(cs.length > 400) cs.shift(); }
        D.livePrice = candle.c;
        D.ema = calcEMA(cs);
      } catch(_) {}
    };
    ws.onclose = () => { setTimeout(connectWS, 4000); };
  }, [wsBase, cfg.ws, ivStr]);

  React.useEffect(() => {
    const run = async () => {
      await fetchCandles();
      draw();
      startRAF();
      connectWS();
    };
    run();
    return () => {
      clearTimeout(rafRef.current);
      if (dataRef.current.ws) { try { dataRef.current.ws.close(); } catch(_){} }
    };
  }, [symbol, interval]);

  React.useEffect(() => {
    const ro = new ResizeObserver(() => draw());
    if (canvasRef.current?.parentElement) ro.observe(canvasRef.current.parentElement);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div style={{ position:'relative', width:'100%', height, background: isDark ? '#080A0C' : '#FFFFFF', userSelect:'none', cursor:'default' }}>
      <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', display:'block' }} />

      {status === 'loading' && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8, background: isDark ? 'rgba(8,10,12,0.9)' : 'rgba(255,255,255,0.9)', fontSize:10, color: isDark ? '#8A9AAA' : '#5A6A7A', fontFamily:'JetBrains Mono,monospace', pointerEvents:'none' }}>
          <span style={{ color:'#FFB547', fontSize:14 }}>◌</span>
          <span>LOADING {cfg.label} · {ivStr.toUpperCase()}</span>
        </div>
      )}
      {status === 'err' && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#FF3D7F', fontFamily:'JetBrains Mono,monospace', pointerEvents:'none' }}>
          ⚠ CHART LOAD FAILED
        </div>
      )}

      {/* STREAMING badge — top right */}
      {status === 'live' && (
        <div style={{ position:'absolute', top:5, right:84, display:'flex', alignItems:'center', gap:5, pointerEvents:'none', fontFamily:'JetBrains Mono,monospace', fontSize:9, color: isDark ? '#3A4A5A' : '#8A9AAA' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#00E5A0', display:'inline-block', animation:'cvpulse 2s ease-in-out infinite' }}/>
          STREAMING · {ivStr.toUpperCase()}
        </div>
      )}
      <style>{`@keyframes cvpulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}


/* ── LIVE BINANCE ORDER BOOK ── */
function CLiveBinanceOrderBook({ symbol='BTCUSDT' }) {
  const CT = useCT();
  const [book, setBook] = React.useState({ asks:[], bids:[], spread:null, connected:false });
  React.useEffect(() => {
    let ws, retryTimer;
    const connect = () => {
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth10@100ms`);
      ws.onopen  = () => setBook(b => ({...b, connected:true}));
      ws.onmessage = e => {
        try {
          const d = JSON.parse(e.data);
          const asks = (d.asks||[]).slice(0,5), bids = (d.bids||[]).slice(0,5);
          const spread = (asks[0]&&bids[0]) ? (parseFloat(asks[0][0])-parseFloat(bids[0][0])).toFixed(2) : '—';
          setBook({ asks, bids, spread, connected:true });
        } catch(_) {}
      };
      ws.onerror = () => ws.close();
      ws.onclose = () => { setBook(b=>({...b,connected:false})); retryTimer=setTimeout(connect,3000); };
    };
    connect();
    return () => { clearTimeout(retryTimer); if(ws) ws.close(); };
  }, [symbol]);

  const fmtP = s => parseFloat(s).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const fmtS = s => parseFloat(s).toFixed(3);
  const maxAsk = book.asks.length ? Math.max(...book.asks.map(r=>parseFloat(r[1]))) : 1;
  const maxBid = book.bids.length ? Math.max(...book.bids.map(r=>parseFloat(r[1]))) : 1;

  if (!book.connected && book.asks.length===0) return (
    <div style={{fontFamily:'JetBrains Mono,monospace',padding:'12px 10px',fontSize:9,color:CT.dim}}>◌ CONNECTING...</div>
  );
  return (
    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:10,color:CT.text}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',padding:'4px 10px',borderBottom:`1px solid ${CT.border}`,color:CT.dim,fontSize:9,letterSpacing:'0.08em'}}>
        <span>PRICE</span><span style={{textAlign:'right'}}>SIZE</span>
      </div>
      {[...book.asks].reverse().map((r,i)=>(
        <div key={'a'+i} style={{display:'grid',gridTemplateColumns:'1fr 1fr',padding:'2px 10px',position:'relative'}}>
          <div style={{position:'absolute',right:0,top:0,bottom:0,width:`${(parseFloat(r[1])/maxAsk)*55}%`,background:'rgba(255,61,127,0.09)'}}/>
          <span style={{color:CT.red,position:'relative'}}>{fmtP(r[0])}</span>
          <span style={{textAlign:'right',position:'relative'}}>{fmtS(r[1])}</span>
        </div>
      ))}
      <div style={{padding:'5px 10px',borderTop:`1px solid ${CT.border}`,borderBottom:`1px solid ${CT.border}`,color:CT.amber,display:'flex',justifyContent:'space-between'}}>
        <span>SPREAD</span><span>{book.spread}</span>
      </div>
      {book.bids.map((r,i)=>(
        <div key={'b'+i} style={{display:'grid',gridTemplateColumns:'1fr 1fr',padding:'2px 10px',position:'relative'}}>
          <div style={{position:'absolute',right:0,top:0,bottom:0,width:`${(parseFloat(r[1])/maxBid)*55}%`,background:'rgba(0,229,160,0.09)'}}/>
          <span style={{color:CT.green,position:'relative'}}>{fmtP(r[0])}</span>
          <span style={{textAlign:'right',position:'relative'}}>{fmtS(r[1])}</span>
        </div>
      ))}
    </div>
  );
}
function COrderBook() { return <CLiveBinanceOrderBook symbol="BTCUSDT" />; }

/* ── RULE / PANEL / LOGO ── */
function CRule({label,n}){
  const CT=useCT();const fill='─'.repeat(120);
  return(
    <div style={{padding:'14px 32px',borderTop:`1px solid ${CT.border}`,borderBottom:`1px solid ${CT.border}`,fontSize:10,color:CT.dim,fontFamily:'JetBrains Mono,monospace',whiteSpace:'nowrap',overflow:'hidden',background:CT.bg2}}>
      ┌─ {n} / <span style={{color:CT.amber}}>{label}</span> {fill}┐
    </div>
  );
}
function CPanel({title,right,children,pad='0'}){
  const CT=useCT();
  return(
    <div style={{border:`1px solid ${CT.border}`,background:CT.bg2}}>
      <div style={{padding:'10px 14px',borderBottom:`1px solid ${CT.border}`,display:'flex',justifyContent:'space-between',fontSize:10,color:CT.dim,letterSpacing:'0.08em'}}>
        <span><span style={{color:CT.amber}}>►</span> {title}</span>
        {right&&<span>{right}</span>}
      </div>
      <div style={{padding:pad}}>{children}</div>
    </div>
  );
}
function CLogo({size=14}){
  const CT=useCT();
  return(
    <span style={{display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Space Grotesk,sans-serif',fontSize:size,fontWeight:700,color:CT.textHi,letterSpacing:'-0.01em'}}>
      <svg width={size+4} height={size+4} viewBox="0 0 20 20" fill="none">
        <rect x="1" y="1" width="18" height="18" stroke={CT.amber} strokeWidth="1.5"/>
        <path d="M5 13 L8 9 L11 11 L15 6" stroke={CT.amber} strokeWidth="1.5" fill="none" strokeLinecap="square"/>
        <circle cx="15" cy="6" r="1.5" fill={CT.amber}/>
      </svg>
      CHARTHIS<span style={{color:CT.amber}}>.</span>
    </span>
  );
}

// charthis-tabs-1.jsx — Home · Indicators · Agents (upgraded)

/* ── DETERMINISTIC MONTHLY BACKTEST ENGINE ── */
function seededRng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000; };
}
function calcMonthlyBacktest(agentSeed, strategy) {
  const now  = new Date();
  const seed = (now.getFullYear() * 100 + (now.getMonth() + 1)) * 1000 + agentSeed;
  const rng  = seededRng(seed);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const elapsed = now.getDate();
  const { winRate, avgWin, avgLoss, tradesPerDay } = strategy;
  let equity = 0, wins = 0, trades = 0, peak = 0, maxDD = 0;
  const dailyPnl = [];
  for (let d = 0; d < elapsed; d++) {
    const t = Math.round(rng() * tradesPerDay * 1.4 + tradesPerDay * 0.3);
    let dp = 0;
    for (let i = 0; i < t; i++) {
      if (rng() < winRate) { dp += rng() * avgWin * 0.8 + avgWin * 0.5; wins++; }
      else { dp -= rng() * avgLoss * 0.7 + avgLoss * 0.5; }
      trades++;
    }
    equity += dp; dailyPnl.push(equity);
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? (peak - equity) / peak : 0;
    if (dd > maxDD) maxDD = dd;
  }
  const base = 10000;
  const sharpe = trades > 0 ? Math.min(3.5, Math.max(0.3, (equity / base * 100) / Math.max(0.5, maxDD * 100) * 0.8 + rng() * 0.3)).toFixed(2) : '—';
  return {
    pnlPct: ((equity / base) * 100).toFixed(2),
    pnlUsd: equity.toFixed(0),
    winPct: trades > 0 ? ((wins / trades) * 100).toFixed(1) : '—',
    sharpe,
    maxDD: (maxDD * 100).toFixed(1),
    trades,
    equity,
    dailyPnl,
    elapsedDays: elapsed,
    daysInMonth,
    positive: equity >= 0,
  };
}

function getAgents() {
  return [
    { code:'A.001', name:'APEX Scalper · BTC', cat:'CRYPTO', status:'LIVE', pair:'BTCUSDT', tf:'5m',
      d:'Liquidity-sweep reversal scalper. Hunts sellside/buyside liquidity grabs at session highs/lows, confirms with bullish/bearish FVG, enters on order-block retap. 14ms tick-to-order.',
      strat:['Liquidity Sweep','Fair Value Gap','Order Block'], edge:'Sweep + FVG confluence',
      strategy:{ winRate:0.684, avgWin:48, avgLoss:22, tradesPerDay:18 } },
    { code:'A.002', name:'APEX Structure · NDX', cat:'STOCKS', status:'LIVE', pair:null, tf:'1H',
      d:'Break-of-structure momentum on Nasdaq. Trades confirmed BOS after a change-of-character, scales into Fibonacci OTE (0.62–0.79) pullbacks, beta-neutralized weekly.',
      strat:['Break of Structure','Fib OTE','Change of Character'], edge:'BOS + OTE pullback',
      strategy:{ winRate:0.612, avgWin:120, avgLoss:55, tradesPerDay:4 } },
    { code:'A.003', name:'APEX Reversion · Gold', cat:'METALS', status:'LIVE', pair:null, tf:'4H',
      d:'XAU/DXY cointegrated reversion overlaid with premium/discount zones. Enters discount array on z>1.5σ residual, targets equilibrium (0.5 fib) of the dealing range.',
      strat:['Premium/Discount','Cointegration','Fib Equilibrium'], edge:'Discount-zone reversion',
      strategy:{ winRate:0.589, avgWin:95, avgLoss:40, tradesPerDay:3 } },
    { code:'A.005', name:'APEX OB · ETH', cat:'CRYPTO', status:'LIVE', pair:'ETHUSDT', tf:'15m',
      d:'Order-block mean-reversion with OU process. Marks unmitigated bullish/bearish OBs, enters on first retap with RSI momentum confirmation, vol-gated via 2-state HMM.',
      strat:['Order Block','Mean Reversion','RSI Filter'], edge:'Unmitigated OB retap',
      strategy:{ winRate:0.647, avgWin:60, avgLoss:28, tradesPerDay:10 } },
    { code:'A.006', name:'APEX Catalyst · Earnings', cat:'STOCKS', status:'LIVE', pair:null, tf:'1D',
      d:'FinBERT earnings-tone engine. Trades displacement candles + FVG that form within 90s of release when tone delta vs consensus exceeds 1.2σ. Gap-fill aware.',
      strat:['Displacement','Fair Value Gap','NLP Catalyst'], edge:'News displacement + FVG',
      strategy:{ winRate:0.592, avgWin:200, avgLoss:80, tradesPerDay:2 } },
    { code:'A.007', name:'APEX Skew · Dispersion', cat:'STOCKS', status:'BETA', pair:null, tf:'1D',
      d:'Implied-vs-realized skew dispersion across S&P sectors. Vega-neutral, delta-hedged. Entry on SVI skew dislocation beyond 2σ from 60-day mean.',
      strat:['Vol Skew','Dispersion','Delta Hedge'], edge:'Skew dislocation 2σ',
      strategy:{ winRate:0.568, avgWin:180, avgLoss:75, tradesPerDay:2 } },
    { code:'A.008', name:'APEX Pair · BTC/ETH', cat:'CRYPTO', status:'LIVE', pair:'ETHUSDT', tf:'15m',
      d:'Kalman-filtered BTC/ETH stat-arb with liquidity-sweep timing. Enters the spread when both legs sweep equal highs/lows simultaneously, adaptive z-band exits.',
      strat:['Stat Arb','Liquidity Sweep','Kalman Hedge'], edge:'Dual-sweep spread entry',
      strategy:{ winRate:0.621, avgWin:70, avgLoss:32, tradesPerDay:6 } },
    { code:'A.009', name:'APEX HFT · Futures Queue', cat:'SCALP', status:'LIVE', pair:'BTCUSDT', tf:'1m',
      d:'Queue-position aggressor on micro futures. Reads order-flow imbalance + buyside/sellside liquidity pools, cancel/replace via PPO with adverse-selection penalty.',
      strat:['Order Flow','Liquidity Pools','Queue Position'], edge:'OFI + liquidity timing',
      strategy:{ winRate:0.660, avgWin:35, avgLoss:15, tradesPerDay:28 } },
    { code:'A.010', name:'APEX Carry · G10 FX', cat:'STOCKS', status:'LIVE', pair:null, tf:'1D',
      d:'Carry-momentum hybrid across G10 FX with structure filter. Only takes carry trades aligned with daily BOS direction, vol-scaled via DCC-GARCH covariance.',
      strat:['Break of Structure','Carry','Momentum'], edge:'Structure-aligned carry',
      strategy:{ winRate:0.574, avgWin:140, avgLoss:65, tradesPerDay:2 } },
    { code:'A.011', name:'APEX Cascade · SOL', cat:'CRYPTO', status:'BETA', pair:'SOLUSDT', tf:'5m',
      d:'Liquidation-cascade sniper. Reads on-chain liquidation maps, enters after sellside sweep into a high-volume node + FVG, position-sizing via Kelly fraction.',
      strat:['Liquidation Sweep','Volume Node','Fair Value Gap'], edge:'Cascade reversal',
      strategy:{ winRate:0.701, avgWin:55, avgLoss:25, tradesPerDay:5 } },
  ].map((a, i) => ({ ...a, bt: calcMonthlyBacktest(i + 1, a.strategy) }));
}

/* ── MINI EQUITY SPARKLINE ── */
function MiniEquity({ dailyPnl, elapsedDays, color, height = 40, width = 120 }) {
  const pts = dailyPnl.slice(0, elapsedDays);
  if (!pts.length) return null;
  const W = width, H = height;
  const min = Math.min(0, ...pts), max = Math.max(0, ...pts), rng = max - min || 1;
  const x = i => (i / Math.max(1, pts.length - 1)) * W;
  const y = v => H - ((v - min) / rng) * (H - 6) - 3;
  let d = `M${x(0)},${y(pts[0])}`;
  pts.forEach((v, i) => { if (i > 0) d += ` L${x(i)},${y(v)}`; });
  const last = pts[pts.length - 1];
  const id = `sg${color.replace(/[^a-z0-9]/gi,'')}${W}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: W, height: H, display: 'block', flexShrink: 0 }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1={y(0)} x2={W} y2={y(0)} stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
      <path d={`${d} L${x(pts.length-1)},${H} L${x(0)},${H} Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx={x(pts.length-1)} cy={y(last)} r="2.5" fill={color} />
    </svg>
  );
}

/* ── WORLD DATA BAR ── */
function WorldDataBar() {
  const CT = useCT();
  const [gdata, setGdata] = React.useState(null);
  const [fg, setFg]       = React.useState(null);
  React.useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/global').then(r=>r.json()).then(d=>setGdata(d.data)).catch(()=>{});
    fetch('https://api.alternative.me/fng/?limit=1').then(r=>r.json()).then(d=>setFg(d.data?.[0])).catch(()=>{});
  }, []);
  const fmt = n => n >= 1e12 ? '$'+(n/1e12).toFixed(2)+'T' : n >= 1e9 ? '$'+(n/1e9).toFixed(1)+'B' : '—';
  const fgColor = fg ? (parseInt(fg.value) >= 60 ? CT.green : parseInt(fg.value) >= 40 ? CT.amber : CT.red) : CT.dim;
  const stats = [
    { l:'TOTAL MKTCAP',   v: gdata ? fmt(gdata.total_market_cap?.usd)          : '—',   c: CT.textHi },
    { l:'BTC DOMINANCE',  v: gdata ? gdata.market_cap_percentage?.btc?.toFixed(1)+'%': '—', c: CT.amber },
    { l:'ETH DOMINANCE',  v: gdata ? gdata.market_cap_percentage?.eth?.toFixed(1)+'%': '—', c: CT.cyan },
    { l:'24H VOLUME',     v: gdata ? fmt(gdata.total_volume?.usd)               : '—',   c: CT.text },
    { l:'ACTIVE COINS',   v: gdata ? gdata.active_cryptocurrencies?.toLocaleString(): '—', c: CT.text },
    { l:'FEAR & GREED',   v: fg    ? fg.value+' · '+fg.value_classification?.toUpperCase(): '—', c: fgColor },
  ];
  return (
    <div style={{ background: CT.bg3, borderBottom: `1px solid ${CT.border}` }}>
      <div style={{ padding: '5px 32px', borderBottom: `1px solid ${CT.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 8, color: CT.amber, letterSpacing: '0.2em' }}>// GLOBAL MARKET · LIVE</span>
        <span style={{ fontSize: 8, color: CT.dim }}>CoinGecko + Alternative.me</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)' }}>
        {stats.map((s, i) => (
          <div key={s.l} style={{ padding: '14px 18px', borderRight: i < 5 ? `1px solid ${CT.border}` : 'none', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.c, fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontSize: 8, color: CT.dim, letterSpacing: '0.12em', marginTop: 6 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── ARTICLE CARDS ── */
const ARTICLES = [
  { tag:'RESEARCH', title:'Why Sharpe Ratio Alone Will Blow Up Your Book', date:'May 2026', read:'8 min',
    color:'#FFB547', desc:'Sharpe is necessary but not sufficient. Walk through Sortino, Calmar, and Omega ratio — and why we use all three in production before shipping any agent.',
    icon:'📐' },
  { tag:'STRATEGY', title:'Avellaneda-Stoikov in Production: What the Paper Gets Wrong', date:'Apr 2026', read:'12 min',
    color:'#00E5A0', desc:'The classical market-making model assumes symmetric fill probabilities and no adverse selection. Here\'s how we patched it for live crypto L2 books.',
    icon:'⚙️' },
  { tag:'MACRO', title:'DXY Cointegration Is Drifting — What It Means for Gold Agents', date:'Apr 2026', read:'6 min',
    color:'#5BD3F0', desc:'The 40-year XAU/DXY relationship is showing Engle-Granger residuals outside the historical 2σ band. Here\'s what we\'re doing about A.003.',
    icon:'📊' },
  { tag:'ML', title:'FinBERT in 90 Seconds: Earnings-Driven Signals That Actually Work', date:'Mar 2026', read:'10 min',
    color:'#FF3D7F', desc:'Most NLP signal papers test on clean text. We tested on live transcript feeds with 60–200ms latency jitter. The results surprised us.',
    icon:'🧠' },
  { tag:'RISK', title:'Kill-Switch Architecture for Autonomous Agents', date:'Mar 2026', read:'7 min',
    color:'#FFB547', desc:'How we built three-layer circuit breakers — position-level, strategy-level, and portfolio-level — that auto-pause on Sharpe decay.',
    icon:'🔒' },

];

function ArticleCard({ a, CT }) {
  return (
    <div style={{ border: `1px solid ${CT.border}`, background: CT.bg2, display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'border-color .2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = a.color}
      onMouseLeave={e => e.currentTarget.style.borderColor = CT.border}>
      {/* Header visual */}
      <div style={{ height: 120, background: `linear-gradient(135deg, ${a.color}18 0%, ${CT.bg3} 100%)`, position: 'relative', overflow: 'hidden', padding: '20px 20px 0', borderBottom: `1px solid ${CT.border}` }}>
        <div style={{ position: 'absolute', bottom: -20, right: -10, fontSize: 72, opacity: 0.12 }}>{a.icon}</div>
        <div style={{ position: 'absolute', top: 12, right: 14, width: 40, height: 40, borderRadius: '50%', border: `1px solid ${a.color}44`, background: a.color + '10' }} />
        <span style={{ fontSize: 8, padding: '3px 8px', background: a.color + '22', border: `1px solid ${a.color}`, color: a.color, letterSpacing: '0.14em', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{a.tag}</span>
      </div>
      {/* Content */}
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: CT.textHi, fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1.35, marginBottom: 10, flex: 1 }}>{a.title}</div>
        <p style={{ fontSize: 10, color: CT.dim, lineHeight: 1.6, margin: '0 0 12px' }}>{a.desc}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: CT.dim, letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace' }}>
          <span>{a.date}</span><span>{a.read} read</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   TAB HOME
══════════════════════════════════════ */

Object.assign(window, { THEMES, ThemeContext, useCT, CTicker, CChart, CTVChart, CLiveBinanceOrderBook, COrderBook, CRule, CPanel, CLogo, seededRng, calcMonthlyBacktest, getAgents, MiniEquity, WorldDataBar, ARTICLES, ArticleCard, computeSignals, useRealSignals, apexSignals, runApexBacktest, useApexSignals, findPivots, useBinanceFutures, useBinanceTickers });
