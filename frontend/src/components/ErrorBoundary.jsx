import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="empty-state" role="alert" style={{ minHeight: '100vh', padding: 'var(--space-8)' }}>
          <h1>Something went wrong</h1>
          <p className="empty-state-description">Reload the page to continue.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload application
          </button>
        </main>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
