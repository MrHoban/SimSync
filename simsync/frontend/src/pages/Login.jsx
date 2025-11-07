import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Set page title
  useEffect(() => {
    document.title = isLogin ? 'Login - SimSync' : 'Sign Up - SimSync'
  }, [isLogin])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
    } catch (error) {
      setError(error.message)
    }
    
    setLoading(false)
  }

  return (
    <div className="login-container">
      {/* Back to Landing Page */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
        <Link to="/" className="btn-back">
          ← Back to Home
        </Link>
      </div>

      <div className="login-card">
        {/* Header */}
        <div>
          <h2 className="login-title">
            🧩 SimSync
          </h2>
          <p className="login-subtitle">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
          <p className="login-subtitle">
            Backup your Sims 4 custom content safely
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </div>

          {/* Toggle Login/Register */}
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="btn-link"
            >
              {isLogin 
                ? "Don't have an account? Create one" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login