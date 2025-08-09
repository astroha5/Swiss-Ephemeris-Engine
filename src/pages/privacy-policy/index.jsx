import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import ProgressIndicator from '../../components/ui/ProgressIndicator';
import ErrorBoundaryNavigation from '../../components/ui/ErrorBoundaryNavigation';

const PrivacyPolicy = () => {
  return (
    <ErrorBoundaryNavigation>
      <Helmet>
        <title>Privacy Policy - Astrova</title>
        <meta name="description" content="Learn about how Astrova protects and handles your personal data and astrological information." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="/privacy-policy" />
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
            <h1 className="text-3xl font-heading font-bold text-text-primary mb-8">Privacy Policy</h1>
            <div className="prose prose-lg max-w-none text-text-secondary space-y-6">
              <h2>Introduction</h2>
              <p>Welcome to Astrova ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our astrological services and website.</p>
              
              <h2>Information We Collect</h2>
              
              <h3>Personal Data</h3>
              <p>We may collect personal information that you voluntarily provide when using our services, including but not limited to:</p>
              <ul>
                <li>Name, email address, phone number, and billing information</li>
                <li>Birth details (date, time, and place of birth) for astrological calculations</li>
                <li>Account credentials</li>
                <li>Communication preferences</li>
                <li>Feedback and correspondence</li>
                <li>Usage data and interaction with our services</li>
              </ul>
              
              <h3>Automatically Collected Information</h3>
              <p>When you visit our website or use our application, we may automatically collect certain information, including:</p>
              <ul>
                <li>Device information (browser type, IP address, device type)</li>
                <li>Usage patterns and interactions</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Location information (with your consent)</li>
              </ul>
              
              <h2>How We Use Your Information</h2>
              <p>We use your personal information for the following purposes:</p>
              <ul>
                <li>Providing and personalizing our astrological services</li>
                <li>Processing payments and managing your account</li>
                <li>Communicating with you about our services, updates, and promotions</li>
                <li>Improving and developing our services</li>
                <li>Analyzing usage patterns and trends</li>
                <li>Protecting our rights, property, and safety</li>
                <li>Complying with legal obligations</li>
              </ul>
              
              <h2>Data Sharing and Disclosure</h2>
              <p>We may share your information with:</p>
              <ul>
                <li>Service providers and business partners who assist in delivering our services (including Razorpay for payment processing)</li>
                <li>Legal authorities when required by law</li>
                <li>Business successors in the event of a merger, acquisition, or sale of assets</li>
              </ul>
              <p>We do not sell your personal information to third parties.</p>

              <h2>Payments and Card Information</h2>
              <p>Payments are processed by Razorpay on PCI‑DSS compliant infrastructure. We do not store your complete card details on Astrova servers. Sensitive payment data (such as full card numbers and CVVs) are handled securely by Razorpay.</p>
              
              <h2>Data Security</h2>
              <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.</p>
              
              <h2>Your Rights</h2>
              <p>Depending on your location, you may have the following rights regarding your personal data:</p>
              <ul>
                <li>Access to your personal information</li>
                <li>Correction of inaccurate or incomplete data</li>
                <li>Deletion of your personal information</li>
                <li>Restriction or objection to processing</li>
                <li>Data portability</li>
                <li>Withdrawal of consent</li>
              </ul>
              <p>To exercise these rights, please contact us using the information provided below.</p>
              
              <h2>Cookies Policy</h2>
              <p>We use cookies and similar tracking technologies to enhance your experience on our website. You can manage your cookie preferences through your browser settings.</p>
              
              <h2>Children's Privacy</h2>
              <p>Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children.</p>
              
              <h2>Changes to This Privacy Policy</h2>
              <p>We may update this Privacy Policy from time to time. The updated version will be indicated by an updated "Last Updated" date.</p>
              
              <h2>Contact Us</h2>
              <p>If you have questions or concerns about this Privacy Policy, please contact us at:</p>
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

export default PrivacyPolicy;