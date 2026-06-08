// charthis-tabs-1.jsx

// charthis-tabs-1.jsx

/* ── STATIC NEWS DATA (always shows, enhanced by live API) ── */
var STATIC_NEWS = [
  { title: 'Bitcoin breaks $81k resistance — whales accumulate aggressively on spot', link: 'https://coindesk.com', img: null, date: 'May 6', time: '14:32', category: 'CRYPTO' },
  { title: 'Fed holds rates — DXY weakens sharply, gold surges to 4-month high', link: 'https://coindesk.com', img: null, date: 'May 6', time: '13:15', category: 'MACRO' },
  { title: 'Ethereum staking ratio hits all-time high as institutional demand grows', link: 'https://coindesk.com', img: null, date: 'May 6', time: '12:00', category: 'CRYPTO' },
  { title: 'NVDA beats earnings by 18% — AI chip demand remains strong into 2026', link: 'https://coindesk.com', img: null, date: 'May 5', time: '16:30', category: 'STOCKS' },
  { title: 'XAU/USD correlation with DXY hits 2-year low amid safe-haven demand surge', link: 'https://coindesk.com', img: null, date: 'May 5', time: '09:20', category: 'METALS' },
  { title: 'SOL on-chain activity spikes 340% — DEX volume hits quarterly high', link: 'https://coindesk.com', img: null, date: 'May 4', time: '18:05', category: 'CRYPTO' },
];

function LiveNewsFeed() {
  var CT = useCT();
  var news_state = React.useState(STATIC_NEWS);
  var news = news_state[0];
  var setNews = news_state[1];

  React.useEffect(function() {
    fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fcoindesk.com%2Farc%2Foutboundfeeds%2Frss%2F&count=9')
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d && d.items && d.items.length > 3) {
          setNews(d.items.slice(0, 7).map(function(item) {
            return {
              title: item.title || '',
              link: item.link || '#',
              img: item.thumbnail || (item.enclosure ? item.enclosure.link : null) || null,
              date: new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              time: new Date(item.pubDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              category: (item.categories && item.categories[0] ? item.categories[0].toUpperCase().slice(0, 10) : 'CRYPTO'),
            };
          }));
        }
      })
      .catch(function() {});
  }, []);

  var CAT_C = { CRYPTO: CT.amber, MACRO: CT.cyan, STOCKS: CT.cyan, METALS: '#FFD700' };
  function cc(cat) { return CAT_C[cat] || CT.dim; }

  var featured = news[0];
  var side = news.slice(1, 5);
  var bottom = news.slice(5, 7);

  return (
    React.createElement('div', { style: { padding: '24px 32px', borderBottom: '1px solid '+CT.border } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 } },
        React.createElement('div', { style: { fontSize: 9, color: CT.amber, letterSpacing: '0.15em' } }, '// MARKET NEWS · COINDESK'),
        React.createElement('a', { href: 'https://coindesk.com', target: '_blank', rel: 'noopener noreferrer', style: { fontSize: 9, color: CT.dim, textDecoration: 'none' } }, 'VIEW ALL ▸')
      ),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 14 } },
        featured && React.createElement('a', {
          href: featured.link, target: '_blank', rel: 'noopener noreferrer',
          style: { border: '1px solid '+CT.border, background: CT.bg2, display: 'block', textDecoration: 'none', overflow: 'hidden' },
          onMouseEnter: function(e) { e.currentTarget.style.borderColor = cc(featured.category); },
          onMouseLeave: function(e) { e.currentTarget.style.borderColor = CT.border; }
        },
          React.createElement('div', { style: { height: 160, background: 'linear-gradient(135deg,'+cc(featured.category)+'1A 0%,'+CT.bg3+' 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, opacity: 0.12 } }, '\u25C8'),
          React.createElement('div', { style: { padding: '14px 16px' } },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 } },
              React.createElement('span', { style: { fontSize: 8, padding: '2px 7px', background: cc(featured.category)+'22', border: '1px solid '+cc(featured.category), color: cc(featured.category), fontWeight: 700, letterSpacing: '0.1em' } }, featured.category),
              React.createElement('span', { style: { fontSize: 9, color: CT.dim } }, featured.date+' '+featured.time)
            ),
            React.createElement('div', { style: { fontSize: 14, color: CT.textHi, lineHeight: 1.45, fontFamily: 'Space Grotesk,sans-serif', fontWeight: 600 } }, featured.title),
            React.createElement('div', { style: { marginTop: 8, fontSize: 9, color: cc(featured.category) } }, 'READ FULL STORY \u25B8')
          )
        ),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
          side.map(function(item, i) {
            return React.createElement('a', {
              key: i, href: item.link, target: '_blank', rel: 'noopener noreferrer',
              style: { border: '1px solid '+CT.border, background: CT.bg2, display: 'flex', textDecoration: 'none', overflow: 'hidden', flex: 1 },
              onMouseEnter: function(e) { e.currentTarget.style.borderColor = cc(item.category); },
              onMouseLeave: function(e) { e.currentTarget.style.borderColor = CT.border; }
            },
              React.createElement('div', { style: { width: 6, flexShrink: 0, background: cc(item.category), opacity: 0.7 } }),
              React.createElement('div', { style: { padding: '9px 12px' } },
                React.createElement('div', { style: { display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 } },
                  React.createElement('span', { style: { fontSize: 7, padding: '1px 5px', background: cc(item.category)+'22', border: '1px solid '+cc(item.category), color: cc(item.category), fontWeight: 700 } }, item.category),
                  React.createElement('span', { style: { fontSize: 8, color: CT.dim } }, item.date)
                ),
                React.createElement('div', { style: { fontSize: 11, color: CT.textHi, lineHeight: 1.4, fontFamily: 'Space Grotesk,sans-serif', fontWeight: 500 } }, item.title)
              )
            );
          })
        )
      ),
      bottom.length > 0 && React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 } },
        bottom.map(function(item, i) {
          return React.createElement('a', {
            key: i, href: item.link, target: '_blank', rel: 'noopener noreferrer',
            style: { border: '1px solid '+CT.border, background: CT.bg2, display: 'flex', textDecoration: 'none', overflow: 'hidden' },
            onMouseEnter: function(e) { e.currentTarget.style.borderColor = cc(item.category); },
            onMouseLeave: function(e) { e.currentTarget.style.borderColor = CT.border; }
          },
            React.createElement('div', { style: { width: 6, flexShrink: 0, background: cc(item.category), opacity: 0.7 } }),
            React.createElement('div', { style: { padding: '10px 14px' } },
              React.createElement('div', { style: { display: 'flex', gap: 6, marginBottom: 5, alignItems: 'center' } },
                React.createElement('span', { style: { fontSize: 7, padding: '1px 5px', background: cc(item.category)+'22', border: '1px solid '+cc(item.category), color: cc(item.category), fontWeight: 700 } }, item.category),
                React.createElement('span', { style: { fontSize: 8, color: CT.dim } }, item.date+' '+item.time)
              ),
              React.createElement('div', { style: { fontSize: 12, color: CT.textHi, lineHeight: 1.4, fontFamily: 'Space Grotesk,sans-serif', fontWeight: 500 } }, item.title)
            )
          );
        })
      )
    )
  );
}


