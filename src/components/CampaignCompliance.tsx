'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePersistedContent } from '@/lib/usePersistedContent'

type Candidate = {
  name:      string
  race:      string
  state:     string
  raceLevel: string | null
} | null

// ── Content data ──────────────────────────────────────────────────────────────

const SETUP_STEPS = [
  {
    number: '01',
    title:  'Designate a Treasurer',
    body:   'A campaign committee cannot raise or spend money without an official treasurer on record. Your treasurer is legally responsible for compliance, recordkeeping, and filing reports. This can be a trusted volunteer, but ideally someone with financial experience.',
    action: 'Required before any money moves.',
    color:  'from-red-600 to-red-800',
    accent: 'text-red-400',
    checks: ['Choose a treasurer (can be yourself for small campaigns)', 'Brief them on reporting duties and deadlines', 'Get their signature on all registration forms'],
  },
  {
    number: '02',
    title:  'Register Your Committee',
    body:   'Federal candidates must file FEC Form 1 (Statement of Organization) and FEC Form 2 (Statement of Candidacy) within 15 days of crossing the $5,000 threshold in contributions or expenditures. State and local candidates must register with the appropriate state or county election authority.',
    action: 'File within 15 days of raising/spending $5,000.',
    color:  'from-blue-600 to-blue-800',
    accent: 'text-blue-400',
    checks: ['Federal: File FEC Form 1 (committee) and Form 2 (candidacy)', 'State/local: Register with your state election authority', 'Obtain a Federal Tax ID (EIN) for the committee', 'Record committee name exactly as filed — use it on all materials'],
  },
  {
    number: '03',
    title:  'Open a Dedicated Campaign Bank Account',
    body:   'All campaign funds must flow through a single, dedicated bank account in the committee name. Never mix personal and campaign funds. Bring your EIN, committee registration, and treasurer information to the bank.',
    action: 'Personal and campaign finances must never mix.',
    color:  'from-emerald-600 to-emerald-800',
    accent: 'text-emerald-400',
    checks: ['Open account in the official committee name', 'Use your EIN — not a Social Security Number', 'Only the treasurer (and authorized signers) should have access', 'Keep a complete, running register of every transaction'],
  },
  {
    number: '04',
    title:  'Set Up Your Accounting System',
    body:   'Every dollar in and every dollar out must be recorded with the donor\'s name, address, occupation, and employer (for contributions over $200 federally). Use the Budget Tracker in CampaignAssist to stay organized.',
    action: 'Accurate records are your legal protection.',
    color:  'from-violet-600 to-violet-800',
    accent: 'text-violet-400',
    checks: ['Record all contributions with full donor details', 'Log every expenditure with vendor, purpose, and date', 'Collect occupation and employer for donors over $200', 'Retain all receipts and bank statements'],
  },
  {
    number: '05',
    title:  'Add Required Disclaimers',
    body:   'Every political communication — mailers, ads, websites, social posts — must include a disclaimer stating who paid for it. Federal: "Paid for by [Committee Name]" or "Authorized by [Candidate Name]". Check your state\'s specific disclaimer language requirements.',
    action: 'Missing disclaimers are an FEC violation.',
    color:  'from-amber-600 to-amber-800',
    accent: 'text-amber-400',
    checks: ['Add disclaimer to every piece of campaign literature', 'Include on website and all digital ads', 'Add to email subject lines or footers', 'Check state law for exact required language'],
  },
  {
    number: '06',
    title:  'Know Your Filing Schedule',
    body:   'Federal candidates file quarterly reports in off-years (January, April, July, October) and may switch to monthly in an election year. Pre-election and post-election reports are also required. State filing schedules vary — check your state election authority\'s calendar.',
    action: 'Late filings trigger fines. Calendar your deadlines now.',
    color:  'from-red-700 to-rose-900',
    accent: 'text-rose-400',
    checks: ['Download the FEC reporting calendar (or your state equivalent)', 'Add every deadline to a shared calendar', 'File even if you had $0 activity (zero reports are required)', 'Amend reports promptly if you find errors'],
  },
]

const CONTRIBUTION_LIMITS = [
  { source: 'Individual',              federal: '$3,300 / election', note: 'Primary and general count separately' },
  { source: 'PAC (multicandidate)',    federal: '$5,000 / election', note: 'Must be registered with FEC' },
  { source: 'State/local party',       federal: '$5,000 / election', note: 'Varies by party type' },
  { source: 'National party committee',federal: '$41,300 / year',    note: 'For Senate candidates' },
  { source: 'Candidate (personal)',    federal: 'Unlimited',         note: 'Personal funds are not contributions' },
  { source: 'Corporation / Union',     federal: 'PROHIBITED',        note: 'Federal ban — some states differ' },
  { source: 'Foreign national',        federal: 'PROHIBITED',        note: 'Applies to any foreign influence' },
  { source: 'Federal contractor',      federal: 'PROHIBITED',        note: 'While under contract' },
  { source: 'Anonymous (over $50)',    federal: 'PROHIBITED',        note: 'Must return unidentified funds' },
]

