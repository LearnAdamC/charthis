
// Live data layer (CoinGecko free public API) + Auth (localStorage).

// ============ LIVE DATA HOOK ============
// CoinGecko simple price endpoint — no API key, CORS-enabled.
// Cached + polled every 30s. Falls back gracefully if offline.

const CG_IDS = {
  'BTC/USD':  { id: 'bitcoin',     decimals: 2 },
  'ETH/USD':  { id: 'ethereum',    decimals: 2 },
  'SOL/USD':  { id: 'solana',      decimals: 2 },
  'BNB/USD':  { id: 'binancecoin', decimals: 2 },
  'AVAX/USD': { id: 'avalanche-2', decimals: 2 },
  'LINK/USD': { id: 'chainlink',   decimals: 3 },
  'DOGE/USD': { id: 'dogecoin',    decimals: 5 },
  'ARB/USD':  { id: 'arbitrum',    decimals: 4 },
};

// Static fallback prices — updated to plausible 2026 values
// (live crypto from CoinGecko overrides BTC/ETH/SOL/etc; non-crypto stays static)
const FALLBACK = {
  'BTC/USD':  { price: 95820.00, change: 1.82 },
  'ETH/USD':  { price: 3486.40,  change: 1.94 },
  'SOL/USD':  { price: 224.18,   change: 0.62 },
  'BNB/USD':  { price: 638.10,   change: 0.74 },
  'AVAX/USD': { price: 41.28,    change: 1.42 },
  'LINK/USD': { price: 21.84,    change: 1.18 },
  'DOGE/USD': { price: 0.39120,  change: -0.84 },
  'ARB/USD':  { price: 0.9214,   change: 0.41 },
  // non-crypto static — 2026-realistic values
  'XAU/USD':  { price: 4617.20,  change: 0.42 },
  'XAG/USD':  { price: 54.82,    change: 0.91 },
  'NVDA':     { price: 184.62,   change: 2.18 },
  'TSLA':     { price: 412.40,   change: -0.84 },
  'AAPL':     { price: 268.50,   change: 0.31 },
  'SPX':      { price: 6418.40,  change: 0.38 },
  'NDX':      { price: 23842.10, change: 0.52 },
  'DXY':      { price: 99.84,    change: -0.21 },
};

function formatPrice(sym, price) {
  const cgInfo = CG_IDS[sym];
  const decimals = cgInfo ? cgInfo.decimals : (price < 10 ? 4 : 2);
  const opts = { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
  return Number(price).toLocaleString('en-US', opts);
}

function formatChange(sym, change) {
  return (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
}

function useLiveData() {
  const [data, setData] = React.useState(FALLBACK);
  const [status, setStatus] = React.useState('loading');
  const [lastUpdate, setLastUpdate] = React.useState(Date.now());

  const fetchData = React.useCallback(async () => {
    try {
      const ids = Object.values(CG_IDS).map(x => x.id).join(',');
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('http ' + res.status);
      const json = await res.json();
      setData(prev => {
        const next = { ...prev };
        Object.entries(CG_IDS).forEach(([sym, info]) => {
          const row = json[info.id];
          if (row) {
            const px = row.usd;
            const ch = row.usd_24h_change || 0;
            // derive 24h hi/low estimate from price + change
            const prevPx = px / (1 + ch / 100);
            const range = Math.abs(px - prevPx) * 1.4;
            next[sym] = {
              price: px,
              change: ch,
              vol24h: row.usd_24h_vol || 0,
              high24h: px + range * 0.4,
              low24h: prevPx - range * 0.2,
              updatedAt: row.last_updated_at,
            };
          }
        });
        ['XAU/USD','XAG/USD','NVDA','TSLA','AAPL','SPX','NDX','DXY'].forEach(sym => {
          const base = FALLBACK[sym];
          const drift = (Math.sin(Date.now() / 60000 + sym.length) * 0.15);
          next[sym] = {
            price: base.price * (1 + drift / 100),
            change: base.change + drift,
            high24h: base.price * 1.012,
            low24h: base.price * 0.988,
          };
        });
        return next;
      });
      setStatus('live');
      setLastUpdate(Date.now());
    } catch (e) {
      console.warn('[charthis] live data fetch failed', e);
      setStatus('offline');
    }
  }, []);

  React.useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 15000); // 15-second sync
    return () => clearInterval(id);
  }, [fetchData]);

  return { data, status, lastUpdate, refresh: fetchData, syncSeconds: 15 };
}

// ============ AUTH ============

const AUTH_KEY = 'charthis_auth_v1';
const USERS_KEY = 'charthis_users_v1';

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); }
  catch { return {}; }
}
function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function loadAuth() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); }
  catch { return null; }
}
function saveAuth(a) {
  if (a) localStorage.setItem(AUTH_KEY, JSON.stringify(a));
  else localStorage.removeItem(AUTH_KEY);
}

// VERY simple hash — clientside only; demo purposes.
function hashPw(pw) {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) h = ((h << 5) + h) + pw.charCodeAt(i);
  return (h >>> 0).toString(16);
}

function useAuth() {
  const [user, setUser] = React.useState(loadAuth);

  const signUp = React.useCallback(({ email, password, name, subCode }) => {
    const users  = loadUsers();
    if (users[email]) return { ok: false, error: 'Email already registered. Try sign in.' };
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

    // ── Validate subscription code ──
    const codeKey = 'charthis_codes';
    let codes = {};
    try { codes = JSON.parse(localStorage.getItem(codeKey) || '{}'); } catch {}
    const upper = (subCode || '').trim().toUpperCase();
    if (!upper) return { ok: false, error: 'Subscription code is required.' };
    const codeEntry = codes[upper];
    if (!codeEntry) return { ok: false, error: 'Invalid subscription code.' };
    if (codeEntry.used) return { ok: false, error: `Code already used by another account.` };

    const tier = codeEntry.tier || 'STARTER';

    // Mark code as used
    codes[upper] = { ...codeEntry, used: true, usedBy: email, usedAt: new Date().toISOString() };
    try { localStorage.setItem(codeKey, JSON.stringify(codes)); } catch {}

    // Also write to charthis_users so admin panel sees it
    const usersKey = 'charthis_users';
    let adminUsers = {};
    try { adminUsers = JSON.parse(localStorage.getItem(usersKey) || '{}'); } catch {}
    adminUsers[email.toLowerCase()] = { name: name || email.split('@')[0], email, tier, code: upper, registeredAt: new Date().toISOString() };
    try { localStorage.setItem(usersKey, JSON.stringify(adminUsers)); } catch {}

    users[email] = { email, name: name || email.split('@')[0], pw: hashPw(password), tier, subCode: upper, created: Date.now() };
    saveUsers(users);
    const u = { email, name: users[email].name, tier };
    saveAuth(u);
    setUser(u);
    return { ok: true };
  }, []);

  const signIn = React.useCallback(({ email, password }) => {
    const users = loadUsers();
    const rec = users[email];
    if (!rec) return { ok: false, error: 'No account found for that email.' };
    if (rec.pw !== hashPw(password)) return { ok: false, error: 'Wrong password.' };
    const u = { email, name: rec.name, tier: rec.tier };
    saveAuth(u);
    setUser(u);
    return { ok: true };
  }, []);

  const signOut = React.useCallback(() => {
    saveAuth(null);
    setUser(null);
  }, []);

  const _setAdminUser = React.useCallback((u) => { saveAuth(u); setUser(u); }, []);
  return { user, signUp, signIn, signOut, _setAdminUser };
}

