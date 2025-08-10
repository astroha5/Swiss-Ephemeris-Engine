import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';
import UserAvatar from '../auth/UserAvatar';
import LoginModal from '../auth/LoginModal';
import SignupModal from '../auth/SignupModal';
import PremiumUpsellModal from './PremiumUpsellModal';
import { isPremium, subscribePremium, syncSubscriptionFromBackend } from '../../services/subscriptionService';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation as useRouterLocation } from 'react-router-dom';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const location = useLocation();
  const routerLocation = useRouterLocation();
  const { isAuthenticated } = useAuth();
  const [showUpsell, setShowUpsell] = useState(false);
  const [pendingUpgrade, setPendingUpgrade] = useState(false);

  const navigationItems = [
    {
      label: 'Home',
      path: '/home-landing-page',
      icon: 'Home',
      tooltip: 'Return to main dashboard'
    },
    {
      label: 'Generate Chart',
      path: '/birth-details-form',
      icon: 'Calculator',
      tooltip: isAuthenticated ? 'Create your personalized birth chart' : 'Sign in to create your birth chart',
      requiresAuth: true
    },
    {
      label: 'Planetary Positions',
      path: '/planetary-events?tab=positions',
      icon: 'Globe',
      tooltip: 'View planetary positions for any date and location'
    },
    {
      label: 'Planet Transits',
      path: '/planet-transits',
      icon: 'Globe',
      tooltip: 'View planetary transits and movements'
    },
    {
      label: 'Event Correlations',
      path: '/planetary-events',
      icon: 'TrendingUp',
      tooltip: 'Explore correlations between world events and planetary positions'
    },
    {
      label: 'Pricing',
      path: '/pricing',
      icon: 'CreditCard',
      tooltip: 'See Free vs Premium'
    },
    {
      label: 'Support',
      path: '/error-handling-page',
      icon: 'HelpCircle',
      tooltip: 'Get help and support'
    }
  ];

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    setIsSignupModalOpen(false);
  };

  const openSignupModal = () => {
    setIsSignupModalOpen(true);
    setIsLoginModalOpen(false);
  };

  const closeModals = () => {
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(false);
  };

  // After sign-in, if user is on Free plan, nudge to upgrade
  React.useEffect(() => {
    let cancelled = false;
    const checkPlan = async () => {
      if (!isAuthenticated) return;
      // Do not show on pricing page
      if (routerLocation.pathname === '/pricing') return;
      // Only show once per sign-in
      const shownKey = 'premiumUpsellShown';
      if (localStorage.getItem(shownKey) === 'true') return;
      const plan = await syncSubscriptionFromBackend();
      if (!cancelled && plan !== 'premium' && !isPremium()) {
        setShowUpsell(true);
        localStorage.setItem(shownKey, 'true');
      }
    };
    checkPlan();
    return () => { cancelled = true; };
  }, [isAuthenticated, routerLocation.pathname]);

  const doUpgrade = async () => {
    try {
      const plan = await syncSubscriptionFromBackend();
      if (plan === 'premium' || isPremium()) {
        alert('You already have Premium access.');
        setShowUpsell(false);
        return;
      }
      await subscribePremium();
      alert('Payment successful! You are now Premium. Enjoy faster and more accurate AI.');
      window.location.assign('/chart-results-dashboard');
      setShowUpsell(false);
    } catch (e) {
      if (e?.code === 'AUTH_REQUIRED') {
        setPendingUpgrade(true);
        setIsLoginModalOpen(true);
        return;
      }
      if (e?.code === 'ALREADY_PREMIUM') {
        alert('You already have Premium access.');
        setShowUpsell(false);
        return;
      }
      if (e?.message === 'PAYMENTS_NOT_CONFIGURED') {
        alert('Payments are not configured. Please try again later.');
      } else {
        alert('Payment failed. Please try again.');
      }
    } finally {
      setPendingUpgrade(false);
    }
  };

  const Logo = () => (
    <div className="flex items-center space-x-3">
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary"
        >
          <circle
            cx="20"
            cy="20"
            r="18"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="animate-pulse-soft"
          />
          <circle
            cx="20"
            cy="20"
            r="12"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            opacity="0.6"
          />
          <circle
            cx="20"
            cy="20"
            r="6"
            fill="currentColor"
            opacity="0.8"
          />
          <path
            d="M20 8 L24 16 L20 12 L16 16 Z"
            fill="currentColor"
            opacity="0.9"
          />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-heading font-semibold text-text-primary">
          Astrova
        </span>
        <span className="text-xs font-caption text-text-secondary -mt-1">
          Vedic Wisdom
        </span>
      </div>
    </div>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-1000 bg-surface/95 backdrop-blur-sm border-b border-border shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/home-landing-page" className="flex-shrink-0 hover-scale">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <div key={item.path} className="relative group">
                <Link
                  to={item.path}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-celestial relative
                    ${isActivePath(item.path)
                      ? 'bg-primary/10 text-primary border border-primary/20' :'text-text-secondary hover:text-primary hover:bg-primary/5'
                    }
                  `}
                >
                  <Icon name={item.icon} size={16} />
                  <span>{item.label}</span>
                  

                </Link>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-1100">
                  {item.tooltip}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-secondary"></div>
                </div>
              </div>
            ))}
          </nav>

          {/* User Avatar / Auth Buttons */}
          <div className="hidden md:block">
            <UserAvatar 
              onOpenLogin={openLoginModal}
              onOpenSignup={openSignupModal}
            />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={toggleMobileMenu}
              className="p-2"
              aria-label="Toggle mobile menu"
            >
              <Icon 
                name={isMobileMenuOpen ? 'X' : 'Menu'} 
                size={24} 
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-surface border-t border-border shadow-medium animate-slide-up">
          <div className="px-4 py-2 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-md text-base font-medium transition-celestial relative
                  ${isActivePath(item.path)
                    ? 'bg-primary/10 text-primary border border-primary/20' :'text-text-secondary hover:text-primary hover:bg-primary/5'
                  }
                `}
              >
                <Icon name={item.icon} size={20} />
                <div className="flex flex-col flex-1">
                  <div className="flex items-center space-x-2">
                    <span>{item.label}</span>
                  </div>
                  <span className="text-xs text-text-muted font-caption">
                    {item.tooltip}
                  </span>
                </div>
              </Link>
            ))}
            
            {/* Mobile Auth Section */}
            <div className="mt-4 pt-4 border-t border-border">
              <UserAvatar 
                onOpenLogin={openLoginModal}
                onOpenSignup={openSignupModal}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Auth Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          if (pendingUpgrade && isAuthenticated) {
            void doUpgrade();
          }
        }}
        onSwitchToSignup={openSignupModal}
      />
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={closeModals}
        onSwitchToLogin={openLoginModal}
      />

      {/* Post-sign-in upsell for Free users */}
      <PremiumUpsellModal
        isOpen={showUpsell}
        onClose={() => setShowUpsell(false)}
        onUpgrade={() => {
          if (!isAuthenticated) {
            setPendingUpgrade(true);
            setIsLoginModalOpen(true);
            return;
          }
          void doUpgrade();
        }}
      />
    </header>
  );
};

export default Header;