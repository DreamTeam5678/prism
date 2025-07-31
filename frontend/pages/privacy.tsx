import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

const PrivacyPolicy: NextPage = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy - Prism</title>
        <meta name="description" content="Privacy Policy for Prism - Your Personal Productivity Assistant" />
      </Head>

      <div className="privacy-policy">
        <div className="container">
          <header className="policy-header">
            <h1>Privacy Policy</h1>
            <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>
          </header>

          <div className="policy-content">
            <section>
              <h2>1. Introduction</h2>
              <p>
                Welcome to Prism ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our platform. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our productivity application.
              </p>
              <p>
                By using Prism, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section>
              <h2>2. Information We Collect</h2>
              
              <h3>2.1 Personal Information</h3>
              <p>We may collect the following personal information:</p>
              <ul>
                <li>Email address (when you create an account)</li>
                <li>Name and profile information</li>
                <li>Task data and productivity information</li>
                <li>Calendar events and scheduling data</li>
                <li>Mood tracking data</li>
                <li>Survey responses and preferences</li>
              </ul>

              <h3>2.2 Voice Data</h3>
              <p>
                Our application includes voice command features that may process your voice input. When you use voice commands:
              </p>
              <ul>
                <li>Voice data is processed in real-time using your device's microphone</li>
                <li>Voice commands are converted to text using your browser's speech recognition capabilities</li>
                <li>We do not store or record your voice data on our servers</li>
                <li>Voice processing occurs locally on your device when possible</li>
                <li>You can disable voice features at any time in your settings</li>
              </ul>

              <h3>2.3 Usage Data</h3>
              <p>We automatically collect certain information about your use of the application:</p>
              <ul>
                <li>Device information (browser type, operating system)</li>
                <li>Usage patterns and feature interactions</li>
                <li>Error logs and performance data</li>
                <li>IP address and general location information</li>
              </ul>
            </section>

            <section>
              <h2>3. How We Use Your Information</h2>
              <p>We use the collected information for the following purposes:</p>
              <ul>
                <li>Provide and maintain our productivity services</li>
                <li>Process voice commands and improve voice recognition accuracy</li>
                <li>Personalize your experience and recommendations</li>
                <li>Analyze usage patterns to improve our application</li>
                <li>Send important updates and notifications</li>
                <li>Respond to your inquiries and support requests</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2>4. Data Storage and Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information:
              </p>
              <ul>
                <li>Data is encrypted in transit and at rest</li>
                <li>Access to personal data is restricted to authorized personnel</li>
                <li>Regular security audits and updates</li>
                <li>Secure hosting infrastructure</li>
                <li>Voice data is not stored on our servers</li>
              </ul>
            </section>

            <section>
              <h2>5. Data Sharing and Disclosure</h2>
              <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
              <ul>
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
                <li>With service providers who assist in operating our application (under strict confidentiality agreements)</li>
              </ul>
            </section>

            <section>
              <h2>6. Your Rights and Choices</h2>
              <p>You have the following rights regarding your personal information:</p>
              <ul>
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Opt-out:</strong> Unsubscribe from communications</li>
                <li><strong>Voice Controls:</strong> Disable voice features in settings</li>
              </ul>
            </section>

            <section>
              <h2>7. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to enhance your experience:
              </p>
              <ul>
                <li>Session cookies for authentication</li>
                <li>Preference cookies to remember your settings</li>
                <li>Analytics cookies to understand usage patterns</li>
                <li>You can control cookie settings in your browser</li>
              </ul>
            </section>

            <section>
              <h2>8. Third-Party Services</h2>
              <p>Our application may integrate with third-party services:</p>
              <ul>
                <li>Authentication providers (Google, etc.)</li>
                <li>Calendar services (Google Calendar, etc.)</li>
                <li>Analytics services</li>
                <li>Each third-party service has its own privacy policy</li>
              </ul>
            </section>

            <section>
              <h2>9. Children's Privacy</h2>
              <p>
                Our application is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. 
                If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2>10. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place 
                to protect your data in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2>11. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page 
                and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
              </p>
            </section>

            <section>
              <h2>12. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="contact-info">
                <p><strong>Email:</strong> <a href="mailto:pamenon146@gmail.com">pamenon146@gmail.com</a></p>
                <p><strong>Subject:</strong> Privacy Policy Inquiry</p>
              </div>
            </section>
          </div>

          <footer className="policy-footer">
            <Link href="/" className="back-link">
              ← Back to Prism
            </Link>
          </footer>
        </div>

        <style jsx>{`
          .privacy-policy {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 2rem 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }

          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }

          .policy-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3rem 2rem;
            text-align: center;
          }

          .policy-header h1 {
            margin: 0 0 1rem 0;
            font-size: 2.5rem;
            font-weight: 700;
          }

          .last-updated {
            margin: 0;
            opacity: 0.9;
            font-size: 1rem;
          }

          .policy-content {
            padding: 3rem 2rem;
            line-height: 1.6;
            color: #333;
          }

          .policy-content section {
            margin-bottom: 2.5rem;
          }

          .policy-content h2 {
            color: #667eea;
            font-size: 1.5rem;
            margin-bottom: 1rem;
            font-weight: 600;
          }

          .policy-content h3 {
            color: #764ba2;
            font-size: 1.2rem;
            margin: 1.5rem 0 0.5rem 0;
            font-weight: 600;
          }

          .policy-content p {
            margin-bottom: 1rem;
          }

          .policy-content ul {
            margin: 1rem 0;
            padding-left: 1.5rem;
          }

          .policy-content li {
            margin-bottom: 0.5rem;
          }

          .contact-info {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 8px;
            margin-top: 1rem;
          }

          .contact-info a {
            color: #667eea;
            text-decoration: none;
          }

          .contact-info a:hover {
            text-decoration: underline;
          }

          .policy-footer {
            padding: 2rem;
            text-align: center;
            border-top: 1px solid #eee;
          }

          .back-link {
            display: inline-flex;
            align-items: center;
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
            padding: 0.75rem 1.5rem;
            border: 2px solid #667eea;
            border-radius: 8px;
            transition: all 0.3s ease;
          }

          .back-link:hover {
            background: #667eea;
            color: white;
            transform: translateY(-2px);
          }

          @media (max-width: 768px) {
            .privacy-policy {
              padding: 1rem;
            }

            .container {
              border-radius: 8px;
            }

            .policy-header {
              padding: 2rem 1rem;
            }

            .policy-header h1 {
              font-size: 2rem;
            }

            .policy-content {
              padding: 2rem 1rem;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default PrivacyPolicy; 