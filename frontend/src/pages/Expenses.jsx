import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { expensesApi, categoriesApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { APP_LOCALE, formatCurrency } from '../utils/format'
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  Tag,
  CreditCard,
  Receipt,
} from 'lucide-react'

function ExpenseModal({ isOpen, onClose, expense, categories, onSave }) {
  const { error } = useToast()
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category_id: '',
    payment_method: 'cash',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description || '',
        amount: expense.amount || '',
        date: expense.date || new Date().toISOString().split('T')[0],
        category_id: expense.category_id || '',
        payment_method: expense.payment_method || 'cash',
      })
    } else {
      setFormData({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category_id: '',
        payment_method: 'cash',
      })
    }
  }, [expense, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
      }

      if (expense) {
        await expensesApi.update(expense.id, data)
      } else {
        await expensesApi.create(data)
      }

      onSave()
      onClose()
    } catch (err) {
      error(err.message || 'Failed to save expense')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3>{expense ? 'Edit Expense' : 'Add New Expense'}</h3>
            <button onClick={onClose} className="btn btn-ghost">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label className="label">Description</label>
              <input
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What did you spend on?"
                required
                className="input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div>
                <label className="label">Amount</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 'var(--space-3)',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-gray-400)',
                    }}
                  />
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    className="input"
                    style={{ paddingLeft: 'var(--space-10)' }}
                  />
                </div>
              </div>

              <div>
                <label className="label">Date</label>
                <div style={{ position: 'relative' }}>
                  <Calendar
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 'var(--space-3)',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-gray-400)',
                    }}
                  />
                  <input
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="input"
                    style={{ paddingLeft: 'var(--space-10)' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div>
                <label className="label">Category</label>
                <div style={{ position: 'relative' }}>
                  <Tag
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 'var(--space-3)',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-gray-400)',
                      zIndex: 1,
                    }}
                  />
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="input select"
                    style={{ paddingLeft: 'var(--space-10)' }}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Payment Method</label>
                <div style={{ position: 'relative' }}>
                  <CreditCard
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 'var(--space-3)',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-gray-400)',
                      zIndex: 1,
                    }}
                  />
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                    className="input select"
                    style={{ paddingLeft: 'var(--space-10)' }}
                  >
                    <option value="cash">Cash</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? (
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              ) : (
                expense ? 'Update' : 'Add Expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, expense }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-error-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-4)',
              color: 'var(--color-error-600)',
            }}
          >
            <Trash2 size={28} />
          </div>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Delete Expense</h3>
          <p style={{ color: 'var(--color-gray-500)' }}>
            Are you sure you want to delete "{expense?.description}"? This action cannot be undone.
          </p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button onClick={onClose} className="btn btn-secondary" disabled={isDeleting}>
            Cancel
          </button>
          <button onClick={handleConfirm} className="btn btn-danger" disabled={isDeleting}>
            {isDeleting ? (
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function Expenses() {
  const { success, error } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    start_date: '',
    end_date: '',
  })
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
  })
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [deletingExpense, setDeletingExpense] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        limit: pagination.limit,
        offset: pagination.offset,
      }

      if (filters.category_id) params.category_id = filters.category_id
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date

      const response = await expensesApi.list(params)

      let filteredItems = response.items
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredItems = filteredItems.filter(
          (item) =>
            item.description.toLowerCase().includes(searchLower) ||
            item.category?.name.toLowerCase().includes(searchLower)
        )
      }

      setExpenses(filteredItems)
      setPagination((prev) => ({
        ...prev,
        total: response.total,
      }))
    } catch (err) {
      error('Failed to load expenses')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.limit, pagination.offset, error])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoriesApi.list()
      setCategories(response)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    if (location.state?.openAddModal) {
      setIsAddModalOpen(true)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  const handleSave = () => {
    fetchExpenses()
    success(editingExpense ? 'Expense updated successfully' : 'Expense added successfully')
    setEditingExpense(null)
  }

  const handleDelete = async () => {
    try {
      await expensesApi.delete(deletingExpense.id)
      fetchExpenses()
      success('Expense deleted successfully')
      setDeletingExpense(null)
    } catch (err) {
      error('Failed to delete expense')
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(APP_LOCALE, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatAmount = formatCurrency

  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
            Expenses
          </h1>
          <p style={{ color: 'var(--color-gray-500)' }}>Manage and track your spending</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: 'var(--space-3)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-gray-400)',
              }}
            />
            <input
              placeholder="Search expenses..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="input"
              style={{ paddingLeft: 'var(--space-10)' }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
            style={showFilters ? { background: 'var(--color-gray-100)' } : {}}
          >
            <Filter size={18} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-4)',
              marginTop: 'var(--space-4)',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--color-gray-200)',
            }}
          >
            <div>
              <label className="label">Category</label>
              <select
                value={filters.category_id}
                onChange={(e) => setFilters((prev) => ({ ...prev, category_id: e.target.value }))}
                className="input select"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">From Date</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters((prev) => ({ ...prev, start_date: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">To Date</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters((prev) => ({ ...prev, end_date: e.target.value }))}
                className="input"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => {
                  setFilters({ search: '', category_id: '', start_date: '', end_date: '' })
                  setPagination((prev) => ({ ...prev, offset: 0 }))
                }}
                className="btn btn-ghost"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
            <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} />
          </div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--radius-2xl)',
                background: 'var(--color-gray-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-4)',
                color: 'var(--color-gray-400)',
              }}
            >
              <Receipt size={32} />
            </div>
            <p className="empty-state-title">No expenses found</p>
            <p className="empty-state-description">
              {filters.search || filters.category_id || filters.start_date
                ? 'Try adjusting your filters'
                : 'Add your first expense to get started'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Payment</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--color-gray-900)' }}>
                          {expense.description}
                        </span>
                      </td>
                      <td>
                        {expense.category ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 'var(--space-1)',
                              padding: 'var(--space-1) var(--space-2)',
                              borderRadius: 'var(--radius-md)',
                              background: expense.category.color_hex + '20',
                              color: expense.category.color_hex,
                              fontSize: '0.75rem',
                              fontWeight: 500,
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: expense.category.color_hex,
                              }}
                            />
                            {expense.category.name}
                          </span>
                        ) : (
                          <span className="badge badge-neutral">Uncategorized</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--color-gray-500)' }}>{formatDate(expense.date)}</td>
                      <td style={{ textTransform: 'capitalize', color: 'var(--color-gray-500)' }}>
                        {expense.payment_method.replace('_', ' ')}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatAmount(expense.amount)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setEditingExpense(expense)}
                            className="btn btn-ghost btn-sm"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeletingExpense(expense)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--color-error-600)' }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-4) var(--space-6)',
                  borderTop: '1px solid var(--color-gray-200)',
                }}
              >
                <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
                  Showing {pagination.offset + 1} to{' '}
                  {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        offset: Math.max(0, prev.offset - prev.limit),
                      }))
                    }
                    disabled={currentPage === 1}
                    className="btn btn-secondary btn-sm"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 var(--space-3)',
                      fontSize: '0.875rem',
                      color: 'var(--color-gray-600)',
                    }}
                  >
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        offset: prev.offset + prev.limit,
                      }))
                    }
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary btn-sm"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <ExpenseModal
        isOpen={isAddModalOpen || !!editingExpense}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingExpense(null)
        }}
        expense={editingExpense}
        categories={categories}
        onSave={handleSave}
      />

      <DeleteConfirmModal
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleDelete}
        expense={deletingExpense}
      />
    </div>
  )
}

export default Expenses
