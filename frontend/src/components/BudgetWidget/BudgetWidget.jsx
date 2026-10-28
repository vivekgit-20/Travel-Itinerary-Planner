/**
 * BudgetWidget - budget overview with per-day breakdown.
 *
 * Props:
 *   totalBudget      number
 *   allocated        number
 *   perPerson        number
 *   currency         string
 *   dailyBreakdown   [{day_number, date, allocated}]
 *   travelers        number
 */

import { DollarSign, IndianRupee, Users } from 'lucide-react'

function formatCurrency(amount, currency = 'USD') {
  if (amount == null) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatShort(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function CurrencyHeaderIcon({ currency }) {
  if (currency === 'INR') return <IndianRupee className="w-5 h-5" />
  return <DollarSign className="w-5 h-5" />
}

export default function BudgetWidget({
  totalBudget = 0,
  allocated = 0,
  perPerson,
  currency = 'USD',
  dailyBreakdown = [],
  travelers,
}) {
  const remaining = totalBudget - allocated
  const overBudget = remaining < 0
  const progress = totalBudget > 0 ? Math.min((allocated / totalBudget) * 100, 100) : 0

  // Find max daily allocation for normalising bar chart
  const maxDaily =
    dailyBreakdown.length > 0
      ? Math.max(...dailyBreakdown.map((d) => d.allocated ?? 0), 1)
      : 1

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 text-navy-700">
        <span className="p-2 rounded-xl bg-teal-50 text-teal-600">
          <CurrencyHeaderIcon currency={currency} />
        </span>
        <h2 className="text-base font-semibold">Budget Overview</h2>
      </div>

      {/* ── Total vs Allocated ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-2xs text-navy-400 uppercase tracking-wide mb-0.5">Total budget</p>
          <p className="text-xl font-bold text-navy-800">
            {formatCurrency(totalBudget, currency)}
          </p>
        </div>
        <div>
          <p className="text-2xs text-navy-400 uppercase tracking-wide mb-0.5">Allocated</p>
          <p className="text-xl font-bold text-navy-800">
            {formatCurrency(allocated, currency)}
          </p>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div>
        <div
          className="w-full h-2.5 bg-surface-muted rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Budget allocated: ${Math.round(progress)}%`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              overBudget ? 'bg-error' : 'bg-teal-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-2xs text-navy-400 mt-1 text-right">
          {Math.round(progress)}% allocated
        </p>
      </div>

      {/* ── Per-person + Remaining ── */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-surface-border">
        {/* Per-person */}
        {(perPerson != null || travelers != null) && (
          <div>
            <div className="flex items-center gap-1 text-2xs text-navy-400 uppercase tracking-wide mb-0.5">
              <Users className="w-3 h-3" />
              Per person
            </div>
            <p className="text-sm font-semibold text-navy-700">
              {perPerson != null
                ? formatCurrency(perPerson, currency)
                : travelers && totalBudget
                ? formatCurrency(Math.round(totalBudget / travelers), currency)
                : '-'}
            </p>
          </div>
        )}

        {/* Remaining */}
        <div>
          <p className="text-2xs text-navy-400 uppercase tracking-wide mb-0.5">Remaining</p>
          <p
            className={`text-sm font-semibold ${
              overBudget ? 'text-error' : 'text-success'
            }`}
          >
            {overBudget ? '-' : ''}
            {formatCurrency(Math.abs(remaining), currency)}
            {overBudget && (
              <span className="ml-1 text-2xs font-normal">(over)</span>
            )}
          </p>
        </div>
      </div>

      {/* ── Daily breakdown bar chart ── */}
      {dailyBreakdown.length > 0 && (
        <div className="pt-1 border-t border-surface-border">
          <p className="text-2xs text-navy-400 uppercase tracking-wide mb-3">
            Day-by-day
          </p>

          <div
            className="flex items-end gap-1 overflow-x-auto pb-1 scrollbar-thin"
            aria-label="Daily budget breakdown"
          >
            {dailyBreakdown.map((d) => {
              const pct = maxDaily > 0 ? ((d.allocated ?? 0) / maxDaily) * 100 : 0
              const isOver =
                totalBudget > 0 &&
                dailyBreakdown.length > 0 &&
                (d.allocated ?? 0) > totalBudget / dailyBreakdown.length * 1.2

              return (
                <div
                  key={d.day_number}
                  className="flex flex-col items-center gap-1 shrink-0"
                  style={{ minWidth: '2rem' }}
                >
                  {/* Bar */}
                  <div
                    className="w-6 bg-surface-muted rounded-t-sm overflow-hidden"
                    style={{ height: '4rem' }}
                    aria-label={`Day ${d.day_number}: ${formatCurrency(d.allocated, currency)}`}
                  >
                    <div
                      className={`w-full rounded-t-sm transition-all duration-500 ease-out ${
                        isOver ? 'bg-warning' : 'bg-teal-400'
                      }`}
                      style={{
                        height: `${pct}%`,
                        marginTop: `${100 - pct}%`,
                      }}
                      title={formatCurrency(d.allocated, currency)}
                    />
                  </div>

                  {/* Day label */}
                  <span className="text-2xs text-navy-400 leading-none">
                    {d.date ? formatShort(d.date) : `D${d.day_number}`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