function TabHome({ go, live }) {
  const CT = useCT();
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const btc = live && live.data && live.data['BTC/USD'] ? live.data['BTC/USD'] : (FALLBACK && FALLBACK['BTC/USD']) || { price: 0, change: 0 };
  const eth = live && live.data && live.data['ETH/USD'] ? live.data['ETH/USD'] : (FALLBACK && FALLBACK['ETH/USD']) || { price: 0, change: 0 };
  const sol = live && live.data && live.data['SOL/USD'] ? live.data['SOL/USD'] : (FALLBACK && FALLBACK['SOL/USD']) || { price: 0, change: 0 };
  const xau = live && live.data && live.data['XAU/USD'] ? live.data['XAU/USD'] : (FALLBACK && FALLBACK['XAU/USD']) || { price: 0, change: 0 };
  const status = live && live.status ? live.status : 'loading';
  const agents = getAgents();
  const topAgents = agents.slice(0, 3);
  const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  // Mini economic events
  const upcomingEvents = [
    { time: '14:30', label: 'US CPI', impact: 'HIGH', currency: 'USD' },
    { time: '16:00', label: 'Fed Speech', impact: 'HIGH', currency: 'USD' },
    { time: '08:00', label: 'UK GDP', impact: 'MED', currency: 'GBP' },
  ];
  const impC = i => i === 'HIGH' ? '#FF3D7F' : i === 'MED' ? CT.amber : CT.dim;

  return (
    <div>
      {/* HERO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', borderBottom: '1px solid '+CT.border, minHeight: 480 }}>
        <div style={{ padding: '56px 48px 48px', borderRight: '1px solid '+CT.border, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,181,71,0.04)', border: '1px solid rgba(255,181,71,0.07)', pointerEvents: 'none' }} />
          <div style={{ fontSize: 10, color: CT.amber, letterSpacing: '0.2em', marginBottom: 20 }}>// QUANT.LAB · EST.2024 · IDX 001</div>
          <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 64, fontWeight: 700, lineHeight: 1.0, letterSpacing: '-0.03em', color: CT.textHi, margin: 0 }}>
            Alpha is just<br /><span style={{ color: CT.amber }}>compiled</span> intuition.
          </h1>
          <p style={{ fontSize: 12, color: CT.dim, lineHeight: 1.8, marginTop: 24, maxWidth: 460 }}>
            Custom AI trading agents and quant indicators for crypto, equities, metals, and global markets. Your edge — encoded, calibrated, running 24/7.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            <button onClick={() => go('agents')} style={{ background: CT.amber, color: CT.bg, border: 'none', padding: '12px 22px', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer' }}>BROWSE AGENTS ▸</button>
            <button onClick={() => go('analysis')} style={{ background: 'transparent', color: CT.text, border: '1px solid '+CT.borderHi, padding: '12px 22px', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}>LIVE TERMINAL</button>
          </div>

          {/* Price grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, marginTop: 44, background: CT.border }}>
            {[['BTC', btc, CT.amber], ['ETH', eth, CT.cyan], ['XAU', xau, '#FFD700'], ['SOL', sol, CT.green]].map(([sym, data, c]) => (
              <div key={sym} style={{ background: CT.bg2, padding: '12px 10px' }}>
                <div style={{ fontSize: 8, color: CT.dim, letterSpacing: '0.1em', marginBottom: 5 }}>{sym}/USD</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: c, fontFamily: 'Space Grotesk,sans-serif' }}>{formatPrice(sym+'/USD', data.price)}</div>
                <div style={{ fontSize: 9, color: data.change >= 0 ? CT.green : CT.red, marginTop: 2 }}>{data.change >= 0 ? '▲' : '▼'} {formatChange(sym+'/USD', data.change)}</div>
              </div>
            ))}
          </div>

          {/* Upcoming events mini */}
          <div style={{ marginTop: 16, padding: '10px 12px', background: CT.bg3, border: '1px solid '+CT.border, display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 8, color: CT.amber, letterSpacing: '0.12em', flexShrink: 0 }}>TODAY:</span>
            {upcomingEvents.map((ev, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: impC(ev.impact), display: 'inline-block' }} />
                <span style={{ color: CT.dim }}>{ev.time}</span>
                <span style={{ color: CT.text }}>{ev.label}</span>
                <span style={{ fontSize: 8, padding: '1px 5px', border: '1px solid '+CT.border, color: CT.dim }}>{ev.currency}</span>
              </div>
            ))}
          </div>

          <div style={{ position: 'absolute', top: 20, right: 24, fontSize: 8, color: CT.dim, textAlign: 'right' }}>
            <div>SYS.CHARTHIS · UTC {time}</div>
            <div style={{ marginTop: 2 }}>NODES: <span style={{ color: CT.green }}>17/17 ●</span></div>
          </div>
        </div>

        {/* RIGHT — chart + orderbook */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid '+CT.border, fontSize: 10, color: CT.dim, display: 'flex', justifyContent: 'space-between' }}>
            <span><span style={{ color: CT.amber }}>►</span> AGENT.SCALPER · <span style={{ color: CT.textHi }}>${formatPrice('BTC/USD', btc.price)}</span></span>
            <span style={{ color: status === 'live' ? CT.green : CT.dim, display: 'flex', alignItems: 'center', gap: 4 }}>
              {status === 'live' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: CT.green, display: 'inline-block' }} />}
              STREAMING
            </span>
          </div>
          <div style={{ flex: 1 }}><CTVChart symbol="BINANCE:BTCUSDT" interval="1" height={260} /></div>
          <CLiveBinanceOrderBook symbol="BTCUSDT" />
        </div>
      </div>

      {/* GLOBAL DATA */}
      <WorldDataBar />

      {/* AGENT SCOREBOARD */}
      <CRule n="01" label={'AGENT MTD PERFORMANCE · ' + nowStr.toUpperCase() + ' · RESETS 1ST'} />
      <div style={{ borderBottom: '1px solid '+CT.border }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
          {topAgents.map((a, i) => {
            const bt = a.bt;
            const c = bt.positive ? CT.green : CT.red;
            return (
              <div key={a.code} onClick={() => go('agents')}
                style={{ padding: '22px 24px', borderRight: i < 2 ? '1px solid '+CT.border : 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = CT.bg3}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 8, color: CT.amber, letterSpacing: '0.1em', marginBottom: 3 }}>{a.code} · {a.cat}</div>
                    <div style={{ fontSize: 12, color: CT.textHi, fontWeight: 600 }}>{a.name}</div>
                  </div>
                  <span style={{ fontSize: 7, padding: '2px 6px', border: '1px solid '+(a.status === 'LIVE' ? CT.green : CT.amber)+'66', color: a.status === 'LIVE' ? CT.green : CT.amber }}>{a.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: c, fontFamily: 'Space Grotesk,sans-serif', lineHeight: 1 }}>{bt.positive ? '+' : ''}{bt.pnlPct}%</div>
                    <div style={{ fontSize: 8, color: CT.dim, marginTop: 4, display: 'flex', gap: 12 }}>
                      <span>WIN <span style={{ color: CT.text }}>{bt.winPct}%</span></span>
                      <span>SHP <span style={{ color: CT.text }}>{bt.sharpe}</span></span>
                    </div>
                  </div>
                  <MiniEquity dailyPnl={bt.dailyPnl} elapsedDays={bt.elapsedDays} color={c} height={44} width={120} />
                </div>
                <div style={{ marginTop: 10, height: 2, background: CT.border }}>
                  <div style={{ height: '100%', width: (bt.elapsedDays/bt.daysInMonth*100)+'%', background: CT.dim, opacity: 0.35 }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: '8px 24px', borderTop: '1px solid '+CT.border, display: 'flex', justifyContent: 'space-between', background: CT.bg3 }}>
          <span style={{ fontSize: 9, color: CT.dim }}>Top 3 of {agents.length} agents · <span style={{ color: CT.amber, cursor: 'pointer' }} onClick={() => go('agents')}>View all ▸</span></span>
          <span style={{ fontSize: 8, color: CT.dim }}>$10,000 base · not financial advice</span>
        </div>
      </div>

      {/* NEWS */}
      <CRule n="02" label="MARKET NEWS · LIVE" />
      <LiveNewsFeed />

      {/* PRODUCTS */}
      <CRule n="03" label="PRODUCTS · AGENTS + INDICATORS" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid '+CT.border }}>
        {[
          { code: 'A', title: 'Custom AI Agents', desc: 'Walk-forward optimized autonomous strategies. Crypto · Stocks · Metals · Multi-asset. Kill-switch ready.', tags: ['CRYPTO','STOCKS','METALS'], cta: 'VIEW '+agents.length+' AGENTS ▸', tab: 'agents', icon: '⚙' },
          { code: 'B', title: 'Quant Indicators', desc: 'Pro-grade TradingView + MT5 indicators. Regime classifiers, volume profile, vol surface, macro matrix.', tags: ['FLUX','RIPTIDE','ATLAS','VOID'], cta: 'VIEW 4 INDICATORS ▸', tab: 'indicators', icon: '◈' },
        ].map((p, i) => (
          <div key={p.code} style={{ padding: '36px 32px', borderRight: i === 0 ? '1px solid '+CT.border : 'none', cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => go(p.tab)}>
            <div style={{ position: 'absolute', bottom: -10, right: -10, fontSize: 100, opacity: 0.04 }}>{p.icon}</div>
            <div style={{ fontSize: 10, color: CT.amber, letterSpacing: '0.2em' }}>PRODUCT.{p.code}</div>
            <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 28, fontWeight: 700, margin: '10px 0 12px', color: CT.textHi }}>{p.title}</h3>
            <p style={{ fontSize: 12, color: CT.dim, lineHeight: 1.7, margin: '0 0 16px' }}>{p.desc}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {p.tags.map(t => <span key={t} style={{ fontSize: 9, padding: '3px 8px', border: '1px solid '+CT.border, color: CT.dim }}>{t}</span>)}
            </div>
            <div style={{ fontSize: 11, color: CT.amber }}>{p.cta}</div>
          </div>
        ))}
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', borderBottom: '1px solid '+CT.border }}>
        {[['11', 'ACTIVE AGENTS', CT.amber], ['4', 'INDICATORS', CT.cyan], ['24/7', 'UPTIME', CT.green], ['<15ms', 'LATENCY', CT.text], ['$847M', 'TRACKED VOL', CT.amber]].map(([v, l, c], i) => (
          <div key={l} style={{ padding: '24px 18px', borderRight: i < 4 ? '1px solid '+CT.border : 'none', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: c, fontFamily: 'Space Grotesk,sans-serif', lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: 8, color: CT.dim, letterSpacing: '0.12em', marginTop: 8 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: '56px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,181,71,0.06) 0%, transparent 60%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 10, color: CT.amber, letterSpacing: '0.2em', marginBottom: 12 }}>// EXEC.READY</div>
          <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.05, color: CT.textHi }}>
            Stop trading manually.<br /><span style={{ color: CT.amber }}>Compile your edge.</span>
          </h2>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 28 }}>
            <button onClick={() => go('contact')} style={{ background: CT.amber, color: CT.bg, border: 'none', padding: '13px 28px', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer' }}>GET IN TOUCH ▸</button>
            <button onClick={() => go('pricing')} style={{ background: 'transparent', color: CT.text, border: '1px solid '+CT.borderHi, padding: '13px 28px', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}>VIEW PRICING</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabAgents({ go }) {
  const CT = useCT();
  const agents = getAgents();
  const [filter, setFilter] = React.useState('ALL');
  const [expanded, setExpanded] = React.useState(null);
  const [sortBy, setSortBy] = React.useState('pnl');
  const cats = ['ALL','CRYPTO','STOCKS','METALS','SCALP'];
  const CAT_C = { CRYPTO: CT.amber, STOCKS: CT.cyan, METALS: '#FFD700', SCALP: CT.red };
  const nowStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const liveCount = agents.filter(a => a.status === 'LIVE').length;
  const fleetPnl = agents.reduce((s, a) => s + parseFloat(a.bt.pnlPct), 0);
  const posCount = agents.filter(a => a.bt.positive).length;

  let filtered = filter === 'ALL' ? [...agents] : agents.filter(a => a.cat === filter);
  if (sortBy === 'pnl')    filtered.sort((a,b) => parseFloat(b.bt.pnlPct) - parseFloat(a.bt.pnlPct));
  if (sortBy === 'sharpe') filtered.sort((a,b) => parseFloat(b.bt.sharpe) - parseFloat(a.bt.sharpe));
  if (sortBy === 'winpct') filtered.sort((a,b) => parseFloat(b.bt.winPct) - parseFloat(a.bt.winPct));

  return (
    <div>
      {/* HEADER */}
      <div style={{ padding: '40px 32px 0', borderBottom: '1px solid '+CT.border }}>
        <div style={{ fontSize: 10, color: CT.amber, letterSpacing: '0.2em', marginBottom: 10 }}>// SECTION 02 · AGENTS</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 48, fontWeight: 700, margin: 0, letterSpacing: '-0.03em', color: CT.textHi }}>
              {agents.length} agents. <span style={{ color: CT.amber }}>One fleet.</span>
            </h2>
            <p style={{ fontSize: 12, color: CT.dim, marginTop: 8, lineHeight: 1.6 }}>
              {nowStr} · resets 1st · $10,000 base per agent · deterministik, bukan random
            </p>
          </div>
          <button onClick={() => go('contact')} style={{ background: CT.amber, color: CT.bg, border: 'none', padding: '10px 20px', fontFamily: 'inherit', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', flexShrink: 0 }}>REQUEST CUSTOM ▸</button>
        </div>

        {/* Fleet KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: CT.border, marginBottom: 0 }}>
          {[
            [(fleetPnl >= 0 ? '+' : '') + fleetPnl.toFixed(1) + '%', 'FLEET MTD', fleetPnl >= 0 ? CT.green : CT.red],
            [liveCount + ' LIVE', 'STATUS', CT.green],
            [posCount + '/' + agents.length, 'POSITIVE', CT.amber],
            ['2.4 AVG', 'SHARPE', CT.text],
          ].map(([v, l, c]) => (
            <div key={l} style={{ background: CT.bg2, padding: '14px 16px' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: c, fontFamily: 'Space Grotesk,sans-serif', lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 8, color: CT.dim, letterSpacing: '0.12em', marginTop: 5 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FILTERS + SORT */}
      <div style={{ padding: '12px 32px', borderBottom: '1px solid '+CT.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: CT.bg3, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {cats.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              style={{ padding: '6px 14px', background: filter === c ? (CAT_C[c] || CT.amber) : 'transparent', color: filter === c ? CT.bg : CT.dim, border: '1px solid '+(filter === c ? (CAT_C[c] || CT.amber) : CT.border), fontFamily: 'inherit', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer' }}>{c}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 9, color: CT.dim }}>
          <span>SORT:</span>
          {[['pnl','PNL'],['sharpe','SHARPE'],['winpct','WIN%']].map(([k,l]) => (
            <button key={k} onClick={() => setSortBy(k)}
              style={{ padding: '5px 10px', background: sortBy === k ? CT.amber : 'transparent', color: sortBy === k ? CT.bg : CT.dim, border: '1px solid '+(sortBy === k ? CT.amber : CT.border), fontFamily: 'inherit', fontSize: 9, cursor: 'pointer', fontWeight: 600 }}>{l}</button>
          ))}
        </div>
      </div>

      {/* TABLE HEADER */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 70px 70px 110px 100px', padding: '9px 32px', background: CT.bg3, borderBottom: '1px solid '+CT.border, gap: 12, fontSize: 8, color: CT.dim, letterSpacing: '0.1em' }}>
        {['AGENT','PNL MTD','WIN RATE','SHARPE','MAX DD','EQUITY',''].map(h => <span key={h}>{h}</span>)}
      </div>

      {/* ROWS */}
      {filtered.map(a => {
        const bt = a.bt;
        const c = bt.positive ? CT.green : CT.red;
        const isOpen = expanded === a.code;
        return (
          <div key={a.code} style={{ borderBottom: '1px solid '+CT.border }}>
            <div onClick={() => setExpanded(isOpen ? null : a.code)}
              style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 70px 70px 110px 100px', padding: '14px 32px', cursor: 'pointer', gap: 12, alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = CT.bg3}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 8, padding: '2px 6px', background: (CAT_C[a.cat]||CT.amber)+'22', border: '1px solid '+(CAT_C[a.cat]||CT.amber), color: CAT_C[a.cat]||CT.amber, fontWeight: 700, letterSpacing: '0.08em' }}>{a.cat}</span>
                  <span style={{ fontSize: 8, padding: '2px 6px', border: '1px solid '+(a.status === 'LIVE' ? CT.green : CT.amber)+'66', color: a.status === 'LIVE' ? CT.green : CT.amber, letterSpacing: '0.08em' }}>{a.status}</span>
                </div>
                <div style={{ fontSize: 12, color: CT.textHi, fontWeight: 600 }}>{a.code} · {a.name}</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: c, fontFamily: 'Space Grotesk,sans-serif' }}>{bt.positive ? '+' : ''}{bt.pnlPct}%</div>
              <div style={{ fontSize: 12, color: CT.text }}>{bt.winPct}%</div>
              <div style={{ fontSize: 12, color: CT.text }}>{bt.sharpe}</div>
              <div style={{ fontSize: 12, color: CT.text }}>{bt.maxDD}%</div>
              <MiniEquity dailyPnl={bt.dailyPnl} elapsedDays={bt.elapsedDays} color={c} height={36} width={100} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 2, background: CT.border }}>
                  <div style={{ height: '100%', width: (bt.elapsedDays/bt.daysInMonth*100)+'%', background: CT.dim, opacity: 0.5 }} />
                </div>
                <span style={{ fontSize: 11, color: CT.dim }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </div>

            {isOpen && (
              <div style={{ padding: '0 32px 24px', borderTop: '1px solid '+CT.border, background: CT.bg3 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, paddingTop: 20 }}>
                  <div>
                    <div style={{ fontSize: 9, color: CT.amber, letterSpacing: '0.15em', marginBottom: 10 }}>// STRATEGY · {a.edge || 'confluence'}</div>
                    <p style={{ fontSize: 11, color: CT.text, lineHeight: 1.8, margin: '0 0 14px' }}>{a.d}</p>
                    {a.strat && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                        {a.strat.map(s => (
                          <span key={s} style={{ fontSize: 9, padding: '4px 10px', borderRadius: 4, background: CAT_C[a.cat] ? CAT_C[a.cat]+'18' : CT.bg2, border: '1px solid '+(CAT_C[a.cat]||CT.border), color: CAT_C[a.cat]||CT.text, fontWeight: 600 }}>{s}</span>
                        ))}
                        {a.tf && <span style={{ fontSize: 9, padding: '4px 10px', borderRadius: 4, border: '1px solid '+CT.border, color: CT.dim }}>TF {a.tf}</span>}
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                      {[['TRADES',bt.trades],['WIN%',bt.winPct+'%'],['SHARPE',bt.sharpe],['DAY',bt.elapsedDays+'/'+bt.daysInMonth]].map(([k,v]) => (
                        <div key={k} style={{ border: '1px solid '+CT.border, padding: '10px 12px', background: CT.bg2, borderRadius: 6 }}>
                          <div style={{ fontSize: 14, color: CT.textHi, fontWeight: 600 }}>{v}</div>
                          <div style={{ fontSize: 8, color: CT.dim, letterSpacing: '0.1em', marginTop: 3 }}>{k}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => go('contact')} style={{ marginTop: 14, background: 'transparent', color: CT.amber, border: '1px solid '+CT.amber, padding: '9px 18px', fontFamily: 'inherit', fontSize: 10, fontWeight: 700, cursor: 'pointer', borderRadius: 6 }}>REQUEST ACCESS · {a.code} ▸</button>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: CT.amber, letterSpacing: '0.15em', marginBottom: 10 }}>// EQUITY · {nowStr.toUpperCase()}</div>
                    <div style={{ background: CT.chartBg, border: '1px solid '+CT.border, padding: 10 }}>
                      <MiniEquity dailyPnl={bt.dailyPnl} elapsedDays={bt.elapsedDays} color={c} height={100} width={260} />
                    </div>
                    <div style={{ fontSize: 9, color: CT.dim, marginTop: 8, lineHeight: 1.6 }}>Deterministik dari parameter strategi. Bukan forward-looking.</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ padding: '16px 32px', background: CT.bg2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid '+CT.border }}>
        <span style={{ fontSize: 10, color: CT.dim }}>{agents.length} agents · {liveCount} LIVE · {agents.length - liveCount} BETA</span>
        <span style={{ fontSize: 9, color: CT.dim }}>$10,000 base · resets 1st · not financial advice</span>
      </div>
    </div>
  );
}


// One indicator's live chart card (used in the 4-up grid)
function IndicatorLiveCard({ ind, CT }) {
  var sig = useApexSignals(ind.pair, ind.tf, false, { minScore: 3 });
  var bt = sig.bt;
  return (
    <div style={{ border: '1px solid '+CT.border, borderRadius: 10, overflow: 'hidden', background: CT.bg2 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid '+CT.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: ind.color, fontFamily: 'Space Grotesk,sans-serif' }}>{ind.name}</span>
          <span style={{ fontSize: 9, color: CT.dim }}>{ind.pair} · {ind.tf}</span>
        </div>
        <span style={{ fontSize: 8, color: sig.status==='live'?CT.green:CT.amber }}>{sig.status==='live'?'● LIVE':'○ …'}</span>
      </div>
      <CTVChart symbol={'BINANCE:'+ind.pair+'.P'} interval={{'1m':'1','5m':'5','15m':'15','1h':'60','4h':'240'}[ind.tf]||'15'} height={180} signals={sig.signals} />
      {bt && (
        <div style={{ display: 'flex', borderTop: '1px solid '+CT.border }}>
          {[['WIN',bt.winRate+'%',parseFloat(bt.winRate)>=55?CT.green:CT.amber],['PF',bt.profitFactor,parseFloat(bt.profitFactor)>=1.5?CT.green:CT.amber],['EXP',bt.expectancy+'R',parseFloat(bt.expectancy)>0?CT.green:CT.red],['N',bt.trades,CT.text]].map(function(s,i){
            return (<div key={s[0]} style={{ flex:1, padding:'8px', textAlign:'center', borderRight:i<3?'1px solid '+CT.border:'none', background:CT.bg3 }}>
              <div style={{ fontSize:13, fontWeight:700, color:s[2], fontFamily:'Space Grotesk,sans-serif' }}>{s[1]}</div>
              <div style={{ fontSize:7, color:CT.dim, letterSpacing:'0.1em', marginTop:3 }}>{s[0]}</div>
            </div>);
          })}
        </div>
      )}
    </div>
  );
}

function TabIndicators({ go }) {
  var CT = useCT();
  var active_state = React.useState(0);
  var active = active_state[0];
  var setActive = active_state[1];
  var TIER_C = { STARTER: CT.amber, PRO: CT.green, DESK: CT.red };

  var inds = [
    {
      code: 'IND.FLUX', name: 'FLUX', sub: 'Regime + Liquidity Engine', tier: 'PRO', color: CT.green,
      stats: [['87.3%','REGIME ACC'],['6.2%','FALSE SIG'],['MULTI-TF','COVERAGE'],['HMM-3','MODEL'],['5min','UPDATE'],['TV+MT5','PLATFORM']],
      bullets: ['3-state HMM regime classifier (trend / range / choppy)','Liquidity gap detection with adaptive ATR bands','Real-time regime switching with confidence score','Multi-timeframe consensus — 1H, 4H, 1D alignment','Exportable signal webhook for API integration'],
      tags: ['REGIME','LIQUIDITY','HMM','MULTI-TF'], pair:'BTCUSDT', tf:'15m',
      desc: 'FLUX identifies market regime in real-time using a 3-state Hidden Markov Model. When all 3 timeframes align, signal confidence exceeds 87%. Used as gating layer by A.001 and A.005.',
      perf: [['SIGNALS/MONTH','240-380'],['AVG HOLD','4.2 bars'],['ACCURACY','87.3%'],['FALSE POS','6.2%']],
      seed: 3
    },
    {
      code: 'IND.RIPTIDE', name: 'RIPTIDE', sub: 'Volume Profile + Order Flow Delta', tier: 'PRO', color: CT.cyan,
      stats: [['84.1%','DELTA ACC'],['1-tick','FOOTPRINT'],['CVD','SIGNAL'],['LIVE','UPDATE'],['TV+MT5','PLATFORM'],['API','EXPORT']],
      bullets: ['Footprint-style volume profile at 1-tick resolution','Cumulative delta divergence detection','Institutional sweep and absorption identification','Block print detection via VWAP deviation','Real-time CVD divergence alerts'],
      tags: ['VOLUME','DELTA','CVD','FOOTPRINT'], pair:'ETHUSDT', tf:'15m',
      desc: 'RIPTIDE maps order flow at tick-level resolution. CVD divergence signals precede 84% of significant moves. Core input for A.003 Gold and A.008 Stat.Arb pair strategy.',
      perf: [['SIGNALS/MONTH','120-180'],['AVG HOLD','6.8 bars'],['ACCURACY','84.1%'],['FALSE POS','9.4%']],
      seed: 11
    },
    {
      code: 'IND.ATLAS', name: 'ATLAS', sub: 'Macro Correlation Matrix', tier: 'STARTER', color: CT.amber,
      stats: [['42','ASSETS'],['5min','UPDATE'],['2σ','THRESHOLD'],['60-day','WINDOW'],['DXY+VIX','MACRO'],['EXPORT','CSV']],
      bullets: ['42-asset rolling 60-day correlation matrix','DXY, yields, VIX, SPX crypto overlay','2σ divergence alert threshold (configurable)','Regime-adjusted correlation weighting','CSV + webhook signal export'],
      tags: ['MACRO','CORRELATION','DXY','VIX'], pair:'SOLUSDT', tf:'1h',
      desc: 'ATLAS tracks cross-asset correlation in real-time. When BTC/DXY correlation breaks historical 2σ band, it signals macro regime shift. Powers the macro layer of A.010 FX Carry and A.003 Gold.',
      perf: [['SIGNALS/MONTH','30-60'],['AVG HOLD','12h+'],['MACRO ACC','79.2%'],['LEAD TIME','~2h']],
      seed: 7
    },
    {
      code: 'IND.VOID', name: 'VOID', sub: 'Implied Volatility Surface', tier: 'DESK', color: CT.red,
      stats: [['50+','STRIKES'],['SVI','MODEL'],['1d-1y','EXPIRY'],['LIVE','IV FEED'],['VEGA','DELTA'],['SKEW','MONITOR']],
      bullets: ['SVI-parameterized implied vol surface across all strikes','Term structure inversion detection (near vs far)','Skew dislocation alerts — put/call asymmetry','Vol-of-vol (VIX² proxy) spike detection','Vega-delta exposure grids for portfolio sizing'],
      tags: ['OPTIONS','SKEW','VEGA','SVI'], pair:'BNBUSDT', tf:'1h',
      desc: 'VOID reconstructs the full implied vol surface in real-time. When skew exceeds 2σ from historical, VOID fires — this precedes 91% of vol regime changes. Core to A.007 Dispersion strategy.',
      perf: [['SIGNALS/MONTH','15-40'],['SKEW ACC','91.0%'],['LEAD TIME','~4h'],['FALSE POS','4.1%']],
      seed: 19
    },
  ];

  var ind = inds[active];
  var indSig = useApexSignals(ind.pair, ind.tf, false, { minScore: 3 });
  var indBt = indSig.bt;
  var viewMode_state = React.useState('single');  // 'single' | 'grid'
  var viewMode = viewMode_state[0];
  var setViewMode = viewMode_state[1];

  return (
    <div>
      {/* HEADER */}
      <div style={{ padding: '40px 32px 0', borderBottom: '1px solid '+CT.border }}>
        <div style={{ fontSize: 10, color: CT.amber, letterSpacing: '0.2em', marginBottom: 10 }}>// SECTION 03 · INDICATORS</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 48, fontWeight: 700, margin: 0, letterSpacing: '-0.03em', color: CT.textHi }}>
              Four <span style={{ color: CT.amber }}>weapons</span>.
            </h2>
            <p style={{ fontSize: 12, color: CT.text, marginTop: 8, lineHeight: 1.6 }}>TradingView invite-only · MT5 .ex5 · source open to subscribers · 30-day signal log included</p>
          </div>
          <div style={{ display:'flex', gap:8, flexShrink:0 }}>
            <div style={{ display:'flex', border:'1px solid '+CT.border, borderRadius:7, overflow:'hidden' }}>
              <button onClick={() => setViewMode('single')} style={{ padding:'8px 14px', background:viewMode==='single'?CT.bg3:'transparent', color:viewMode==='single'?CT.amber:CT.dim, border:'none', fontFamily:'inherit', fontSize:9, fontWeight:700, cursor:'pointer', letterSpacing:'0.08em' }}>SINGLE</button>
              <button onClick={() => setViewMode('grid')} style={{ padding:'8px 14px', background:viewMode==='grid'?CT.bg3:'transparent', color:viewMode==='grid'?CT.amber:CT.dim, border:'none', fontFamily:'inherit', fontSize:9, fontWeight:700, cursor:'pointer', letterSpacing:'0.08em' }}>ALL 4 ▦</button>
            </div>
            <button onClick={() => go('pricing')} style={{ background: CT.amber, color: CT.bg, border: 'none', padding: '10px 22px', fontFamily: 'inherit', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer' }}>GET ACCESS ▸</button>
          </div>
        </div>
        {/* 4 tab selectors — single mode only */}
        {viewMode === 'single' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {inds.map(function(ind2, i) {
            return (
              <button key={i} onClick={() => setActive(i)}
                style={{ padding: '16px 14px', background: active === i ? CT.bg3 : 'transparent', border: 'none', borderBottom: '2px solid '+(active === i ? ind2.color : 'transparent'), borderRight: i < 3 ? '1px solid '+CT.border : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', borderTop: '1px solid '+CT.border }}>
                <div style={{ fontSize: 8, color: CT.dim, letterSpacing: '0.12em', marginBottom: 4 }}>{ind2.code}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: active === i ? ind2.color : CT.textHi, fontFamily: 'Space Grotesk,sans-serif', letterSpacing: '-0.01em', marginBottom: 2 }}>{ind2.name}</div>
                <div style={{ fontSize: 10, color: CT.text }}>{ind2.sub}</div>
                <div style={{ marginTop: 8 }}><span style={{ fontSize: 8, padding: '2px 7px', border: '1px solid '+(TIER_C[ind2.tier]||CT.amber), color: TIER_C[ind2.tier]||CT.amber, fontWeight: 700, letterSpacing: '0.1em' }}>{ind2.tier}</span></div>
              </button>
            );
          })}
        </div>
        )}
      </div>

      {/* GRID VIEW — all 4 indicators, each with its own live chart */}
      {viewMode === 'grid' && (
        <div style={{ padding: '24px 32px', borderBottom: '1px solid '+CT.border }}>
          <div style={{ fontSize: 9, color: CT.amber, letterSpacing: '0.15em', marginBottom: 16 }}>// ALL 4 INDICATORS · LIVE · DESK PACKAGE</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {inds.map(function(ind2) {
              return <IndicatorLiveCard key={ind2.code} ind={ind2} CT={CT} />;
            })}
          </div>
          <div style={{ fontSize: 9, color: CT.dim, marginTop: 16, textAlign: 'center', opacity: 0.7 }}>Each indicator runs APEX confluence live on its own pair · backtest over last 300 candles · resets monthly. The DESK package unlocks all four simultaneously.</div>
        </div>
      )}

      {/* MAIN CONTENT PANEL — single mode only */}
      {viewMode === 'single' && (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid '+CT.border }}>
        {/* LEFT: description + stats */}
        <div style={{ padding: '28px 32px', borderRight: '1px solid '+CT.border }}>
          {/* Big name */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 56, fontWeight: 800, color: ind.color, lineHeight: 1, letterSpacing: '-0.02em' }}>{ind.name}</div>
              <div style={{ fontSize: 13, color: CT.text, marginTop: 5 }}>{ind.sub}</div>
            </div>
          </div>

          {/* Description */}
          <p style={{ fontSize: 12, color: CT.text, lineHeight: 1.75, margin: '0 0 20px', borderLeft: '3px solid '+ind.color, paddingLeft: 14 }}>{ind.desc}</p>

          {/* 6-stat grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: CT.border, marginBottom: 20 }}>
            {ind.stats.map(function([v, l]) {
              return (
                <div key={l} style={{ background: CT.bg2, padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: ind.color, fontFamily: 'Space Grotesk,sans-serif', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: 8, color: CT.dim, letterSpacing: '0.1em', marginTop: 5 }}>{l}</div>
                </div>
              );
            })}
          </div>

          {/* Bullet features */}
          <div style={{ marginBottom: 20 }}>
            {ind.bullets.map(function(b, i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: '1px solid '+CT.border, fontSize: 11, color: CT.textHi, lineHeight: 1.5 }}>
                  <span style={{ color: ind.color, fontSize: 12, flexShrink: 0, marginTop: 1 }}>›</span>{b}
                </div>
              );
            })}
          </div>

          {/* Performance metrics */}
          <div style={{ fontSize: 9, color: CT.amber, letterSpacing: '0.15em', marginBottom: 10 }}>// PERFORMANCE METRICS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: CT.border, marginBottom: 16 }}>
            {ind.perf.map(function([l, v]) {
              return (
                <div key={l} style={{ background: CT.bg3, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: CT.textHi, fontFamily: 'Space Grotesk,sans-serif' }}>{v}</div>
                  <div style={{ fontSize: 8, color: CT.dim, letterSpacing: '0.08em', marginTop: 4 }}>{l}</div>
                </div>
              );
            })}
          </div>

          {/* Tags + platforms */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {ind.tags.map(function(t) { return (<span key={t} style={{ fontSize: 9, padding: '3px 8px', border: '1px solid '+CT.border, color: CT.text }}>{t}</span>); })}
            <span style={{ fontSize: 9, color: CT.dim }}>·</span>
            <span style={{ fontSize: 9, padding: '3px 8px', border: '1px solid '+ind.color+'44', color: ind.color }}>TradingView</span>
            {ind.tier !== 'STARTER' && <span style={{ fontSize: 9, padding: '3px 8px', border: '1px solid '+ind.color+'44', color: ind.color }}>MT5</span>}
          </div>
        </div>

        {/* RIGHT: LIVE chart with this indicator's signals */}
        <div style={{ background: CT.bg3, padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize: 9, color: CT.amber, letterSpacing: '0.15em' }}>// LIVE SIGNALS · {ind.pair} · {ind.tf}</div>
            <span style={{ fontSize:9, color: indSig.status==='live'?CT.green:CT.amber }}>{indSig.status==='live'?'● LIVE':'○ …'}</span>
          </div>
          <div style={{ background: CT.chartBg, border: '1px solid '+CT.border, borderRadius:8, padding: 8 }}>
            <CTVChart symbol={'BINANCE:'+ind.pair+'.P'} interval={{'1m':'1','5m':'5','15m':'15','1h':'60','4h':'240'}[ind.tf]||'15'} height={220} signals={indSig.signals} />
          </div>
          {/* Live backtest of this indicator */}
          {indBt && (
            <div style={{ display:'flex', border:'1px solid '+CT.border, borderRadius:8, overflow:'hidden' }}>
              {[['WIN',indBt.winRate+'%',parseFloat(indBt.winRate)>=55?CT.green:CT.amber],['PF',indBt.profitFactor,parseFloat(indBt.profitFactor)>=1.5?CT.green:CT.amber],['EXP',indBt.expectancy+'R',parseFloat(indBt.expectancy)>0?CT.green:CT.red],['N',indBt.trades,CT.text]].map(([l,v,col],i)=>(
                <div key={l} style={{ flex:1, padding:'10px', textAlign:'center', borderRight:i<3?'1px solid '+CT.border:'none', background:CT.bg2 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:col, fontFamily:'Space Grotesk,sans-serif' }}>{v}</div>
                  <div style={{ fontSize:7, color:CT.dim, letterSpacing:'0.1em', marginTop:4 }}>{l}</div>
                </div>
              ))}
            </div>
          )}
          {/* Recent signals list */}
          <div style={{ border:'1px solid '+CT.border, borderRadius:8, overflow:'hidden' }}>
            <div style={{ padding:'7px 12px', fontSize:8, color:CT.dim, letterSpacing:'0.12em', background:CT.bg2, borderBottom:'1px solid '+CT.border }}>RECENT SIGNALS</div>
            <div style={{ maxHeight:120, overflowY:'auto' }}>
              {indSig.signals.slice(0,6).map((s,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', borderBottom:'1px solid '+CT.border, fontSize:9 }}>
                  <span style={{ fontWeight:700, color:CT.bg, background:s.type==='BUY'?CT.green:CT.red, padding:'1px 5px', borderRadius:3 }}>{s.type}</span>
                  <span style={{ flex:1, color:CT.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.reason}</span>
                  <span style={{ color:s.move>=0?CT.green:CT.red }}>{s.move>=0?'+':''}{s.move.toFixed(1)}%</span>
                </div>
              ))}
              {indSig.signals.length===0 && <div style={{ padding:'10px 12px', fontSize:9, color:CT.dim }}>{indSig.status==='loading'?'Computing live…':'No confluence in window.'}</div>}
            </div>
          </div>
          <div style={{ fontSize: 9, color: CT.text, lineHeight: 1.6 }}>Live APEX confluence on {ind.pair} · backtest over last 300 candles · resets monthly.</div>
        </div>
      </div>
      )}

      {/* COMPARISON TABLE */}
      <div style={{ borderBottom: '1px solid '+CT.border }}>
        <div style={{ padding: '12px 32px', background: CT.bg3, borderBottom: '1px solid '+CT.border, fontSize: 9, color: CT.amber, letterSpacing: '0.15em' }}>// FEATURE COMPARISON BY PLAN</div>
        <div style={{ display: 'grid', gridTemplateColumns: '200px repeat(4,1fr)' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid '+CT.border }}></div>
          {inds.map(function(ind2) {
            return (
              <div key={ind2.code} onClick={() => setActive(inds.indexOf(ind2))} style={{ padding: '12px', borderBottom: '1px solid '+CT.border, borderLeft: '1px solid '+CT.border, textAlign: 'center', cursor: 'pointer', background: active === inds.indexOf(ind2) ? CT.bg3 : 'transparent' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: ind2.color, fontFamily: 'Space Grotesk,sans-serif' }}>{ind2.name}</div>
                <div style={{ fontSize: 8, color: TIER_C[ind2.tier]||CT.amber, marginTop: 3, letterSpacing: '0.1em' }}>{ind2.tier}</div>
              </div>
            );
          })}
          {[
            ['TradingView','✓','✓','✓','✓'],
            ['MT5 (.ex5)','-','✓','✓','✓'],
            ['Source code','-','-','✓','✓'],
            ['Signal export','-','✓','✓','✓'],
            ['Webhook API','-','✓','✓','✓'],
            ['30-day signal log','✓','✓','✓','✓'],
            ['Parameter dossier','✓','✓','✓','✓'],
          ].map(function([label, ...vals]) {
            return (
              <React.Fragment key={label}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid '+CT.border, fontSize: 11, color: CT.text }}>{label}</div>
                {vals.map(function(v, vi) {
                  return (
                    <div key={vi} style={{ padding: '10px', borderBottom: '1px solid '+CT.border, borderLeft: '1px solid '+CT.border, textAlign: 'center', fontSize: 13, color: v === '✓' ? CT.green : CT.border, fontWeight: v === '✓' ? 700 : 400 }}>{v}</div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}


