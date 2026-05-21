import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Banknote,
  BookOpen,
  Briefcase,
  Car,
  Circle,
  Coffee,
  Dumbbell,
  Edit2,
  Gamepad2,
  Gift,
  HeartPulse,
  Home,
  Plane,
  Plus,
  Search,
  ShoppingBag,
  Tags,
  Ticket,
  Trash2,
  Utensils,
  Wallet,
  X,
} from 'lucide-react'
import { categoriesApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'

const ICON_OPTIONS = [
  { value: 'circle', label: 'General', icon: Circle },
  { value: 'utensils', label: 'Food', icon: Utensils },
  { value: 'car', label: 'Transport', icon: Car },
  { value: 'home', label: 'Housing', icon: Home },
  { value: 'shopping-bag', label: 'Shopping', icon: ShoppingBag },
  { value: 'heart-pulse', label: 'Health', icon: HeartPulse },
  { value: 'ticket', label: 'Entertainment', icon: Ticket },
  { value: 'wallet', label: 'Wallet', icon: Wallet },
  { value: 'coffee', label: 'Coffee', icon: Coffee },
  { value: 'plane', label: 'Travel', icon: Plane },
  { value: 'book-open', label: 'Education', icon: BookOpen },
  { value: 'dumbbell', label: 'Fitness', icon: Dumbbell },
  { value: 'gamepad-2', label: 'Games', icon: Gamepad2 },
  { value: 'gift', label: 'Gifts', icon: Gift },
  { value: 'briefcase', label: 'Work', icon: Briefcase },
  { value: 'banknote', label: 'Bills', icon: Banknote },
]

const COLOR_OPTIONS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#64748b',
]

const DEFAULT_FORM = {
  name: '',
  color_hex: '#3b82f6',
  icon: 'circle',
}

const iconMap = ICON_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.icon
  return acc
}, {})

function CategoryIcon({ icon, color, size = 20 }) {
  const Icon = iconMap[icon] || Circle
  return <Icon size={size} color={color} />
}

function CategoryModal({ isOpen, category, onClose, onSave }) {
  const { error } = useToast()
  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        color_hex: category.color_hex || DEFAULT_FORM.color_hex,
        icon: category.icon || DEFAULT_FORM.icon,
      })
      return
    }

    setFormData(DEFAULT_FORM)
  }, [category, isOpen])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      if (category) {
        await categoriesApi.update(category.id, formData)
      } else {
        await categoriesApi.create(formData)
      }
      await onSave()
      onClose()
    } catch (err) {
      error(err.message || 'Failed to save category')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3>{category ? 'Edit Category' : 'Add Category'}</h3>
            <button type="button" onClick={onClose} className="btn btn-ghost" aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div>
              <label className="label" htmlFor="category-name">
                Name
              </label>
              <input
                id="category-name"
                name="name"
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Category name"
                maxLength={80}
                required
                className="input"
              />
            </div>

            <div>
              <label className="label">Color</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, color_hex: color }))}
                    aria-label={`Use color ${color}`}
                    title={color}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 'var(--radius-lg)',
                      background: color,
                      border:
                        formData.color_hex === color
                          ? '3px solid var(--color-gray-900)'
                          : '2px solid white',
                      boxShadow: '0 0 0 1px var(--color-gray-200)',
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={formData.color_hex}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, color_hex: event.target.value }))
                  }
                  aria-label="Custom color"
                  style={{
                    width: 34,
                    height: 34,
                    padding: 0,
                    border: '1px solid var(--color-gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'white',
                  }}
                />
              </div>
            </div>

            <div>
              <label className="label">Icon</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(46px, 1fr))',
                  gap: 'var(--space-2)',
                }}
              >
                {ICON_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const isSelected = formData.icon === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, icon: option.value }))}
                      className="btn btn-secondary"
                      title={option.label}
                      aria-label={option.label}
                      style={{
                        minWidth: 46,
                        height: 42,
                        padding: 0,
                        background: isSelected ? 'var(--color-gray-100)' : 'white',
                        borderColor: isSelected ? 'var(--color-primary-500)' : 'var(--color-gray-300)',
                        color: isSelected ? 'var(--color-primary-600)' : 'var(--color-gray-600)',
                      }}
                    >
                      <Icon size={18} />
                    </button>
                  )
                })}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                border: '1px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--color-gray-50)',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-xl)',
                  background: `${formData.color_hex}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CategoryIcon icon={formData.icon} color={formData.color_hex} size={22} />
              </div>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                  {formData.name || 'Category preview'}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                  {formData.color_hex}
                </p>
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
              ) : category ? (
                'Update'
              ) : (
                'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteCategoryModal({ category, onClose, onConfirm }) {
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

  if (!category) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()} style={{ maxWidth: 420 }}>
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
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Delete Category</h3>
          <p style={{ color: 'var(--color-gray-500)' }}>
            Delete "{category.name}"? Existing expenses will remain, but they may no longer show this category.
          </p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isDeleting}>
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} className="btn btn-danger" disabled={isDeleting}>
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

function Categories() {
  const { success, error } = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deletingCategory, setDeletingCategory] = useState(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const response = await categoriesApi.list()
      setCategories(response)
    } catch (err) {
      error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [error])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return categories
    return categories.filter((category) => category.name.toLowerCase().includes(query))
  }, [categories, search])

  const handleSave = async () => {
    await fetchCategories()
    success(editingCategory ? 'Category updated successfully' : 'Category created successfully')
    setEditingCategory(null)
  }

  const handleDelete = async () => {
    try {
      await categoriesApi.delete(deletingCategory.id)
      await fetchCategories()
      success('Category deleted successfully')
      setDeletingCategory(null)
    } catch (err) {
      error(err.message || 'Failed to delete category')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
            Categories
          </h1>
          <p style={{ color: 'var(--color-gray-500)' }}>
            Organize expenses with reusable labels, colors, and icons.
          </p>
        </div>
        <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <div className="card" style={{ padding: 'var(--space-4)' }}>
        <div style={{ position: 'relative', maxWidth: 420 }}>
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
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories..."
            className="input"
            style={{ paddingLeft: 'var(--space-10)' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
          <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Tags className="empty-state-icon" size={56} />
            <p className="empty-state-title">No categories found</p>
            <p className="empty-state-description">
              {search ? 'Try a different search term.' : 'Create your first category to classify expenses.'}
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {filteredCategories.map((category) => (
            <div key={category.id} className="card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 'var(--radius-xl)',
                      background: `${category.color_hex}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: '0 0 auto',
                    }}
                  >
                    <CategoryIcon icon={category.icon} color={category.color_hex} size={22} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {category.name}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                      {category.color_hex}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-1)', flex: '0 0 auto' }}>
                  <button
                    type="button"
                    onClick={() => setEditingCategory(category)}
                    className="btn btn-ghost btn-sm"
                    title="Edit"
                    aria-label={`Edit ${category.name}`}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingCategory(category)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-error-600)' }}
                    title="Delete"
                    aria-label={`Delete ${category.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryModal
        isOpen={isModalOpen || !!editingCategory}
        category={editingCategory}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCategory(null)
        }}
        onSave={handleSave}
      />

      <DeleteCategoryModal
        category={deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default Categories
