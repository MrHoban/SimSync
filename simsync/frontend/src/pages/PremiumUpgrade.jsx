import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { apiService } from '../services/apiService';

const PremiumUpgrade = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set page title
    document.title = 'Premium Upgrade - SimSync';
    
    // Get current user
    const currentUser = auth.currentUser;
    setUser(currentUser);
  }, []);

  const handleUpgrade = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const currentUrl = window.location.origin;
      const response = await apiService.createCheckoutSession(
        user.uid,
        `${currentUrl}/dashboard?payment=success`,
        `${currentUrl}/premium?payment=cancelled`
      );

      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Stripe payments are currently being set up. Please check back soon or contact support for manual upgrade.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-upgrade-container">
      {/* Back to Dashboard */}
      <div className="premium-nav">
        <Link to="/dashboard" className="btn-back">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="premium-content">
        <div className="upgrade-card">
          <div className="upgrade-header">
            <h1>🚀 Upgrade to Premium</h1>
            <p>Unlock unlimited features and support SimSync development</p>
          </div>

          <div className="upgrade-features">
            <h3>Premium Benefits:</h3>
            <ul>
              <li>✅ 500MB storage (10x more than free)</li>
              <li>✅ Unlimited file uploads</li>
              <li>✅ Priority customer support</li>
              <li>✅ Early access to new features</li>
              <li>✅ Support independent development</li>
              <li>✅ No ads or limitations</li>
              <li>✅ Community file sharing</li>
            </ul>
          </div>

          <div className="upgrade-pricing">
            <div className="price">
              <span className="amount">$9.99</span>
              <span className="period">/month</span>
            </div>
            <p className="price-note">Cancel anytime • No long-term commitments</p>
          </div>

          <button
            className="btn-upgrade"
            onClick={handleUpgrade}
            disabled={loading || !user}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Processing...
              </>
            ) : (
              '🎯 Upgrade Now'
            )}
          </button>

          <div className="upgrade-security">
            <p>
              🔒 <strong>Secure payments powered by Stripe</strong><br />
              Your payment information is encrypted and secure
            </p>
          </div>

          <div className="upgrade-guarantee">
            <p>
              <strong>30-day money-back guarantee</strong><br />
              Not satisfied? Get a full refund, no questions asked.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpgrade;