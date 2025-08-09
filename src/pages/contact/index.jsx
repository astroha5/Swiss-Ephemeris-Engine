import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import ProgressIndicator from '../../components/ui/ProgressIndicator';
import ErrorBoundaryNavigation from '../../components/ui/ErrorBoundaryNavigation';

const ContactPage = () => {
  return (
    <ErrorBoundaryNavigation>
      <Helmet>
        <title>Contact Us - Astrova</title>
        <meta name="description" content="Get in touch with Astrova for support, billing, or general inquiries." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="/contact" />
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
              <h1 className="text-3xl font-heading font-bold text-text-primary mb-6">Contact Us</h1>
              <p className="text-text-secondary mb-8">We’re here to help. Reach out for support, billing, or general questions.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary mb-3">Support</h2>
                  <ul className="space-y-2 text-text-secondary">
                    <li>Email: <a className="text-primary hover:underline" href="mailto:contact@astrova.com">contact@astrova.com</a></li>
                    <li>Phone: <a className="text-primary hover:underline" href="tel:+919876543210">+91 98765 43210</a></li>
                    <li>Hours: Mon–Fri, 10:00–18:00 IST</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-text-primary mb-3">Registered Office</h2>
                  <address className="not-italic text-text-secondary leading-relaxed">
                    Astrova Technologies Pvt. Ltd.<br />
                    2nd Floor, MG Road<br />
                    Bengaluru, Karnataka 560001<br />
                    India
                  </address>
                </div>
              </div>

              <div className="mt-10 text-text-secondary">
                <h2 className="text-xl font-semibold text-text-primary mb-3">Billing & Subscription</h2>
                <p className="mb-2">For billing issues or subscription cancellations, please refer to our <Link className="text-primary hover:underline" to="/refund-policy">Refund & Cancellation Policy</Link> and <Link className="text-primary hover:underline" to="/terms-of-service">Terms of Service</Link>, or contact us via email/phone above.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundaryNavigation>
  );
};

export default ContactPage;


