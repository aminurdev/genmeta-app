import Link from "next/link";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Terms and Conditions
          </h1>
          <p className="text-muted-foreground text-lg">
            Last updated: August 31, 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-card rounded-lg shadow-lg border p-8 md:p-12 space-y-8">

          {/* 1. Definitions */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Definitions</h2>
            <ul className="space-y-3 ml-4">
              <li className="text-foreground leading-relaxed">
                <strong>&quot;App&quot;:</strong> Refers to GenMeta.app, including
                all its features and services.
              </li>
              <li className="text-foreground leading-relaxed">
                <strong>&quot;User&quot;:</strong> Any individual or entity using
                GenMeta.app.
              </li>
              <li className="text-foreground leading-relaxed">
                <strong>&quot;Content&quot;:</strong> Any data, text, images, or
                other material generated, uploaded, or shared through the App.
              </li>
            </ul>
          </section>

          {/* 2. Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Acceptance of Terms</h2>
            <p className="text-foreground leading-relaxed">
              By accessing or using GenMeta.app, you agree to comply with these
              Terms and Conditions. If you do not agree, please refrain from using
              the App.
            </p>
          </section>

          {/* 3. User Responsibilities */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. User Responsibilities</h2>
            <ul className="space-y-3 list-disc list-inside text-foreground ml-4">
              <li className="leading-relaxed">
                <strong>Lawful Use:</strong> Users must use the App in compliance
                with all applicable local, national, and international laws and
                regulations.
              </li>
              <li className="leading-relaxed">
                <strong>Islamic Compliance:</strong> Users are expected to ensure
                that their use of the App aligns with Islamic principles and does
                not promote or engage in activities contrary to Islamic teachings.
              </li>
              <li className="leading-relaxed">
                <strong>Content Ownership:</strong> Users retain ownership of the
                Content they create or upload but grant GenMeta.app a license to
                use, display, and distribute such Content as necessary to operate
                the App.
              </li>
            </ul>
          </section>

          {/* 4. Prohibited Activities */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Prohibited Activities</h2>
            <p className="text-foreground leading-relaxed mb-3">Users are prohibited from:</p>
            <ul className="space-y-3 list-disc list-inside text-foreground ml-4">
              <li className="leading-relaxed">
                Uploading or sharing Content that is offensive, defamatory,
                obscene, or violates any laws or Islamic principles.
              </li>
              <li className="leading-relaxed">
                Engaging in activities that harm, disrupt, or interfere with the
                App&apos;s functionality or security.
              </li>
              <li className="leading-relaxed">
                Attempting unauthorized access to other users&apos; accounts or
                GenMeta.app&apos;s systems.
              </li>
            </ul>
          </section>

          {/* 5. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Intellectual Property</h2>
            <ul className="space-y-3 list-disc list-inside text-foreground ml-4">
              <li className="leading-relaxed">
                All intellectual property rights related to the App, including but
                not limited to software, design, and trademarks, are owned by
                GenMeta.app.
              </li>
              <li className="leading-relaxed">
                Users may not use GenMeta.app&apos;s intellectual property without
                prior written consent.
              </li>
            </ul>
          </section>

          {/* 6. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Limitation of Liability</h2>
            <p className="text-foreground leading-relaxed">
              GenMeta.app is provided &quot;as is&quot; without warranties of any
              kind. We are not liable for any damages arising from the use or
              inability to use the App, including but not limited to direct,
              indirect, incidental, or consequential damages.
            </p>
          </section>

          {/* 7. Account Termination */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Account Termination</h2>
            <p className="text-foreground leading-relaxed">
              We reserve the right to suspend or terminate user accounts at our
              discretion, especially in cases of violation of these Terms and
              Conditions or engagement in prohibited activities.
            </p>
          </section>

          {/* 8. Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">8. Changes to Terms</h2>
            <p className="text-foreground leading-relaxed">
              GenMeta.app may update these Terms and Conditions periodically.
              Users will be notified of significant changes, and continued use of
              the App constitutes acceptance of the updated terms.
            </p>
          </section>

          {/* 9. Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">9. Governing Law</h2>
            <p className="text-foreground leading-relaxed">
              These Terms and Conditions are governed by the laws of Bangladesh,
              in accordance with Islamic principles. Any disputes arising from
              these terms shall be resolved in the competent courts of Bangladesh.
            </p>
          </section>

          {/* 10. Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">10. Contact Information</h2>
            <p className="text-foreground leading-relaxed mb-4">
              For questions or concerns regarding these Terms and Conditions,
              please contact us:
            </p>
            <div className="bg-muted/50 rounded-lg p-6 space-y-3">
              <p className="text-foreground">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:support@genmeta.app"
                  className="text-primary hover:underline font-medium"
                >
                  support@genmeta.app
                </a>
              </p>
              <p className="text-foreground">
                <strong>Phone:</strong>{" "}
                <a
                  href="tel:+8801817710493"
                  className="text-primary hover:underline font-medium"
                >
                  +880 1817-710493
                </a>
              </p>
              <p className="text-foreground">
                <strong>WhatsApp:</strong>{" "}
                <a
                  href="https://wa.me/8801817710493"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  +880 1817-710493
                </a>
              </p>
            </div>
          </section>

          {/* Legal Information */}
          <section>
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Legal Information</h3>
              <div className="space-y-2">
                <p className="text-foreground">
                  <strong>Trade License Number:</strong> 8875151896
                </p>
                <p className="text-foreground">
                  <strong>TIN:</strong> 892080214766
                </p>
                <p className="text-foreground">
                  <strong>Business Registration:</strong> Registered under the laws
                  of Bangladesh
                </p>
              </div>
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
