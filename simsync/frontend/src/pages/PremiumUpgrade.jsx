import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { createCheckoutSession } from '../services/apiService';

const PremiumUpgrade = () => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const currentUrl = window.location.origin;
      const response = await createCheckoutSession(
        user.uid,
        `${currentUrl}?payment=success`,
        `${currentUrl}?payment=cancelled`
      );

      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Failed to start payment process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-upgrade">
      <div className="upgrade-card">
        <div className="upgrade-header">
          <h2>🚀 Upgrade to Premium</h2>
          <p>Unlock unlimited features and support SimSync development</p>
        </div>

        <div className="upgrade-features">
          <h3>Premium Benefits:</h3>
          <ul>
            <li>✅ 500MB storage (10x more than free)</li>
            <li>✅ Share unlimited files with the community</li>
            <li>✅ Priority customer support</li>
            <li>✅ Early access to new features</li>
            <li>✅ Support independent development</li>
            <li>✅ No ads or limitations</li>
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
          className="upgrade-button"
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

      <style jsx>{`
        .premium-upgrade {
          padding: 2rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .upgrade-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 2rem;
          color: white;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .upgrade-header h2 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(45deg, #ffd700, #ffed4e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .upgrade-header p {
          opacity: 0.9;
          font-size: 1.1rem;
          margin-bottom: 2rem;
        }

        .upgrade-features {
          text-align: left;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 1.5rem;
          margin: 2rem 0;
          backdrop-filter: blur(10px);
        }

        .upgrade-features h3 {
          text-align: center;
          margin-bottom: 1rem;
          font-size: 1.3rem;
        }

        .upgrade-features ul {
          list-style: none;
          padding: 0;
        }

        .upgrade-features li {
          padding: 0.5rem 0;
          font-size: 1rem;
          opacity: 0.95;
        }

        .upgrade-pricing {
          margin: 2rem 0;
        }

        .price {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .amount {
          background: linear-gradient(45deg, #ffd700, #ffed4e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .period {
          font-size: 1.5rem;
          opacity: 0.8;
        }

        .price-note {
          opacity: 0.8;
          font-size: 0.9rem;
        }

        .upgrade-button {
          background: linear-gradient(45deg, #ff6b6b, #ee5a24);
          border: none;
          border-radius: 50px;
          padding: 1rem 2rem;
          font-size: 1.2rem;
          font-weight: bold;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin: 2rem auto;
          min-width: 200px;
        }

        .upgrade-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(255, 107, 107, 0.3);
        }

        .upgrade-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .upgrade-security {
          margin-top: 2rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .upgrade-guarantee {
          margin-top: 1rem;
          font-size: 0.9rem;
          opacity: 0.8;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .premium-upgrade {
            padding: 1rem;
          }

          .upgrade-card {
            padding: 1.5rem;
          }

          .upgrade-header h2 {
            font-size: 1.5rem;
          }

          .price {
            font-size: 2.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PremiumUpgrade;