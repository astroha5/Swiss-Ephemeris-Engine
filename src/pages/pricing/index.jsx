import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/ui/Header';
import ErrorBoundaryNavigation from '../../components/ui/ErrorBoundaryNavigation';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import { subscribePremium, isPremium, syncSubscriptionFromBackend } from '../../services/subscriptionService';
import LoginModal from '../../components/auth/LoginModal';
import SignupModal from '../../components/auth/SignupModal';
import { useAuth } from '../../contexts/AuthContext';

const PricingPage = () => {
  const { isAuthenticated, userPreferences } = useAuth();
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [signupOpen, setSignupOpen] = React.useState(false);
  const [pendingUpgrade, setPendingUpgrade] = React.useState(false);

  React.useEffect(() => {
    // Sync status on load if signed in
    syncSubscriptionFromBackend();
  }, []);

  React.useEffect(() => {
    if (isAuthenticated && pendingUpgrade) {
      void doSubscribe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, pendingUpgrade]);

  const doSubscribe = async () => {
    try {
      // Prevent double purchase if already premium
      const backendPlan = await syncSubscriptionFromBackend();
      if (backendPlan === 'premium' || isPremium()) {
        alert('You already have Premium access.');
        setPendingUpgrade(false);
        return;
      }
      await subscribePremium();
      alert('You are now Premium! Enjoy faster and more accurate AI.');
    } catch (e) {
      if (e?.code === 'AUTH_REQUIRED') {
        setPendingUpgrade(true);
        setLoginOpen(true);
        return;
      }
      if (e?.code === 'ALREADY_PREMIUM') {
        alert('You already have Premium access.');
        setPendingUpgrade(false);
        return;
      }
      alert('Subscription failed. Please try again.');
    } finally {
      setPendingUpgrade(false);
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      setPendingUpgrade(true);
      setLoginOpen(true);
      return;
    }
    await doSubscribe();
  };

  return (
    <ErrorBoundaryNavigation>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-heading font-bold text-text-primary">Choose Your Plan</h1>
            <p className="text-text-secondary mt-2">Upgrade to Premium for faster, more accurate AI insights.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border rounded-xl bg-surface p-6 shadow-soft">
              <div className="flex items-center mb-4">
                <Icon name="Feather" size={20} className="text-text-secondary mr-2" />
                <h2 className="text-2xl font-semibold">Free</h2>
              </div>
              <p className="text-text-secondary mb-4">Access all features using free AI models.</p>
              <div className="text-3xl font-bold mb-6">₹0<span className="text-base text-text-secondary font-normal">/month</span></div>
              <ul className="space-y-2 text-sm text-text-secondary mb-6">
                <li>• Full chart generation</li>
                <li>• AI interpretations with free models</li>
                <li>• Standard speed</li>
              </ul>
              <Button variant="outline">Current Plan</Button>
            </div>

            <div className="border border-primary/30 rounded-xl bg-primary/5 p-6 shadow-soft">
              <div className="flex items-center mb-4">
                <Icon name="Zap" size={20} className="text-primary mr-2" />
                <h2 className="text-2xl font-semibold text-primary">Premium</h2>
              </div>
              <p className="text-text-secondary mb-4">Faster and more accurate AI with priority processing.</p>
              <div className="text-3xl font-bold mb-6">₹99<span className="text-base text-text-secondary font-normal">/month</span></div>
              <ul className="space-y-2 text-sm text-text-secondary mb-6">
                <li>• Priority queue and faster responses</li>
                <li>• Enhanced accuracy models</li>
                <li>• Early access to new AI features</li>
              </ul>
              {isPremium() ? (
                <Button disabled>Already Premium</Button>
              ) : (
                <Button onClick={handleSubscribe} iconName="Crown" iconPosition="left">Upgrade to Premium</Button>
              )}
              <p className="mt-3 text-xs text-text-muted">₹99/month. Auto‑renews monthly until cancelled. You can cancel anytime; access continues until the end of the current billing cycle. See our <Link to="/terms-of-service" className="text-primary hover:underline">Terms</Link> and <Link to="/refund-policy" className="text-primary hover:underline">Refund & Cancellation Policy</Link>.</p>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-text-secondary">
            Questions about billing? <Link to="/contact" className="text-primary hover:underline">Contact us</Link>.
          </div>
        </main>
        {/* Auth Modals for gated upgrade */}
        <LoginModal
          isOpen={loginOpen}
          onClose={() => setLoginOpen(false)}
          onSwitchToSignup={() => { setLoginOpen(false); setSignupOpen(true); }}
        />
        <SignupModal
          isOpen={signupOpen}
          onClose={() => setSignupOpen(false)}
          onSwitchToLogin={() => { setSignupOpen(false); setLoginOpen(true); }}
        />
      </div>
    </ErrorBoundaryNavigation>
  );
};

export default PricingPage;


