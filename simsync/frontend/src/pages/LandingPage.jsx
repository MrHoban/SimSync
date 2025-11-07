import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

const LandingPage = () => {
  useEffect(() => {
    document.title = 'SimSync - Sims 4 Custom Content Backup Tool'
  }, [])

  return (
    <div className="landing-container">
      {/* Navigation Header */}
      <nav className="landing-nav">
        <div className="nav-content">
          <div className="nav-brand">
            <Link to="/" className="brand-link">
              🧩 <span className="brand-text">SimSync</span>
            </Link>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="nav-link login-link">
              Sign In
            </Link>
            <Link to="/login" className="btn-nav-primary">
              Create Account
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-header">
            <h1 className="hero-title">
              🧩 SimSync
            </h1>
            <p className="hero-subtitle">
              The Ultimate Sims 4 Custom Content Backup Tool
            </p>
            <p className="hero-description">
              Never lose your custom content again! SimSync safely backs up your Sims 4 mods, 
              CC, and saves to the cloud, making it easy to sync between devices or restore after reinstalls.
            </p>
          </div>

          <div className="hero-actions">
            <Link to="/login" className="btn-hero-primary">
              🚀 Get Started Free
            </Link>
            <button 
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="btn-hero-secondary"
            >
              📖 Learn More
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">1000+</span>
              <span className="stat-label">Files Backed Up</span>
            </div>
            <div className="stat">
              <span className="stat-number">50+</span>
              <span className="stat-label">Happy Simmers</span>
            </div>
            <div className="stat">
              <span className="stat-number">99.9%</span>
              <span className="stat-label">Uptime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-content">
          <h2 className="section-title">✨ Why Choose SimSync?</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">☁️</div>
              <h3>Cloud Backup</h3>
              <p>Your custom content is safely stored in the cloud with military-grade encryption</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>Multi-Device Sync</h3>
              <p>Access your CC on any device - perfect for creators who use multiple computers</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>Upload and download your files quickly with our optimized cloud infrastructure</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Private</h3>
              <p>Your files are private and secure with Firebase authentication and storage</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mobile Friendly</h3>
              <p>Manage your backups from any device with our responsive web interface</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Easy to Use</h3>
              <p>Simple drag-and-drop interface makes backing up your CC effortless</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-content">
          <h2 className="section-title">💎 Choose Your Plan</h2>
          <p className="section-subtitle">Start free, upgrade when you need more power</p>
          
          <div className="pricing-grid">
            {/* Basic Plan */}
            <div className="pricing-card basic">
              <div className="plan-header">
                <h3>🌟 Basic</h3>
                <div className="price">
                  <span className="amount">Free</span>
                  <span className="period">Forever</span>
                </div>
              </div>
              
              <ul className="features-list">
                <li>✅ 50MB storage</li>
                <li>✅ Up to 25 files</li>
                <li>✅ Basic file types (.package, .trayitem)</li>
                <li>✅ Email support</li>
                <li>✅ Secure cloud storage</li>
                <li>❌ No file sharing</li>
                <li>❌ Limited downloads</li>
              </ul>
              
              <Link to="/login" className="btn-plan basic">
                Start Free
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="pricing-card premium featured">
              <div className="featured-badge">Most Popular</div>
              <div className="plan-header">
                <h3>🚀 Premium</h3>
                <div className="price">
                  <span className="amount">$9.99</span>
                  <span className="period">/month</span>
                </div>
              </div>
              
              <ul className="features-list">
                <li>✅ 500MB storage (10x more!)</li>
                <li>✅ Unlimited files</li>
                <li>✅ All file types supported</li>
                <li>✅ Priority support</li>
                <li>✅ File sharing with community</li>
                <li>✅ Unlimited downloads</li>
                <li>✅ Early access to features</li>
                <li>✅ Support indie development</li>
              </ul>
              
              <Link to="/login" className="btn-plan premium">
                Upgrade to Premium
              </Link>
              
              <p className="guarantee">30-day money-back guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section">
        <div className="section-content">
          <h2 className="section-title">🔄 How SimSync Works</h2>
          
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Sign Up</h3>
              <p>Create your free account in seconds with just your email</p>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <h3>Upload Files</h3>
              <p>Drag and drop your Sims 4 mods, CC, and saves to backup</p>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <h3>Access Anywhere</h3>
              <p>Download your files on any device, anytime you need them</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Protect Your Sims 4 Content?</h2>
          <p>Join thousands of Simmers who trust SimSync to keep their custom content safe</p>
          
          <div className="cta-actions">
            <Link to="/login" className="btn-cta-primary">
              🎯 Start Backing Up Now
            </Link>
          </div>
          
          <p className="cta-note">
            Free to start • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>🧩 SimSync</h4>
            <p>The trusted backup solution for Sims 4 custom content</p>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <p>📧 <a href="mailto:joshuawhoban@gmail.com">joshuawhoban@gmail.com</a></p>
          </div>
          
          <div className="footer-section">
            <h4>Community</h4>
            <p>Built with ❤️ for The Sims 4 community</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 SimSync. Made with passion for Simmers everywhere. Made by Joshua Hoban</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage