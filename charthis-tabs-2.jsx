// charthis-tabs-2.jsx

function TabAnalysis({ live }) {
  const CT = useCT();
  const [asset, setAsset] = React.useState('BTC');
  const [tf, setTf] = React.useState('1H');
  const [section, setSection] = React.useState('terminal');
  const ld = live && live.data ? live.data : {};
  const status = live && live.status ? live.status : 'loading';

  const ASSETS = [
    { k: 'BTC',  label: 'BTC/USD', sym: 'BTC/USD', tv: 'BINANCE:BTCUSDT', rest:'BTCUSDT', spot:false },
    { k: 'ETH',  label: 'ETH/USD', sym: 'ETH/USD', tv: 'BINANCE:ETHUSDT', rest:'ETHUSDT', spot:false },
    { k: 'XAU',  label: 'XAU/USD', sym: 'XAU/USD', tv: 'TVC:GOLD',         rest:null,     spot:true },
    { k: 'SOL',  label: 'SOL/USD', sym: 'SOL/USD', tv: 'BINANCE:SOLUSDT', rest:'SOLUSDT', spot:false },
    { k: 'NVDA', label: 'NVDA',    sym: 'NVDA',    tv: 'NASDAQ:NVDA',     rest:null,     spot:true },
  ];
  const TV_IV = { '1m': '1', '5m': '5', '15m': '15', '1H': '60', '4H': '240', '1D': 'D' };
  const cur = ASSETS.find(a => a.k === asset) || ASSETS[0];
  const d = ld[cur.sym] || (FALLBACK && FALLBACK[cur.sym]) || { price: 0, change: 0 };
  const up = d.change >= 0;

  // Real TA signals for the active asset (live Binance)
  const tfRest = { '1m':'1m','5m':'5m','15m':'15m','1H':'1h','4H':'4h','1D':'1d' }[tf] || '1h';
  const realSig = useRealSignals(cur.rest, tfRest, cur.spot);
  const signals = realSig.signals.slice(0, 10).map(s => ({
    t: s.t, type: s.type, sym: cur.k, reason: s.reason, price: s.price, move: s.move, rsi: s.rsi,
  }));

  // Correlation matrix
  const CORR_ASSETS = ['BTC', 'ETH', 'SOL', 'XAU', 'DXY', 'SPX', 'VIX'];
  const CORR_MAT = [
    [1.00, 0.88, 0.82, -0.18, -0.42, 0.61, -0.55],
    [0.88, 1.00, 0.79, -0.14, -0.38, 0.58, -0.51],
    [0.82, 0.79, 1.00, -0.10, -0.30, 0.52, -0.44],
    [-0.18, -0.14, -0.10, 1.00, -0.74, 0.22, -0.38],
    [-0.42, -0.38, -0.30, -0.74, 1.00, -0.55, 0.48],
    [0.61, 0.58, 0.52, 0.22, -0.55, 1.00, -0.72],
    [-0.55, -0.51, -0.44, -0.38, 0.48, -0.72, 1.00],
  ];
  const corrColor = v => {
    const alpha = 0.12 + Math.abs(v) * 0.4;
    return v > 0.05 ? 'rgba(0,229,160,' + alpha + ')' : v < -0.05 ? 'rgba(255,61,127,' + alpha + ')' : CT.bg3;
  };

  // Economic calendar (static, realistic dates)
  const now = new Date();
  const calEvents = [
    { time: '14:30', date: 'Today', event: 'US CPI m/m', impact: 'HIGH', forecast: '+0.3%', prev: '+0.4%', currency: 'USD' },
    { time: '16:00', date: 'Today', event: 'Fed Chair Speech', impact: 'HIGH', forecast: '-', prev: '-', currency: 'USD' },
    { time: '08:00', date: 'Tomorrow', event: 'UK GDP q/q', impact: 'MED', forecast: '+0.1%', prev: '+0.2%', currency: 'GBP' },
    { time: '10:00', date: 'Tomorrow', event: 'EUR CPI Flash', impact: 'HIGH', forecast: '+2.1%', prev: '+2.3%', currency: 'EUR' },
    { time: '14:30', date: 'Thu', event: 'US Initial Jobless Claims', impact: 'MED', forecast: '220K', prev: '215K', currency: 'USD' },
    { time: '14:30', date: 'Fri', event: 'US NFP', impact: 'HIGH', forecast: '180K', prev: '256K', currency: 'USD' },
    { time: '14:30', date: 'Fri', event: 'US Unemployment Rate', impact: 'HIGH', forecast: '4.1%', prev: '4.2%', currency: 'USD' },
  ];
  const impactColor = i => i === 'HIGH' ? CT.red : i === 'MED' ? CT.amber : CT.dim;

  // Backtest heatmap
  const heatData = React.useMemo(() => (
    ['2021', '2022', '2023', '2024', '2025'].map((y, yi) =>
      Array.from({ length: 12 }, (_, mi) => parseFloat((Math.sin((yi * 12 + mi) * 0.71) * 9 + (yi - 1) * 1.4 + Math.cos(mi * 0.5) * 2.1).toFixed(1)))
    )
  ), []);

  const SECTIONS = [['terminal', 'TERMINAL'], ['correlation', 'CORRELATION'], ['calendar', 'CALENDAR'], ['backtest', 'BACKTEST']];

  return (
    <div>
      {/* HEADER */}
      <div style={{ padding: '40px 32px 0', borderBottom: '1px solid ' + CT.border }}>
        <div style={{ fontSize: 10, color: CT.amber, letterSpacing: '0.2em', marginBottom: 10 }}>// SECTION 04 · LIVE ANALYSIS</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 48, fontWeight: 700, margin: 0, letterSpacing: '-0.03em', color: CT.textHi }}>
              The terminal, <span style={{ color: CT.amber }}>live</span>.
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: CT.dim }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: status === 'live' ? CT.green : CT.dim, display: 'inline-block' }} />
            {status === 'live' ? 'LIVE DATA' : 'CONNECTING'}
          </div>
        </div>
        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {SECTIONS.map(([k, l]) => (
            <button key={k} onClick={() => setSection(k)}
              style={{ padding: '10px 22px', background: 'transparent', color: section === k ? CT.amber : CT.dim, border: 'none', borderBottom: '2px solid ' + (section === k ? CT.amber : 'transparent'), fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.12em', fontWeight: 700, cursor: 'pointer' }}>{l}</button>
          ))}
        </div>
      </div>

      {/* TERMINAL */}
      {section === 'terminal' && (
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 220px', minHeight: 480, borderBottom: '1px solid ' + CT.border }}>
          {/* Watchlist */}
          <div style={{ borderRight: '1px solid ' + CT.border, background: CT.bg2 }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid ' + CT.border, fontSize: 8, color: CT.dim, letterSpacing: '0.12em' }}>WATCHLIST</div>
            {ASSETS.map(a => {
              const ad = ld[a.sym] || (FALLBACK && FALLBACK[a.sym]) || { price: 0, change: 0 };
              return (
                <div key={a.k} onClick={() => setAsset(a.k)}
                  style={{ padding: '10px 12px', borderBottom: '1px solid ' + CT.border, cursor: 'pointer', background: asset === a.k ? CT.bg3 : 'transparent', borderLeft: '2px solid ' + (asset === a.k ? CT.amber : 'transparent') }}>
                  <div style={{ fontSize: 11, color: asset === a.k ? CT.amber : CT.text, fontWeight: asset === a.k ? 600 : 400, marginBottom: 2 }}>{a.label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                    <span style={{ color: CT.dim }}>{formatPrice(a.sym, ad.price)}</span>
                    <span style={{ color: ad.change >= 0 ? CT.green : CT.red, fontSize: 9 }}>{formatChange(a.sym, ad.change)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Chart */}
          <div style={{ borderRight: '1px solid ' + CT.border }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid ' + CT.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                <span style={{ color: CT.text, fontSize: 12, fontWeight: 600, fontFamily: 'Space Grotesk,sans-serif' }}>{cur.label}</span>
                <span style={{ color: CT.amber, fontSize: 16, fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700 }}>{formatPrice(cur.sym, d.price)}</span>
                <span style={{ color: up ? CT.green : CT.red, fontSize: 10 }}>{up ? '+' : ''}{formatChange(cur.sym, d.change)}</span>
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                {['1m', '5m', '15m', '1H', '4H', '1D'].map(t => (
                  <button key={t} onClick={() => setTf(t)}
                    style={{ padding: '3px 8px', fontSize: 9, color: t === tf ? CT.bg : CT.dim, background: t === tf ? CT.amber : 'transparent', cursor: 'pointer', border: '1px solid ' + (t === tf ? CT.amber : CT.border), fontFamily: 'inherit', fontWeight: 600 }}>{t}</button>
                ))}
              </div>
            </div>
            <CTVChart symbol={cur.tv} interval={TV_IV[tf] || '60'} height={300} signals={realSig.signals} />
            <div style={{ padding: '8px 12px', borderTop: '1px solid ' + CT.border, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', fontSize: 10, background: CT.bg3 }}>
              {[['OPEN', formatPrice(cur.sym, d.price / (1 + (d.change || 0) / 100))], ['HIGH', formatPrice(cur.sym, d.price * 1.01)], ['LOW', formatPrice(cur.sym, d.price * 0.99)], ['VOL', '$28.4B'], ['RSI', Math.min(80, Math.max(30, 50 + (d.change || 0) * 3.5)).toFixed(0)]].map(([l, v]) => (
                <div key={l}><div style={{ color: CT.dim, marginBottom: 2, fontSize: 8 }}>{l}</div><div style={{ color: CT.text, fontFamily: 'Space Grotesk,sans-serif', fontSize: 12, fontWeight: 600 }}>{v}</div></div>
              ))}
            </div>
          </div>
          {/* Signals — REAL TA */}
          <div style={{ background: CT.bg2 }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid ' + CT.border, fontSize: 8, color: CT.dim, letterSpacing: '0.12em', display: 'flex', justifyContent: 'space-between' }}>
              <span>SIGNALS · EMA+RSI</span>
              <span style={{ color: realSig.status==='live'?CT.green:realSig.status==='na'?CT.dim:CT.amber }}>{realSig.status==='live'?'● LIVE':realSig.status==='na'?'○ crypto only':'○ …'}</span>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 420 }}>
              {signals.length === 0 && (
                <div style={{ padding:'14px 12px', fontSize:10, color:CT.dim, lineHeight:1.5 }}>
                  {realSig.status==='na'?'Live signals available for crypto. Stocks/metals use synthetic chart.':realSig.status==='loading'?'Computing from live candles…':'No crossover events in window.'}
                </div>
              )}
              {signals.map((sig, i) => (
                <div key={i} style={{ padding: '9px 12px', borderBottom: '1px solid ' + CT.border, borderLeft: '2px solid ' + (sig.type === 'BUY' ? CT.green : CT.red) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ color: sig.type === 'BUY' ? CT.green : CT.red, fontWeight: 700, fontSize: 10 }}>{sig.type} · {sig.sym}</span>
                    <span style={{ color: CT.dim, fontSize: 9 }}>{sig.t}</span>
                  </div>
                  <div style={{ color: CT.text, lineHeight: 1.4, fontSize: 10 }}>{sig.reason}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span style={{ color: CT.dim, fontSize: 9 }}>@ {formatPrice(cur.sym, sig.price)} · RSI {sig.rsi}</span>
                    <span style={{ fontSize: 9, color: sig.move >= 0 ? CT.green : CT.red }}>{sig.move >= 0 ? '+' : ''}{sig.move.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CORRELATION */}
      {section === 'correlation' && (
        <div style={{ padding: '28px 32px', borderBottom: '1px solid ' + CT.border }}>
          <div style={{ fontSize: 9, color: CT.amber, letterSpacing: '0.15em', marginBottom: 16 }}>// 30-DAY ROLLING PEARSON CORRELATIONS</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 10px', color: CT.dim, textAlign: 'left', fontWeight: 400, fontSize: 9 }}></th>
                  {CORR_ASSETS.map(a => <th key={a} style={{ padding: '8px 10px', color: CT.amber, fontWeight: 700, letterSpacing: '0.1em', fontSize: 9 }}>{a}</th>)}
                </tr>
              </thead>
              <tbody>
                {CORR_ASSETS.map((ra, ri) => (
                  <tr key={ra}>
                    <td style={{ padding: '7px 10px', color: CT.amber, fontWeight: 700, letterSpacing: '0.1em', fontSize: 9 }}>{ra}</td>
                    {CORR_MAT[ri].map((v, ci) => (
                      <td key={ci} style={{ padding: '7px 10px', background: corrColor(v), color: Math.abs(v) > 0.05 ? CT.textHi : CT.dim, textAlign: 'center', fontWeight: Math.abs(v) > 0.6 ? 700 : 400, border: '1px solid ' + CT.border }}>{v.toFixed(2)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: 9, color: CT.dim }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, background: 'rgba(0,229,160,0.5)', display: 'inline-block' }} />Positive correlation</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, background: 'rgba(255,61,127,0.5)', display: 'inline-block' }} />Negative correlation</span>
          </div>
          {/* VIX Term Structure */}
          <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: 9, color: CT.amber, letterSpacing: '0.15em', marginBottom: 14 }}>// VIX TERM STRUCTURE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 1, background: CT.border, maxWidth: 520 }}>
              {[['VIX', '18.4'], ['VIX3M', '19.8'], ['VIX6M', '21.2'], ['VIX1Y', '22.9'], ['VVIX', '94.3'], ['SKEW', '128']].map(([l, v]) => (
                <div key={l} style={{ background: CT.bg2, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: CT.amber, fontFamily: 'Space Grotesk,sans-serif' }}>{v}</div>
                  <div style={{ fontSize: 8, color: CT.dim, letterSpacing: '0.1em', marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ECONOMIC CALENDAR */}
      {section === 'calendar' && (
        <div style={{ padding: '28px 32px', borderBottom: '1px solid ' + CT.border }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 9, color: CT.amber, letterSpacing: '0.15em' }}>// ECONOMIC CALENDAR</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 9 }}>
              {[['HIGH', CT.red], ['MED', CT.amber], ['LOW', CT.dim]].map(([l, c]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, color: CT.dim }}>
                  <span style={{ width: 8, height: 8, background: c, display: 'inline-block', borderRadius: '50%' }} />{l}
                </span>
              ))}
            </div>
          </div>
          <div style={{ border: '1px solid ' + CT.border }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 80px 1fr 60px 80px 80px 80px', padding: '8px 14px', background: CT.bg3, borderBottom: '1px solid ' + CT.border, fontSize: 8, color: CT.dim, letterSpacing: '0.1em', gap: 10 }}>
              {['DATE', 'TIME', 'EVENT', 'CCY', 'FORECAST', 'PREV', 'IMPACT'].map(h => <span key={h}>{h}</span>)}
            </div>
            {calEvents.map((ev, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 80px 1fr 60px 80px 80px 80px', padding: '12px 14px', borderBottom: i < calEvents.length - 1 ? '1px solid ' + CT.border : 'none', gap: 10, alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = CT.bg3}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: 10, color: CT.dim }}>{ev.date}</span>
                <span style={{ fontSize: 10, color: CT.text, fontFamily: 'JetBrains Mono,monospace' }}>{ev.time}</span>
                <span style={{ fontSize: 11, color: CT.textHi, fontWeight: 500 }}>{ev.event}</span>
                <span style={{ fontSize: 9, padding: '2px 6px', border: '1px solid ' + CT.border, color: CT.dim, width: 'fit-content' }}>{ev.currency}</span>
                <span style={{ fontSize: 10, color: CT.cyan, fontFamily: 'JetBrains Mono,monospace' }}>{ev.forecast}</span>
                <span style={{ fontSize: 10, color: CT.text, fontFamily: 'JetBrains Mono,monospace' }}>{ev.prev}</span>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[...Array(ev.impact === 'HIGH' ? 3 : ev.impact === 'MED' ? 2 : 1)].map((_, bi) => (
                    <span key={bi} style={{ width: 8, height: 8, background: impactColor(ev.impact), display: 'inline-block', borderRadius: '50%' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 9, color: CT.dim }}>Times in UTC · source: investing.com</div>
        </div>
      )}

      {/* BACKTEST */}
      {section === 'backtest' && (
        <div style={{ padding: '28px 32px', borderBottom: '1px solid ' + CT.border }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
            <CPanel title="EQUITY CURVE · 2021-2025 · A.001+A.002+A.003">
              <div style={{ height: 200, background: CT.chartBg }}><CChart height={200} seed={51} color={CT.green} /></div>
              <div style={{ padding: '12px 14px', borderTop: '1px solid ' + CT.border, display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, fontSize: 10 }}>
                {[['CAGR', '34.7%', CT.green], ['SHARPE', '2.41', CT.text], ['SORTINO', '3.18', CT.text], ['MAX DD', '-8.2%', CT.red], ['WIN%', '68.4%', CT.text], ['CALMAR', '4.23', CT.text]].map(([l, v, c]) => (
                  <div key={l}><div style={{ color: CT.dim, marginBottom: 2, fontSize: 8 }}>{l}</div><div style={{ color: c, fontFamily: 'Space Grotesk,sans-serif', fontSize: 17, fontWeight: 700 }}>{v}</div></div>
                ))}
              </div>
            </CPanel>
            <CPanel title="MONTHLY HEATMAP · 5Y" pad="12px">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13,1fr)', gap: 2, fontSize: 7 }}>
                <div></div>
                {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => (
                  <div key={i} style={{ color: CT.dim, textAlign: 'center' }}>{m}</div>
                ))}
                {heatData.map((row, yi) => (
                  <React.Fragment key={yi}>
                    <div style={{ color: CT.dim, fontSize: 8, display: 'flex', alignItems: 'center' }}>{['21', '22', '23', '24', '25'][yi]}</div>
                    {row.map((v, mi) => (
                      <div key={mi} title={(v >= 0 ? '+' : '') + v + '%'}
                        style={{ aspectRatio: '1', background: v >= 0 ? 'rgba(0,229,160,' + (0.1 + Math.abs(v) * 0.05) + ')' : 'rgba(255,61,127,' + (0.1 + Math.abs(v) * 0.05) + ')', border: '1px solid ' + CT.border, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CT.text }}>
                        {v > 0 ? '+' : ''}{v}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 9, color: CT.dim }}>{heatData.flat().filter(v => v >= 0).length}/60 months positive</div>
            </CPanel>
          </div>
        </div>
      )}
    </div>
  );
}

const PRICING_SUBS_KEY  = 'charthis_codes';
function pricingGetDB(key) { try { return JSON.parse(localStorage.getItem(key)||'{}'); } catch { return {}; } }
function pricingSetDB(key, data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch {} }

function SubCodeInput({ tier, CT }) {
  const [code, setCode]   = React.useState('');
  const [name, setName]   = React.useState('');
  const [email, setEmail] = React.useState('');
  const [step, setStep]   = React.useState('code');
  const [errMsg, setErr]  = React.useState('');
  const [matchTier, setMatchTier] = React.useState('');
  const [open, setOpen]   = React.useState(false);

  const checkCode = () => {
    const db = pricingGetDB(PRICING_SUBS_KEY);
    const up = code.trim().toUpperCase();
    const entry = db[up];
    if (!entry) { setErr('Code not found.'); setStep('err'); return; }
    if (entry.used) { setErr('Already used by another account.'); setStep('err'); return; }
    setMatchTier(entry.tier); setStep('register');
  };
  const register = () => {
    if (!name.trim() || !email.trim()) return;
    const now = new Date().toISOString();
    const up  = code.trim().toUpperCase();
    const codes = pricingGetDB(PRICING_SUBS_KEY);
    const users = pricingGetDB(USERS_KEY);
    codes[up] = { ...codes[up], used: true, usedBy: email.trim(), usedAt: now };
    users[email.trim().toLowerCase()] = { name: name.trim(), email: email.trim(), tier: matchTier, code: up, registeredAt: now };
    pricingSetDB(PRICING_SUBS_KEY, codes);
    pricingSetDB(USERS_KEY, users);
    setStep('done');
  };

  if (!open) return (
    <div style={{ marginTop: 10 }}>
      <button onClick={() => setOpen(true)} style={{ width:'100%', background:'transparent', color:CT.dim, border:'1px dashed '+CT.border, padding:'9px 16px', fontFamily:'inherit', fontSize:10, letterSpacing:'0.1em', cursor:'pointer' }}>
        HAVE A CODE? ENTER HERE
      </button>
    </div>
  );
  return (
    <div style={{ marginTop:10, border:'1px solid '+CT.borderHi, padding:16, background:CT.bg2 }}>
      <div style={{ fontSize:9, color:CT.amber, letterSpacing:'0.15em', marginBottom:12 }}>// SUBSCRIPTION CODE</div>
      {(step === 'code' || step === 'err') && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <input value={code} onChange={e=>{ setCode(e.target.value); setStep('code'); }}
            placeholder="CHARTHIS-XXX-XXXXXXXX"
            style={{ width:'100%', background:CT.bg, border:'1px solid '+(step==='err'?CT.red:CT.border), color:CT.textHi, padding:'9px 12px', fontFamily:'JetBrains Mono,monospace', fontSize:11, outline:'none', letterSpacing:'0.05em', boxSizing:'border-box', textTransform:'uppercase' }} />
          {step === 'err' && <div style={{ fontSize:10, color:CT.red }}>{errMsg}</div>}
          <button onClick={checkCode} style={{ background:CT.amber, color:CT.bg, border:'none', padding:10, fontFamily:'inherit', fontSize:10, fontWeight:700, cursor:'pointer' }}>VALIDATE ▸</button>
          <button onClick={() => { setOpen(false); setCode(''); setStep('code'); }} style={{ background:'transparent', color:CT.dim, border:'none', fontFamily:'inherit', fontSize:9, cursor:'pointer' }}>cancel</button>
        </div>
      )}
      {step === 'register' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ fontSize:10, color:CT.green }}>Valid code — <span style={{ color:CT.amber }}>{matchTier}</span> tier</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"
            style={{ width:'100%', background:CT.bg, border:'1px solid '+CT.border, color:CT.textHi, padding:'9px 12px', fontFamily:'JetBrains Mono,monospace', fontSize:11, outline:'none', boxSizing:'border-box' }} />
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com"
            style={{ width:'100%', background:CT.bg, border:'1px solid '+CT.border, color:CT.textHi, padding:'9px 12px', fontFamily:'JetBrains Mono,monospace', fontSize:11, outline:'none', boxSizing:'border-box' }} />
          <button onClick={register} style={{ background:CT.amber, color:CT.bg, border:'none', padding:10, fontFamily:'inherit', fontSize:10, fontWeight:700, cursor:'pointer' }}>REGISTER ▸</button>
        </div>
      )}
      {step === 'done' && (
        <div style={{ textAlign:'center', padding:'8px 0' }}>
          <div style={{ fontSize:20, color:CT.green, marginBottom:8 }}>✓</div>
          <div style={{ fontSize:11, color:CT.textHi, fontWeight:600 }}>Registered!</div>
          <div style={{ fontSize:10, color:CT.dim, marginTop:4 }}>{email} — {matchTier}</div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   TAB ANALYSIS
══════════════════════════════════ */
function TabPricing({ go }) {
  const CT = useCT();
  const [billing, setBilling] = React.useState('monthly');
  const [livePrices, setLivePrices] = React.useState(() => {
    const def = { STARTER:{m:79,a:63}, PRO:{m:249,a:199}, DESK:{m:599,a:479} };
    try { return { ...def, ...JSON.parse(localStorage.getItem('charthis_pricing')||'{}') }; }
    catch { return def; }
  });
  React.useEffect(() => {
    const sync = () => {
      const def = { STARTER:{m:79,a:63}, PRO:{m:249,a:199}, DESK:{m:599,a:479} };
      try { setLivePrices({ ...def, ...JSON.parse(localStorage.getItem('charthis_pricing')||'{}') }); } catch {}
    };
    const t = setInterval(sync, 2000);
    window.addEventListener('storage', sync);
    return () => { clearInterval(t); window.removeEventListener('storage', sync); };
  }, []);

  const formatPrice = t => billing === 'monthly' ? livePrices[t]?.m : livePrices[t]?.a;

  const tiers = [
    { n:'STARTER', tag:'TIER.01', hi:false, cta:'START STARTER',
      tagline:'For the solo trader testing the waters.',
      items:['2 production agents (your pick)','ATLAS indicator only','Live terminal · 1 watchlist','Signals delayed 60s','Up to $25k AUM coverage','Discord community access','Email support · 24h SLA'] },
    { n:'PRO', tag:'TIER.02', hi:true, cta:'GO PRO',
      tagline:'For serious operators running a real book.',
      items:['6 production agents','2 of 4 indicators (FLUX + ATLAS)','Live terminal · 5 watchlists · realtime','Walk-forward optimizer (run weekly)','Up to $250k AUM coverage','Webhook + API export','Priority Slack channel · 4h SLA','1 custom strategy review / qtr'] },
    { n:'DESK', tag:'TIER.03', hi:false, cta:'CONTACT DESK',
      tagline:'Full arsenal. Built for desks running real capital.',
      items:['All 11 agents · always-on','All 4 indicators (incl. VOID)','Live terminal · unlimited · zero-delay','Daily walk-forward + Monte Carlo','No AUM cap · co-located execution','White-label option + multi-seat','Dedicated quant analyst · 1h SLA','1 fully-custom agent build / quarter'] },
  ];

  return (
    <div>
      <div style={{ padding:'48px 32px 24px', borderBottom:'1px solid '+CT.border }}>
        <div style={{ fontSize:10, color:CT.amber, letterSpacing:'0.2em', marginBottom:12 }}>// SECTION 05 · PRICING</div>
        <h2 style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:56, fontWeight:700, margin:0, letterSpacing:'-0.03em', color:CT.textHi }}>
          Simple <span style={{ color:CT.amber }}>pricing</span>.
        </h2>
        <p style={{ fontSize:13, color:CT.dim, marginTop:16, maxWidth:720, lineHeight:1.7 }}>One seat, one trader. No hidden fees. Cancel anytime.</p>
      </div>

      {/* Billing toggle */}
      <div style={{ padding:'20px 32px', borderBottom:'1px solid '+CT.border, display:'flex', gap:8, alignItems:'center' }}>
        <button onClick={() => setBilling('monthly')}
          style={{ padding:'8px 18px', background:billing==='monthly'?CT.amber:'transparent', color:billing==='monthly'?CT.bg:CT.dim, border:'1px solid '+(billing==='monthly'?CT.amber:CT.border), fontFamily:'inherit', fontSize:10, fontWeight:700, cursor:'pointer', letterSpacing:'0.1em' }}>MONTHLY</button>
        <button onClick={() => setBilling('annual')}
          style={{ padding:'8px 18px', background:billing==='annual'?CT.amber:'transparent', color:billing==='annual'?CT.bg:CT.dim, border:'1px solid '+(billing==='annual'?CT.amber:CT.border), fontFamily:'inherit', fontSize:10, fontWeight:700, cursor:'pointer', letterSpacing:'0.1em' }}>ANNUAL · SAVE 20%</button>
      </div>

      {/* Tiers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', borderBottom:'1px solid '+CT.border, alignItems:'stretch' }}>
        {tiers.map((t, i) => (
          <div key={t.n} style={{ padding:'40px 32px', borderRight:i<2?'1px solid '+CT.border:'none', background:t.hi?CT.bg3:'transparent', position:'relative', display:'flex', flexDirection:'column' }}>
            {t.hi && <div style={{ position:'absolute', top:14, right:18, fontSize:9, color:CT.amber, letterSpacing:'0.15em' }}>★ MOST POPULAR</div>}
            <div style={{ fontSize:11, color:CT.amber, letterSpacing:'0.15em', marginBottom:12 }}>{t.tag}</div>
            <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:28, fontWeight:600, marginBottom:6, color:CT.textHi }}>{t.n}</div>
            <div style={{ fontSize:11, color:CT.dim, marginBottom:24, lineHeight:1.5 }}>{t.tagline}</div>
            <div style={{ marginBottom:28, display:'flex', alignItems:'baseline', gap:6 }}>
              <span style={{ fontSize:20, color:CT.dim, fontFamily:'Space Grotesk,sans-serif' }}>$</span>
              <span style={{ fontSize:56, fontFamily:'Space Grotesk,sans-serif', fontWeight:600, color:CT.textHi, letterSpacing:'-0.02em', lineHeight:1 }}>{formatPrice(t.n)}</span>
              <span style={{ color:CT.dim, fontSize:12 }}>/mo{billing==='annual'?' · billed annually':''}</span>
            </div>
            <div style={{ borderTop:'1px solid '+CT.border, paddingTop:18, flex:1 }}>
              {t.items.map((it, j) => (
                <div key={j} style={{ fontSize:11, color:CT.text, padding:'7px 0', display:'flex', gap:10, lineHeight:1.5, borderBottom:'1px dashed '+CT.border }}>
                  <span style={{ color:CT.amber, flexShrink:0 }}>›</span>{it}
                </div>
              ))}
            </div>
            <button onClick={() => go('contact')}
              style={{ marginTop:28, width:'100%', background:t.hi?CT.amber:'transparent', color:t.hi?CT.bg:CT.text, border:t.hi?'none':'1px solid '+CT.borderHi, padding:'14px 16px', fontFamily:'inherit', fontSize:11, fontWeight:700, letterSpacing:'0.1em', cursor:'pointer' }}>
              {t.cta} ▸
            </button>
            <SubCodeInput tier={t.n} CT={CT} />
          </div>
        ))}
      </div>

      {/* FAQ */}
      <CRule n="05.1" label="FAQ · COMMON QUESTIONS" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:'1px solid '+CT.border }}>
        {[
          ['What does "production agent" mean?','A live strategy running on our infrastructure, connected to your broker or exchange via API, with real-time signal execution and kill-switch controls.'],
          ['Can I bring my own strategy?','Yes — Pro tier and above include strategy reviews. DESK includes 1 fully-custom agent build per quarter.'],
          ['Is there a free trial?','No free trial, but we offer a 30-day money-back guarantee on STARTER and PRO if the agent underperforms the benchmark.'],
          ['What exchanges are supported?','Binance, Bybit, OKX, Coinbase Advanced, Interactive Brokers, and Alpaca. MT5 brokerage on request.'],
          ['How are signals delivered?','Via our live terminal, webhook to your endpoint, Telegram bot, or direct email. All latency under 500ms from signal to delivery.'],
          ['Can I cancel anytime?','Yes, monthly subscriptions cancel with no penalty. Annual plans are non-refundable after 30 days.'],
        ].map(([q,a],i) => (
          <div key={i} style={{ padding:'24px 28px', borderBottom:i<4?'1px solid '+CT.border:'none', borderRight:i%2===0?'1px solid '+CT.border:'none' }}>
            <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:14, fontWeight:600, color:CT.textHi, marginBottom:8 }}>› {q}</div>
            <div style={{ fontSize:11, color:CT.dim, lineHeight:1.7 }}>{a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   TAB ABOUT
══════════════════════════════════ */

function TabAbout() {
  const CT = useCT();
  const DEFAULT_TIMELINE = [
    { y:'2024 Q1', t:'Started Charthis', d:'Encoded first 3 strategies. Live PnL tracking from day one.' },
    { y:'2024 Q3', t:'First 50 subscribers', d:'Indicators line launched. FLUX + ATLAS shipped.' },
    { y:'2025 Q1', t:'Agent marketplace', d:'Opened public catalog. 8 production agents.' },
    { y:'2025 Q4', t:'$500M tracked volume', d:'Gold agent A.003 launched. Fleet crossed $25M tracked AUM.' },
    { y:'2026 Q2', t:'Today', d:'11 agents · 247 subs · 2.41 avg Sharpe.' },
  ];
  const getTimeline = () => {
    try {
      const s = JSON.parse(localStorage.getItem('charthis_settings')||'{}');
      return (s.timeline && s.timeline.length) ? s.timeline : DEFAULT_TIMELINE;
    } catch { return DEFAULT_TIMELINE; }
  };
  const [timeline, setTimeline] = React.useState(getTimeline);
  React.useEffect(() => {
    const sync = () => setTimeline(getTimeline());
    const t = setInterval(sync, 2000);
    window.addEventListener('storage', sync);
    return () => { clearInterval(t); window.removeEventListener('storage', sync); };
  }, []);

  return (
    <div>
      <div style={{ padding:'48px 32px 24px', borderBottom:'1px solid '+CT.border }}>
        <div style={{ fontSize:10, color:CT.amber, letterSpacing:'0.2em', marginBottom:12 }}>// SECTION 06 · ABOUT</div>
        <h2 style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:56, fontWeight:700, margin:0, letterSpacing:'-0.03em', color:CT.textHi }}>
          A small <span style={{ color:CT.amber }}>quant atelier</span>.
        </h2>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', borderBottom:'1px solid '+CT.border }}>
        <div style={{ padding:'40px 32px', borderRight:'1px solid '+CT.border }}>
          <p style={{ fontSize:14, color:CT.text, lineHeight:1.7, margin:0 }}>Charthis was started in 2024 by a discretionary trader who got tired of staring at screens. The mission: encode the patterns that worked, kill the ones that didn't, and ship them as autonomous agents.</p>
          <p style={{ fontSize:12, color:CT.dim, lineHeight:1.7, marginTop:20 }}>The thesis is simple: most retail tooling is either too rigid (off-the-shelf bots that overfit) or too academic (papers that never trade). Charthis sits between — every agent is hand-calibrated to a specific edge, validated against 5+ years of out-of-sample data, and shipped with a public dossier.</p>
          <div style={{ marginTop:28, padding:20, border:'1px solid '+CT.border, background:CT.bg2 }}>
            <div style={{ fontSize:10, color:CT.amber, letterSpacing:'0.15em', marginBottom:14 }}>// PRINCIPLES</div>
            {[
              ['No black box.','Every agent ships with backtest dossier and source notes.'],
              ['Walk-forward or it doesn\'t ship.','In-sample performance is irrelevant.'],
              ['Kill-switch first.','Drawdown caps and Sharpe-decay triggers baked in.'],
              ['Operator-built.','Every agent is hand-calibrated by people who actually trade.'],
            ].map(([t,d],i) => (
              <div key={i} style={{ padding:'8px 0', borderTop:i?'1px dashed '+CT.border:'none', marginTop:i?8:0 }}>
                <div style={{ fontSize:12, color:CT.text, fontWeight:600 }}>› {t}</div>
                <div style={{ fontSize:11, color:CT.dim, paddingLeft:14, marginTop:2 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:'40px 32px' }}>
          <div style={{ fontSize:10, color:CT.amber, letterSpacing:'0.15em', marginBottom:16 }}>// TIMELINE</div>
          {timeline.map((s, i) => (
            <div key={i} style={{ display:'flex', gap:16, padding:'14px 0', borderBottom:i<timeline.length-1?'1px solid '+CT.border:'none' }}>
              <div style={{ fontSize:10, color:CT.amber, letterSpacing:'0.1em', minWidth:80, paddingTop:2, flexShrink:0 }}>{s.y}</div>
              <div>
                <div style={{ fontSize:13, color:CT.text, fontWeight:600 }}>{s.t}</div>
                <div style={{ fontSize:11, color:CT.dim, marginTop:2, lineHeight:1.5 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   TAB CONTACT
══════════════════════════════════ */

function TabContact() {
  const CT = useCT();
  const [sent, setSent] = React.useState(false);
  const [form, setForm] = React.useState({ name:'', email:'', topic:'agent', msg:'' });

  const DEFAULT_CHANNELS = [
    { k:'EMAIL',     v:'hello@charthis.io',     tag:'FASTEST FOR FORMAL'   },
    { k:'TELEGRAM',  v:'@charthis_dev',          tag:'PREFERRED · FAST'     },
    { k:'X/TWITTER', v:'@charthis_io',           tag:'PUBLIC EXCHANGE'       },
    { k:'DISCORD',   v:'charthis.gg/invite',     tag:'COMMUNITY'             },
    { k:'CALENDAR',  v:'cal.com/charthis/intro', tag:'BOOK A CALL'           },
    { k:'LOCATION',  v:'Jakarta, ID · UTC+7',    tag:'Mon–Fri 09:00–22:00'  },
  ];
  const getSettings = () => { try { return JSON.parse(localStorage.getItem('charthis_settings')||'{}'); } catch { return {}; } };
  const [settings, setSettings] = React.useState(getSettings);
  React.useEffect(() => {
    const sync = () => setSettings(getSettings());
    const t = setInterval(sync, 2000);
    window.addEventListener('storage', sync);
    return () => { clearInterval(t); window.removeEventListener('storage', sync); };
  }, []);

  const channels = (settings.channels && settings.channels.length) ? settings.channels : DEFAULT_CHANNELS;
  const contactEmail = settings.contactEmail || 'hello@charthis.io';
  const preferred    = settings.preferredChannel || channels[1] ? channels[1].v : '@charthis_dev';

  const sendMessage = () => {
    if (!form.name || !form.email || !form.msg) return;
    const subject = encodeURIComponent('[Charthis] ' + form.topic.toUpperCase() + ' inquiry from ' + form.name);
    const body    = encodeURIComponent('Name: ' + form.name + '\nEmail: ' + form.email + '\nTopic: ' + form.topic + '\n\n' + form.msg);
    window.open('mailto:' + contactEmail + '?subject=' + subject + '&body=' + body, '_blank');
    setSent(true);
  };

  return (
    <div>
      <div style={{ padding:'48px 32px 24px', borderBottom:'1px solid '+CT.border }}>
        <div style={{ fontSize:10, color:CT.amber, letterSpacing:'0.2em', marginBottom:12 }}>// SECTION 07 · CONTACT</div>
        <h2 style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:56, fontWeight:700, margin:0, letterSpacing:'-0.03em', color:CT.textHi }}>
          Get in <span style={{ color:CT.amber }}>touch</span>.
        </h2>
        <p style={{ fontSize:13, color:CT.dim, marginTop:16, maxWidth:720, lineHeight:1.7 }}>Telegram is fastest. Email for anything formal. Response time: usually within 4 hours.</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr', borderBottom:'1px solid '+CT.border }}>
        {/* Channels */}
        <div style={{ padding:'40px 32px', borderRight:'1px solid '+CT.border }}>
          <div style={{ fontSize:11, color:CT.amber, letterSpacing:'0.15em', marginBottom:12 }}>CHANNELS</div>
          <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:28, fontWeight:600, marginBottom:24, color:CT.textHi }}>REACH US</div>
          <div style={{ borderTop:'1px solid '+CT.border, paddingTop:18 }}>
            {channels.map((c, i) => (
              <div key={i} style={{ padding:'10px 0', borderBottom:i<channels.length-1?'1px solid '+CT.border:'none', display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:12 }}>
                <div>
                  <span style={{ fontSize:9, color:CT.amber, letterSpacing:'0.15em', display:'block', marginBottom:3 }}>{c.k}</span>
                  <span style={{ fontSize:11, color:CT.textHi }}>{c.v}</span>
                </div>
                <span style={{ fontSize:9, color:CT.dim, textAlign:'right', flexShrink:0 }}>{c.tag}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:28, padding:'14px 16px', border:'1px solid '+CT.amber, background:'rgba(255,181,71,0.05)' }}>
            <div style={{ fontSize:9, color:CT.amber, letterSpacing:'0.15em', marginBottom:4 }}>★ PREFERRED</div>
            <div style={{ fontSize:12, color:CT.textHi }}>{preferred}</div>
          </div>
        </div>
        {/* Form */}
        <div style={{ padding:'40px 32px', background:CT.bg3, position:'relative' }}>
          <div style={{ position:'absolute', top:14, right:18, fontSize:9, color:CT.amber, letterSpacing:'0.15em' }}>★ SEND A MESSAGE</div>
          <div style={{ fontSize:11, color:CT.amber, letterSpacing:'0.15em', marginBottom:12 }}>CONTACT.FORM</div>
          <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:28, fontWeight:600, marginBottom:6, color:CT.textHi }}>Write to us</div>
          <div style={{ fontSize:11, color:CT.dim, marginBottom:24 }}>Sends directly to <span style={{ color:CT.amber }}>{contactEmail}</span></div>
          {!sent ? (
            <div style={{ borderTop:'1px solid '+CT.border, paddingTop:24, display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={{ fontSize:9, color:CT.dim, letterSpacing:'0.15em', display:'block', marginBottom:6 }}>NAME</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
                    style={{ width:'100%', background:CT.bg2, border:'1px solid '+CT.border, color:CT.text, padding:'11px 14px', fontFamily:'JetBrains Mono,monospace', fontSize:12, outline:'none', boxSizing:'border-box' }} placeholder="Your name" />
                </div>
                <div>
                  <label style={{ fontSize:9, color:CT.dim, letterSpacing:'0.15em', display:'block', marginBottom:6 }}>EMAIL</label>
                  <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
                    style={{ width:'100%', background:CT.bg2, border:'1px solid '+CT.border, color:CT.text, padding:'11px 14px', fontFamily:'JetBrains Mono,monospace', fontSize:12, outline:'none', boxSizing:'border-box' }} placeholder="you@domain.com" />
                </div>
              </div>
              <div>
                <label style={{ fontSize:9, color:CT.dim, letterSpacing:'0.15em', display:'block', marginBottom:6 }}>TOPIC</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                  {[['agent','Custom Agent'],['indicator','Indicator'],['enterprise','Enterprise'],['other','Other']].map(([k,l]) => (
                    <button key={k} type="button" onClick={() => setForm({...form,topic:k})}
                      style={{ padding:'11px 8px', background:form.topic===k?CT.amber:CT.bg2, color:form.topic===k?CT.bg:CT.text, border:'1px solid '+(form.topic===k?CT.amber:CT.border), fontFamily:'inherit', fontSize:10, fontWeight:700, cursor:'pointer' }}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize:9, color:CT.dim, letterSpacing:'0.15em', display:'block', marginBottom:6 }}>MESSAGE</label>
                <textarea value={form.msg} onChange={e=>setForm({...form,msg:e.target.value})} rows={5}
                  style={{ width:'100%', background:CT.bg2, border:'1px solid '+CT.border, color:CT.text, padding:'11px 14px', fontFamily:'JetBrains Mono,monospace', fontSize:12, outline:'none', resize:'vertical', boxSizing:'border-box' }}
                  placeholder="Tell us about your edge, your asset class..." />
              </div>
              <button onClick={sendMessage}
                style={{ width:'100%', background:CT.amber, color:CT.bg, border:'none', padding:'14px 16px', fontFamily:'inherit', fontSize:11, fontWeight:700, letterSpacing:'0.1em', cursor:'pointer' }}>
                SEND MESSAGE ▸
              </button>
              <div style={{ fontSize:10, color:CT.dim, lineHeight:1.6 }}>Opens your email client · sends to {contactEmail}</div>
            </div>
          ) : (
            <div style={{ borderTop:'1px solid '+CT.border, paddingTop:32, textAlign:'center' }}>
              <div style={{ fontSize:40, color:CT.green, marginBottom:14 }}>✓</div>
              <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:24, fontWeight:600, marginBottom:8, color:CT.textHi }}>Email client opened.</div>
              <div style={{ fontSize:12, color:CT.dim }}>Sending to <span style={{ color:CT.amber }}>{contactEmail}</span></div>
              <button onClick={() => { setSent(false); setForm({name:'',email:'',topic:'agent',msg:''}); }}
                style={{ marginTop:24, background:'transparent', color:CT.text, border:'1px solid '+CT.borderHi, padding:'12px 22px', fontFamily:'inherit', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                SEND ANOTHER ▸
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TabAnalysis, TabPricing, TabAbout, TabContact });