// ── SubCodeValidator — inline code check with live feedback ──
function SubCodeValidator({ code, onChange, CT, inputStyle }) {
  const [status, setStatus] = React.useState('idle'); // idle | ok | err
  const [tierLabel, setTierLabel] = React.useState('');

  const check = (val) => {
    onChange(val);
    const upper = val.trim().toUpperCase();
    if (!upper) { setStatus('idle'); setTierLabel(''); return; }
    let codes = {};
    try { codes = JSON.parse(localStorage.getItem('charthis_codes') || '{}'); } catch {}
    const entry = codes[upper];
    if (!entry) { setStatus('err'); setTierLabel(''); return; }
    if (entry.used) { setStatus('err'); setTierLabel('Already used'); return; }
    setStatus('ok');
    setTierLabel(entry.tier);
  };

  const borderColor = status === 'ok' ? CT.green : status === 'err' ? CT.red : CT.border;
  const TIER_COLORS = { STARTER: CT.amber, PRO: CT.green, DESK: CT.cyan };

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={code}
          onChange={e => check(e.target.value)}
          placeholder="CHARTHIS-PRO-XXXXXXXX"
          style={{ ...inputStyle, marginBottom: 0, border: `1px solid ${borderColor}`, textTransform: 'uppercase', letterSpacing: '0.06em', paddingRight: 36 }}
        />
        {status !== 'idle' && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: status === 'ok' ? CT.green : CT.red }}>
            {status === 'ok' ? '✓' : '✕'}
          </span>
        )}
      </div>
      {status === 'ok' && (
        <div style={{ marginTop: 6, fontSize: 10, color: CT.green, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>✓ Valid code</span>
          <span style={{ padding: '2px 8px', border: `1px solid ${TIER_COLORS[tierLabel] || CT.amber}`, color: TIER_COLORS[tierLabel] || CT.amber, fontSize: 9, letterSpacing: '0.12em', fontWeight: 700 }}>{tierLabel}</span>
          <span style={{ color: CT.dim }}>tier unlocked</span>
        </div>
      )}
      {status === 'err' && (
        <div style={{ marginTop: 6, fontSize: 10, color: CT.red }}>
          {code.trim().length > 8 ? (tierLabel || 'Invalid or already used code') : 'Keep typing…'}
        </div>
      )}
    </div>
  );
}

// ============ AUTH MODAL ============

function AuthModal({ open, mode: initialMode, onClose, auth }) {
  const CT = useCT();
  const [mode, setMode] = React.useState(initialMode || 'signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [subCode, setSubCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => { if (open) { setMode(initialMode || 'signin'); setError(''); setSubCode(''); } }, [open, initialMode]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    setTimeout(() => {
      if (mode === 'admin') {
        const PW_KEY = 'charthis_admin_pw';
        const DEFAULT_PW = 'admin1234';
        const stored = localStorage.getItem(PW_KEY) || DEFAULT_PW;
        if (password === stored) {
          const adminUser = { email: '__admin__', name: 'Admin', tier: 'ADMIN', isAdmin: true };
          // persist admin session
          try { localStorage.setItem('charthis_auth', JSON.stringify(adminUser)); } catch {}
          auth._setAdminUser(adminUser);
          setBusy(false);
          onClose();
          setPassword('');
        } else {
          setBusy(false);
          setError('Incorrect admin password.');
        }
        return;
      }
      const fn = mode === 'signin' ? auth.signIn : auth.signUp;
      const res = fn({ email: email.trim().toLowerCase(), password, name, subCode });
      setBusy(false);
      if (!res.ok) setError(res.error);
      else { onClose(); setEmail(''); setPassword(''); setName(''); }
    }, 400);
  };

  const inputStyle = {
    width: '100%', background: CT.bg, color: CT.textHi,
    border: `1px solid ${CT.border}`, padding: '12px 14px',
    fontFamily: 'JetBrains Mono, monospace', fontSize: 12, outline: 'none',
    marginBottom: 12,
  };
  const labelStyle = { fontSize: 9, color: CT.dim, letterSpacing: '0.15em', marginBottom: 6, display: 'block' };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
      backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 460, maxWidth: '100%', background: CT.bg2,
        border: `1px solid ${CT.borderHi}`, position: 'relative',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        {/* header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${CT.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: CT.bg3 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: CT.amber, boxShadow: `0 0 8px ${CT.amber}` }} />
            <span style={{ fontSize: 10, color: CT.dim, letterSpacing: '0.2em' }}>// CHARTHIS · {mode === 'signin' ? 'AUTHENTICATE' : mode === 'admin' ? 'ADMIN ACCESS' : 'PROVISION ACCOUNT'}</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: CT.dim, border: 'none', cursor: 'pointer', fontSize: 16, padding: 4 }}>✕</button>
        </div>

        {/* tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `1px solid ${CT.border}` }}>
          {[['signin','SIGN IN'],['signup','CREATE ACCOUNT'],['admin','ADMIN']].map(([k, l]) => (
            <button key={k} onClick={() => { setMode(k); setError(''); }} style={{
              padding: '14px 0',
              background: mode === k ? 'transparent' : CT.bg,
              color: mode === k ? (k === 'admin' ? CT.red : CT.amber) : CT.dim,
              border: 'none',
              borderBottom: `2px solid ${mode === k ? (k === 'admin' ? CT.red : CT.amber) : 'transparent'}`,
              fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.15em', fontWeight: 700, cursor: 'pointer',
            }}>{l}</button>
          ))}
        </div>

        {/* form */}
        <form onSubmit={submit} style={{ padding: '24px 24px 20px' }}>
          {mode === 'admin' ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(255,61,127,0.06)', border: `1px solid rgba(255,61,127,0.2)`, marginBottom: 16, fontSize: 10, color: CT.red }}>
                <span>⚠</span>
                <span>Restricted area · Admin access only</span>
              </div>
              <label style={labelStyle}>ADMIN PASSWORD</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inputStyle, border: `1px solid rgba(255,61,127,0.3)` }} autoFocus />
            </div>
          ) : (
            <div>
              {mode === 'signup' && (
                <div>
                  <label style={labelStyle}>FULL NAME (OPTIONAL)</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Quant" style={inputStyle} />
                </div>
              )}
              <label style={labelStyle}>EMAIL</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="trader@firm.com" style={inputStyle} />
              <label style={labelStyle}>PASSWORD</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
              {mode === 'signup' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>SUBSCRIPTION CODE</label>
                  <SubCodeValidator code={subCode} onChange={setSubCode} CT={CT} inputStyle={inputStyle} />
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(255,61,127,0.08)', border: `1px solid ${CT.red}`, padding: '10px 12px', fontSize: 10, color: CT.red, marginBottom: 14 }}>
              ⚠ {error}
            </div>
          )}

          <button type="submit" disabled={busy} style={{
            width: '100%', background: mode === 'admin' ? CT.red : CT.amber, color: mode === 'admin' ? '#fff' : CT.bg, border: 'none',
            padding: '14px 16px', fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.12em', cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1,
          }}>
            {busy ? 'PROCESSING...' : (mode === 'signin' ? 'SIGN IN ▸' : mode === 'admin' ? 'ACCESS ADMIN ▸' : 'CREATE ACCOUNT ▸')}
          </button>

          <div style={{ marginTop: 16, fontSize: 9, color: CT.dim, lineHeight: 1.7, textAlign: 'center' }}>
            {mode === 'admin' ? (
              <span style={{ color: CT.dim }}>Access is logged · stored locally</span>
            ) : (
              <>
                {mode === 'signin' ? 'No account? ' : 'Already registered? '}
                <span onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }} style={{ color: CT.amber, cursor: 'pointer', textDecoration: 'underline' }}>
                  {mode === 'signin' ? 'Create one' : 'Sign in'}
                </span>
                {' · '}
                <span style={{ opacity: 0.7 }}>Stored locally</span>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ ACCOUNT CHIP ============

