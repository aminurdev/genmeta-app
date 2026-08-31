import Link from "next/link";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 animate-gradient-x">
            Refund Policy
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
              At GenMeta, we are committed to customer satisfaction. This Refund
              Policy outlines the terms and conditions for refunds on our
              services and products.
            </p>
          </section>

          {/* 1. Refund Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              1. Refund Eligibility
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              We offer refunds under the following conditions:
            </p>

            <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-6 mb-4">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                7-Day Money-Back Guarantee
              </h3>
              <p className="text-foreground leading-relaxed mb-3">
                If you contact us within <strong>7 days</strong> of your
                purchase, we will provide an instant refund if you have not used
                more than <strong>30% of your allocated credits</strong>.
              </p>
              <ul className="space-y-2 list-disc list-inside text-foreground ml-4">
                <li>Applies to all subscription plans and credit packages</li>
                <li>Must be requested within 7 days of purchase</li>
                <li>Credit usage must be 30% or less</li>
                <li>Instant processing upon approval</li>
              </ul>
            </div>
          </section>

          {/* 2. Non-Refundable Situations */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              2. Non-Refundable Situations
            </h2>
            <p className="text-foreground leading-relaxed mb-3">
              Refunds will <strong>NOT</strong> be granted in the following
              situations:
            </p>
            <ul className="space-y-3 list-disc list-inside text-foreground ml-4">
              <li className="leading-relaxed">
                After 7 days from the date of purchase
              </li>
              <li className="leading-relaxed">
                If you have used more than 30% of your allocated credits
              </li>
              <li className="leading-relaxed">
                If you have violated our Terms and Conditions
              </li>
              <li className="leading-relaxed">
                Engagement in prohibited or fraudulent activities
              </li>
            </ul>
          </section>

          {/* 3. How to Request a Refund */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              3. How to Request a Refund
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              To request a refund, please follow these simple steps:
            </p>
            <ol className="space-y-4 ml-4">
              <li className="text-foreground leading-relaxed">
                <strong className="text-lg">1. Contact Support</strong>
                <p className="mt-2">
                  Send an email to{" "}
                  <a
                    href="mailto:support@genmeta.app"
                    className="text-primary hover:underline font-medium"
                  >
                    support@genmeta.app
                  </a>{" "}
                  with the subject line &quot;Refund Request&quot;
                </p>
              </li>
              <li className="text-foreground leading-relaxed">
                <strong className="text-lg">2. Provide Details</strong>
                <p className="mt-2">
                  Include your account email, transaction ID, and purchase date
                </p>
              </li>
              <li className="text-foreground leading-relaxed">
                <strong className="text-lg">3. Receive Instant Refund</strong>
                <p className="mt-2">
                  If you meet the eligibility criteria, your refund will be
                  processed instantly
                </p>
              </li>
            </ol>
          </section>

          {/* 4. Refund Processing */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              4. Refund Processing
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              Once your refund is approved, it will be processed to your
              original payment method. Processing times may vary:
            </p>
            <ul className="space-y-3 list-disc list-inside text-foreground ml-4">
              <li className="leading-relaxed">
                <strong>Mobile Banking (bKash, Nagad, Rocket):</strong> 1-2
                business days
              </li>
              <li className="leading-relaxed">
                <strong>Credit/Debit Card:</strong> 3-5 business days
              </li>
              <li className="leading-relaxed">
                <strong>Bank Transfer:</strong> 5-7 business days
              </li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Note: Processing times may vary depending on your financial
              institution.
            </p>
          </section>

          {/* 5. Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              5. Changes to This Policy
            </h2>
            <p className="text-foreground leading-relaxed">
              GenMeta reserves the right to modify this Refund Policy at any
              time. Changes will be effective immediately upon posting on our
              website. Your continued use of our services after changes are
              posted constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 6. Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              6. Contact Information
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              For refund requests or questions about this policy, please contact
              us:
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
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Legal Information
              </h3>
              <div className="space-y-2">
                <p className="text-foreground">
                  <strong>Trade License Number:</strong> 8875151896
                </p>
                <p className="text-foreground">
                  <strong>TIN:</strong> 892080214766
                </p>
                <p className="text-foreground">
                  <strong>Business Registration:</strong> Registered under the
                  laws of Bangladesh
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
