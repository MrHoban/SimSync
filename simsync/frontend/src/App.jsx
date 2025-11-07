import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'

// Import our page components
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PremiumUpgrade from './pages/PremiumUpgrade'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Landing Page - Public */}
          <Route 
            path="/" 
            element={user ? <Navigate to="/dashboard" /> : <LandingPage />} 
          />
          
          {/* Login Page */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" /> : <Login />} 
          />
          
          {/* Dashboard - Protected */}
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard /> : <Navigate to="/login" />} 
          />
          
          {/* Premium Upgrade - Protected */}
          <Route 
            path="/premium" 
            element={user ? <PremiumUpgrade /> : <Navigate to="/login" />} 
          />
          
          {/* Catch all other routes and redirect appropriately */}
          <Route 
            path="*" 
            element={<Navigate to={user ? "/dashboard" : "/"} />} 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
