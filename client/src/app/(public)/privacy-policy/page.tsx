import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-lg">
            Last updated: August 31, 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-card rounded-lg shadow-lg border p-8 md:p-12 space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-foreground leading-relaxed">
              GenMeta (&quot;GenMeta&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the GenMeta desktop application and the website available at{" "}
              <Link href="https://genmeta.app" className="text-primary hover:underline font-medium">
                https://genmeta.app
              </Link>
              .
            </p>
            <p className="text-foreground leading-relaxed mt-4">
              This Privacy Policy explains how we collect, use, store, and protect information when you use the GenMeta application, website, and related services.
            </p>
            <p className="text-foreground leading-relaxed mt-4">
              By using GenMeta, you agree to the practices described in this Privacy Policy.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Information We Collect</h2>
            <p className="text-foreground leading-relaxed mb-4">
              We collect only the information necessary to provide, maintain, secure, and improve GenMeta.
            </p>
            
            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Account Information</h3>
            <p className="text-foreground leading-relaxed mb-3">
              When you create or use a GenMeta account, we may collect:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Name</li>
              <li>Email address</li>
              <li>Account authentication information</li>
              <li>Information provided through supported social login providers</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              If you use a social login option, we may receive basic account information provided by that authentication provider, such as your name and email address.
            </p>
            <p className="text-foreground leading-relaxed mt-4 font-medium">
              We do not collect or store your social login password.
            </p>
          </section>

          {/* 2. Usage and Account Statistics */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Usage and Account Statistics</h2>
            <p className="text-foreground leading-relaxed mb-3">
              We collect information related to your use of GenMeta, which may include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Number of uses or processing requests</li>
              <li>Usage statistics</li>
              <li>Account activity related to GenMeta features</li>
              <li>Subscription, credit, or payment-related statistics</li>
              <li>Service usage dates and related account information</li>
            </ul>
            
            <p className="text-foreground leading-relaxed mt-4 mb-3">
              We use this information to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Provide and manage GenMeta services</li>
              <li>Apply usage limits</li>
              <li>Manage subscriptions and credits</li>
              <li>Monitor service usage</li>
              <li>Prevent abuse</li>
              <li>Improve the application and services</li>
              <li>Generate aggregated statistics</li>
            </ul>
          </section>

          {/* 3. Payment Information */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Payment Information</h2>
            <p className="text-foreground leading-relaxed mb-4">
              GenMeta uses <strong>PayStation</strong> as a payment service provider for payments made through our website.
            </p>
            <p className="text-foreground leading-relaxed mb-3">
              We may receive and store information related to your transaction, such as:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Transaction ID</li>
              <li>Payment status</li>
              <li>Amount paid</li>
              <li>Payment date</li>
              <li>Subscription or purchase information</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              Payment card or other sensitive payment credentials are processed by the payment provider and are not intentionally stored by GenMeta unless explicitly stated otherwise.
            </p>
            <p className="text-foreground leading-relaxed mt-4">
              For more information about how PayStation handles personal information, please review{" "}
              <Link 
                href="https://paystation.com.bd/privacy-policy" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                PayStation&apos;s Privacy Policy
              </Link>
              .
            </p>
          </section>

          {/* 4. Uploaded Files and Content */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Uploaded Files and Content</h2>
            <p className="text-foreground leading-relaxed mb-4">
              GenMeta is designed to process your files <strong>locally on your device</strong>.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              Files that you select for processing, including images, videos, vector files, or other supported content, are processed locally by the GenMeta application.
            </p>
            <p className="text-foreground leading-relaxed mb-4 font-medium">
              GenMeta does not upload or store your selected files on our servers as part of normal application processing.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              We do not intentionally store copies of your uploaded files on our servers.
            </p>
            <p className="text-foreground leading-relaxed">
              However, GenMeta may send information necessary for AI-powered processing to third-party AI services when a feature requires it. See the <strong>AI Services</strong> section below.
            </p>
          </section>

          {/* 5. AI Services */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. AI Services</h2>
            <p className="text-foreground leading-relaxed mb-4">
              GenMeta currently uses <strong>Google Gemini</strong> and may use additional third-party AI or machine-learning services in the future to provide AI-powered features.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              Depending on the feature being used, information required to generate an AI result may be transmitted to the applicable AI service.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              We do not use your files for unrelated purposes.
            </p>
            <p className="text-foreground leading-relaxed">
              We may update this Privacy Policy when additional AI service providers are introduced or when our data practices materially change.
            </p>
            <p className="text-foreground leading-relaxed mt-4">
              For information about Google&apos;s handling of data, please review Google&apos;s applicable privacy documentation.
            </p>
          </section>

          {/* 6. Google Analytics */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Google Analytics</h2>
            <p className="text-foreground leading-relaxed mb-4">
              We use <strong>Google Analytics</strong> to understand how users interact with our website and services and to improve GenMeta.
            </p>
            <p className="text-foreground leading-relaxed mb-3">
              Google Analytics may collect information such as:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Usage and session information</li>
              <li>Device and browser information</li>
              <li>Approximate geographic information</li>
              <li>Interaction and event information</li>
              <li>Other analytics identifiers</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              Google Analytics is used for statistical and analytical purposes and to help us understand product usage and improve our services.
            </p>
          </section>

          {/* 7. Error Reports and Diagnostics */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Error Reports and Diagnostics</h2>
            <p className="text-foreground leading-relaxed mb-4">
              GenMeta may collect technical error reports and diagnostic information when errors or unexpected behavior occur.
            </p>
            <p className="text-foreground leading-relaxed mb-3">
              These reports may contain information such as:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Error messages</li>
              <li>Stack traces</li>
              <li>Application version</li>
              <li>Operating system information</li>
              <li>Technical diagnostic information</li>
              <li>Information necessary to reproduce or investigate an issue</li>
            </ul>
            
            <p className="text-foreground leading-relaxed mt-4 mb-3">
              We use error reports to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Detect bugs</li>
              <li>Diagnose technical problems</li>
              <li>Improve application stability</li>
              <li>Improve performance</li>
              <li>Provide better support</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              We do not intentionally collect the contents of your private files through error reporting.
            </p>
          </section>

          {/* 8. How We Use Information */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">8. How We Use Information</h2>
            <p className="text-foreground leading-relaxed mb-3">
              We may use collected information to:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-foreground ml-4">
              <li>Create and manage user accounts.</li>
              <li>Authenticate users.</li>
              <li>Provide GenMeta features and services.</li>
              <li>Process and manage subscriptions, credits, and purchases.</li>
              <li>Track usage and enforce applicable usage limits.</li>
              <li>Detect abuse, fraud, or unauthorized activity.</li>
              <li>Diagnose errors and technical problems.</li>
              <li>Improve GenMeta and its features.</li>
              <li>Analyze service usage and performance.</li>
              <li>Communicate with users regarding their account or service.</li>
              <li>Comply with applicable legal obligations.</li>
            </ol>
          </section>

          {/* 9. How We Share Information */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">9. How We Share Information</h2>
            <p className="text-foreground leading-relaxed mb-4 font-medium">
              We do not sell your personal information.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              We may share limited information with service providers when necessary to operate GenMeta.
            </p>
            <p className="text-foreground leading-relaxed mb-3">
              These providers may include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Authentication providers used for social login</li>
              <li>Payment providers, including PayStation</li>
              <li>AI service providers, including Google Gemini</li>
              <li>Analytics providers, including Google Analytics</li>
              <li>Hosting, infrastructure, security, or other technical service providers</li>
              <li>Government authorities or other parties when required by applicable law</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              We only share information that is reasonably necessary for the relevant service or legal requirement.
            </p>
          </section>

          {/* 10. Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">10. Data Security</h2>
            <p className="text-foreground leading-relaxed mb-4">
              We take reasonable technical and organizational measures to protect information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              Account and service communications may use encryption and secure communication protocols such as HTTPS/TLS where appropriate.
            </p>
            <p className="text-foreground leading-relaxed">
              However, no internet-based service can guarantee absolute security. We therefore cannot guarantee that information will always remain completely secure.
            </p>
          </section>

          {/* 11. Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">11. Data Retention</h2>
            <p className="text-foreground leading-relaxed mb-3">
              We retain personal information only for as long as reasonably necessary to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Provide our services</li>
              <li>Maintain user accounts</li>
              <li>Manage subscriptions and transactions</li>
              <li>Maintain security and service records</li>
              <li>Resolve disputes</li>
              <li>Comply with legal obligations</li>
              <li>Enforce our agreements</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              When information is no longer required, we may delete or anonymize it in accordance with our data-retention practices and applicable laws.
            </p>
          </section>

          {/* 12. Account and Data Deletion */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">12. Account and Data Deletion</h2>
            <p className="text-foreground leading-relaxed mb-4">
              You may request deletion of your GenMeta account and associated personal information.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              You can use the account deletion functionality available through GenMeta or contact us if you need assistance.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              When an account deletion request is completed, we will delete or anonymize associated personal information, except information that we are required or permitted to retain for legitimate purposes, including legal, security, fraud-prevention, or financial-record requirements.
            </p>
            <p className="text-foreground leading-relaxed">
              Deletion of an account may also result in the loss of access to associated subscriptions, credits, or other account-related services, subject to applicable terms.
            </p>
          </section>

          {/* 13. Your Privacy Choices and Rights */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">13. Your Privacy Choices and Rights</h2>
            <p className="text-foreground leading-relaxed mb-3">
              Depending on your location and applicable law, you may have rights regarding your personal information, including the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Access information associated with your account</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Request information about how your data is used</li>
              <li>Withdraw certain permissions or consents where applicable</li>
              <li>Object to or restrict certain processing where applicable</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              You may contact us to exercise applicable privacy rights.
            </p>
            <p className="text-foreground leading-relaxed mt-4">
              We may need to verify your identity before processing certain requests.
            </p>
          </section>

          {/* 14. Cookies and Similar Technologies */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">14. Cookies and Similar Technologies</h2>
            <p className="text-foreground leading-relaxed mb-3">
              Our website may use cookies and similar technologies for purposes including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Authentication</li>
              <li>Security</li>
              <li>Maintaining sessions</li>
              <li>Website functionality</li>
              <li>Analytics</li>
              <li>Improving user experience</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              Google Analytics may use cookies or similar identifiers as part of its analytics functionality.
            </p>
            <p className="text-foreground leading-relaxed mt-4">
              You can manage or disable cookies through your browser settings, although some website functionality may not work correctly if cookies are disabled.
            </p>
          </section>

          {/* 15. Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">15. Children&apos;s Privacy</h2>
            <p className="text-foreground leading-relaxed mb-4">
              GenMeta is not intended to knowingly collect personal information from children where prohibited by applicable law.
            </p>
            <p className="text-foreground leading-relaxed">
              If you believe that a child has provided personal information to us without appropriate authorization, please contact us so that we can review and take appropriate action.
            </p>
          </section>

          {/* 16. Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">16. Third-Party Services</h2>
            <p className="text-foreground leading-relaxed mb-4">
              GenMeta may use third-party services to provide authentication, payments, analytics, AI processing, hosting, security, and other functionality.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              These third parties may process information according to their own privacy policies and applicable terms.
            </p>
            <p className="text-foreground leading-relaxed mb-3">
              Examples of services currently used by GenMeta include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Google Gemini</li>
              <li>Google Analytics</li>
              <li>PayStation</li>
              <li>Social authentication providers</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              We may add or change service providers as GenMeta evolves. When such changes materially affect how personal information is processed, we may update this Privacy Policy.
            </p>
          </section>

          {/* 17. Changes to This Privacy Policy */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">17. Changes to This Privacy Policy</h2>
            <p className="text-foreground leading-relaxed mb-4">
              We may update this Privacy Policy from time to time.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              When we make changes, we will update the <strong>&quot;Last updated&quot;</strong> date at the top of this page.
            </p>
            <p className="text-foreground leading-relaxed">
              If we make material changes to how we collect or use personal information, we may provide additional notice where appropriate.
            </p>
          </section>

          {/* 18. Contact Us */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">18. Contact Us</h2>
            <p className="text-foreground leading-relaxed mb-4">
              If you have questions about this Privacy Policy, your personal information, or a data deletion request, please contact us:
            </p>
            <div className="bg-muted/50 rounded-lg p-6 space-y-2">
              <p className="text-foreground font-semibold">GenMeta Team</p>
              <p className="text-foreground">
                Website:{" "}
                <Link href="https://genmeta.app" className="text-primary hover:underline font-medium">
                  https://genmeta.app
                </Link>
              </p>
              <p className="text-foreground">
                Privacy contact:{" "}
                <a href="mailto:support@genmeta.app" className="text-primary hover:underline font-medium">
                  support@genmeta.app
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Back to Home Link */}
        <div className="text-center mt-12">
          <Link 
            href="/" 
            className="inline-flex items-center text-primary hover:underline font-medium text-lg"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
