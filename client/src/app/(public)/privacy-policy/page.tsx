import {
  A,
  B,
  LegalLayout,
  OL,
  P,
  Sec,
  Sub,
  UL,
} from "@/components/legal/legal";

export const metadata = {
  title: "Privacy Policy | GenMeta",
};

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" updated="August 31, 2026">
      <Sec>
        <P>
          GenMeta (&quot;GenMeta&quot;, &quot;we&quot;, &quot;us&quot;, or
          &quot;our&quot;) operates the GenMeta desktop application and the
          website available at{" "}
          <A href="https://genmeta.app">https://genmeta.app</A>.
        </P>
        <P>
          This Privacy Policy explains how we collect, use, store, and protect
          information when you use the GenMeta application, website, and
          related services.
        </P>
        <P>
          By using GenMeta, you agree to the practices described in this
          Privacy Policy.
        </P>
      </Sec>

      <Sec title="1. Information We Collect">
        <P>
          We collect only the information necessary to provide, maintain,
          secure, and improve GenMeta.
        </P>
        <Sub>Account Information</Sub>
        <P>When you create or use a GenMeta account, we may collect:</P>
        <UL
          items={[
            "Name",
            "Email address",
            "Account authentication information",
            "Information provided through supported social login providers",
          ]}
        />
        <P>
          If you use a social login option, we may receive basic account
          information provided by that authentication provider, such as your
          name and email address.
        </P>
        <P strong>We do not collect or store your social login password.</P>
      </Sec>

      <Sec title="2. Usage and Account Statistics">
        <P>
          We collect information related to your use of GenMeta, which may
          include:
        </P>
        <UL
          items={[
            "Number of uses or processing requests",
            "Usage statistics",
            "Account activity related to GenMeta features",
            "Subscription, credit, or payment-related statistics",
            "Service usage dates and related account information",
          ]}
        />
        <P>We use this information to:</P>
        <UL
          items={[
            "Provide and manage GenMeta services",
            "Apply usage limits",
            "Manage subscriptions and credits",
            "Monitor service usage",
            "Prevent abuse",
            "Improve the application and services",
            "Generate aggregated statistics",
          ]}
        />
      </Sec>

      <Sec title="3. Payment Information">
        <P>
          GenMeta uses <B>PayStation</B> as a payment service provider for
          payments made through our website.
        </P>
        <P>
          We may receive and store information related to your transaction,
          such as:
        </P>
        <UL
          items={[
            "Transaction ID",
            "Payment status",
            "Amount paid",
            "Payment date",
            "Subscription or purchase information",
          ]}
        />
        <P>
          Payment card or other sensitive payment credentials are processed by
          the payment provider and are not intentionally stored by GenMeta
          unless explicitly stated otherwise.
        </P>
        <P>
          For more information about how PayStation handles personal
          information, please review{" "}
          <A href="https://paystation.com.bd/privacy-policy">
            PayStation&apos;s Privacy Policy
          </A>
          .
        </P>
      </Sec>

      <Sec title="4. Uploaded Files and Content">
        <P>
          GenMeta is designed to process your files <B>locally on your device</B>.
        </P>
        <P>
          Files that you select for processing, including images, videos,
          vector files, or other supported content, are processed locally by
          the GenMeta application.
        </P>
        <P strong>
          GenMeta does not upload or store your selected files on our servers
          as part of normal application processing.
        </P>
        <P>
          We do not intentionally store copies of your uploaded files on our
          servers.
        </P>
        <P>
          However, GenMeta may send information necessary for AI-powered
          processing to third-party AI services when a feature requires it. See
          the <B>AI Services</B> section below.
        </P>
      </Sec>

      <Sec title="5. AI Services">
        <P>
          GenMeta currently uses <B>Google Gemini</B> and may use additional
          third-party AI or machine-learning services in the future to provide
          AI-powered features.
        </P>
        <P>
          Depending on the feature being used, information required to generate
          an AI result may be transmitted to the applicable AI service.
        </P>
        <P>We do not use your files for unrelated purposes.</P>
        <P>
          We may update this Privacy Policy when additional AI service
          providers are introduced or when our data practices materially
          change.
        </P>
        <P>
          For information about Google&apos;s handling of data, please review
          Google&apos;s applicable privacy documentation.
        </P>
      </Sec>

      <Sec title="6. Google Analytics">
        <P>
          We use <B>Google Analytics</B> to understand how users interact with
          our website and services and to improve GenMeta.
        </P>
        <P>Google Analytics may collect information such as:</P>
        <UL
          items={[
            "Usage and session information",
            "Device and browser information",
            "Approximate geographic information",
            "Interaction and event information",
            "Other analytics identifiers",
          ]}
        />
        <P>
          Google Analytics is used for statistical and analytical purposes and
          to help us understand product usage and improve our services.
        </P>
      </Sec>

      <Sec title="7. Error Reports and Diagnostics">
        <P>
          GenMeta may collect technical error reports and diagnostic
          information when errors or unexpected behavior occur.
        </P>
        <P>These reports may contain information such as:</P>
        <UL
          items={[
            "Error messages",
            "Stack traces",
            "Application version",
            "Operating system information",
            "Technical diagnostic information",
            "Information necessary to reproduce or investigate an issue",
          ]}
        />
        <P>We use error reports to:</P>
        <UL
          items={[
            "Detect bugs",
            "Diagnose technical problems",
            "Improve application stability",
            "Improve performance",
            "Provide better support",
          ]}
        />
        <P>
          We do not intentionally collect the contents of your private files
          through error reporting.
        </P>
      </Sec>

      <Sec title="8. How We Use Information">
        <P>We may use collected information to:</P>
        <OL
          items={[
            "Create and manage user accounts.",
            "Authenticate users.",
            "Provide GenMeta features and services.",
            "Process and manage subscriptions, credits, and purchases.",
            "Track usage and enforce applicable usage limits.",
            "Detect abuse, fraud, or unauthorized activity.",
            "Diagnose errors and technical problems.",
            "Improve GenMeta and its features.",
            "Analyze service usage and performance.",
            "Communicate with users regarding their account or service.",
            "Comply with applicable legal obligations.",
          ]}
        />
      </Sec>

      <Sec title="9. How We Share Information">
        <P strong>We do not sell your personal information.</P>
        <P>
          We may share limited information with service providers when
          necessary to operate GenMeta.
        </P>
        <P>These providers may include:</P>
        <UL
          items={[
            "Authentication providers used for social login",
            "Payment providers, including PayStation",
            "AI service providers, including Google Gemini",
            "Analytics providers, including Google Analytics",
            "Hosting, infrastructure, security, or other technical service providers",
            "Government authorities or other parties when required by applicable law",
          ]}
        />
        <P>
          We only share information that is reasonably necessary for the
          relevant service or legal requirement.
        </P>
      </Sec>

      <Sec title="10. Data Security">
        <P>
          We take reasonable technical and organizational measures to protect
          information against unauthorized access, alteration, disclosure, or
          destruction.
        </P>
        <P>
          Account and service communications may use encryption and secure
          communication protocols such as HTTPS/TLS where appropriate.
        </P>
        <P>
          However, no internet-based service can guarantee absolute security.
          We therefore cannot guarantee that information will always remain
          completely secure.
        </P>
      </Sec>

      <Sec title="11. Data Retention">
        <P>
          We retain personal information only for as long as reasonably
          necessary to:
        </P>
        <UL
          items={[
            "Provide our services",
            "Maintain user accounts",
            "Manage subscriptions and transactions",
            "Maintain security and service records",
            "Resolve disputes",
            "Comply with legal obligations",
            "Enforce our agreements",
          ]}
        />
        <P>
          When information is no longer required, we may delete or anonymize it
          in accordance with our data-retention practices and applicable laws.
        </P>
      </Sec>

      <Sec title="12. Account and Data Deletion">
        <P>
          You may request deletion of your GenMeta account and associated
          personal information.
        </P>
        <P>
          You can use the account deletion functionality available through
          GenMeta or contact us if you need assistance.
        </P>
        <P>
          When an account deletion request is completed, we will delete or
          anonymize associated personal information, except information that we
          are required or permitted to retain for legitimate purposes,
          including legal, security, fraud-prevention, or financial-record
          requirements.
        </P>
        <P>
          Deletion of an account may also result in the loss of access to
          associated subscriptions, credits, or other account-related
          services, subject to applicable terms.
        </P>
      </Sec>

      <Sec title="13. Your Privacy Choices and Rights">
        <P>
          Depending on your location and applicable law, you may have rights
          regarding your personal information, including the right to:
        </P>
        <UL
          items={[
            "Access information associated with your account",
            "Correct inaccurate information",
            "Request deletion of your information",
            "Request information about how your data is used",
            "Withdraw certain permissions or consents where applicable",
            "Object to or restrict certain processing where applicable",
          ]}
        />
        <P>You may contact us to exercise applicable privacy rights.</P>
        <P>We may need to verify your identity before processing certain requests.</P>
      </Sec>

      <Sec title="14. Cookies and Similar Technologies">
        <P>
          Our website may use cookies and similar technologies for purposes
          including:
        </P>
        <UL
          items={[
            "Authentication",
            "Security",
            "Maintaining sessions",
            "Website functionality",
            "Analytics",
            "Improving user experience",
          ]}
        />
        <P>
          Google Analytics may use cookies or similar identifiers as part of
          its analytics functionality.
        </P>
        <P>
          You can manage or disable cookies through your browser settings,
          although some website functionality may not work correctly if cookies
          are disabled.
        </P>
      </Sec>

      <Sec title="15. Children's Privacy">
        <P>
          GenMeta is not intended to knowingly collect personal information
          from children where prohibited by applicable law.
        </P>
        <P>
          If you believe that a child has provided personal information to us
          without appropriate authorization, please contact us so that we can
          review and take appropriate action.
        </P>
      </Sec>

      <Sec title="16. Third-Party Services">
        <P>
          GenMeta may use third-party services to provide authentication,
          payments, analytics, AI processing, hosting, security, and other
          functionality.
        </P>
        <P>
          These third parties may process information according to their own
          privacy policies and applicable terms.
        </P>
        <P>Examples of services currently used by GenMeta include:</P>
        <UL
          items={[
            "Google Gemini",
            "Google Analytics",
            "PayStation",
            "Social authentication providers",
          ]}
        />
        <P>
          We may add or change service providers as GenMeta evolves. When such
          changes materially affect how personal information is processed, we
          may update this Privacy Policy.
        </P>
      </Sec>

      <Sec title="17. Changes to This Privacy Policy">
        <P>We may update this Privacy Policy from time to time.</P>
        <P>
          When we make changes, we will update the <B>&quot;Last updated&quot;</B>{" "}
          date at the top of this page.
        </P>
        <P>
          If we make material changes to how we collect or use personal
          information, we may provide additional notice where appropriate.
        </P>
      </Sec>

      <Sec title="18. Contact Us">
        <P>
          If you have questions about this Privacy Policy, your personal
          information, or a data deletion request, please contact us:
        </P>
        <P>
          <B>GenMeta Team</B>
          <br />
          Website: <A href="https://genmeta.app">https://genmeta.app</A>
          <br />
          Privacy contact:{" "}
          <A href="mailto:support@genmeta.app">support@genmeta.app</A>
        </P>
      </Sec>
    </LegalLayout>
  );
}
