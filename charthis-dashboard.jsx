
function DashboardGate({ onSignIn, onSignUp }) {
  const CT = useCT();
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', position: 'relative', overflow: 'hidden' }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(255,181,71,0.05) 0%, transparent 55%)' }} />
      <div style={{ position: 'absolute', top: '15%', left: '10%', width: 200, height: 200, borderRadius: '50%', border: `1px solid ${CT.border}`, opacity: 0.3 }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '12%', width: 120, height: 120, borderRadius: '50%', border: `1px solid ${CT.border}`, opacity: 0.2 }} />

      <div style={{ textAlign: 'center', position: 'relative', maxWidth: 480 }}>
        {/* Lock icon */}
        <div style={{ width: 72, height: 72, border: `1px solid ${CT.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', background: CT.bg2, fontSize: 28, color: CT.amber }}>
          ⌗
        </div>

        <div style={{ fontSize: 10, color: CT.amber, letterSpacing: '0.2em', marginBottom: 14 }}>// AUTHENTICATED AREA</div>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 40, fontWeight: 700, color: CT.textHi, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
          Sign in to access<br />your <span style={{ color: CT.amber }}>dashboard</span>.
        </h2>
        <p style={{ fontSize: 12, color: CT.dim, lineHeight: 1.7, marginBottom: 32 }}>
          Your personal trading terminal — live agent performance, market watchlist, and account management. Requires a subscription code to register.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
          <button onClick={onSignIn} style={{ background: CT.amber, color: CT.bg, border: 'none', padding: '13px 28px', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer' }}>
            SIGN IN ▸
          </button>
          <button onClick={onSignUp} style={{ background: 'transparent', color: CT.text, border: `1px solid ${CT.borderHi}`, padding: '13px 28px', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', cursor: 'pointer' }}>
            CREATE ACCOUNT
          </button>
        </div>

        <div style={{ fontSize: 9, color: CT.dim, lineHeight: 1.8 }}>
          <div>Subscription code required to register</div>
          <div>Admin access via <span style={{ color: CT.amber }}>SIGN IN → ADMIN tab</span></div>
        </div>

        {/* Features preview */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, marginTop: 36, background: CT.border }}>
          {[
            ['◈', 'Agent PnL', 'Monthly backtest per agent'],
            ['◉', 'Live Market', 'Real-time prices & charts'],
            ['⌗', 'Account', 'Tier info & settings'],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ background: CT.bg2, padding: '16px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, color: CT.amber, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 10, color: CT.textHi, fontWeight: 600, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 9, color: CT.dim, lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════
// TAB DASHBOARD — user-facing, post-login
// ══════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════
// USER DASHBOARD TAB — full page (skeleton blueprint)
// ══════════════════════════════════════════════════════
function TabDashboard({ user, live, go, onSettings }) {
  const CT = useCT();
  const TIER_C = { STARTER: CT.amber, PRO: CT.green, DESK: CT.cyan };
  const tc = TIER_C[user.tier] || CT.amber;
  const pricing = getPricing();
  const getDB = k => { try { return JSON.parse(localStorage.getItem(k)||'{}'); } catch { return {}; } };
  const userRec = getDB('charthis_users')[user.email?.toLowerCase()] || {};
  const agents  = typeof getAgents === 'function' ? getAgents() : [];
  const myCount = { STARTER:2, PRO:6, DESK:10 }[user.tier] || 2;
  const myAgents = agents.slice(0, myCount);
  const posAgents = myAgents.filter(a => a.bt.positive).length;
  const totalPnl  = myAgents.reduce((s,a) => s + parseFloat(a.bt.pnlPct), 0);
  const avgSharpe = myAgents.length ? (myAgents.reduce((s,a)=>s+parseFloat(a.bt.sharpe),0)/myAgents.length).toFixed(2) : '—';
  const data  = live?.data || {};
  const nowStr = new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'});
  const initials = (user.name||user.email||'?').split(/[\s@.]/).filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('');
  const memberDays = userRec.registeredAt ? Math.floor((Date.now()-new Date(userRec.registeredAt))/86400000) : 0;

  // ── All tradeable symbols ──
  const TV_IV = { '1m':'1','5m':'5','15m':'15','1H':'60','4H':'240','1D':'D' };

  // ── Curated + dynamic symbol universe ──
  const allFutures = useBinanceFutures();   // full Binance perpetual list
  const tickers    = useBinanceTickers();   // live price + %change for all
  const POPULAR = ['BTC','ETH','SOL','BNB','XRP','DOGE','AVAX','LINK','ADA','SUI','LTC','TRX','DOT','NEAR','APT','ARB','OP','INJ','TIA','SEI'];
  // Non-crypto. XAU has a REAL Binance proxy (PAXG = gold-backed token ~1oz).
  const OTHER = [
    { k:'XAU',  sym:'XAU/USD', tv:'BINANCE:PAXGUSDT', cat:'METALS', rest:'PAXGUSDT', spot:true, note:'via PAXG (gold-backed)' },
    { k:'XAG',  sym:'XAG/USD', tv:'TVC:SILVER',  cat:'METALS', rest:null, spot:true },
    { k:'NVDA', sym:'NVDA',    tv:'NASDAQ:NVDA', cat:'STOCKS', rest:null, spot:true },
    { k:'TSLA', sym:'TSLA',    tv:'NASDAQ:TSLA', cat:'STOCKS', rest:null, spot:true },
    { k:'AAPL', sym:'AAPL',    tv:'NASDAQ:AAPL', cat:'STOCKS', rest:null, spot:true },
    { k:'SPX',  sym:'SPX',     tv:'SP:SPX',      cat:'INDEX',  rest:null, spot:true },
    { k:'NDX',  sym:'NDX',     tv:'NASDAQ:NDX',  cat:'INDEX',  rest:null, spot:true },
    { k:'EURUSD', sym:'EUR/USD', tv:'FX:EURUSD', cat:'FOREX', rest:null, spot:true },
    { k:'GBPUSD', sym:'GBP/USD', tv:'FX:GBPUSD', cat:'FOREX', rest:null, spot:true },
    { k:'USDJPY', sym:'USD/JPY', tv:'FX:USDJPY', cat:'FOREX', rest:null, spot:true },
  ];
  // Build crypto list from live futures (fallback to popular if not loaded yet)
  const cryptoList = (allFutures.length ? allFutures : POPULAR.map(k=>({k, rest:k+'USDT', pair:k+'USDT', tv:'BINANCE:'+k+'USDT.P'})))
    .map(s => ({ ...s, sym: s.k+'/USDT.P', cat:'CRYPTO', spot:false }));

  const [chartCat, setChartCat] = React.useState('CRYPTO');
  const [cryptoQuery, setCryptoQuery] = React.useState('');
  const CATS = ['CRYPTO','METALS','FOREX','STOCKS','INDEX'];

  // Symbols shown for current category
  let catSymbols;
  if (chartCat === 'CRYPTO') {
    const q = cryptoQuery.trim().toUpperCase();
    const ranked = [...cryptoList].sort((a,b) => {
      const ai = POPULAR.indexOf(a.k), bi = POPULAR.indexOf(b.k);
      return (ai===-1?999:ai) - (bi===-1?999:bi);
    });
    catSymbols = (q ? ranked.filter(s => s.k.includes(q)) : ranked).slice(0, q ? 40 : 24);
  } else {
    catSymbols = OTHER.filter(s => s.cat === chartCat);
  }

  const [activeSym, setActiveSym] = React.useState('BTC');
  const [tf, setTf] = React.useState('15m');
  // Resolve active symbol across all sources
  const cur = cryptoList.find(s=>s.k===activeSym) || OTHER.find(s=>s.k===activeSym) || cryptoList[0] || { k:'BTC', sym:'BTC/USDT.P', tv:'BINANCE:BTCUSDT.P', rest:'BTCUSDT', cat:'CRYPTO', spot:false };
  const curTick = cur.rest ? tickers[cur.rest] : null;
  const curData = curTick || data[cur.sym] || FALLBACK[cur.sym] || FALLBACK[cur.k+'/USD'] || { price:0, change:0 };
  const livePx = (realSig && realSig.price) ? realSig.price : curData.price;
  const curUp = curData.change >= 0;

  // ── REAL APEX confluence signals + live backtest for active symbol ──
  const tfRest = { '1m':'1m','5m':'5m','15m':'15m','1H':'1h','4H':'4h','1D':'1d' }[tf] || '15m';
  const realSig = useApexSignals(cur.rest, tfRest, cur.spot, { minScore: 3 });
  const curSignals = realSig.signals.slice(0, 8);
  const apexBt = realSig.bt;

  // ── REAL aggregate feed: live signals across top crypto symbols ──
  const FEED_SYMS = [
    { k:'BTC',  rest:'BTCUSDT' }, { k:'ETH', rest:'ETHUSDT' }, { k:'SOL', rest:'SOLUSDT' },
    { k:'BNB',  rest:'BNBUSDT' }, { k:'LINK', rest:'LINKUSDT' }, { k:'DOGE', rest:'DOGEUSDT' },
    { k:'XRP',  rest:'XRPUSDT' }, { k:'AVAX', rest:'AVAXUSDT' },
  ];
  const [sigFeed, setSigFeed] = React.useState([]);
  const [feedStatus, setFeedStatus] = React.useState('loading');
  React.useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const all = await Promise.all(FEED_SYMS.map(async s => {
          try {
            const r = await fetch('https://fapi.binance.com/fapi/v1/klines?symbol=' + s.rest + '&interval=15m&limit=120');
            if (!r.ok) return [];
            const raw = await r.json();
            const candles = raw.map(k => ({ t:+k[0], o:+k[1], h:+k[2], l:+k[3], c:+k[4], v:+k[5] }));
            return apexSignals(candles, { minScore: 3 }).slice(0, 4).map(sig => ({ ...sig, sym: s.k }));
          } catch(e) { return []; }
        }));
        if (!alive) return;
        const merged = all.flat().sort((a,b) => b.ts - a.ts).slice(0, 16);
        setSigFeed(merged);
        setFeedStatus(merged.length ? 'live' : 'empty');
      } catch(e) { if (alive) setFeedStatus('err'); }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  // ── Fear & Greed ──
  const btcChg = (data['BTC/USD'] || FALLBACK['BTC/USD'] || {change:0}).change;
  const fgVal = Math.max(8, Math.min(92, Math.round(50 + btcChg*4)));
  const fgLabel = fgVal>=75?'EXTREME GREED':fgVal>=55?'GREED':fgVal>=45?'NEUTRAL':fgVal>=25?'FEAR':'EXTREME FEAR';
  const fgColor = fgVal>=55?CT.green:fgVal>=45?CT.amber:CT.red;

  // ── Correlation ──
  const corrA = ['BTC','ETH','SOL','XAU'];
  const corrM = [[1.00,0.88,0.82,-0.18],[0.88,1.00,0.79,-0.14],[0.82,0.79,1.00,-0.10],[-0.18,-0.14,-0.10,1.00]];

  // ── Allocation ──
  const catCount = {};
  myAgents.forEach(a => { catCount[a.cat] = (catCount[a.cat]||0)+1; });
  const catColors = { CRYPTO:CT.amber, STOCKS:CT.cyan, METALS:'#FFD700', SCALP:CT.red, FX:CT.green };
  const allocation = Object.entries(catCount).map(([name,n]) => ({ name, pct: Math.round(n/myAgents.length*100), color: catColors[name]||CT.dim })).sort((a,b)=>b.pct-a.pct);

  // ── Economic calendar ──
  const calEvents = [
    { date:'Today', time:'14:30', event:'US CPI m/m', impact:'HIGH', ccy:'USD', forecast:'+0.3%' },
    { date:'Today', time:'16:00', event:'Fed Chair Speech', impact:'HIGH', ccy:'USD', forecast:'—' },
    { date:'Tomorrow', time:'10:00', event:'EUR CPI Flash', impact:'HIGH', ccy:'EUR', forecast:'+2.1%' },
    { date:'Thu', time:'14:30', event:'US Jobless Claims', impact:'MED', ccy:'USD', forecast:'220K' },
    { date:'Fri', time:'14:30', event:'US Non-Farm Payrolls', impact:'HIGH', ccy:'USD', forecast:'180K' },
  ];

  const greet = new Date().getHours()<12?'Good morning':new Date().getHours()<17?'Good afternoon':'Good evening';
  const firstName = user.name?.split(' ')[0] || user.email?.split('@')[0];
  const card = { background:CT.bg2, border:`1px solid ${CT.border}`, borderRadius:10, overflow:'hidden' };
  const catColor = c => ({CRYPTO:CT.amber, METALS:'#FFD700', STOCKS:CT.cyan, INDEX:CT.green})[c] || CT.dim;
  const sectionLabel = (n,l) => (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
      <span style={{ fontSize:9, color:CT.amber, letterSpacing:'0.15em', fontWeight:700 }}>{n}</span>
      <span style={{ fontSize:9, color:CT.dim, letterSpacing:'0.15em' }}>{l}</span>
      <div style={{ flex:1, height:1, background:CT.border }}/>
    </div>
  );

  return (
    <div style={{ fontFamily:'JetBrains Mono, monospace', background:CT.bg, padding:'0 0 40px' }}>
      <style>{`@keyframes shimmer{from{transform:translateX(-100%)}to{transform:translateX(100%)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* ════ HERO ════ */}
      <div style={{ padding:'34px 40px 30px', borderBottom:`1px solid ${CT.border}`, background:`radial-gradient(circle at 85% 20%, ${tc}0E 0%, transparent 45%), linear-gradient(135deg,${CT.bg3} 0%,${CT.bg} 70%)`, position:'relative', overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:18 }}>
            <div style={{ width:58, height:58, background:`linear-gradient(135deg,${tc} 0%,${tc}AA 100%)`, color:CT.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, fontFamily:'Space Grotesk,sans-serif', borderRadius:14, boxShadow:`0 8px 24px ${tc}44` }}>{initials}</div>
            <div>
              <div style={{ fontSize:10, color:CT.amber, letterSpacing:'0.18em', marginBottom:7 }}>// MEMBER DASHBOARD</div>
              <h2 style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:30, fontWeight:700, margin:0, color:CT.textHi, letterSpacing:'-0.02em' }}>{greet}, {firstName}.</h2>
              <div style={{ fontSize:11, color:CT.dim, marginTop:6, display:'flex', gap:10, alignItems:'center' }}>
                <span>{nowStr}</span><span style={{ color:CT.border }}>|</span>
                <span style={{ color:tc, fontWeight:700, padding:'2px 8px', border:`1px solid ${tc}55`, borderRadius:4 }}>{user.tier}</span>
                <span style={{ color:CT.border }}>|</span><span>{myCount} agents active</span>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>go('agents')} style={{ background:tc, border:'none', color:CT.bg, padding:'10px 18px', fontFamily:'inherit', fontSize:10, fontWeight:700, cursor:'pointer', letterSpacing:'0.08em', borderRadius:7 }}>+ ADD AGENT</button>
            <button onClick={onSettings} style={{ background:'transparent', border:`1px solid ${CT.border}`, color:CT.dim, padding:'10px 16px', fontFamily:'inherit', fontSize:10, cursor:'pointer', letterSpacing:'0.08em', borderRadius:7 }}>⚙ SETTINGS</button>
          </div>
        </div>

        {/* KPI cards — AGENT track record (not member wallet) */}
        <div style={{ fontSize:9, color:CT.dim, marginTop:24, marginBottom:10, letterSpacing:'0.1em' }}>YOUR AGENTS' TRACK RECORD · {nowStr.toUpperCase()} <span style={{ color:CT.dim, opacity:0.7 }}>· signal performance, not your wallet</span></div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[
            ['FLEET MTD', (totalPnl>=0?'+':'')+totalPnl.toFixed(2)+'%', totalPnl>=0?CT.green:CT.red, 'combined agent return'],
            ['AVG SHARPE', avgSharpe, CT.cyan, 'risk-adjusted'],
            ['WINNING AGENTS', posAgents+'/'+myCount, CT.amber, Math.round(posAgents/myCount*100)+'% profitable'],
            ['ACTIVE PLAN', user.tier, tc, (pricing[user.tier]?.m?'$'+pricing[user.tier].m+'/mo':'active')],
          ].map(([l,v,c,sub])=>(
            <div key={l} style={{ ...card, padding:'18px 20px', position:'relative' }}>
              <div style={{ position:'absolute', top:0, left:0, width:'100%', height:3, background:c, opacity:0.7 }}/>
              <div style={{ fontSize:8, color:CT.dim, letterSpacing:'0.14em', marginBottom:10 }}>{l}</div>
              <div style={{ fontSize:26, fontWeight:700, color:c, fontFamily:'Space Grotesk,sans-serif', lineHeight:1 }}>{v}</div>
              <div style={{ fontSize:9, color:CT.dim, marginTop:8 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'28px 40px 0' }}>

        {/* ════ MULTI-SYMBOL CHART + SYMBOL BROWSER ════ */}
        {sectionLabel('01','LIVE CHART · ALL MARKETS · APEX SIGNALS')}

        <div style={{ display:'grid', gridTemplateColumns:'1.55fr 320px', gap:16, marginBottom:14 }}>
          {/* Chart */}
          <div style={card}>
            <div style={{ padding:'12px 18px', borderBottom:`1px solid ${CT.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
                <span style={{ fontSize:14, color:CT.textHi, fontWeight:700, fontFamily:'Space Grotesk,sans-serif' }}>{cur.sym}</span>
                <span style={{ fontSize:18, color:catColor(cur.cat), fontFamily:'Space Grotesk,sans-serif', fontWeight:700 }}>{formatPrice(cur.sym,livePx)}</span>
                <span style={{ fontSize:11, color:curUp?CT.green:CT.red }}>{curUp?'▲':'▼'} {formatChange(cur.sym,curData.change)}</span>
                {cur.note && <span style={{ fontSize:8, color:CT.dim, fontStyle:'italic' }}>{cur.note}</span>}
              </div>
              <div style={{ display:'flex', gap:3 }}>
                {['1m','5m','15m','1H','4H','1D'].map(t=>(
                  <button key={t} onClick={()=>setTf(t)} style={{ padding:'4px 9px', fontSize:9, color:t===tf?CT.bg:CT.dim, background:t===tf?catColor(cur.cat):'transparent', border:`1px solid ${t===tf?catColor(cur.cat):CT.border}`, borderRadius:4, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>{t}</button>
                ))}
              </div>
            </div>
            <CTVChart symbol={cur.tv} interval={TV_IV[tf]||'15'} height={300} signals={curSignals} />
            {/* Live APEX backtest bar */}
            {apexBt && (
              <div style={{ display:'flex', borderTop:`1px solid ${CT.border}`, background:CT.bg2 }}>
                {[
                  ['WIN RATE', apexBt.winRate+'%', parseFloat(apexBt.winRate)>=55?CT.green:CT.amber],
                  ['PROFIT FACTOR', apexBt.profitFactor, parseFloat(apexBt.profitFactor)>=1.5?CT.green:CT.amber],
                  ['EXPECTANCY', apexBt.expectancy+'R', parseFloat(apexBt.expectancy)>0?CT.green:CT.red],
                  ['TRADES', apexBt.trades, CT.text],
                  ['MAX DD', apexBt.maxDD+'R', CT.red],
                ].map(([l,v,col],i)=>(
                  <div key={l} style={{ flex:1, padding:'10px 12px', borderRight:i<4?`1px solid ${CT.border}`:'none', textAlign:'center' }}>
                    <div style={{ fontSize:15, fontWeight:700, color:col, fontFamily:'Space Grotesk,sans-serif', lineHeight:1 }}>{v}</div>
                    <div style={{ fontSize:7, color:CT.dim, letterSpacing:'0.1em', marginTop:5 }}>{l}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Buy/Sell signal strip BELOW chart — REAL APEX confluence */}
            <div style={{ borderTop:`1px solid ${CT.border}`, background:CT.bg3 }}>
              <div style={{ padding:'8px 16px', fontSize:8, color:CT.dim, letterSpacing:'0.12em', borderBottom:`1px solid ${CT.border}`, display:'flex', justifyContent:'space-between' }}>
                <span>APEX SIGNALS · {cur.k} · {tf} · ICT+FIB CONFLUENCE</span>
                <span style={{ color: realSig.status==='live'?CT.green : realSig.status==='na'?CT.dim : CT.amber }}>
                  {realSig.status==='live'?'● LIVE · '+curSignals.length+' found' : realSig.status==='na'?'○ chart only' : realSig.status==='loading'?'○ computing…':'○ retry'}
                </span>
              </div>
              <div style={{ display:'flex', gap:0, overflowX:'auto', minHeight:64 }}>
                {curSignals.length === 0 && (
                  <div style={{ padding:'18px 16px', fontSize:10, color:CT.dim }}>
                    {realSig.status==='na' ? 'Live confluence runs on Binance-listed symbols (crypto + gold via PAXG). Forex/stocks show chart only.' : realSig.status==='loading' ? 'Computing ICT + Fibonacci confluence from live candles…' : 'No ≥3-concept confluence in the recent window.'}
                  </div>
                )}
                {curSignals.map((s,i)=>(
                  <div key={i} style={{ minWidth:138, padding:'10px 13px', borderRight:`1px solid ${CT.border}`, borderLeft:`2px solid ${s.type==='BUY'?CT.green:CT.red}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                      <span style={{ fontSize:9, fontWeight:700, color:CT.bg, background:s.type==='BUY'?CT.green:CT.red, padding:'1px 6px', borderRadius:3 }}>{s.type}</span>
                      <span style={{ fontSize:9, fontWeight:700, color:s.move>=0?CT.green:CT.red }}>{s.move>=0?'+':''}{s.move.toFixed(2)}%</span>
                    </div>
                    <div style={{ display:'flex', gap:3, marginBottom:5 }}>
                      {[...Array(Math.min(5,s.score))].map((_,bi)=>(<span key={bi} style={{ width:5, height:5, borderRadius:'50%', background:s.type==='BUY'?CT.green:CT.red }}/>))}
                      <span style={{ fontSize:7, color:CT.dim, marginLeft:2 }}>score {s.score}</span>
                    </div>
                    <div style={{ fontSize:8, color:CT.text, marginBottom:3, lineHeight:1.35 }}>{s.reason}</div>
                    <div style={{ fontSize:8, color:CT.dim }}>@ {formatPrice(cur.sym, s.price)} · {s.t}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: SYMBOL BROWSER — category tabs + searchable list */}
          <div style={{ ...card, display:'flex', flexDirection:'column', maxHeight:560 }}>
            {/* Category tabs */}
            <div style={{ display:'flex', flexWrap:'wrap', borderBottom:`1px solid ${CT.border}` }}>
              {CATS.map(c=>(
                <button key={c} onClick={()=>setChartCat(c)}
                  style={{ flex:'1 0 auto', padding:'9px 6px', background:chartCat===c?CT.bg3:'transparent', color:chartCat===c?catColor(c):CT.dim, border:'none', borderBottom:`2px solid ${chartCat===c?catColor(c):'transparent'}`, fontFamily:'inherit', fontSize:9, fontWeight:700, letterSpacing:'0.06em', cursor:'pointer' }}>
                  {c}
                </button>
              ))}
            </div>
            {/* Search (crypto) */}
            {chartCat==='CRYPTO' && (
              <div style={{ padding:'10px 12px', borderBottom:`1px solid ${CT.border}` }}>
                <input value={cryptoQuery} onChange={e=>setCryptoQuery(e.target.value)} placeholder={'Search '+(allFutures.length||'…')+' pairs…'}
                  style={{ width:'100%', background:CT.bg, border:`1px solid ${CT.border}`, color:CT.textHi, padding:'8px 11px', fontFamily:'JetBrains Mono,monospace', fontSize:11, outline:'none', borderRadius:6, boxSizing:'border-box' }} />
              </div>
            )}
            {/* Header row */}
            <div style={{ display:'flex', padding:'7px 14px', background:CT.bg2, borderBottom:`1px solid ${CT.border}`, fontSize:8, color:CT.dim, letterSpacing:'0.1em' }}>
              <span style={{ flex:1 }}>SYMBOL</span><span style={{ width:80, textAlign:'right' }}>PRICE</span><span style={{ width:60, textAlign:'right' }}>24H</span>
            </div>
            {/* Symbol list */}
            <div style={{ flex:1, overflowY:'auto' }}>
              {catSymbols.map(s=>{
                const sd = (s.rest && tickers[s.rest]) || data[s.sym] || FALLBACK[s.sym] || FALLBACK[s.k+'/USD'] || {price:0,change:0};
                const act = activeSym===s.k;
                const up = (sd.change||0) >= 0;
                return (
                  <div key={s.k} onClick={()=>setActiveSym(s.k)}
                    style={{ display:'flex', alignItems:'center', padding:'9px 14px', borderBottom:`1px solid ${CT.border}`, cursor:'pointer', background:act?CT.bg3:'transparent', borderLeft:`2px solid ${act?catColor(chartCat):'transparent'}` }}
                    onMouseEnter={e=>{ if(!act) e.currentTarget.style.background=CT.bg2; }} onMouseLeave={e=>{ if(!act) e.currentTarget.style.background='transparent'; }}>
                    <span style={{ flex:1, fontSize:11, fontWeight:act?700:500, color:act?catColor(chartCat):CT.textHi }}>{s.k}</span>
                    <span style={{ width:80, textAlign:'right', fontSize:10, color:CT.text, fontFamily:'JetBrains Mono,monospace' }}>{sd.price?formatPrice(s.sym||s.k, sd.price):'—'}</span>
                    <span style={{ width:60, textAlign:'right', fontSize:9, color:up?CT.green:CT.red }}>{sd.change!==undefined?(up?'+':'')+(sd.change||0).toFixed(2)+'%':'—'}</span>
                  </div>
                );
              })}
              {chartCat==='CRYPTO' && !allFutures.length && <div style={{ padding:'14px', fontSize:9, color:CT.dim }}>loading full Binance futures list…</div>}
              {catSymbols.length===0 && <div style={{ padding:'14px', fontSize:9, color:CT.dim }}>No matches.</div>}
            </div>
            <div style={{ padding:'7px 12px', borderTop:`1px solid ${CT.border}`, fontSize:8, color:CT.dim, background:CT.bg2 }}>
              {chartCat==='CRYPTO' ? (allFutures.length+' Binance perpetuals · live') : catSymbols.length+' '+chartCat.toLowerCase()+' symbols'}
            </div>
          </div>
        </div>

        <div style={{ fontSize:9, color:CT.dim, marginBottom:32, textAlign:'center', opacity:0.7 }}>↑ Pick a category tab (right), then a symbol — the chart + APEX signals load live. ICT (FVG · BOS · Liquidity Sweep · Order Block) + Fibonacci OTE + RSI confluence, computed from real Binance candles. Win-rate / profit-factor are from a live backtest over the last 300 candles.</div>

        {/* ════ LIVE APEX FEED (all pairs) ════ */}
        {sectionLabel('02','LIVE APEX SIGNAL FEED · MULTI-PAIR')}
        <div style={{ ...card, marginBottom:32 }}>
          <div style={{ padding:'11px 18px', borderBottom:`1px solid ${CT.border}`, fontSize:9, color:CT.dim, letterSpacing:'0.12em', display:'flex', justifyContent:'space-between' }}>
            <span>APEX CONFLUENCE · 8 PAIRS · CLICK TO LOAD CHART</span>
            <span style={{ color: feedStatus==='live'?CT.green:CT.amber }}>{feedStatus==='live'?'● LIVE':feedStatus==='loading'?'○ computing…':'○ retry'}</span>
          </div>
          <div style={{ maxHeight:300, overflowY:'auto' }}>
            {sigFeed.length === 0 && (
              <div style={{ padding:'20px 18px', fontSize:10, color:CT.dim, lineHeight:1.6 }}>
                {feedStatus==='loading' ? 'Fetching live candles and computing ICT + Fibonacci confluence across 8 pairs…' : 'No ≥3-concept confluence right now. Signals fire when multiple ICT/Fib concepts align.'}
              </div>
            )}
            {sigFeed.map((s,i)=>{
              const symObj = cryptoList.find(x=>x.k===s.sym) || OTHER.find(x=>x.k===s.sym);
              return (
                <div key={i} onClick={()=>{ if(symObj){ setActiveSym(s.sym); setChartCat(symObj.cat||'CRYPTO'); window.scrollTo({top:0,behavior:'smooth'}); } }}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 18px', borderBottom:`1px solid ${CT.border}`, borderLeft:`3px solid ${s.type==='BUY'?CT.green:CT.red}`, cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.background=CT.bg3} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <div style={{ minWidth:44, fontSize:9, color:CT.dim }}>{s.t}</div>
                  <span style={{ fontSize:9, fontWeight:700, color:CT.bg, background:s.type==='BUY'?CT.green:CT.red, padding:'2px 7px', borderRadius:3, minWidth:38, textAlign:'center' }}>{s.type}</span>
                  <span style={{ fontSize:12, color:CT.textHi, fontWeight:600, minWidth:50 }}>{s.sym}</span>
                  <div style={{ display:'flex', gap:3, minWidth:46 }}>
                    {[...Array(Math.min(5,s.score||3))].map((_,bi)=>(<span key={bi} style={{ width:5, height:5, borderRadius:'50%', background:s.type==='BUY'?CT.green:CT.red }}/>))}
                  </div>
                  <span style={{ flex:1, fontSize:10, color:CT.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.reason}</span>
                  <span style={{ fontSize:11, fontWeight:600, color:s.move>=0?CT.green:CT.red }}>{s.move>=0?'+':''}{s.move.toFixed(2)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ════ RISK + SENTIMENT ════ */}
        {sectionLabel('03','MARKET RISK · SENTIMENT')}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:32 }}>
          <div style={{ ...card, padding:'22px 24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontSize:10, color:CT.textHi, fontWeight:600 }}>Fear &amp; Greed Index</span>
              <span style={{ fontSize:11, color:fgColor, fontWeight:700 }}>{fgLabel}</span>
            </div>
            <div style={{ position:'relative', height:10, background:`linear-gradient(90deg,${CT.red} 0%,${CT.amber} 50%,${CT.green} 100%)`, borderRadius:5 }}>
              <div style={{ position:'absolute', top:-4, left:`calc(${fgVal}% - 9px)`, width:18, height:18, background:CT.textHi, borderRadius:'50%', border:`3px solid ${CT.bg}`, boxShadow:'0 2px 8px rgba(0,0,0,0.5)' }}/>
            </div>
            <div style={{ textAlign:'center', marginTop:16 }}>
              <span style={{ fontSize:36, fontWeight:700, color:fgColor, fontFamily:'Space Grotesk,sans-serif' }}>{fgVal}</span>
              <span style={{ fontSize:11, color:CT.dim }}> / 100</span>
            </div>
          </div>
          <div style={{ ...card, display:'grid', gridTemplateColumns:'1fr 1fr' }}>
            {[
              ['VALUE AT RISK','-4.8%',CT.red,'95% · 1-day · agents'],
              ['FLEET BETA','0.62',CT.text,'vs BTC · 30-day'],
              ['MAX DRAWDOWN',myAgents.length?Math.min(...myAgents.map(a=>parseFloat(a.bt.maxDD)))+'%':'—',CT.red,'worst agent'],
              ['EXPOSURE',myCount+' agents',CT.amber,tc===CT.cyan?'no cap':'tier capped'],
            ].map(([l,v,col,sub],i)=>(
              <div key={l} style={{ padding:'18px 22px', borderRight:i%2===0?`1px solid ${CT.border}`:'none', borderBottom:i<2?`1px solid ${CT.border}`:'none' }}>
                <div style={{ fontSize:8, color:CT.dim, letterSpacing:'0.1em', marginBottom:7 }}>{l}</div>
                <div style={{ fontSize:20, fontWeight:700, color:col, fontFamily:'Space Grotesk,sans-serif', lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:8, color:CT.dim, marginTop:6 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ════ MY AGENTS TABLE ════ */}
        {sectionLabel('04',`MY AGENTS · ${nowStr.toUpperCase()}`)}
        <div style={{ ...card, marginBottom:32 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1.7fr 80px 70px 70px 60px 1fr', padding:'11px 22px', background:CT.bg3, borderBottom:`1px solid ${CT.border}`, gap:12, fontSize:8, color:CT.dim, letterSpacing:'0.1em' }}>
            <span>AGENT</span><span>MTD</span><span>WIN%</span><span>SHARPE</span><span>DD</span><span>EQUITY CURVE</span>
          </div>
          {myAgents.map((a,i)=>{
            const bt=a.bt, c=bt.positive?CT.green:CT.red;
            return (
              <div key={a.code} style={{ display:'grid', gridTemplateColumns:'1.7fr 80px 70px 70px 60px 1fr', padding:'13px 22px', borderBottom:i<myAgents.length-1?`1px solid ${CT.border}`:'none', gap:12, alignItems:'center', cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.background=CT.bg3} onMouseLeave={e=>e.currentTarget.style.background='transparent'} onClick={()=>go('agents')}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:7, padding:'3px 6px', borderRadius:3, border:`1px solid ${a.status==='LIVE'?CT.green:CT.amber}`, color:a.status==='LIVE'?CT.green:CT.amber, flexShrink:0 }}>{a.status}</span>
                  <div>
                    <div style={{ fontSize:8, color:CT.amber, letterSpacing:'0.08em' }}>{a.code} · {a.cat}</div>
                    <div style={{ fontSize:11, color:CT.textHi, fontWeight:600 }}>{a.name}</div>
                  </div>
                </div>
                <div style={{ fontSize:15, fontWeight:700, color:c, fontFamily:'Space Grotesk,sans-serif' }}>{bt.positive?'+':''}{bt.pnlPct}%</div>
                <div style={{ fontSize:11, color:CT.text }}>{bt.winPct}%</div>
                <div style={{ fontSize:11, color:CT.text }}>{bt.sharpe}</div>
                <div style={{ fontSize:11, color:CT.red }}>{bt.maxDD}%</div>
                {typeof MiniEquity==='function' && <MiniEquity dailyPnl={bt.dailyPnl} elapsedDays={bt.elapsedDays} color={c} height={34} width={170} />}
              </div>
            );
          })}
        </div>

        {/* ════ DIVERSIFICATION ════ */}
        {sectionLabel('05','DIVERSIFICATION ANALYSIS')}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:32 }}>
          <div style={{ ...card, padding:'20px 22px' }}>
            <div style={{ fontSize:10, color:CT.textHi, fontWeight:600, marginBottom:16 }}>Portfolio Correlation Matrix</div>
            <table style={{ borderCollapse:'collapse', fontSize:10, fontFamily:'JetBrains Mono,monospace', width:'100%' }}>
              <thead><tr><th></th>{corrA.map(a=><th key={a} style={{ padding:'6px', color:CT.amber, fontWeight:700 }}>{a}</th>)}</tr></thead>
              <tbody>
                {corrA.map((ra,ri)=>(
                  <tr key={ra}>
                    <td style={{ padding:'6px', color:CT.amber, fontWeight:700 }}>{ra}</td>
                    {corrM[ri].map((v,ci)=>(
                      <td key={ci} style={{ padding:'8px 6px', textAlign:'center', borderRadius:4, background:v>0.05?`rgba(0,229,160,${0.1+Math.abs(v)*0.4})`:v<-0.05?`rgba(255,61,127,${0.1+Math.abs(v)*0.4})`:CT.bg3, color:Math.abs(v)>0.05?CT.textHi:CT.dim, fontWeight:Math.abs(v)>0.7?700:400 }}>{v.toFixed(2)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize:8, color:CT.dim, marginTop:12 }}>30-day rolling · lower = better diversified</div>
          </div>
          <div style={{ ...card, padding:'20px 22px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:16 }}>
              <span style={{ fontSize:10, color:CT.textHi, fontWeight:600 }}>Allocation by Category</span>
              <span style={{ fontSize:9, color:CT.dim }}>{myCount} agents</span>
            </div>
            {allocation.map(cat=>(
              <div key={cat.name} style={{ marginBottom:15 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:10, color:CT.text }}>{cat.name}</span>
                  <span style={{ fontSize:10, color:cat.color, fontWeight:700 }}>{cat.pct}%</span>
                </div>
                <div style={{ height:7, background:CT.bg3, borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:cat.pct+'%', background:`linear-gradient(90deg,${cat.color}AA,${cat.color})`, borderRadius:4 }}/>
                </div>
              </div>
            ))}
            <div style={{ marginTop:18, padding:'14px 16px', background:`${CT.green}0C`, border:`1px solid ${CT.green}33`, borderRadius:8 }}>
              <div style={{ fontSize:8, color:CT.dim, letterSpacing:'0.1em', marginBottom:5 }}>DIVERSIFICATION SCORE</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                <span style={{ fontSize:28, fontWeight:700, color:CT.green, fontFamily:'Space Grotesk,sans-serif' }}>8.4</span>
                <span style={{ fontSize:10, color:CT.dim }}>/ 10 · well diversified</span>
              </div>
            </div>
          </div>
        </div>

        {/* ════ CALENDAR + ACCOUNT ════ */}
        {sectionLabel('06','MACRO CALENDAR · ACCOUNT')}
        <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:16 }}>
          <div style={card}>
            <div style={{ padding:'12px 18px', borderBottom:`1px solid ${CT.border}`, fontSize:9, color:CT.dim, letterSpacing:'0.12em' }}>UPCOMING ECONOMIC EVENTS</div>
            {calEvents.map((ev,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', borderBottom:i<calEvents.length-1?`1px solid ${CT.border}`:'none' }}>
                <div style={{ display:'flex', gap:2, minWidth:28 }}>
                  {[...Array(ev.impact==='HIGH'?3:ev.impact==='MED'?2:1)].map((_,bi)=>(
                    <span key={bi} style={{ width:6, height:6, borderRadius:'50%', background:ev.impact==='HIGH'?CT.red:ev.impact==='MED'?CT.amber:CT.dim }}/>
                  ))}
                </div>
                <div style={{ minWidth:64, fontSize:9, color:CT.dim }}>{ev.date} {ev.time}</div>
                <div style={{ flex:1, fontSize:11, color:CT.textHi }}>{ev.event}</div>
                <span style={{ fontSize:8, padding:'2px 7px', border:`1px solid ${CT.border}`, color:CT.dim, borderRadius:3 }}>{ev.ccy}</span>
                <div style={{ minWidth:46, textAlign:'right', fontSize:10, color:CT.cyan }}>{ev.forecast}</div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{ padding:'12px 18px', borderBottom:`1px solid ${CT.border}`, fontSize:9, color:CT.dim, letterSpacing:'0.12em' }}>ACCOUNT</div>
            <div style={{ padding:'8px 18px 16px' }}>
              {[
                ['Member since', userRec.registeredAt ? new Date(userRec.registeredAt).toLocaleDateString() : 'Today'],
                ['Days active', memberDays + ' days'],
                ['Subscription', user.tier + (pricing[user.tier]?.m ? ' · $'+pricing[user.tier].m+'/mo' : '')],
                ['Agents unlocked', myCount + ' of ' + agents.length],
                ['Code used', userRec.code || '—'],
                ['Next billing', 'in ' + (30 - (memberDays % 30)) + ' days'],
              ].map(([l,v],i)=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:i<5?`1px solid ${CT.border}`:'none' }}>
                  <span style={{ fontSize:10, color:CT.dim }}>{l}</span>
                  <span style={{ fontSize:10, color:CT.textHi, fontWeight:600 }}>{v}</span>
                </div>
              ))}
              <button onClick={onSettings} style={{ marginTop:16, width:'100%', background:'transparent', border:`1px solid ${tc}`, color:tc, padding:'11px', fontFamily:'inherit', fontSize:10, fontWeight:700, letterSpacing:'0.1em', cursor:'pointer', borderRadius:7 }}>MANAGE SUBSCRIPTION ▸</button>
            </div>
          </div>
        </div>

        {/* ════ UPGRADE (Starter) ════ */}
        {user.tier === 'STARTER' && (
          <div style={{ marginTop:24, padding:'34px 40px', textAlign:'center', borderRadius:12, background:`radial-gradient(circle at 50% 0%, ${CT.amber}12 0%, transparent 60%), ${CT.bg2}`, border:`1px solid ${CT.amber}33` }}>
            <div style={{ fontSize:10, color:CT.amber, letterSpacing:'0.15em', marginBottom:12 }}>// UNLOCK FULL ARSENAL</div>
            <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:26, fontWeight:700, color:CT.textHi, marginBottom:6 }}>Get {agents.length - myCount} more agents + all indicators</div>
            <div style={{ fontSize:11, color:CT.dim, marginBottom:22 }}>Upgrade to PRO or DESK for full terminal access, API webhooks, and walk-forward optimizer.</div>
            <button onClick={()=>go('pricing')} style={{ background:CT.amber, color:CT.bg, border:'none', padding:'13px 30px', fontFamily:'inherit', fontSize:11, fontWeight:700, letterSpacing:'0.1em', cursor:'pointer', borderRadius:8 }}>VIEW PLANS ▸</button>
          </div>
        )}
      </div>
    </div>
  );
}

function TabAdminPage({ onSettings }) {
  const CT  = useCT();
  const [tab, setTab]   = React.useState('overview');
  const [tick, setTick] = React.useState(0);
  const [genTier, setGenTier] = React.useState('PRO');
  const [genQty,  setGenQty]  = React.useState(1);
  const [genNote, setGenNote] = React.useState('');
  const [genResult, setGenResult] = React.useState([]);
  const [codeSearch, setCodeSearch] = React.useState('');
  const [userSearch, setUserSearch] = React.useState('');
  const [localP, setLocalP] = React.useState(getPricing);
  const [contactSettings, setContactSettings] = React.useState(() => {
    const DEFAULT_CH=[{k:'EMAIL',v:'hello@charthis.io',tag:'FASTEST FOR FORMAL'},{k:'TELEGRAM',v:'@charthis_dev',tag:'PREFERRED'},{k:'X/TWITTER',v:'@charthis_io',tag:'PUBLIC'},{k:'DISCORD',v:'charthis.gg/invite',tag:'COMMUNITY'},{k:'CALENDAR',v:'cal.com/charthis/intro',tag:'BOOK A CALL'},{k:'LOCATION',v:'Jakarta, ID · UTC+7',tag:'Mon–Fri 09:00–22:00 WIB'}];
    const s = (() => { try { return JSON.parse(localStorage.getItem('charthis_settings')||'{}'); } catch { return {}; } })();
    return { contactEmail: s.contactEmail||'hello@charthis.io', preferredChannel: s.preferredChannel||'@charthis_dev', channels: s.channels||DEFAULT_CH };
  });
  const [tlEntries, setTlEntries] = React.useState(() => {
    const DEFAULT_TL=[{y:'2024 Q1',t:'Started Charthis',d:'Encoded first 3 strategies.'},{y:'2024 Q3',t:'First 50 subscribers',d:'FLUX + ATLAS shipped.'},{y:'2025 Q1',t:'Agent marketplace',d:'8 production agents.'},{y:'2026 Q2',t:'Today',d:'11 agents · 247 subs.'}];
    try { const s=JSON.parse(localStorage.getItem('charthis_settings')||'{}'); return s.timeline||DEFAULT_TL; } catch { return DEFAULT_TL; }
  });

  React.useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const getDB  = k => { try { return JSON.parse(localStorage.getItem(k)||'{}'); } catch { return {}; } };
  const setDB  = (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} };
  const getSettings = () => { try { return JSON.parse(localStorage.getItem('charthis_settings')||'{}'); } catch { return {}; } };
  const saveSettings = s => { try { localStorage.setItem('charthis_settings',JSON.stringify(s)); } catch {} };

  const codes   = getDB('charthis_codes');
  const users   = getDB('charthis_users');
  const pricing = getPricing();
  const settings = getSettings();
  const allC    = Object.entries(codes).map(([code,v])=>({code,...v}));
  const allU    = Object.values(users);
  const usedC   = allC.filter(c=>c.used);
  const freeC   = allC.filter(c=>!c.used);
  const TIER_C  = { STARTER:CT.amber, PRO:CT.green, DESK:CT.cyan };
  const estRev  = ['STARTER','PRO','DESK'].reduce((s,t)=>s+allC.filter(c=>c.tier===t&&c.used).length*(pricing[t]?.m||0),0);

  const genCode = tier => {
    const ch='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let p=''; for(let i=0;i<8;i++) p+=ch[Math.floor(Math.random()*ch.length)];
    return `CHARTHIS-${tier.slice(0,3)}-${p}`;
  };
  const generate = () => {
    const db=getDB('charthis_codes'), now=new Date().toISOString(), nc=[];
    for(let i=0;i<Math.min(50,Math.max(1,genQty));i++){
      let c; do{c=genCode(genTier);}while(db[c]);
      db[c]={tier:genTier,used:false,createdAt:now,note:genNote||null};
      nc.push(c);
    }
    setDB('charthis_codes',db); setGenResult(nc); setTick(x=>x+1);
  };
  const deleteCode = code => {
    if(!confirm(`Delete ${code}?`)) return;
    const db=getDB('charthis_codes'); delete db[code]; setDB('charthis_codes',db); setTick(x=>x+1);
  };
  const deleteUser = email => {
    if(!confirm(`Remove ${email}?`)) return;
    const db=getDB('charthis_users'); delete db[email]; setDB('charthis_users',db); setTick(x=>x+1);
  };
  const copyText = t => navigator.clipboard.writeText(t).catch(()=>{});
  const exportAll = () => {
    const data={codes:getDB('charthis_codes'),users:getDB('charthis_users'),pricing:getPricing(),settings:getSettings(),exportedAt:new Date().toISOString()};
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    a.download=`charthis_${new Date().toISOString().slice(0,10)}.json`; a.click();
  };

  const TABS = [
    ['overview','📊 OVERVIEW'],['generate','⚡ GENERATE'],['codes','🔑 CODES'],
    ['users','👤 USERS'],['pricing','💰 PRICING'],['contact','📧 CONTACT'],['timeline','📅 TIMELINE'],
  ];
  const inp = { background:CT.bg, border:`1px solid ${CT.border}`, color:CT.textHi, padding:'9px 12px', fontFamily:'JetBrains Mono,monospace', fontSize:11, outline:'none', boxSizing:'border-box', width:'100%' };

  return (
    <div style={{ fontFamily:'JetBrains Mono,monospace' }}>
      {/* ── HEADER ── */}
      <div style={{ padding:'32px 40px 0', borderBottom:`1px solid ${CT.border}`, background:`linear-gradient(135deg,${CT.bg3},${CT.bg})`, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:220, height:220, borderRadius:'50%', background:CT.red+'06', border:`1px solid ${CT.red}0A`, pointerEvents:'none' }}/>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
          <div>
            <div style={{ fontSize:10, color:CT.red, letterSpacing:'0.2em', marginBottom:8 }}>// ⌗ ADMIN PANEL · RESTRICTED ACCESS</div>
            <h2 style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:40, fontWeight:700, margin:0, color:CT.textHi, letterSpacing:'-0.02em' }}>Admin Dashboard</h2>
            <div style={{ fontSize:11, color:CT.dim, marginTop:6 }}>
              {allC.length} codes · {allU.length} users · {usedC.length} activations · <span style={{color:CT.green}}>${estRev.toLocaleString()}/mo est.</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={exportAll} style={{ background:'transparent', border:`1px solid ${CT.border}`, color:CT.dim, padding:'9px 16px', fontFamily:'inherit', fontSize:10, cursor:'pointer' }}>↓ EXPORT ALL</button>
            <button onClick={onSettings} style={{ background:'transparent', border:`1px solid ${CT.red}55`, color:CT.red, padding:'9px 16px', fontFamily:'inherit', fontSize:10, cursor:'pointer' }}>⚙ SETTINGS</button>
          </div>
        </div>
        {/* Sub-nav */}
        <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
          {TABS.map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{ padding:'10px 20px', background:'transparent', color:tab===k?CT.red:CT.dim, border:'none', borderBottom:`2px solid ${tab===k?CT.red:'transparent'}`, fontFamily:'inherit', fontSize:9, letterSpacing:'0.1em', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:'28px 40px' }}>

        {/* ══ OVERVIEW ══ */}
        {tab === 'overview' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:14 }}>
              {[['TOTAL CODES',allC.length,CT.textHi],['UNUSED',freeC.length,CT.green],['ACTIVATED',usedC.length,CT.red],['USERS',allU.length,CT.amber]].map(s=>(
                <div key={s[0]} style={{ border:`1px solid ${CT.border}`, padding:'20px 24px', background:CT.bg2 }}>
                  <div style={{ fontSize:36, fontWeight:700, color:s[2], fontFamily:'Space Grotesk,sans-serif', lineHeight:1 }}>{s[1]}</div>
                  <div style={{ fontSize:9, color:CT.dim, letterSpacing:'0.14em', marginTop:8 }}>{s[0]}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:32 }}>
              {[
                ['CONVERSION', allC.length?Math.round(usedC.length/allC.length*100)+'%':'0%', CT.cyan],
                ['ARPU', allU.length?'$'+Math.round(estRev/allU.length):'$0', CT.green],
                ['ACTIVE AGENTS', '10 LIVE', CT.amber],
                ['SYSTEM', 'NOMINAL ●', CT.green],
              ].map(s=>(
                <div key={s[0]} style={{ border:`1px solid ${CT.border}`, padding:'16px 24px', background:CT.bg3 }}>
                  <div style={{ fontSize:24, fontWeight:700, color:s[2], fontFamily:'Space Grotesk,sans-serif', lineHeight:1 }}>{s[1]}</div>
                  <div style={{ fontSize:8, color:CT.dim, letterSpacing:'0.14em', marginTop:7 }}>{s[0]}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <div>
                <div style={{ fontSize:9, color:CT.amber, letterSpacing:'0.15em', marginBottom:14 }}>// TIER BREAKDOWN + REVENUE</div>
                {['STARTER','PRO','DESK'].map(tier=>{
                  const tot=allC.filter(c=>c.tier===tier).length;
                  const us=allC.filter(c=>c.tier===tier&&c.used).length;
                  const pct=tot?Math.round((us/tot)*100):0;
                  const rev=us*(pricing[tier]?.m||0);
                  return (
                    <div key={tier} style={{ marginBottom:16 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, alignItems:'baseline' }}>
                        <span style={{ fontSize:12, color:TIER_C[tier], fontWeight:600 }}>{tier}</span>
                        <div>
                          <span style={{ fontSize:11, color:CT.text }}>{us}/{tot} used</span>
                          <span style={{ fontSize:10, color:CT.green, marginLeft:10 }}>${rev.toLocaleString()}/mo</span>
                        </div>
                      </div>
                      <div style={{ height:5, background:CT.border, borderRadius:2 }}>
                        <div style={{ height:'100%', width:pct+'%', background:TIER_C[tier], borderRadius:2, transition:'width .4s' }}/>
                      </div>
                    </div>
                  );
                })}
                <div style={{ border:`1px solid ${CT.green}44`, padding:'16px', background:CT.green+'08', marginTop:8 }}>
                  <div style={{ fontSize:9, color:CT.dim, marginBottom:4 }}>EST. MONTHLY REVENUE</div>
                  <div style={{ fontSize:36, fontWeight:700, color:CT.green, fontFamily:'Space Grotesk,sans-serif' }}>${estRev.toLocaleString()}</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize:9, color:CT.amber, letterSpacing:'0.15em', marginBottom:14 }}>// RECENT REGISTRATIONS</div>
                {[...allU].sort((a,b)=>new Date(b.registeredAt)-new Date(a.registeredAt)).slice(0,8).map(u=>(
                  <div key={u.email} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${CT.border}` }}>
                    <div>
                      <div style={{ fontSize:11, color:CT.textHi, fontWeight:600 }}>{u.name}</div>
                      <div style={{ fontSize:9, color:CT.dim }}>{u.email}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <span style={{ padding:'2px 8px', border:`1px solid ${TIER_C[u.tier]||CT.amber}`, color:TIER_C[u.tier]||CT.amber, fontSize:8, fontWeight:700 }}>{u.tier}</span>
                      <div style={{ fontSize:8, color:CT.dim, marginTop:3 }}>{u.registeredAt?new Date(u.registeredAt).toLocaleDateString():'—'}</div>
                    </div>
                  </div>
                ))}
                {allU.length===0 && <div style={{ color:CT.dim, fontSize:11 }}>No users yet.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ══ GENERATE ══ */}
        {tab === 'generate' && (
          <div style={{ maxWidth:640 }}>
            <div style={{ fontSize:9, color:CT.amber, letterSpacing:'0.15em', marginBottom:20 }}>// GENERATE SUBSCRIPTION CODES</div>
            <div style={{ border:`1px solid ${CT.border}`, padding:20, background:CT.bg2, marginBottom:20 }}>
              <div style={{ fontSize:9, color:CT.dim, letterSpacing:'0.12em', marginBottom:10 }}>TIER</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:18 }}>
                {['STARTER','PRO','DESK'].map(t=>(
                  <button key={t} onClick={()=>setGenTier(t)} style={{ padding:'12px', background:genTier===t?TIER_C[t]:CT.bg, color:genTier===t?CT.bg:CT.dim, border:`1px solid ${genTier===t?TIER_C[t]:CT.border}`, fontFamily:'inherit', fontSize:10, fontWeight:700, cursor:'pointer' }}>{t}</button>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:12, marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:9, color:CT.dim, letterSpacing:'0.1em', marginBottom:6 }}>QUANTITY (max 50)</div>
                  <input type="number" value={genQty} onChange={e=>setGenQty(+e.target.value)} min="1" max="50" style={{...inp}} />
                </div>
                <div>
                  <div style={{ fontSize:9, color:CT.dim, letterSpacing:'0.1em', marginBottom:6 }}>NOTE (optional)</div>
                  <input type="text" value={genNote} onChange={e=>setGenNote(e.target.value)} placeholder="e.g. influencer batch may 2026" style={{...inp}} />
                </div>
              </div>
              <button onClick={generate} style={{ width:'100%', background:CT.amber, color:CT.bg, border:'none', padding:'13px', fontFamily:'inherit', fontSize:11, fontWeight:700, letterSpacing:'0.12em', cursor:'pointer' }}>GENERATE CODES ▸</button>
            </div>
            {genResult.length > 0 && (
              <div style={{ border:`1px solid ${CT.border}`, padding:16, background:CT.bg2 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <span style={{ fontSize:10, color:CT.textHi }}>{genResult.length} code{genResult.length>1?'s':''} generated · <span style={{color:TIER_C[genTier]}}>{genTier}</span></span>
                  <button onClick={()=>copyText(genResult.join('\n'))} style={{ background:'transparent', border:`1px solid ${CT.border}`, color:CT.dim, padding:'4px 10px', fontFamily:'inherit', fontSize:9, cursor:'pointer' }}>COPY ALL</button>
                </div>
                {genResult.map(c=>(
                  <div key={c} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:`1px solid ${CT.border}` }}>
                    <span style={{ fontSize:12, color:CT.textHi, letterSpacing:'0.05em', fontFamily:'JetBrains Mono,monospace' }}>{c}</span>
                    <button onClick={()=>copyText(c)} style={{ background:'transparent', border:`1px solid ${CT.border}`, color:CT.dim, padding:'3px 9px', fontFamily:'inherit', fontSize:9, cursor:'pointer' }}>COPY</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ CODES ══ */}
        {tab === 'codes' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:10 }}>
              <div style={{ fontSize:9, color:CT.amber, letterSpacing:'0.15em' }}>// ALL CODES ({allC.length})</div>
              <div style={{ display:'flex', gap:8 }}>
                {['STARTER','PRO','DESK'].map(t=>(
                  <button key={t} onClick={()=>{const db=getDB('charthis_codes'),now=new Date().toISOString(),ch='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let p='';for(let i=0;i<8;i++)p+=ch[Math.floor(Math.random()*ch.length)];const c=`CHARTHIS-${t.slice(0,3)}-${p}`;db[c]={tier:t,used:false,createdAt:now,note:null};try{localStorage.setItem('charthis_codes',JSON.stringify(db));}catch{}copyText(c);setTick(x=>x+1);}}
                    style={{ background:TIER_C[t]+'22', border:`1px solid ${TIER_C[t]}`, color:TIER_C[t], padding:'6px 12px', fontFamily:'inherit', fontSize:9, fontWeight:700, cursor:'pointer' }}>+ {t}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <input value={codeSearch} onChange={e=>setCodeSearch(e.target.value)} placeholder="Search code, tier, email…" style={{...inp}} />
            </div>
            <div style={{ border:`1px solid ${CT.border}` }}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 90px 80px 1fr 90px 80px', padding:'8px 14px', background:CT.bg3, fontSize:8, color:CT.dim, letterSpacing:'0.1em', gap:10 }}>
                {['CODE','TIER','STATUS','USED BY','CREATED',''].map(h=><span key={h}>{h}</span>)}
              </div>
              {allC.filter(e=>!codeSearch||(e.code+e.tier+(e.usedBy||'')).toLowerCase().includes(codeSearch.toLowerCase()))
                .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
                .map(e=>(
                <div key={e.code} style={{ display:'grid', gridTemplateColumns:'2fr 90px 80px 1fr 90px 80px', padding:'10px 14px', borderTop:`1px solid ${CT.border}`, gap:10, alignItems:'center' }}
                  onMouseEnter={ev=>ev.currentTarget.style.background=CT.bg3}
                  onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
                  <span style={{ fontSize:11, color:CT.textHi, letterSpacing:'0.04em' }}>{e.code}</span>
                  <span style={{ padding:'2px 7px', border:`1px solid ${TIER_C[e.tier]||CT.amber}`, color:TIER_C[e.tier]||CT.amber, fontSize:8, fontWeight:700, width:'fit-content' }}>{e.tier}</span>
                  <span style={{ fontSize:9, color:e.used?CT.red:CT.green }}>{e.used?'● USED':'○ FREE'}</span>
                  <span style={{ fontSize:10, color:CT.dim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.usedBy||'—'}</span>
                  <span style={{ fontSize:9, color:CT.dim }}>{e.createdAt?.slice(0,10)||'—'}</span>
                  <div style={{ display:'flex', gap:5 }}>
                    <button onClick={()=>copyText(e.code)} style={{ background:'transparent', border:`1px solid ${CT.border}`, color:CT.dim, padding:'3px 7px', fontFamily:'inherit', fontSize:8, cursor:'pointer' }}>COPY</button>
                    <button onClick={()=>deleteCode(e.code)} style={{ background:'transparent', border:`1px solid ${CT.red}44`, color:CT.red, padding:'3px 7px', fontFamily:'inherit', fontSize:8, cursor:'pointer' }}>✕</button>
                  </div>
                </div>
              ))}
              {allC.length===0&&<div style={{padding:'24px',color:CT.dim,fontSize:11}}>No codes yet. Use Generate or the + buttons above.</div>}
            </div>
          </div>
        )}

        {/* ══ USERS ══ */}
        {tab === 'users' && (
          <div>
            <div style={{ fontSize:9, color:CT.amber, letterSpacing:'0.15em', marginBottom:18 }}>// REGISTERED USERS ({allU.length})</div>
            <div style={{ marginBottom:14 }}>
              <input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Search name, email, tier…" style={{...inp}} />
            </div>
            <div style={{ border:`1px solid ${CT.border}` }}>
              <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1.5fr 90px 1.2fr 100px 50px', padding:'8px 14px', background:CT.bg3, fontSize:8, color:CT.dim, letterSpacing:'0.1em', gap:10 }}>
                {['NAME','EMAIL','TIER','CODE','REGISTERED',''].map(h=><span key={h}>{h}</span>)}
              </div>
              {allU.filter(u=>!userSearch||(u.name+u.email+(u.tier||'')).toLowerCase().includes(userSearch.toLowerCase()))
                .sort((a,b)=>new Date(b.registeredAt)-new Date(a.registeredAt))
                .map(u=>(
                <div key={u.email} style={{ display:'grid', gridTemplateColumns:'1.2fr 1.5fr 90px 1.2fr 100px 50px', padding:'10px 14px', borderTop:`1px solid ${CT.border}`, gap:10, alignItems:'center' }}
                  onMouseEnter={ev=>ev.currentTarget.style.background=CT.bg3}
                  onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
                  <span style={{ fontSize:11, color:CT.textHi, fontWeight:600 }}>{u.name||'—'}</span>
                  <span style={{ fontSize:10, color:CT.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</span>
                  <span style={{ padding:'2px 7px', border:`1px solid ${TIER_C[u.tier]||CT.amber}`, color:TIER_C[u.tier]||CT.amber, fontSize:8, fontWeight:700, width:'fit-content' }}>{u.tier||'—'}</span>
                  <span style={{ fontSize:9, color:CT.dim }}>{u.code||'—'}</span>
                  <span style={{ fontSize:9, color:CT.dim }}>{u.registeredAt?new Date(u.registeredAt).toLocaleDateString():'—'}</span>
                  <button onClick={()=>deleteUser(u.email)} style={{ background:'transparent', border:`1px solid ${CT.red}44`, color:CT.red, padding:'3px 7px', fontFamily:'inherit', fontSize:8, cursor:'pointer' }}>✕</button>
                </div>
              ))}
              {allU.length===0&&<div style={{padding:'24px',color:CT.dim,fontSize:11}}>No users yet.</div>}
            </div>
          </div>
        )}

        {/* ══ PRICING ══ */}
        {tab === 'pricing' && (
          <div style={{ maxWidth:540 }}>
            <div style={{ fontSize:9, color:CT.amber, letterSpacing:'0.15em', marginBottom:8 }}>// MANAGE PRICING</div>
            <div style={{ fontSize:10, color:CT.dim, marginBottom:20, lineHeight:1.6 }}>Changes apply site-wide instantly via localStorage. Pricing page refreshes every 2s.</div>
            <div>
              {['STARTER','PRO','DESK'].map(tier=>(
                <div key={tier} style={{ border:`1px solid ${TIER_C[tier]}44`, padding:16, marginBottom:12, background:CT.bg2 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:TIER_C[tier], letterSpacing:'0.12em', marginBottom:12 }}>{tier}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div>
                      <div style={{ fontSize:8, color:CT.dim, marginBottom:5 }}>MONTHLY ($)</div>
                      <input type="number" value={localP[tier]?.m||0} onChange={e=>setLocalP(p=>({...p,[tier]:{...(p[tier]||{}),m:+e.target.value}}))} style={{...inp}} />
                    </div>
                    <div>
                      <div style={{ fontSize:8, color:CT.dim, marginBottom:5 }}>ANNUAL ($)</div>
                      <input type="number" value={localP[tier]?.a||0} onChange={e=>setLocalP(p=>({...p,[tier]:{...(p[tier]||{}),a:+e.target.value}}))} style={{...inp}} />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={()=>{try{localStorage.setItem('charthis_pricing',JSON.stringify(localP));}catch{}setTick(x=>x+1);}} style={{ width:'100%', background:CT.amber, color:CT.bg, border:'none', padding:'13px', fontFamily:'inherit', fontSize:11, fontWeight:700, letterSpacing:'0.12em', cursor:'pointer', marginTop:4 }}>
                SAVE PRICING ▸
              </button>
            </div>
          </div>
        )}

        {/* ══ CONTACT ══ */}
        {tab === 'contact' && (
          <div style={{ maxWidth:640 }}>
            <div style={{ fontSize:9, color:CT.amber, letterSpacing:'0.15em', marginBottom:20 }}>// CONTACT PAGE SETTINGS</div>
            {(() => {
              const ls = contactSettings;
              const setLs = setContactSettings;
              const localCh = ls.channels;
              const setLocalCh = (fn) => setContactSettings(s => ({...s, channels: typeof fn==='function' ? fn(s.channels) : fn}));
              const save = () => { const ns={...ls}; saveSettings(ns); setTick(x=>x+1); };
              return (
                <div>
                  <div style={{ border:`1px solid ${CT.border}`, padding:16, background:CT.bg2, marginBottom:16 }}>
                    <div style={{ fontSize:9, color:CT.dim, marginBottom:6 }}>CONTACT EMAIL (form sends here)</div>
                    <input value={ls.contactEmail||''} onChange={e=>setLs(s=>({...s,contactEmail:e.target.value}))} placeholder="hello@yoursite.com" style={{...inp,marginBottom:12}} />
                    <div style={{ fontSize:9, color:CT.dim, marginBottom:6 }}>PREFERRED CHANNEL</div>
                    <input value={ls.preferredChannel||''} onChange={e=>setLs(s=>({...s,preferredChannel:e.target.value}))} placeholder="@handle" style={{...inp}} />
                  </div>
                  <div style={{ fontSize:9, color:CT.dim, letterSpacing:'0.1em', marginBottom:10 }}>REACH US CHANNELS</div>
                  {localCh.map((ch,i)=>(
                    <div key={i} style={{ border:`1px solid ${CT.border}`, padding:'10px 12px', marginBottom:6, background:CT.bg2 }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 32px', gap:6, alignItems:'center' }}>
                        <input value={ch.k} onChange={e=>{const c=[...localCh];c[i]={...c[i],k:e.target.value};setLocalCh(c);}} placeholder="LABEL" style={{...inp,fontSize:9}} />
                        <input value={ch.v} onChange={e=>{const c=[...localCh];c[i]={...c[i],v:e.target.value};setLocalCh(c);}} placeholder="Value" style={{...inp,fontSize:9}} />
                        <input value={ch.tag} onChange={e=>{const c=[...localCh];c[i]={...c[i],tag:e.target.value};setLocalCh(c);}} placeholder="Tag" style={{...inp,fontSize:9}} />
                        <button onClick={()=>{const c=[...localCh];c.splice(i,1);setLocalCh(c);}} style={{background:'transparent',border:`1px solid ${CT.red}44`,color:CT.red,padding:'8px',fontFamily:'inherit',fontSize:10,cursor:'pointer'}}>✕</button>
                      </div>
                    </div>
                  ))}
                  <div style={{ display:'flex', gap:8, marginTop:10 }}>
                    <button onClick={()=>setLocalCh(c=>[...c,{k:'',v:'',tag:''}])} style={{flex:1,background:'transparent',border:`1px solid ${CT.border}`,color:CT.dim,padding:'9px',fontFamily:'inherit',fontSize:9,cursor:'pointer'}}>+ ADD CHANNEL</button>
                    <button onClick={save} style={{flex:1,background:CT.amber,color:CT.bg,border:'none',padding:'9px',fontFamily:'inherit',fontSize:9,fontWeight:700,cursor:'pointer'}}>SAVE ▸</button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ══ TIMELINE ══ */}
        {tab === 'timeline' && (
          <div style={{ maxWidth:640 }}>
            <div style={{ fontSize:9, color:CT.amber, letterSpacing:'0.15em', marginBottom:20 }}>// ABOUT PAGE TIMELINE</div>
            {(() => {
              const tl = tlEntries;
              const setTl = setTlEntries;
              const save = () => { saveSettings({...getSettings(),timeline:tl}); setTick(x=>x+1); };
              return (
                <div>
                  {tl.map((item,i)=>(
                    <div key={i} style={{ border:`1px solid ${CT.border}`, padding:14, marginBottom:8, background:CT.bg2 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <span style={{ fontSize:9, color:CT.dim }}>Entry {i+1}</span>
                        <button onClick={()=>{const t=[...tl];t.splice(i,1);setTl(t);}} style={{background:'transparent',border:`1px solid ${CT.red}44`,color:CT.red,padding:'2px 8px',fontFamily:'inherit',fontSize:9,cursor:'pointer'}}>✕ REMOVE</button>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'100px 1fr', gap:8, marginBottom:8 }}>
                        <input value={item.y} onChange={e=>{const t=[...tl];t[i]={...t[i],y:e.target.value};setTl(t);}} placeholder="2024 Q1" style={{...inp,fontSize:10}} />
                        <input value={item.t} onChange={e=>{const t=[...tl];t[i]={...t[i],t:e.target.value};setTl(t);}} placeholder="Event title" style={{...inp,fontSize:10}} />
                      </div>
                      <input value={item.d} onChange={e=>{const t=[...tl];t[i]={...t[i],d:e.target.value};setTl(t);}} placeholder="Description…" style={{...inp,fontSize:10}} />
                    </div>
                  ))}
                  <div style={{ display:'flex', gap:8, marginTop:8 }}>
                    <button onClick={()=>setTl(t=>[...t,{y:'',t:'',d:''}])} style={{flex:1,background:'transparent',border:`1px solid ${CT.border}`,color:CT.dim,padding:'10px',fontFamily:'inherit',fontSize:9,cursor:'pointer'}}>+ ADD ENTRY</button>
                    <button onClick={save} style={{flex:1,background:CT.amber,color:CT.bg,border:'none',padding:'10px',fontFamily:'inherit',fontSize:9,fontWeight:700,cursor:'pointer'}}>SAVE TIMELINE ▸</button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
}

Object.assign(window, {
  DashboardGate, TabDashboard, WorldDataBar, TabAdminPage
});
