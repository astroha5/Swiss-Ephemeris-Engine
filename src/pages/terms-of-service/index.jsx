import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import ProgressIndicator from '../../components/ui/ProgressIndicator';
import ErrorBoundaryNavigation from '../../components/ui/ErrorBoundaryNavigation';

const TermsOfService = () => {
  return (
    <ErrorBoundaryNavigation>
      <Helmet>
        <title>Terms of Service - Astrova</title>
        <meta name="description" content="Read the terms and conditions for using Astrova's astrological services and platform." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="/terms-of-service" />
      </Helmet>
      
      <div className="bg-background min-h-screen">
        <Header />
        <ProgressIndicator />
        
        <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link to="/" className="text-primary hover:text-primary/80 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>
          
          <div className="bg-surface rounded-xl shadow-soft border border-border p-8 md:p-12">
            <h1 className="text-3xl font-heading font-bold text-text-primary mb-8">Terms of Service</h1>
            <div className="prose prose-lg max-w-none text-text-secondary space-y-6">
              <h2>Agreement to Terms</h2>
              <p>By accessing and using Astrova ("we," "our," or "us"), you accept and agree to be bound by the terms and provision of this agreement. These Terms of Service govern your use of our website, application, and astrological services.</p>
              
              <h2>Description of Service</h2>
              <p>Astrova provides astrological calculations, birth chart analysis, predictions, and related astrological services. Our services include but are not limited to:</p>
              <ul>
                <li>Birth chart generation and analysis</li>
                <li>Planetary position calculations</li>
                <li>Astrological predictions and interpretations</li>
                <li>Vedic astrology services</li>
                <li>Dasha calculations and transit analysis</li>
                <li>Premium astrological insights and reports</li>
              </ul>
              
              <h2>User Account and Registration</h2>
              <p>To access certain features of our service, you may be required to create an account. You agree to:</p>
              <ul>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security of your password</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
              
              <h2>Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use our services for any unlawful purpose or in violation of any laws</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt our services</li>
                <li>Upload malicious code or harmful content</li>
                <li>Reproduce, distribute, or create derivative works without permission</li>
                <li>Use our services to harass, abuse, or harm others</li>
              </ul>
              
              <h2>Intellectual Property Rights</h2>
              <p>All content, features, and functionality of our services, including but not limited to text, graphics, logos, images, and software, are owned by Astrova and are protected by copyright, trademark, and other intellectual property laws.</p>
              
              <h2>Payment Terms</h2>
              <p>For paid services:</p>
              <ul>
                <li>All fees are in Indian Rupees (INR) unless otherwise specified</li>
                <li>Payment is processed securely through Razorpay</li>
                <li>Subscriptions automatically renew monthly unless cancelled</li>
                <li>Refunds are subject to our Refund Policy</li>
                <li>We reserve the right to change pricing with notice</li>
              </ul>

              <h2>Cancellation</h2>
              <p>You may cancel your subscription at any time. Cancellations take effect at the end of the current billing cycle. To cancel, contact us at <a href="mailto:contact@astrova.com">contact@astrova.com</a> or call <a href="tel:+919876543210">+91 98765 43210</a>. Self‑serve cancellation within the app will be available soon.</p>
              
              <h2>Service Availability</h2>
              <p>While we strive to maintain continuous service availability, we do not guarantee uninterrupted access. We may temporarily suspend services for maintenance, updates, or other operational reasons.</p>
              
              <h2>Disclaimer of Warranties</h2>
              <p>Astrological services are provided for entertainment and informational purposes only. We make no warranties about:</p>
              <ul>
                <li>The accuracy or completeness of astrological predictions</li>
                <li>The suitability of our services for any particular purpose</li>
                <li>The reliability or availability of our services</li>
                <li>The outcomes or results from using our services</li>
              </ul>
              <p>Our services are provided "as is" without warranty of any kind.</p>
              
              <h2>Limitation of Liability</h2>
              <p>To the fullest extent permitted by law, Astrova shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or other intangible losses resulting from your use of our services.</p>
              
              <h2>Privacy and Data Protection</h2>
              <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.</p>
              
              <h2>Termination</h2>
              <p>We may terminate or suspend your account and access to our services immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.</p>
              
              <h2>Governing Law</h2>
              <p>These Terms of Service are governed by and construed in accordance with the laws of India, without regard to conflict of law principles.</p>
              
              <h2>Changes to Terms</h2>
              <p>We reserve the right to modify these terms at any time. We will provide notice of significant changes. Your continued use of our services constitutes acceptance of the modified terms.</p>
              
              <h2>Contact Information</h2>
              <p>If you have any questions about these Terms of Service, please contact us at:</p>
              <p>Email: contact@astrova.com</p>
              
              <p className="text-text-muted mt-8">Last Updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          </div>
        </main>
      </div>
    </ErrorBoundaryNavigation>
  );
};

export default TermsOfService;
