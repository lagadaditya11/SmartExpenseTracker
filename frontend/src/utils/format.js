export const APP_LOCALE = import.meta.env.VITE_APP_LOCALE || 'en-US'
export const APP_CURRENCY = import.meta.env.VITE_APP_CURRENCY || 'USD'

const currencyFormatter = new Intl.NumberFormat(APP_LOCALE, {
  style: 'currency',
  currency: APP_CURRENCY,
})

export function formatCurrency(amount) {
  return currencyFormatter.format(Number(amount) || 0)
}

export function formatDate(date, options) {
  return new Date(date).toLocaleDateString(APP_LOCALE, options)
}
