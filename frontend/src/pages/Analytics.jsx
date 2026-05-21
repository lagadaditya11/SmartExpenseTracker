import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BarChart3,
  DollarSign,
  PieChart as PieChartIcon,
  Receipt,
  Target,
  TrendingUp,
} from 'lucide-react'
import { analyticsApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'

const FALLBACK_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#14b8a6',
  '#64748b',
]

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount) || 0)
}

function StatCard({ icon: Icon, label, value, detail, tone = 'blue' }) {
  const tones = {
    blue: { bg: 'var(--color-primary-50)', fg: 'var(--color-primary-600)' },
    green: { bg: 'var(--color-success-50)', fg: 'var(--color-success-600)' },
    amber: { bg: 'var(--color-warning-50)', fg: 'var(--color-warning-600)' },
    slate: { bg: 'var(--color-gray-100)', fg: 'var(--color-gray-700)' },
  }
  const color = tones[tone] || tones.blue

  return (
    <div className="card" style={{ padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div>
          <p style={{ fontWeight: 500, color: 'var(--color-gray-500)', marginBottom: 'var(--space-2)' }}>
            {label}
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-gray-900)' }}>
            {value}
          </p>
          {detail && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 'var(--space-1)' }}>
              {detail}
            </p>
          )}
        </div>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 'var(--radius-xl)',
            background: color.bg,
            color: color.fg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '0 0 auto',
          }}
        >
          <Icon size={23} />
        </div>
      </div>
    </div>
  )
}

