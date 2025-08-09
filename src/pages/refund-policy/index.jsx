import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import ProgressIndicator from '../../components/ui/ProgressIndicator';
import ErrorBoundaryNavigation from '../../components/ui/ErrorBoundaryNavigation';

const RefundPolicy = () => {
  return (
    <ErrorBoundaryNavigation>
      <Helmet>
        <title>Refund Policy - Astrova</title>
        <meta name="description" content="Learn about Astrova's refund policy for subscriptions and astrological services." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="/refund-policy" />
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
            <h1 className="text-3xl font-heading font-bold text-text-primary mb-8">Refund & Cancellation Policy</h1>
            <div className="prose prose-lg max-w-none text-text-secondary space-y-6">
              <h2>Subscriptions</h2>
              <p>Our Premium subscription is available at ₹99 per month and auto-renews monthly until cancelled.</p>

              <h2>Refunds</h2>
              <p>Payments for Premium subscriptions are generally non-refundable. We do not offer partial or pro‑rated refunds for unused time after a cancellation.</p>
              <p>Exceptions may be considered in limited cases such as duplicate charges or confirmed fraudulent transactions. For such cases, contact our support team within 7 days of the charge. Eligible refunds, if approved, are typically processed within 5–7 business days.</p>

              <h2>Cancellation</h2>
              <p>You may cancel your subscription at any time. Cancellations take effect at the end of the current billing cycle, and you will retain Premium access until that time. To request cancellation, please email us at <a href="mailto:contact@astrova.com">contact@astrova.com</a> or call <a href="tel:+919876543210">+91 98765 43210</a>. In‑app self‑serve cancellation will be available soon.</p>

              <h2>Billing Support</h2>
              <p>For billing questions, refund requests, or cancellation assistance, contact:
                <br />Email: <a href="mailto:contact@astrova.com">contact@astrova.com</a>
                <br />Phone: <a href="tel:+919876543210">+91 98765 43210</a>
              </p>
              
              <p className="text-text-muted mt-8">Last Updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          </div>
        </main>
      </div>
    </ErrorBoundaryNavigation>
  );
};

export default RefundPolicy;
