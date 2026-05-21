import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsApi, expensesApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import {
  DollarSign,
  Receipt,
  TrendingUp,
  ArrowRight,
  Plus,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

function StatCard({ icon: Icon, title, value, subtitle, color }) {
  const colorMap = {
    blue: { bg: 'var(--color-primary-50)', icon: 'var(--color-primary-600)' },
    green: { bg: 'var(--color-success-50)', icon: 'var(--color-success-600)' },
    purple: { bg: '#f3e8ff', icon: '#9333ea' },
  }

  const colors = colorMap[color] || colorMap.blue

  return (
    <div className="card" style={{ padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--color-gray-500)',
              marginBottom: 'var(--space-2)',
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              color: 'var(--color-gray-900)',
            }}
          >
            {value}
          </p>
          {subtitle && (
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-gray-500)',
                marginTop: 'var(--space-1)',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-xl)',
            background: colors.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.icon,
          }}
        >
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}

function RecentExpenses({ expenses, onViewAll }) {
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="card">
      <div
        style={{
          padding: 'var(--space-5) var(--space-6)',
          borderBottom: '1px solid var(--color-gray-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Expenses</h3>
        <button
          onClick={onViewAll}
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--color-primary-600)' }}
        >
          View All
          <ArrowRight size={16} />
        </button>
      </div>
      <div style={{ padding: 'var(--space-2)' }}>
        {expenses.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
            <Receipt className="empty-state-icon" size={48} />
            <p className="empty-state-title">No expenses yet</p>
            <p className="empty-state-description">Add your first expense to get started</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {expenses.map((expense) => (
              <div
                key={expense.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-4) var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-gray-50)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-lg)',
                      background: expense.category?.color_hex || 'var(--color-gray-200)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                  >
                    {expense.category?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, color: 'var(--color-gray-900)' }}>
                      {expense.description}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                      {expense.category?.name || 'Uncategorized'} • {formatDate(expense.date)}
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    fontWeight: 600,
                    color: 'var(--color-gray-900)',
                  }}
                >
                  {formatAmount(expense.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const { error } = useToast()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [monthlyData, setMonthlyData] = useState([])
  const [recentExpenses, setRecentExpenses] = useState([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [summaryRes, monthlyRes, expensesRes] = await Promise.all([
          analyticsApi.dashboardSummary(),
          analyticsApi.monthlySummary(),
          expensesApi.list({ limit: 5 }),
        ])

        setSummary(summaryRes)
        setMonthlyData(monthlyRes.map(item => ({
          month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
          total: Number(item.total),
        })))
        setRecentExpenses(expensesRes.items)
      } catch (err) {
        error('Failed to load dashboard data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [error])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  const categoryColors = summary?.category_breakdown?.map((cat, index) => {
    const defaultColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
    return cat.color_hex || defaultColors[index % defaultColors.length]
  }) || []

  const pieData = summary?.category_breakdown?.map((cat, index) => ({
    name: cat.category_name,
    value: Number(cat.total),
    color: categoryColors[index],
  })) || []

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--color-gray-500)' }}>
            Welcome back! Here's your financial overview.
          </p>
        </div>
        <button
          onClick={() => navigate('/expenses', { state: { openAddModal: true } })}
          className="btn btn-primary"
        >
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        <StatCard
          icon={DollarSign}
          title="Current Month"
          value={formatCurrency(summary?.current_month_total)}
          subtitle="Total expenses this month"
          color="blue"
        />
        <StatCard
          icon={Receipt}
          title="Transactions"
          value={summary?.transaction_count || 0}
          subtitle="Number of transactions"
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          title="Categories"
          value={summary?.category_breakdown?.length || 0}
          subtitle="Active spending categories"
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        {/* Monthly Trend Chart */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-6)' }}>
            Monthly Spending Trend
          </h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'var(--color-gray-500)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-gray-200)' }}
                />
                <YAxis
                  tick={{ fill: 'var(--color-gray-500)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-gray-200)' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  formatter={(value) => [`$${value}`, 'Total']}
                  contentStyle={{
                    background: 'white',
                    border: '1px solid var(--color-gray-200)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="var(--color-primary-500)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-6)' }}>
            Spending by Category
          </h3>
          {pieData.length > 0 ? (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`$${value}`, 'Amount']}
                    contentStyle={{
                      background: 'white',
                      border: '1px solid var(--color-gray-200)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state" style={{ height: 300 }}>
              <p className="empty-state-description">No data available</p>
            </div>
          )}
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            {pieData.slice(0, 5).map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 'var(--radius-sm)',
                    background: item.color,
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)' }}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Expenses */}
      <RecentExpenses expenses={recentExpenses} onViewAll={() => navigate('/expenses')} />
    </div>
  )
}

export default Dashboard