function EmptyChart({ message }) {
  return (
    <div
      className="empty-state"
      style={{
        height: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <p className="empty-state-description">{message}</p>
    </div>
  )
}

function BudgetUsage({ budgets }) {
  return (
    <div className="card" style={{ padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-warning-50)',
            color: 'var(--color-warning-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Target size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Budget Usage</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
            Current month tracked budget progress
          </p>
        </div>
      </div>

      {budgets.length === 0 ? (
        <EmptyChart message="No budgets are configured for this month." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {budgets.map((budget) => {
            const percent = Math.min(Number(budget.percent_used) || 0, 100)
            const isOver = Number(budget.percent_used) > 100
            return (
              <div key={`${budget.category_id}-${budget.month}`}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 'var(--space-4)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <span style={{ fontWeight: 500, color: 'var(--color-gray-900)' }}>
                    {budget.category_name}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
                    {formatCurrency(budget.spent_so_far)} / {formatCurrency(budget.monthly_limit)}
                  </span>
                </div>
                <div
                  style={{
                    height: 10,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-gray-100)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${percent}%`,
                      height: '100%',
                      borderRadius: 'var(--radius-full)',
                      background: isOver ? 'var(--color-error-500)' : 'var(--color-primary-500)',
                    }}
                  />
                </div>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: isOver ? 'var(--color-error-600)' : 'var(--color-gray-500)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  {(Number(budget.percent_used) || 0).toFixed(1)}% used
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Analytics() {
  const { error } = useToast()
  const [loading, setLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const [monthlyRes, categoryRes, summaryRes] = await Promise.all([
          analyticsApi.monthlySummary(),
          analyticsApi.categoryBreakdown(),
          analyticsApi.dashboardSummary(),
        ])

        setMonthlyData(
          monthlyRes.map((item) => ({
            month: item.month,
            label: new Date(`${item.month}-01`).toLocaleDateString('en-US', {
              month: 'short',
              year: '2-digit',
            }),
            total: Number(item.total),
          }))
        )
        setCategoryData(
          categoryRes.map((item, index) => ({
            ...item,
            total: Number(item.total),
            color: item.color_hex || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
          }))
        )
        setSummary(summaryRes)
      } catch (err) {
        error('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [error])

  const stats = useMemo(() => {
    const twelveMonthTotal = monthlyData.reduce((sum, item) => sum + item.total, 0)
    const monthsWithSpend = monthlyData.filter((item) => item.total > 0)
    const averageMonthly = monthsWithSpend.length ? twelveMonthTotal / monthsWithSpend.length : 0
    const topCategory = categoryData[0]

    return {
      twelveMonthTotal,
      averageMonthly,
      topCategory,
      currentMonthTotal: Number(summary?.current_month_total) || 0,
      transactionCount: summary?.transaction_count || 0,
    }
  }, [categoryData, monthlyData, summary])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
            Analytics
          </h1>
          <p style={{ color: 'var(--color-gray-500)' }}>
            Track monthly trends, category mix, and budget progress.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <StatCard
          icon={DollarSign}
          label="Current Month"
          value={formatCurrency(stats.currentMonthTotal)}
          detail={`${stats.transactionCount} transactions`}
          tone="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="12 Month Total"
          value={formatCurrency(stats.twelveMonthTotal)}
          detail="Rolling expense total"
          tone="green"
        />
        <StatCard
          icon={BarChart3}
          label="Monthly Average"
          value={formatCurrency(stats.averageMonthly)}
          detail="Across months with spending"
          tone="amber"
        />
        <StatCard
          icon={PieChartIcon}
          label="Top Category"
          value={stats.topCategory?.category_name || 'None'}
          detail={stats.topCategory ? formatCurrency(stats.topCategory.total) : 'No category spending yet'}
          tone="slate"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-6)' }}>
            Spending Trend
          </h3>
          {monthlyData.some((item) => item.total > 0) ? (
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'var(--color-gray-500)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--color-gray-200)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--color-gray-500)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--color-gray-200)' }}
                    tickLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Total']}
                    labelFormatter={(label) => `Month: ${label}`}
                    contentStyle={{
                      background: 'white',
                      border: '1px solid var(--color-gray-200)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="var(--color-primary-600)"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="Add expenses to see monthly spending trends." />
          )}
        </div>

        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-6)' }}>
            Category Distribution
          </h3>
          {categoryData.length > 0 ? (
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={66}
                    outerRadius={112}
                    paddingAngle={2}
                    dataKey="total"
                    nameKey="category_name"
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.category_id || entry.category_name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Spent']}
                    contentStyle={{
                      background: 'white',
                      border: '1px solid var(--color-gray-200)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="No category data for the current month." />
          )}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(min(100%, 340px), 0.8fr)',
          gap: 'var(--space-6)',
        }}
        className="analytics-detail-grid"
      >
        <div className="card" style={{ overflow: 'hidden' }}>
          <div
            style={{
              padding: 'var(--space-5) var(--space-6)',
              borderBottom: '1px solid var(--color-gray-200)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <Receipt size={20} color="var(--color-primary-600)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Category Breakdown</h3>
          </div>
          {categoryData.length === 0 ? (
            <EmptyChart message="No category spending in the current month." />
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ textAlign: 'right' }}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData.map((category) => {
                    const share = stats.currentMonthTotal
                      ? (category.total / stats.currentMonthTotal) * 100
                      : 0
                    return (
                      <tr key={category.category_id || category.category_name}>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 'var(--space-2)',
                              fontWeight: 500,
                              color: 'var(--color-gray-900)',
                            }}
                          >
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 'var(--radius-full)',
                                background: category.color,
                              }}
                            />
                            {category.category_name}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(category.total)}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--color-gray-500)' }}>
                          {share.toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-6)' }}>
            Monthly Bars
          </h3>
          {monthlyData.some((item) => item.total > 0) ? (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData.slice(-6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'var(--color-gray-500)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Total']}
                    contentStyle={{
                      background: 'white',
                      border: '1px solid var(--color-gray-200)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  />
                  <Bar dataKey="total" fill="var(--color-success-500)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="No monthly totals yet." />
          )}
        </div>
      </div>

      <BudgetUsage budgets={summary?.budget_usage || []} />

      <style>{`
        @media (max-width: 1024px) {
          .analytics-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Analytics
