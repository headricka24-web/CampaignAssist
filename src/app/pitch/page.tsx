'use client'

const DEPARTMENTS = [
  {
    color: '#b91c1c',
    icon: '★',
    name: 'Command',
    tools: ['Campaign Dashboard & Morning Brief', 'Path to Victory Calculator'],
    blurb: 'A daily operational overview — win numbers, targets, and what matters today.',
  },
  {
    color: '#1d4ed8',
    icon: '◉',
    name: 'Intelligence',
    tools: ['War Room (Opposition Tracking)', 'Hot Button Issue Briefings', 'Live News Feed', 'Constituent & Voter Bloc Profiles'],
    blurb: 'Know your opposition, your voters, and every story breaking in your district.',
  },
  {
    color: '#4338ca',
    icon: '✦',
    name: 'Communications',
    tools: ['Media Studio (Talking Points & Content)', 'Fundraising Letter Writer', 'Press Contact Manager'],
    blurb: 'Draft speeches, talking points, press releases, and fundraising asks — fast.',
  },
  {
    color: '#065f46',
    icon: '◎',
    name: 'Field Ops',
    tools: ['Outreach Hub (Contacts, Donors & Events)', 'Voter File Manager'],
    blurb: 'Organize your contacts, donors, volunteers, and canvassing all in one place.',
  },
  {
    color: '#b45309',
    icon: '◆',
    name: 'Finance',
    tools: ['Budget Tracker (Income, Expenses & Cash on Hand)', 'Compliance & Filing Guide'],
    blurb: 'Track every dollar in and out. Stay compliant with your state\'s rules.',
  },
  {
    color: '#c2410c',
    icon: '▶',
    name: 'Advertising',
    tools: ['Ad Copy Studio (TV, Radio, Digital & Mail)', 'Ad Strategy Advisor', 'Local Media Outlet Finder'],
    blurb: 'Write broadcast-ready scripts and get a complete media strategy built around your budget.',
  },
]

const STATS = [
  { value: '14', label: 'Operational Tools' },
  { value: '6', label: 'Campaign Departments' },
  { value: '1', label: 'Platform, No Staff Required' },
  { value: '∞', label: 'Content — Write as Much as You Need' },
]