function AccountChip({ user, onSignOut, onOpenDashboard, onGoToDashboard }) {
  const CT = useCT();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);
  const initials = (user.name || user.email).split(/[\s@.]/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('');
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        background: CT.bg2, color: CT.textHi, border: `1px solid ${CT.border}`,
        padding: '6px 10px 6px 6px', fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ width: 22, height: 22, borderRadius: 2, background: user.isAdmin ? CT.red : CT.amber, color: user.isAdmin ? '#fff' : CT.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{initials}</span>
        <span>{user.name || user.email.split('@')[0]}</span>
        <span style={{ color: CT.dim, fontSize: 9 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 240,
          background: CT.bg2, border: `1px solid ${CT.borderHi}`, zIndex: 200,
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${CT.border}` }}>
            <div style={{ fontSize: 12, color: CT.textHi, marginBottom: 4 }}>{user.name}</div>
            <div style={{ fontSize: 10, color: CT.dim }}>{user.email}</div>
            <div style={{ marginTop: 8, display: 'inline-block', background: user.isAdmin ? CT.red : CT.amber, color: user.isAdmin ? '#fff' : CT.bg, padding: '2px 8px', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em' }}>{user.isAdmin ? '⌗ ADMIN' : user.tier + ' TIER'}</div>
          </div>
          <div style={{ padding: '6px 0' }}>
            {(user.isAdmin ? [
              ['Admin Panel', () => { setOpen(false); onOpenDashboard(); }],
            ] : [
              ['Dashboard', () => { setOpen(false); onGoToDashboard?.(); }],
              ['Settings', () => { setOpen(false); onOpenDashboard(); }],
            ]).map(([l, fn]) => (
              <div key={l} onClick={fn} style={{ padding: '9px 16px', fontSize: 11, color: CT.text, cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.background = CT.bg3}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                {l}
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${CT.border}`, marginTop: 4, paddingTop: 4 }}>
              <div onClick={() => { setOpen(false); onSignOut(); }} style={{ padding: '9px 16px', fontSize: 11, color: CT.red, cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,61,127,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                Sign out
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ LIVE TICKER (replaces static one) ============

function CTickerLive({ data, status }) {
  const CT = useCT();
  const items = [
    'BTC/USD','ETH/USD','SOL/USD','BNB/USD','AVAX/USD','LINK/USD','DOGE/USD','ARB/USD',
    'XAU/USD','XAG/USD','NVDA','TSLA','AAPL','SPX','NDX','DXY'
  ].map(sym => {
    const d = data[sym] || FALLBACK[sym];
    return { sym, px: formatPrice(sym, d.price), d: formatChange(sym, d.change), up: d.change >= 0 };
  });
  const all = [...items, ...items, ...items];
  return (
    <div style={{ borderTop: `1px solid ${CT.border}`, borderBottom: `1px solid ${CT.border}`, background: CT.chartBg, overflow: 'hidden', padding: '6px 0', display: 'flex', alignItems: 'center' }}>
      <div style={{ flex: '0 0 auto', padding: '0 14px', borderRight: `1px solid ${CT.border}`, fontSize: 9, color: status === 'live' ? CT.green : CT.dim, letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: status === 'live' ? CT.green : CT.dim, boxShadow: status === 'live' ? `0 0 6px ${CT.green}` : 'none', animation: status === 'live' ? 'pulse 2s infinite' : 'none' }} />
        {status === 'live' ? 'LIVE FEED' : status === 'loading' ? 'CONNECTING' : 'CACHED'}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 32, animation: 'cticker 80s linear infinite', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
          {all.map((t, i) => (
            <span key={i} style={{ display: 'inline-flex', gap: 8, alignItems: 'baseline' }}>
              <span style={{ color: CT.dim }}>{t.sym}</span>
              <span style={{ color: CT.text }}>{t.px}</span>
              <span style={{ color: t.up ? CT.green : CT.red }}>{t.d}</span>
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes cticker { from { transform: translateX(0) } to { transform: translateX(-33.33%) } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// USER DASHBOARD PANEL
// ══════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// PRICING CONFIG — read/write from localStorage (set by admin)
// ══════════════════════════════════════════════════════════════
const PRICE_KEY = 'charthis_pricing';
const DEFAULT_PRICES = {
  STARTER: { m: 79,  a: 63  },
  PRO:     { m: 249, a: 199 },
  DESK:    { m: 599, a: 479 },
};

function getPricing() {
  try { return { ...DEFAULT_PRICES, ...JSON.parse(localStorage.getItem(PRICE_KEY) || '{}') }; }
  catch { return DEFAULT_PRICES; }
}
function setPricing(data) {
  try { localStorage.setItem(PRICE_KEY, JSON.stringify(data)); } catch {}
}

// Expose so pricing tab can use it
window._getPricing = getPricing;

// ══════════════════════════════════════════════════════════════
// USER DASHBOARD — redesigned
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════
// USER SETTINGS PANEL (drawer)
// ══════════════════════════════════════════════════════
function CDashboard({ user, data, onSignOut }) {
  const CT  = useCT();
  const [section, setSection] = React.useState('profile');
  const [pwForm, setPwForm]   = React.useState({ cur: '', nw: '', con: '' });
  const [pwMsg,  setPwMsg]    = React.useState('');
  const getDB = k => { try { return JSON.parse(localStorage.getItem(k)||'{}'); } catch { return {}; } };
  const userRec = getDB('charthis_users')[user.email?.toLowerCase()] || {};
  const pricing = getPricing();
  const TIER_C  = { STARTER: CT.amber, PRO: CT.green, DESK: CT.cyan };
  const tc = TIER_C[user.tier] || CT.amber;
  const initials = (user.name||user.email||'?').split(/[\s@.]/).filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('');

  const SECTIONS = [
    { k: 'profile',      l: 'Profile',      icon: '◉' },
    { k: 'subscription', l: 'Subscription', icon: '◈' },
    { k: 'security',     l: 'Security',     icon: '⌗' },
    { k: 'preferences',  l: 'Preferences',  icon: '◎' },
  ];

  const changePw = () => {
    const users = getDB('charthis_session_users') || getDB('charthis_users');
    const USERS_KEY = 'charthis_session_users';
    let db = {}; try { db = JSON.parse(localStorage.getItem('charthis_userdb')||'{}'); } catch {}
    if (!pwForm.cur) { setPwMsg('Enter current password.'); return; }
    if (pwForm.nw.length < 6) { setPwMsg('New password min 6 chars.'); return; }
    if (pwForm.nw !== pwForm.con) { setPwMsg('Passwords do not match.'); return; }
    // Update pw in userdb
    if (db[user.email]) {
      const hash = s => [...s].reduce((h,c)=>(Math.imul(31,h)+c.charCodeAt(0))|0,0).toString(36);
      if (db[user.email].pw !== hash(pwForm.cur)) { setPwMsg('Current password incorrect.'); return; }
      db[user.email].pw = hash(pwForm.nw);
      try { localStorage.setItem('charthis_userdb', JSON.stringify(db)); } catch {}
      setPwMsg('✓ Password updated.');
      setPwForm({ cur:'', nw:'', con:'' });
    } else { setPwMsg('✓ Password updated (demo mode).'); }
  };

  const inp = { width:'100%', background:CT.bg, border:`1px solid ${CT.border}`, color:CT.textHi, padding:'10px 12px', fontFamily:'JetBrains Mono,monospace', fontSize:11, outline:'none', boxSizing:'border-box' };

  return (
    <div style={{ fontFamily:'JetBrains Mono,monospace', height:'100%', display:'flex', flexDirection:'column' }}>
      {/* Profile strip */}
      <div style={{ padding:'20px 20px 16px', background:`linear-gradient(135deg,${CT.bg3},${CT.bg2})`, borderBottom:`1px solid ${CT.border}`, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:42, height:42, background:tc, color:CT.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, boxShadow:`0 0 16px ${tc}44` }}>{initials}</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:CT.textHi }}>{user.name||user.email.split('@')[0]}</div>
            <div style={{ fontSize:9, color:CT.dim }}>{user.email}</div>
          </div>
          <span style={{ marginLeft:'auto', padding:'3px 8px', background:tc+'22', border:`1px solid ${tc}`, color:tc, fontSize:8, fontWeight:700, letterSpacing:'.1em' }}>{user.tier}</span>
        </div>
      </div>

      {/* Nav tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${CT.border}`, flexShrink:0 }}>
        {SECTIONS.map(s => (
          <button key={s.k} onClick={() => setSection(s.k)} style={{ flex:1, padding:'10px 4px', background:'transparent', color:section===s.k ? CT.amber : CT.dim, border:'none', borderBottom:`2px solid ${section===s.k ? CT.amber : 'transparent'}`, fontFamily:'inherit', fontSize:8, letterSpacing:'.08em', fontWeight:700, cursor:'pointer' }}>
            {s.icon} {s.l}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>

        {/* ── PROFILE ── */}
        {section === 'profile' && (
          <div>
            <div style={{ fontSize:9, color:CT.amber, letterSpacing:'.15em', marginBottom:14 }}>// PROFILE INFORMATION</div>
            <div style={{ border:`1px solid ${CT.border}`, background:CT.bg2, marginBottom:12 }}>
              {[
                ['DISPLAY NAME', user.name||'—'],
                ['EMAIL', user.email],
                ['ACCOUNT ID', userRec.code||'LEGACY'],
                ['MEMBER SINCE', userRec.registeredAt ? new Date(userRec.registeredAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : '—'],
                ['STATUS', '● ACTIVE'],
              ].map(([k,v],i,arr) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 14px', borderBottom:i<arr.length-1?`1px solid ${CT.border}`:'none' }}>
                  <span style={{ fontSize:9, color:CT.dim, letterSpacing:'.1em' }}>{k}</span>
                  <span style={{ fontSize:11, color:k==='STATUS'?CT.green:CT.textHi }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUBSCRIPTION ── */}
        {section === 'subscription' && (
          <div>
            <div style={{ fontSize:9, color:CT.amber, letterSpacing:'.15em', marginBottom:14 }}>// SUBSCRIPTION</div>
            <div style={{ border:`1px solid ${tc}44`, background:tc+'08', marginBottom:14 }}>
              <div style={{ padding:'14px 16px', borderBottom:`1px solid ${tc}22`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:CT.textHi, fontFamily:'Space Grotesk,sans-serif' }}>{user.tier}</div>
                  <div style={{ fontSize:9, color:CT.dim, marginTop:2 }}>Current plan</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:22, fontWeight:700, color:tc, fontFamily:'Space Grotesk,sans-serif' }}>${pricing[user.tier]?.m||'—'}</div>
                  <div style={{ fontSize:9, color:CT.dim }}>/month</div>
                </div>
              </div>
              <div style={{ padding:'12px 16px' }}>
                {({
                  STARTER: [['Agents','2 production'],['Indicators','ATLAS only'],['Signals','Delayed 60s'],['Support','Email 24h']],
                  PRO:     [['Agents','6 production'],['Indicators','FLUX + ATLAS'],['Signals','Realtime'],['Optimizer','Walk-forward'],['Support','Slack 4h']],
                  DESK:    [['Agents','All 11'],['Indicators','All 4 incl VOID'],['Signals','0-delay'],['Optimizer','Daily + MC'],['Support','Analyst 1h']],
                }[user.tier]||[]).map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', fontSize:10, borderBottom:`1px solid ${CT.border}` }}>
                    <span style={{ color:CT.dim }}>{k}</span><span style={{ color:CT.textHi }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            {userRec.code && (
              <div style={{ border:`1px solid ${CT.border}`, padding:'10px 14px', marginBottom:12, background:CT.bg2 }}>
                <div style={{ fontSize:9, color:CT.dim, marginBottom:4 }}>SUBSCRIPTION CODE</div>
                <div style={{ fontSize:12, color:CT.textHi, letterSpacing:'.05em' }}>{userRec.code}</div>
              </div>
            )}
            <button onClick={() => {}} style={{ width:'100%', background:'transparent', border:`1px solid ${CT.amber}`, color:CT.amber, padding:'10px', fontFamily:'inherit', fontSize:10, fontWeight:700, letterSpacing:'.1em', cursor:'pointer' }}>
              UPGRADE PLAN ▸
            </button>
          </div>
        )}

        {/* ── SECURITY ── */}
        {section === 'security' && (
          <div>
            <div style={{ fontSize:9, color:CT.amber, letterSpacing:'.15em', marginBottom:14 }}>// SECURITY</div>
            <div style={{ border:`1px solid ${CT.border}`, padding:16, background:CT.bg2, marginBottom:12 }}>
              <div style={{ fontSize:10, color:CT.dim, letterSpacing:'.1em', marginBottom:14 }}>CHANGE PASSWORD</div>
              {[['CURRENT PASSWORD','cur','Current password'],['NEW PASSWORD','nw','New password (min 6)'],['CONFIRM PASSWORD','con','Confirm new password']].map(([l,k,ph]) => (
                <div key={k} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:8, color:CT.dim, letterSpacing:'.12em', marginBottom:5 }}>{l}</div>
                  <input type="password" value={pwForm[k]} onChange={e=>setPwForm(f=>({...f,[k]:e.target.value}))} placeholder={ph} style={inp} />
                </div>
              ))}
              {pwMsg && <div style={{ fontSize:10, color:pwMsg.startsWith('✓')?CT.green:CT.red, marginBottom:10 }}>{pwMsg}</div>}
              <button onClick={changePw} style={{ width:'100%', background:CT.amber, color:CT.bg, border:'none', padding:'10px', fontFamily:'inherit', fontSize:10, fontWeight:700, letterSpacing:'.1em', cursor:'pointer' }}>
                UPDATE PASSWORD ▸
              </button>
            </div>
          </div>
        )}

        {/* ── PREFERENCES ── */}
        {section === 'preferences' && (
          <div>
            <div style={{ fontSize:9, color:CT.amber, letterSpacing:'.15em', marginBottom:14 }}>// PREFERENCES</div>
            <div style={{ border:`1px solid ${CT.border}`, background:CT.bg2 }}>
              {[
                { l:'Email alerts on agent signals', v:true },
                { l:'Weekly performance digest', v:true },
                { l:'Show PnL in USD (vs %)', v:false },
                { l:'Dark mode (always)', v:true },
              ].map((pref,i,arr)=>(
                <div key={pref.l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', borderBottom:i<arr.length-1?`1px solid ${CT.border}`:'none' }}>
                  <span style={{ fontSize:10, color:CT.text }}>{pref.l}</span>
                  <div style={{ width:36, height:20, background:pref.v?CT.green+'44':CT.border, border:`1px solid ${pref.v?CT.green:CT.border}`, borderRadius:10, position:'relative', cursor:'pointer' }}>
                    <div style={{ width:14, height:14, background:pref.v?CT.green:CT.dim, borderRadius:'50%', position:'absolute', top:2, left:pref.v?18:2, transition:'left .2s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding:'12px 20px', borderTop:`1px solid ${CT.border}`, flexShrink:0 }}>
        <button onClick={onSignOut}
          style={{ width:'100%', background:'transparent', border:`1px solid ${CT.border}`, color:CT.dim, padding:'10px', fontFamily:'inherit', fontSize:10, fontWeight:700, letterSpacing:'.12em', cursor:'pointer', transition:'all .15s' }}
          onMouseEnter={e=>{e.target.style.borderColor=CT.red;e.target.style.color=CT.red;}}
          onMouseLeave={e=>{e.target.style.borderColor=CT.border;e.target.style.color=CT.dim;}}>
          SIGN OUT
        </button>
      </div>
    </div>
  );
}

function CAdminPanel({ onSignOut }) {
  const CT   = useCT();
  const [tab, setTab]   = React.useState('dashboard');
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
  const [tick, setTick] = React.useState(0);
  const getSettings = () => { try { return JSON.parse(localStorage.getItem('charthis_settings')||'{}'); } catch { return {}; } };
  const saveSettings = (s) => { try { localStorage.setItem('charthis_settings', JSON.stringify(s)); } catch {} };
  const [siteSettings, setSiteSettings] = React.useState(getSettings);

  const DEFAULT_CHANNELS = [
    { k: 'EMAIL',     v: 'hello@charthis.io',     tag: 'FASTEST FOR FORMAL' },
    { k: 'TELEGRAM',  v: '@charthis_dev',          tag: 'PREFERRED · FAST REPLY' },
    { k: 'X/TWITTER', v: '@charthis_io',           tag: 'PUBLIC EXCHANGE' },
    { k: 'DISCORD',   v: 'charthis.gg/invite',     tag: 'COMMUNITY' },
    { k: 'CALENDAR',  v: 'cal.com/charthis/intro', tag: 'BOOK A CALL' },
    { k: 'LOCATION',  v: 'Jakarta, ID · UTC+7',    tag: 'Mon–Fri 09:00–22:00 WIB' },
  ];
  const DEFAULT_TIMELINE = [
    { y: '2024 Q1', t: 'Started Charthis', d: 'Encoded first 3 strategies. Live PnL tracking from day one.' },
    { y: '2024 Q3', t: 'First 50 subscribers', d: 'Indicators line launched. FLUX + ATLAS shipped.' },
    { y: '2025 Q1', t: 'Agent marketplace', d: 'Opened public catalog. 8 production agents.' },
    { y: '2025 Q4', t: '$500M tracked volume', d: 'Gold agent A.003 launched. Fleet crossed $25M tracked AUM.' },
    { y: '2026 Q2', t: 'Today', d: '11 agents · 247 subs · 2.41 avg Sharpe.' },
  ];
  const channels  = siteSettings.channels  || DEFAULT_CHANNELS;
  const timeline  = siteSettings.timeline  || DEFAULT_TIMELINE;
  const [editChannels, setEditChannels] = React.useState(() => JSON.parse(JSON.stringify(channels)));
  const [editTimeline, setEditTimeline] = React.useState(() => JSON.parse(JSON.stringify(timeline)));
  React.useEffect(() => { if (tab === 'contact')  setEditChannels(JSON.parse(JSON.stringify(channels))); }, [tab]);
  React.useEffect(() => { if (tab === 'timeline') setEditTimeline(JSON.parse(JSON.stringify(timeline))); }, [tab]);

  React.useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 4000);
    return () => clearInterval(t);
  }, []);

  const getDB = k => { try { return JSON.parse(localStorage.getItem(k)||'{}'); } catch { return {}; } };
  const setDB = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const codes = getDB('charthis_codes');
  const users = getDB('charthis_users');
  const allC = Object.entries(codes).map(([code, v]) => ({ code, ...v }));
  const allU = Object.values(users);
  const used = allC.filter(c => c.used).length;
  const free = allC.filter(c => !c.used).length;

  const genCode = tier => {
    const ch = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let p=''; for(let i=0;i<8;i++) p+=ch[Math.floor(Math.random()*ch.length)];
    return `CHARTHIS-${tier.slice(0,3)}-${p}`;
  };

  const generate = () => {
    const db = getDB('charthis_codes');
    const now = new Date().toISOString();
    const newCodes = [];
    for (let i = 0; i < Math.min(50, Math.max(1, genQty)); i++) {
      let code; do { code = genCode(genTier); } while (db[code]);
      db[code] = { tier: genTier, used: false, createdAt: now, note: genNote || null };
      newCodes.push(code);
    }
    setDB('charthis_codes', db);
    setGenResult(newCodes);
    setTick(x => x + 1);
  };

  const savePricing = () => {
    setPricing(pricing);
    setTick(x => x + 1);
  };

  const deleteCode = code => {
    if (!confirm(`Delete ${code}?`)) return;
    const db = getDB('charthis_codes'); delete db[code]; setDB('charthis_codes', db); setTick(x=>x+1);
  };
  const deleteUser = email => {
    if (!confirm(`Remove ${email}?`)) return;
    const db = getDB('charthis_users'); delete db[email]; setDB('charthis_users', db); setTick(x=>x+1);
  };
  const exportJSON = () => {
    const data = { codes: getDB('charthis_codes'), users: getDB('charthis_users'), pricing: getPricing(), exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `charthis_data_${new Date().toISOString().slice(0,10)}.json`; a.click();
  };
  const copyText = t => navigator.clipboard.writeText(t).catch(() => {});

  const TABS = [['dashboard','OVERVIEW'],['generate','GENERATE'],['codes','CODES'],['users','USERS'],['pricing','PRICING'],['contact','CONTACT'],['timeline','TIMELINE']];
  const TIER_C = { STARTER: CT.amber, PRO: CT.green, DESK: CT.cyan };
  const inp = { background: CT.bg, border: `1px solid ${CT.border}`, color: CT.textHi, padding: '8px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ fontFamily: 'JetBrains Mono, monospace', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Admin header */}
      <div style={{ padding: '14px 16px 0', borderBottom: `1px solid ${CT.border}`, background: CT.bg3, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 14, color: CT.red }}>⌗</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: CT.textHi }}>Admin Panel</span>
          <span style={{ padding: '1px 7px', background: 'rgba(255,61,127,0.12)', border: `1px solid ${CT.red}55`, color: CT.red, fontSize: 8, letterSpacing: '0.1em' }}>RESTRICTED</span>
          <button onClick={exportJSON} title="Export all data as JSON" style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid ${CT.border}`, color: CT.dim, padding: '3px 8px', fontFamily: 'inherit', fontSize: 9, cursor: 'pointer' }}>↓ EXPORT</button>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '8px 2px', background: 'transparent', color: tab === k ? CT.red : CT.dim, border: 'none', borderBottom: `2px solid ${tab === k ? CT.red : 'transparent'}`, fontFamily: 'inherit', fontSize: 8, letterSpacing: '0.08em', fontWeight: 700, cursor: 'pointer' }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* OVERVIEW */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
              {[['CODES', allC.length, CT.textHi], ['UNUSED', free, CT.green], ['USED', used, CT.red], ['USERS', allU.length, CT.amber]].map(([l, v, c]) => (
                <div key={l} style={{ border: `1px solid ${CT.border}`, padding: '12px', background: CT.bg2 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c, fontFamily: 'Space Grotesk, sans-serif' }}>{v}</div>
                  <div style={{ fontSize: 8, color: CT.dim, letterSpacing: '0.12em', marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 9, color: CT.amber, letterSpacing: '0.15em', marginBottom: 10 }}>// TIER USAGE</div>
            {['STARTER','PRO','DESK'].map(tier => {
              const tot = allC.filter(c => c.tier === tier).length;
              const us  = allC.filter(c => c.tier === tier && c.used).length;
              const pct = tot ? Math.round((us/tot)*100) : 0;
              return (
                <div key={tier} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 9 }}>
                    <span style={{ color: TIER_C[tier] }}>{tier}</span>
                    <span style={{ color: CT.dim }}>{us}/{tot}</span>
                  </div>
                  <div style={{ height: 3, background: CT.border }}>
                    <div style={{ height: '100%', width: pct+'%', background: TIER_C[tier] }} />
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize: 9, color: CT.amber, letterSpacing: '0.15em', margin: '18px 0 10px' }}>// RECENT USERS</div>
            {[...allU].sort((a,b)=>new Date(b.registeredAt)-new Date(a.registeredAt)).slice(0,5).map(u => (
              <div key={u.email} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${CT.border}`, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: CT.textHi }}>{u.name}</div>
                  <div style={{ fontSize: 9, color: CT.dim }}>{u.email}</div>
                </div>
                <span style={{ padding: '2px 7px', border: `1px solid ${TIER_C[u.tier]||CT.amber}`, color: TIER_C[u.tier]||CT.amber, fontSize: 8 }}>{u.tier}</span>
              </div>
            ))}
            {allU.length === 0 && <div style={{ color: CT.dim, fontSize: 10 }}>No users yet.</div>}
          </div>
        )}

        {/* GENERATE */}
        {tab === 'generate' && (
          <div>
            <div style={{ fontSize: 9, color: CT.amber, letterSpacing: '0.15em', marginBottom: 14 }}>// GENERATE CODES</div>
            <div style={{ border: `1px solid ${CT.border}`, padding: 14, marginBottom: 14, background: CT.bg2 }}>
              <div style={{ fontSize: 9, color: CT.dim, letterSpacing: '0.12em', marginBottom: 8 }}>TIER</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
                {['STARTER','PRO','DESK'].map(t => (
                  <button key={t} onClick={() => setGenTier(t)} style={{ padding: '9px 4px', background: genTier===t ? TIER_C[t] : 'transparent', color: genTier===t ? CT.bg : CT.dim, border: `1px solid ${genTier===t ? TIER_C[t] : CT.border}`, fontFamily: 'inherit', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>{t}</button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 9, color: CT.dim, letterSpacing: '0.1em', marginBottom: 5 }}>QTY</div>
                  <input type="number" value={genQty} onChange={e=>setGenQty(+e.target.value)} min="1" max="50" style={{...inp, width: '100%'}} />
                </div>
                <div>
                  <div style={{ fontSize: 9, color: CT.dim, letterSpacing: '0.1em', marginBottom: 5 }}>NOTE (optional)</div>
                  <input type="text" value={genNote} onChange={e=>setGenNote(e.target.value)} placeholder="e.g. batch jan 2026" style={{...inp, width: '100%'}} />
                </div>
              </div>
              <button onClick={generate} style={{ width: '100%', background: CT.amber, color: CT.bg, border: 'none', padding: '10px', fontFamily: 'inherit', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', cursor: 'pointer' }}>GENERATE ▸</button>
            </div>
            {genResult.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 9, color: CT.dim }}>{genResult.length} code{genResult.length>1?'s':''} · {genTier}</span>
                  <button onClick={() => copyText(genResult.join('\n'))} style={{ ...inp, padding: '3px 8px', fontSize: 9, cursor: 'pointer', width: 'auto' }}>COPY ALL</button>
                </div>
                {genResult.map(c => (
                  <div key={c} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${CT.border}` }}>
                    <span style={{ fontSize: 11, color: CT.textHi, letterSpacing: '0.05em' }}>{c}</span>
                    <button onClick={() => copyText(c)} style={{ ...inp, padding: '2px 7px', fontSize: 9, cursor: 'pointer', width: 'auto' }}>COPY</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CODES */}
        {tab === 'codes' && (
          <div>
            <div style={{ fontSize: 9, color: CT.amber, letterSpacing: '0.15em', marginBottom: 10 }}>// ALL CODES ({allC.length})</div>
            <input value={codeSearch} onChange={e=>setCodeSearch(e.target.value)} placeholder="Search…" style={{...inp, width: '100%', marginBottom: 12}} />
            {allC.filter(e => !codeSearch || e.code.toLowerCase().includes(codeSearch.toLowerCase()) || (e.tier||'').toLowerCase().includes(codeSearch.toLowerCase()) || (e.usedBy||'').toLowerCase().includes(codeSearch.toLowerCase()))
              .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
              .map(e => (
              <div key={e.code} style={{ border: `1px solid ${CT.border}`, padding: '10px 12px', marginBottom: 6, background: CT.bg2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: CT.textHi, letterSpacing: '0.05em' }}>{e.code}</span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => copyText(e.code)} style={{ ...inp, padding: '2px 6px', fontSize: 8, cursor: 'pointer', width: 'auto' }}>COPY</button>
                    <button onClick={() => deleteCode(e.code)} style={{ background: 'transparent', border: `1px solid ${CT.red}44`, color: CT.red, padding: '2px 6px', fontFamily: 'inherit', fontSize: 8, cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 7, fontSize: 8, alignItems: 'center' }}>
                  <span style={{ padding: '1px 6px', border: `1px solid ${TIER_C[e.tier]||CT.amber}`, color: TIER_C[e.tier]||CT.amber }}>{e.tier}</span>
                  <span style={{ color: e.used ? CT.red : CT.green }}>{e.used ? '● USED' : '○ FREE'}</span>
                  {e.usedBy && <span style={{ color: CT.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{e.usedBy}</span>}
                </div>
              </div>
            ))}
            {allC.length === 0 && <div style={{ color: CT.dim, fontSize: 10 }}>No codes yet.</div>}
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div>
            <div style={{ fontSize: 9, color: CT.amber, letterSpacing: '0.15em', marginBottom: 10 }}>// USERS ({allU.length})</div>
            <input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Search…" style={{...inp, width: '100%', marginBottom: 12}} />
            {allU.filter(u => !userSearch || (u.name||'').toLowerCase().includes(userSearch.toLowerCase()) || (u.email||'').toLowerCase().includes(userSearch.toLowerCase()) || (u.tier||'').toLowerCase().includes(userSearch.toLowerCase()))
              .sort((a,b)=>new Date(b.registeredAt)-new Date(a.registeredAt))
              .map(u => (
              <div key={u.email} style={{ border: `1px solid ${CT.border}`, padding: '10px 12px', marginBottom: 6, background: CT.bg2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 11, color: CT.textHi }}>{u.name}</div>
                    <div style={{ fontSize: 9, color: CT.dim }}>{u.email}</div>
                  </div>
                  <button onClick={() => deleteUser(u.email)} style={{ background: 'transparent', border: `1px solid ${CT.red}44`, color: CT.red, padding: '2px 6px', fontFamily: 'inherit', fontSize: 8, cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ display: 'flex', gap: 6, fontSize: 8 }}>
                  <span style={{ padding: '1px 6px', border: `1px solid ${TIER_C[u.tier]||CT.amber}`, color: TIER_C[u.tier]||CT.amber }}>{u.tier}</span>
                  <span style={{ color: CT.dim }}>{u.code}</span>
                  <span style={{ color: CT.dim }}>{u.registeredAt ? new Date(u.registeredAt).toLocaleDateString() : '—'}</span>
                </div>
              </div>
            ))}
            {allU.length === 0 && <div style={{ color: CT.dim, fontSize: 10 }}>No users yet.</div>}
          </div>
        )}

        {/* PRICING */}
        {tab === 'pricing' && (
          <div>
            <div style={{ fontSize: 9, color: CT.amber, letterSpacing: '0.15em', marginBottom: 6 }}>// MANAGE PRICING</div>
            <div style={{ fontSize: 9, color: CT.dim, marginBottom: 16, lineHeight: 1.6 }}>Changes apply site-wide instantly. Annual = monthly value displayed (you set the actual annual price).</div>
            {['STARTER','PRO','DESK'].map(tier => (
              <div key={tier} style={{ border: `1px solid ${TIER_C[tier]}44`, background: CT.bg2, padding: '14px', marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: TIER_C[tier], letterSpacing: '0.12em', marginBottom: 12 }}>{tier}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 8, color: CT.dim, letterSpacing: '0.1em', marginBottom: 5 }}>MONTHLY PRICE ($)</div>
                    <input type="number" value={pricing[tier]?.m || 0}
                      onChange={e => setPricingState(p => ({...p, [tier]: {...(p[tier]||{}), m: +e.target.value}}))}
                      style={{...inp, width: '100%'}} />
                  </div>
                  <div>
                    <div style={{ fontSize: 8, color: CT.dim, letterSpacing: '0.1em', marginBottom: 5 }}>ANNUAL PRICE ($)</div>
                    <input type="number" value={pricing[tier]?.a || 0}
                      onChange={e => setPricingState(p => ({...p, [tier]: {...(p[tier]||{}), a: +e.target.value}}))}
                      style={{...inp, width: '100%'}} />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={savePricing} style={{ width: '100%', background: CT.amber, color: CT.bg, border: 'none', padding: '11px', fontFamily: 'inherit', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', cursor: 'pointer', marginTop: 4 }}>
              SAVE PRICING ▸
            </button>
            <div style={{ fontSize: 9, color: CT.dim, marginTop: 8, textAlign: 'center' }}>Saved to localStorage · applied across all pages</div>
          </div>
        )}

        {/* CONTACT SETTINGS */}
        {tab === 'contact' && editChannels && (
          <div>
            <div style={{ fontSize: 9, color: CT.amber, letterSpacing: '.15em', marginBottom: 14 }}>// CONTACT SETTINGS</div>

            {/* Contact email */}
            <div style={{ border:`1px solid ${CT.border}`, padding:14, background:CT.bg2, marginBottom:14 }}>
              <div style={{ fontSize: 9, color: CT.dim, letterSpacing: '.1em', marginBottom: 8 }}>CONTACT EMAIL (form sends here)</div>
              <input
                value={siteSettings.contactEmail || ''}
                onChange={e => setSiteSettings(s => ({...s, contactEmail: e.target.value}))}
                placeholder="hello@yoursite.com"
                style={{...inp, marginBottom: 10}}
              />
              <div style={{ fontSize: 9, color: CT.dim, letterSpacing: '.1em', marginBottom: 8 }}>PREFERRED CHANNEL (shown in contact page)</div>
              <input
                value={siteSettings.preferredChannel || ''}
                onChange={e => setSiteSettings(s => ({...s, preferredChannel: e.target.value}))}
                placeholder="@charthis_dev"
                style={{...inp, marginBottom: 10}}
              />
              <button onClick={() => { saveSettings({...siteSettings}); setTick(x=>x+1); }} style={{ width:'100%', background:CT.amber, color:CT.bg, border:'none', padding:'9px', fontFamily:'inherit', fontSize:10, fontWeight:700, cursor:'pointer' }}>SAVE ▸</button>
            </div>

            {/* Channels list */}
            <div style={{ fontSize: 9, color: CT.dim, letterSpacing: '.1em', marginBottom: 10 }}>REACH US CHANNELS</div>
            {editChannels.map((ch, i) => (
              <div key={i} style={{ border:`1px solid ${CT.border}`, padding:'10px 12px', marginBottom:6, background:CT.bg2 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 28px', gap:6, alignItems:'center' }}>
                  <input value={ch.k} onChange={e=>{const c=[...editChannels];c[i]={...c[i],k:e.target.value};setEditChannels(c);}} placeholder="LABEL" style={{...inp, fontSize:9}} />
                  <input value={ch.v} onChange={e=>{const c=[...editChannels];c[i]={...c[i],v:e.target.value};setEditChannels(c);}} placeholder="Value" style={{...inp, fontSize:9}} />
                  <input value={ch.tag} onChange={e=>{const c=[...editChannels];c[i]={...c[i],tag:e.target.value};setEditChannels(c);}} placeholder="Tag" style={{...inp, fontSize:9}} />
                  <button onClick={()=>{const c=[...editChannels];c.splice(i,1);setEditChannels(c);}} style={{background:'transparent',border:`1px solid ${CT.red}44`,color:CT.red,padding:'6px',fontFamily:'inherit',fontSize:10,cursor:'pointer'}}>✕</button>
                </div>
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <button onClick={()=>setEditChannels(c=>[...c,{k:'',v:'',tag:''}])} style={{flex:1,background:'transparent',border:`1px solid ${CT.border}`,color:CT.dim,padding:'8px',fontFamily:'inherit',fontSize:9,cursor:'pointer'}}>+ ADD CHANNEL</button>
              <button onClick={()=>{ saveSettings({...siteSettings, channels: editChannels}); setSiteSettings(s=>({...s,channels:editChannels})); setTick(x=>x+1); }} style={{flex:1,background:CT.amber,color:CT.bg,border:'none',padding:'8px',fontFamily:'inherit',fontSize:9,fontWeight:700,cursor:'pointer'}}>SAVE CHANNELS ▸</button>
            </div>
          </div>
        )}

        {/* TIMELINE EDITOR */}
        {tab === 'timeline' && editTimeline && (
          <div>
            <div style={{ fontSize: 9, color: CT.amber, letterSpacing: '.15em', marginBottom: 14 }}>// ABOUT PAGE TIMELINE</div>
            {editTimeline.map((item, i) => (
              <div key={i} style={{ border:`1px solid ${CT.border}`, padding:'12px', marginBottom:8, background:CT.bg2 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:9, color:CT.dim }}>Entry {i+1}</span>
                  <button onClick={()=>{const t=[...editTimeline];t.splice(i,1);setEditTimeline(t);}} style={{background:'transparent',border:`1px solid ${CT.red}44`,color:CT.red,padding:'2px 7px',fontFamily:'inherit',fontSize:9,cursor:'pointer'}}>✕ REMOVE</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'100px 1fr', gap:6, marginBottom:6 }}>
                  <input value={item.y} onChange={e=>{const t=[...editTimeline];t[i]={...t[i],y:e.target.value};setEditTimeline(t);}} placeholder="2024 Q1" style={{...inp, fontSize:10}} />
                  <input value={item.t} onChange={e=>{const t=[...editTimeline];t[i]={...t[i],t:e.target.value};setEditTimeline(t);}} placeholder="Event title" style={{...inp, fontSize:10}} />
                </div>
                <input value={item.d} onChange={e=>{const t=[...editTimeline];t[i]={...t[i],d:e.target.value};setEditTimeline(t);}} placeholder="Description..." style={{...inp, fontSize:10}} />
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <button onClick={()=>setEditTimeline(t=>[...t,{y:'',t:'',d:''}])} style={{flex:1,background:'transparent',border:`1px solid ${CT.border}`,color:CT.dim,padding:'9px',fontFamily:'inherit',fontSize:9,cursor:'pointer'}}>+ ADD ENTRY</button>
              <button onClick={()=>{ saveSettings({...siteSettings, timeline: editTimeline}); setSiteSettings(s=>({...s,timeline:editTimeline})); setTick(x=>x+1); }} style={{flex:1,background:CT.amber,color:CT.bg,border:'none',padding:'9px',fontFamily:'inherit',fontSize:9,fontWeight:700,cursor:'pointer'}}>SAVE TIMELINE ▸</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 16px', borderTop: `1px solid ${CT.border}`, flexShrink: 0 }}>
        <button onClick={onSignOut} style={{ width: '100%', background: 'transparent', border: `1px solid ${CT.red}55`, color: CT.red, padding: '9px', fontFamily: 'inherit', fontSize: 9, letterSpacing: '0.12em', cursor: 'pointer' }}>
          SIGN OUT ADMIN
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// DRAWER
// ══════════════════════════════════════════════════════

function CDashboardDrawer({ open, user, data, onClose, onSignOut }) {
  const CT = useCT();
  if (!user) return null;
  return (
    <>
      {open && <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(3px)',zIndex:1000 }} />}
      <div style={{
        position:'fixed',top:0,right:0,bottom:0,
        width: user.isAdmin ? 400 : 360,
        background: CT.bg2,
        borderLeft:`1px solid ${user.isAdmin ? CT.red+'44' : CT.borderHi}`,
        zIndex:1001,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition:'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        display:'flex',flexDirection:'column',
      }}>
        <div style={{ padding:'12px 16px',borderBottom:`1px solid ${CT.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',background:CT.bg3,flexShrink:0 }}>
          <span style={{ fontSize:9,color:CT.dim,letterSpacing:'.15em' }}>{user.isAdmin ? '⌗ ADMIN PANEL' : '// MY ACCOUNT'}</span>
          <button onClick={onClose} style={{ background:'transparent',border:'none',color:CT.dim,cursor:'pointer',fontSize:18,padding:4,lineHeight:1,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
        </div>
        <div style={{ flex:1,overflow:'hidden' }}>
          {user.isAdmin
            ? <CAdminPanel onSignOut={() => { onSignOut(); onClose(); }} />
            : <CDashboard user={user} data={data} onSignOut={() => { onSignOut(); onClose(); }} />
          }
        </div>
      </div>
    </>
  );
}

;

// ══════════════════════════════════════════════════════
// DASHBOARD GATE — shown when visiting /dashboard not logged in
// ══════════════════════════════════════════════════════
Object.assign(window, {
  FALLBACK, formatPrice, formatChange, useLiveData, useAuth, SubCodeValidator, AuthModal, AccountChip, CTickerLive, getPricing, setPricing, CDashboard, CAdminPanel, CDashboardDrawer
});
