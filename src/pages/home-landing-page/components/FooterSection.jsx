import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const FooterSection = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: 'Generate Chart', path: '/birth-details-form' },
      { label: 'View Results', path: '/chart-results-dashboard' },
      { label: 'Support', path: '/error-handling-page' }
    ],
    resources: [
      { label: 'About Vedic Astrology', path: 'https://en.wikipedia.org/wiki/Hindu_astrology' },
      { label: 'Chart Reading Guide', path: 'https://en.wikipedia.org/wiki/Natal_chart' },
      { label: 'Vimshottari Dasha', path: 'https://en.wikipedia.org/wiki/Dasha_(astrology)#Vimshottari_Dasha' }
    ],
    support: [
      { label: 'Help Center', path: '/error-handling-page' },
      { label: 'Contact Us', path: '/contact' },
      { label: 'Privacy Policy', path: '/privacy-policy' },
      { label: 'Terms of Service', path: '/terms-of-service' },
      { label: 'Refund Policy', path: '/refund-policy' }
    ]
  };

  const socialLinks = [
    { name: 'Facebook', icon: 'Facebook', url: 'https://facebook.com' },
    { name: 'Twitter', icon: 'Twitter', url: 'https://twitter.com' },
    { name: 'Instagram', icon: 'Instagram', url: 'https://instagram.com' },
    { name: 'YouTube', icon: 'Youtube', url: 'https://youtube.com' }
  ];

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
    <footer className="bg-secondary text-secondary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <Link to="/home-landing-page" className="inline-block mb-6">
                <Logo />
              </Link>
              
              <p className="text-secondary-foreground/80 font-body mb-6 leading-relaxed">
                Discover the ancient wisdom of Vedic astrology through modern AI technology. Generate accurate birth charts and receive personalized interpretations.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    className="w-10 h-10 bg-secondary-foreground/10 hover:bg-primary/20 rounded-lg flex items-center justify-center transition-celestial hover-scale"
                    aria-label={`Follow us on ${social.name}`}
                  >
                    <Icon 
                      name={social.icon} 
                      size={18} 
                      className="text-secondary-foreground/70 hover:text-primary transition-celestial"
                    />
                  </a>
                ))}
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h3 className="text-lg font-heading font-semibold text-secondary-foreground mb-6">
                Platform
              </h3>
              <ul className="space-y-3">
                {footerLinks.platform.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-secondary-foreground/70 hover:text-primary transition-celestial font-body"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h3 className="text-lg font-heading font-semibold text-secondary-foreground mb-6">
                Resources
              </h3>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.path}
                      className="text-secondary-foreground/70 hover:text-primary transition-celestial font-body"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-lg font-heading font-semibold text-secondary-foreground mb-6">
                Support
              </h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-secondary-foreground/70 hover:text-primary transition-celestial font-body"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-secondary-foreground/20 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <h4 className="text-lg font-heading font-semibold text-secondary-foreground mb-2">
                Stay Connected
              </h4>
              <p className="text-secondary-foreground/70 font-caption">
                Get updates on new features and astrological insights
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-secondary-foreground/10 rounded-lg px-4 py-2">
                <Icon name="Mail" size={16} className="text-secondary-foreground/70" />
                <span className="text-secondary-foreground/70 font-caption">
                  Newsletter coming soon
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-secondary-foreground/20 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-secondary-foreground/60 font-caption">
                © {currentYear} Astrova. All rights reserved. Made with ❤️ for astrology enthusiasts.
              </p>
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2 text-secondary-foreground/60">
                <Icon name="Shield" size={14} />
                <span className="font-caption">Secure & Private</span>
              </div>
              <div className="flex items-center space-x-2 text-secondary-foreground/60">
                <Icon name="Zap" size={14} />
                <span className="font-caption">AI-Powered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;