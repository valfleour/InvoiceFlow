import { useState } from 'react'
import type { FormEvent } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

const SESSION_STORAGE_KEY = 'invoiceflow.authenticated-user'

function MarketingContent({
  onLogout,
}: {
  onLogout: () => void
}) {
  const [count, setCount] = useState(0)

  return (
    <>
      <header className="workspace-header">
        <div>
          <p className="eyebrow">InvoiceFlow Workspace</p>
          <h1>Welcome back</h1>
          <p className="workspace-copy">
            Your existing dashboard content is still here, now behind a simple
            login entry point.
          </p>
        </div>
        <button className="secondary-action" type="button" onClick={onLogout}>
          Log out
        </button>
      </header>

      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h2 className="workspace-title">Get started</h2>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          className="counter"
          onClick={() => setCount((currentCount) => currentCount + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank" rel="noreferrer">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank" rel="noreferrer">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a
                href="https://github.com/vitejs/vite"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank" rel="noreferrer">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank" rel="noreferrer">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a
                href="https://bsky.app/profile/vite.dev"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => window.sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true',
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError('Enter both your email and password to continue.')
      return
    }

    window.sessionStorage.setItem(SESSION_STORAGE_KEY, 'true')
    setError('')
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
    setPassword('')
    setIsAuthenticated(false)
  }

  if (isAuthenticated) {
    return <MarketingContent onLogout={handleLogout} />
  }

  return (
    <main className="login-shell">
      <section className="login-panel login-panel--brand" aria-label="Brand">
        <p className="eyebrow">InvoiceFlow</p>
        <h1>Log in to manage invoices with confidence.</h1>
        <p className="login-copy">
          We added a dedicated entry page while leaving the existing app
          experience available after sign-in.
        </p>

        <div className="brand-preview">
          <img src={heroImg} className="brand-preview__image" alt="" />
          <div className="brand-preview__card">
            <span>Fast handoff</span>
            <strong>Access the current workspace without changing its flow.</strong>
          </div>
        </div>
      </section>

      <section className="login-panel login-panel--form">
        <div className="form-intro">
          <p className="eyebrow">Secure Access</p>
          <h2>Welcome back</h2>
          <p>
            Use any non-empty email and password for this client-side login
            screen.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email address</span>
            <input
              autoComplete="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
            />
          </label>

          {error ? (
            <p className="form-message" role="alert">
              {error}
            </p>
          ) : (
            <p className="form-hint">
              This is a front-end-only login gate, so no server configuration is
              required.
            </p>
          )}

          <button className="primary-action" type="submit">
            Log in
          </button>
        </form>
      </section>
    </main>
  )
}

export default App