const PROHIBITED = [
  { icon: '🚫', rule: 'Corporate and union general treasury funds', detail: 'Even if officers donate personally with their own money, the company itself cannot give.' },
  { icon: '🚫', rule: 'Foreign nationals and foreign corporations', detail: 'Any contribution — money, goods, or services — from a non-U.S. citizen or foreign entity is illegal.' },
  { icon: '🚫', rule: 'Federal government contractors', detail: 'Individuals or companies currently under a federal contract cannot contribute to federal campaigns.' },
  { icon: '🚫', rule: 'Contributions in someone else\'s name', detail: '"Straw donor" schemes — giving via a third party to hide the true source — are a federal crime.' },
  { icon: '🚫', rule: 'Cash contributions over $100', detail: 'Any cash donation above $100 is prohibited. Checks, cards, and verified digital payments are required.' },
  { icon: '🚫', rule: 'Contributions from minors directed by parents', detail: 'A contribution is only legal if the minor makes it from their own funds and of their own free will.' },
]

const RECORDS_TO_KEEP = [
  'All bank statements and cancelled checks',
  'Receipts and invoices for every expenditure',
  'Donor contribution cards or online records (name, address, occupation, employer)',
  'All filed FEC or state reports and amendments',
  'Payroll records if you have paid staff',
  'Vendor contracts and agreements',
  'Any written communications about contributions',
  'Credit card statements for campaign charges',
]

