import { cn } from '@/lib/utils'

interface Rule {
  id: string
  title: string
  description: string
  severity: 'critical' | 'warning' | 'info'
  category: string
  method: 'auto' | 'manual'
  active: boolean
}

const RULES: Rule[] = [
  // Brand
  {
    id: 'r1', category: 'Brand',
    title: 'Logo minimum size — 80px width on digital',
    description: 'The Puppies logo must be at least 80px wide on any digital asset to maintain legibility.',
    severity: 'critical', method: 'auto', active: true,
  },
  {
    id: 'r2', category: 'Brand',
    title: 'Puppies red must match #FF5C39 ±5%',
    description: 'Brand red color must fall within the approved range (approx. R:221-255, G:0-13, B:0-25).',
    severity: 'warning', method: 'auto', active: true,
  },
  {
    id: 'r3', category: 'Brand',
    title: 'Logo must appear in top-left or top-right quadrant',
    description: 'Brand guidelines require the logo to be placed in the upper portion of packaging.',
    severity: 'critical', method: 'auto', active: true,
  },
  {
    id: 'r4', category: 'Brand',
    title: 'Sub-brand lockup must appear below Puppies logo',
    description: 'Sub-brand name (e.g., Pro Plan, Puppies ONE) must be visually subordinate to the master brand.',
    severity: 'warning', method: 'auto', active: true,
  },
  {
    id: 'r5', category: 'Brand',
    title: 'No competitor logo or brand within clear space',
    description: 'Competitor references are not permitted in the main artwork area.',
    severity: 'critical', method: 'auto', active: true,
  },
  // Legal
  {
    id: 'r6', category: 'Legal',
    title: 'Net weight must appear on front panel',
    description: 'Required by law (FPLA): net weight or count must be visible on the principal display panel.',
    severity: 'critical', method: 'auto', active: true,
  },
  {
    id: 'r7', category: 'Legal',
    title: 'Manufacturer name and address required',
    description: 'The responsible party name and US address must appear on the packaging.',
    severity: 'critical', method: 'auto', active: true,
  },
  {
    id: 'r8', category: 'Legal',
    title: '"Results may vary" disclaimer for claims',
    description: 'Any performance or health claims must be accompanied by the standard disclaimer.',
    severity: 'warning', method: 'manual', active: true,
  },
  {
    id: 'r9', category: 'Legal',
    title: 'No unsubstantiated health claims',
    description: 'Claims such as "cures" or "treats disease" are not permitted without FDA approval.',
    severity: 'critical', method: 'auto', active: true,
  },
  // Regulatory
  {
    id: 'r10', category: 'Regulatory',
    title: 'AAFCO nutritional adequacy statement required',
    description: 'Pet food must include AAFCO statement confirming the diet meets nutritional levels.',
    severity: 'critical', method: 'auto', active: true,
  },
  {
    id: 'r11', category: 'Regulatory',
    title: 'Guaranteed analysis panel required',
    description: 'Minimum percentages of crude protein, crude fat, and maximum crude fiber/moisture must be shown.',
    severity: 'critical', method: 'auto', active: true,
  },
  {
    id: 'r12', category: 'Regulatory',
    title: 'Ingredient list in descending order by weight',
    description: 'All ingredients must be listed from heaviest to lightest per AAFCO regulations.',
    severity: 'warning', method: 'auto', active: true,
  },
  // Typography
  {
    id: 'r13', category: 'Typography',
    title: 'Minimum body copy font size — 6pt',
    description: 'All legally required text must be at minimum 6pt for readability.',
    severity: 'warning', method: 'auto', active: true,
  },
  {
    id: 'r14', category: 'Typography',
    title: 'Only approved brand typefaces',
    description: 'Headlines must use Gotham or trade-approved alternatives only.',
    severity: 'info', method: 'auto', active: true,
  },
  // Color
  {
    id: 'r15', category: 'Color',
    title: 'Sufficient contrast ratio on required text',
    description: 'Legal and nutritional text must achieve minimum 4.5:1 contrast ratio against background.',
    severity: 'warning', method: 'auto', active: true,
  },
]

const CATEGORY_ORDER = ['Brand', 'Legal', 'Regulatory', 'Typography', 'Color']
const SEVERITY_COLORS = {
  critical: { dot: 'bg-[#D32F2F]', badge: 'bg-[#FEECEC] text-[#D32F2F]' },
  warning:  { dot: 'bg-[#F57C00]', badge: 'bg-[#FFF3E0] text-[#F57C00]' },
  info:     { dot: 'bg-[#1565C0]', badge: 'bg-[#E3F2FD] text-[#1565C0]' },
}

export function RulesPage() {
  const categories = CATEGORY_ORDER.filter(cat => RULES.some(r => r.category === cat))
  const activeCount = RULES.filter(r => r.active).length

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] text-[#5E5954] tracking-widest mb-1">AI VALIDATION ENGINE</p>
          <h1 className="text-[#0A0A0F] text-2xl font-semibold">Validation Rules</h1>
          <p className="text-[#5E5954] text-sm mt-1">{activeCount} active rules across {categories.length} categories</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#FF5C39] hover:bg-[#E54E2A] text-white text-sm font-medium rounded-xl transition-all shadow-sm shadow-[#FF5C39]/20">
          + Add Rule
        </button>
      </div>

      {/* Rules by category */}
      <div className="space-y-5">
        {categories.map(category => {
          const categoryRules = RULES.filter(r => r.category === category)
          return (
            <div key={category}>
              <div className="flex items-center gap-3 mb-3">
                <p className="font-mono text-[10px] text-[#5E5954] tracking-widest">{category.toUpperCase()}</p>
                <div className="h-px flex-1 bg-[#E5E7EB]" />
                <span className="font-mono text-[9px] text-[#5E5954]">{categoryRules.length}</span>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden divide-y divide-[#FAFAFA]">
                {categoryRules.map(rule => {
                  const sc = SEVERITY_COLORS[rule.severity]
                  return (
                    <div key={rule.id} className="px-4 py-3.5 flex items-start gap-3 hover:bg-[#FFFFFF] transition-colors group">
                      {/* Active dot */}
                      <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', sc.dot)} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <p className="text-sm font-medium text-[#0A0A0F] leading-snug flex-1">{rule.title}</p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold capitalize', sc.badge)}>
                              {rule.severity}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#FAFAFA] text-[#5E5954]">
                              {rule.method === 'auto' ? 'Auto-detected' : 'Manual review'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#E8F5E9] text-[#2E7D32]">
                              Active
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-[#5E5954] leading-relaxed mt-0.5">{rule.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