export default function PitchPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #fff; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

        .page { max-width: 860px; margin: 0 auto; padding: 0 32px 80px; }

        /* ── Hero ── */
        .hero { background: #0a1628; color: #fff; margin: 0 -32px; padding: 64px 32px 56px; position: relative; overflow: hidden; }
        .hero-accent { position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(to right, #dc2626, #b91c1c); }
        .hero-watermark { position: absolute; right: 48px; top: 20px; font-size: 180px; font-weight: 900; color: rgba(255,255,255,0.03); line-height: 1; pointer-events: none; user-select: none; }
        .hero-eyebrow { font-size: 10px; font-weight: 900; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(212,160,23,0.9); margin-bottom: 16px; }
        .hero-title { font-size: 52px; font-weight: 900; line-height: 1.08; margin-bottom: 20px; }
        .hero-title span { color: #e8b820; }
        .hero-sub { font-size: 17px; color: rgba(255,255,255,0.65); max-width: 540px; line-height: 1.6; margin-bottom: 36px; }
        .hero-divider { height: 1px; background: linear-gradient(to right, rgba(212,160,23,0.4), transparent); margin-top: 48px; }

        /* ── Section labels ── */
        .section-label { font-size: 10px; font-weight: 900; letter-spacing: 0.28em; text-transform: uppercase; color: #94a3b8; margin: 48px 0 20px; }

        /* ── Problem / Solution block ── */
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 12px; }
        .callout { border-radius: 14px; padding: 24px 28px; }
        .callout-problem { background: #fef2f2; border: 1px solid #fecaca; }
        .callout-solution { background: #f0fdf4; border: 1px solid #bbf7d0; }
        .callout-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 12px; }
        .callout-problem .callout-title { color: #dc2626; }
        .callout-solution .callout-title { color: #16a34a; }
        .callout ul { padding-left: 18px; }
        .callout li { font-size: 13.5px; line-height: 1.7; color: #334155; margin-bottom: 2px; }

        /* ── Stats row ── */
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 40px 0; }
        .stat { background: #0a1628; border-radius: 14px; padding: 22px 16px; text-align: center; }
        .stat-value { font-size: 36px; font-weight: 900; color: #e8b820; line-height: 1; margin-bottom: 6px; }
        .stat-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.1em; line-height: 1.4; }

        /* ── Department cards ── */
        .dept-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .dept-card { border-radius: 14px; border: 1px solid #e2e8f0; padding: 22px 24px; background: #fff; }
        .dept-header { display: flex; align-items: center; gap-10px; margin-bottom: 10px; }
        .dept-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900; color: #fff; margin-right: 10px; flex-shrink: 0; }
        .dept-name { font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; }
        .dept-blurb { font-size: 12.5px; color: #64748b; line-height: 1.55; margin-bottom: 12px; margin-top: 6px; }
        .dept-tools { list-style: none; padding: 0; border-top: 1px solid #f1f5f9; padding-top: 10px; }
        .dept-tools li { font-size: 12px; color: #475569; line-height: 1.6; padding: 1px 0; display: flex; align-items: baseline; gap: 6px; }
        .dept-tools li::before { content: '—'; font-size: 10px; color: #cbd5e1; flex-shrink: 0; }

        /* ── Who it's for ── */
        .audience-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 40px; }
        .audience-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; }
        .audience-icon { font-size: 22px; margin-bottom: 8px; }
        .audience-title { font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
        .audience-desc { font-size: 12px; color: #64748b; line-height: 1.5; }

        /* ── Footer CTA ── */
        .cta-block { background: #0a1628; border-radius: 18px; padding: 40px 48px; text-align: center; margin-top: 48px; position: relative; overflow: hidden; }
        .cta-block::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(to right, #dc2626, #b91c1c); }
        .cta-title { font-size: 28px; font-weight: 900; color: #fff; margin-bottom: 12px; }
        .cta-title span { color: #e8b820; }
        .cta-sub { font-size: 14px; color: rgba(255,255,255,0.55); max-width: 420px; margin: 0 auto 28px; line-height: 1.6; }
        .cta-url { display: inline-block; background: #dc2626; color: #fff; font-weight: 900; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; padding: 14px 36px; border-radius: 10px; text-decoration: none; }
        .cta-footnote { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 20px; }

        /* ── Print overrides ── */
        @media print {
          @page { size: letter portrait; margin: 0.55in 0.5in; }
          /* Isolate only the pitch — hide sidebar, nav, footer */
          body > * { visibility: hidden; }
          #pitch-root, #pitch-root * { visibility: visible; }
          #pitch-root { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
          .hero { margin: 0; padding: 48px 32px 44px; }
          .dept-grid { page-break-inside: avoid; }
          .cta-block { page-break-inside: avoid; }
          .stats { page-break-inside: avoid; }
          .audience-grid { page-break-inside: avoid; }
        }
      `}</style>

    <div id="pitch-root">

      {/* Print button — hidden in PDF */}
      <div className="no-print" style={{ position: 'fixed', top: 20, right: 24, zIndex: 50, display: 'flex', gap: 10 }}>
        <button
          onClick={() => window.print()}
          style={{ background: '#0a1628', color: '#fff', fontWeight: 900, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 22px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
        >
          ⬇ Download PDF
        </button>
      </div>

      <div className="page">

        {/* ── Hero ── */}
        <div className="hero">
          <div className="hero-accent" />
          <div className="hero-watermark">★</div>
          <p className="hero-eyebrow">Campaign Infrastructure · 2026</p>
          <h1 className="hero-title">
            Everything your campaign needs.<br />
            <span>In one place.</span>
          </h1>
          <p className="hero-sub">
            CampaignAssist gives every candidate — from city council to Congress — a full campaign operation
            without a massive staff or budget. Strategy, messaging, advertising, field ops, and finance,
            all ready to go on day one.
          </p>
          <div className="hero-divider" />
        </div>

        {/* ── The problem / solution ── */}
        <p className="section-label">Why CampaignAssist</p>
        <div className="two-col">
          <div className="callout callout-problem">
            <p className="callout-title">The Old Way</p>
            <ul>
              <li>Expensive consultants for every task</li>
              <li>Weeks to get messaging, ads & strategy ready</li>
              <li>Tools scattered across dozens of platforms</li>
              <li>Small campaigns left with nothing</li>
              <li>Ground game locked behind big-budget vendors</li>
            </ul>
          </div>
          <div className="callout callout-solution">
            <p className="callout-title">With CampaignAssist</p>
            <ul>
              <li>Every department online the day you sign up</li>
              <li>Messaging, scripts & strategy built in minutes</li>
              <li>One dashboard — nothing falls through the cracks</li>
              <li>Scales from $5K races to $1M+</li>
              <li>Voter file, donors, volunteers — all in one place</li>
            </ul>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="stats">
          {STATS.map(s => (
            <div className="stat" key={s.label}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Departments ── */}
        <p className="section-label">The Full Platform — 6 Departments</p>
        <div className="dept-grid">
          {DEPARTMENTS.map(d => (
            <div className="dept-card" key={d.name}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <div className="dept-icon" style={{ background: d.color }}>{d.icon}</div>
                <span className="dept-name" style={{ color: d.color }}>{d.name}</span>
              </div>
              <p className="dept-blurb">{d.blurb}</p>
              <ul className="dept-tools">
                {d.tools.map(t => <li key={t}>{t}</li>)}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Who it's for ── */}
        <p className="section-label">Built For Every Level</p>
        <div className="audience-grid">
          <div className="audience-card">
            <div className="audience-icon">🏙️</div>
            <p className="audience-title">City & County Races</p>
            <p className="audience-desc">Get a full operation without a single paid staffer. Messaging, voter outreach, and budget tracking from day one.</p>
          </div>
          <div className="audience-card">
            <div className="audience-icon">🏛️</div>
            <p className="audience-title">State Legislature</p>
            <p className="audience-desc">District-specific strategy, issue briefings, constituent profiles, and press management — all in one dashboard.</p>
          </div>
          <div className="audience-card">
            <div className="audience-icon">🇺🇸</div>
            <p className="audience-title">Congressional & Statewide</p>
            <p className="audience-desc">Broadcast ad copy, full media buying strategy, opposition tracking, and compliance guidance at scale.</p>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="cta-block">
          <h2 className="cta-title">Ready to run a <span>real campaign?</span></h2>
          <p className="cta-sub">
            Get started today. No setup fees, no long-term contracts.
            Your full campaign infrastructure is live in minutes.
          </p>
          <a className="cta-url" href="https://campaignassist.app">
            campaignassist.app
          </a>
          <p className="cta-footnote">Questions? headricka24@gmail.com</p>
        </div>

      </div>

    </div> {/* #pitch-root */}
    </>
  )
}