const ONGOING_CHECKLIST_ITEMS = [
  { id: 'q1',  label: 'File quarterly report — January deadline'          },
  { id: 'q2',  label: 'File quarterly report — April deadline'            },
  { id: 'q3',  label: 'File quarterly report — July deadline'             },
  { id: 'q4',  label: 'File quarterly report — October deadline'          },
  { id: 'pre', label: 'File pre-election report (12 days before election)' },
  { id: 'post',label: 'File post-election report (30 days after election)' },
  { id: 'rev', label: 'Monthly review: verify all transactions recorded'  },
  { id: 'don', label: 'Verify donor occupation/employer for $200+ donors' },
  { id: 'dis', label: 'Audit all new materials for disclaimer language'    },
  { id: 'lim', label: 'Check contribution totals — no donor over limit'   },
  { id: 'ret', label: 'Return any prohibited contributions promptly'       },
  { id: 'bak', label: 'Back up all financial records off-site'            },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function CampaignCompliance({ candidate }: { candidate: Candidate }) {
  const isFederal = (candidate?.raceLevel ?? '').toLowerCase() === 'federal'
  const level     = candidate?.raceLevel ? candidate.raceLevel.charAt(0).toUpperCase() + candidate.raceLevel.slice(1) : 'Campaign'

  const [savedChecklist, saveChecklist, { loading: checklistLoading }] = usePersistedContent<Record<string, boolean>>('compliance-checklist', {})
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [openStep, setOpenStep] = useState<number | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (!checklistLoading && !initialized.current) {
      initialized.current = true
      setChecked(savedChecklist)
    }
  }, [checklistLoading, savedChecklist])

  function toggle(id: string) {
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] }
      saveChecklist(next)
      return next
    })
  }

  const doneCount = ONGOING_CHECKLIST_ITEMS.filter(i => checked[i.id]).length

  return (
    <div className="min-h-full">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="relative bg-[#0a1e38] overflow-hidden -mx-6 -mt-6 mb-8">
        <div className="absolute inset-0 bg-stripe-pattern opacity-20 pointer-events-none" />
        <div className="absolute top-4 right-[8%] text-white/[0.04] text-[200px] font-black leading-none select-none">⚖</div>
        <div className="h-1.5 bg-amber-gradient" style={{ background: 'linear-gradient(to right, #f59e0b, #d97706)' }} />
        <div className="relative px-8 py-12">
          <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/25 rounded-full px-4 py-1.5 mb-5">
            <span className="text-amber-400 text-[10px] font-black uppercase tracking-[0.3em]">◆ Finance — Compliance</span>
          </div>
          <h1 className="font-display font-black text-white text-3xl md:text-5xl leading-tight mb-3">
            Campaign Finance<br />
            <span className="text-amber-400">Registration & Compliance.</span>
          </h1>
          <p className="text-blue-200/55 text-base max-w-2xl mb-2">
            A step-by-step guide to registering your committee, staying legally compliant, and never missing a filing deadline.
          </p>
          {candidate && (
            <p className="text-white/25 text-sm">
              {candidate.name} · {candidate.race} · {level}-level guidance
              {!isFederal && ' — always verify requirements with your state election authority'}
            </p>
          )}
        </div>
        <div className="h-px" style={{ background: 'linear-gradient(to right, rgba(245,158,11,0.4), transparent)' }} />
      </div>

      <div className="max-w-4xl space-y-12">

        {/* ── Important Notice ──────────────────────────────────────────────── */}
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <span className="text-amber-500 text-xl shrink-0 mt-0.5">⚠️</span>
          <div>
            <p className="font-bold text-amber-800 text-sm mb-0.5">This is general guidance, not legal advice.</p>
            <p className="text-amber-700/80 text-sm leading-relaxed">
              Campaign finance law varies by race type, state, and year. Federal candidates should consult{' '}
              <a href="https://www.fec.gov" target="_blank" rel="noopener noreferrer" className="underline font-semibold">fec.gov</a>{' '}
              directly. State and local candidates should contact their state or county election authority.
              When in doubt, consult a campaign finance attorney.
            </p>
          </div>
        </div>

        {/* ── Setup Steps ───────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-5 w-1 rounded-full bg-amber-500" />
            <h2 className="font-display font-black text-gray-900 text-2xl">Getting Started: 6 Essential Steps</h2>
          </div>

          <div className="space-y-3">
            {SETUP_STEPS.map((step, i) => {
              const isOpen = openStep === i
              return (
                <div
                  key={step.number}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div className={`h-1 bg-gradient-to-r ${step.color}`} />
                  <button
                    onClick={() => setOpenStep(isOpen ? null : i)}
                    className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
                  >
                    <div className={`font-display font-black text-3xl leading-none bg-gradient-to-br ${step.color} bg-clip-text text-transparent shrink-0 w-10`}>
                      {step.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 text-base">{step.title}</p>
                      <p className={`text-xs font-bold mt-0.5 ${step.accent}`}>{step.action}</p>
                    </div>
                    <span className="text-gray-300 text-sm shrink-0">{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 border-t border-gray-50">
                      <p className="text-gray-600 text-sm leading-relaxed mt-4 mb-4">{step.body}</p>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Action Items</p>
                        {step.checks.map(c => (
                          <div key={c} className="flex items-start gap-2.5">
                            <span className={`${step.accent} text-xs mt-0.5 shrink-0`}>★</span>
                            <span className="text-gray-700 text-sm">{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Contribution Limits ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-5 w-1 rounded-full bg-blue-500" />
            <h2 className="font-display font-black text-gray-900 text-2xl">
              {isFederal ? 'Federal Contribution Limits (2025–2026)' : 'Contribution Limits & Rules'}
            </h2>
          </div>

          {!isFederal && (
            <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
              <span className="text-blue-500 shrink-0 mt-0.5">ℹ️</span>
              <p className="text-blue-700 text-sm">
                State and local contribution limits vary significantly. The federal figures below are a useful reference, but{' '}
                <strong>confirm your state&apos;s specific limits</strong> with your state election authority before fundraising.
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-700" />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Source</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Federal Limit</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {CONTRIBUTION_LIMITS.map((row, i) => (
                    <tr key={row.source} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-800">{row.source}</td>
                      <td className={`px-5 py-3 text-sm font-black ${row.federal === 'PROHIBITED' ? 'text-red-600' : row.federal === 'Unlimited' ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {row.federal}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Prohibited Contributions ──────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-5 w-1 rounded-full bg-red-500" />
            <h2 className="font-display font-black text-gray-900 text-2xl">Prohibited Contributions</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {PROHIBITED.map(p => (
              <div key={p.rule} className="bg-white rounded-xl border border-red-100 p-4 flex gap-3">
                <span className="text-xl shrink-0">{p.icon}</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-0.5">{p.rule}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{p.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Reporting Overview ────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-5 w-1 rounded-full bg-violet-500" />
            <h2 className="font-display font-black text-gray-900 text-2xl">Reporting Requirements</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Quarterly Reports', timing: 'Jan · Apr · Jul · Oct', body: 'Cover the prior quarter\'s activity. Required even if no contributions or expenditures were made.', color: 'from-violet-500 to-violet-700', icon: '📅' },
              { label: 'Pre-Election Report', timing: '12 days before election', body: 'Covers activity through the 20th day before the election. Must be received by FEC by deadline.', color: 'from-red-500 to-red-700', icon: '⏰' },
              { label: 'Post-Election Report', timing: '30 days after election', body: 'Covers the period from the pre-election report through the election. Closes out the election cycle.', color: 'from-emerald-500 to-emerald-700', icon: '✅' },
            ].map(r => (
              <div key={r.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`h-1.5 bg-gradient-to-r ${r.color}`} />
                <div className="p-5">
                  <div className="text-2xl mb-2">{r.icon}</div>
                  <p className="font-black text-gray-900 text-sm mb-1">{r.label}</p>
                  <p className="text-xs text-violet-600 font-bold mb-2">{r.timing}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{r.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-gray-700 mb-2">48-Hour Rule (Election year)</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              In the final 20 days before a primary or general election, any contribution of <strong>$1,000 or more</strong> must be reported within 48 hours of receipt.
              This is a strict deadline — failure to comply results in fines.
            </p>
          </div>
        </section>

        {/* ── Record Keeping ────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-5 w-1 rounded-full bg-emerald-500" />
            <h2 className="font-display font-black text-gray-900 text-2xl">Record Keeping</h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-700" />
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                Federal law requires campaigns to retain financial records for <strong>3 years</strong> from the date of filing the related report.
                Keep both digital and physical backups. The following must be retained:
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {RECORDS_TO_KEEP.map(r => (
                  <div key={r} className="flex items-start gap-2">
                    <span className="text-emerald-500 text-xs mt-0.5 shrink-0">✓</span>
                    <span className="text-gray-700 text-sm">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Ongoing Compliance Checklist ──────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 rounded-full bg-amber-500" />
              <h2 className="font-display font-black text-gray-900 text-2xl">Compliance Checklist</h2>
            </div>
            <span className="text-sm font-bold text-gray-400">
              {doneCount} / {ONGOING_CHECKLIST_ITEMS.length} complete
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-100 rounded-full mb-5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${(doneCount / ONGOING_CHECKLIST_ITEMS.length) * 100}%` }}
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600" />
            <div className="divide-y divide-gray-50">
              {ONGOING_CHECKLIST_ITEMS.map(item => (
                <label
                  key={item.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 cursor-pointer transition-colors"
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    checked[item.id]
                      ? 'bg-amber-500 border-amber-500'
                      : 'border-gray-200 bg-white'
                  }`}>
                    {checked[item.id] && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={!!checked[item.id]}
                    onChange={() => toggle(item.id)}
                  />
                  <span className={`text-sm transition-colors ${checked[item.id] ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-2 text-center">
            Checklist progress is saved locally on this device.
          </p>
        </section>

        {/* ── Resources ─────────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-5 w-1 rounded-full bg-gray-400" />
            <h2 className="font-display font-black text-gray-900 text-2xl">Official Resources</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'FEC.gov — Federal Election Commission', desc: 'Official source for federal campaign finance law, forms, filing system (FECFile), and reporting calendar.', url: 'https://www.fec.gov', label: 'fec.gov', icon: '🏛️' },
              { title: 'FEC Campaign Guide', desc: 'Plain-language guides for congressional candidates, political committees, and party committees.', url: 'https://www.fec.gov/help-candidates-and-committees/guides/', label: 'FEC Guides', icon: '📖' },
              { title: 'NCSL — State Finance Laws', desc: 'The National Conference of State Legislatures tracks campaign finance laws for all 50 states.', url: 'https://www.ncsl.org/elections-and-campaigns/campaign-finance-overview', label: 'ncsl.org', icon: '🗺️' },
              { title: 'CampaignAssist Budget Tracker', desc: 'Track every income and expense transaction in your campaign, import bank statements, and stay organized.', url: '/budget', label: 'Open Budget Tracker', icon: '💵', internal: true },
            ].map(r => (
              <a
                key={r.title}
                href={r.url}
                target={r.internal ? undefined : '_blank'}
                rel={r.internal ? undefined : 'noopener noreferrer'}
                className="flex gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all group"
              >
                <span className="text-2xl shrink-0">{r.icon}</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-0.5 group-hover:text-amber-600 transition-colors">{r.title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed mb-1">{r.desc}</p>
                  <span className="text-xs font-bold text-amber-500">{r.label} →</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
        <div className="bg-[#0a1e38] rounded-2xl p-7 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <p className="text-white font-black text-lg mb-1">Keep your finances clean and organized.</p>
            <p className="text-blue-300/50 text-sm">Use the Budget Tracker to log every transaction and stay report-ready at all times.</p>
          </div>
          <Link
            href="/budget"
            className="shrink-0 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-black text-sm uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
          >
            Open Budget Tracker →
          </Link>
        </div>

      </div>
    </div>
  )
}
