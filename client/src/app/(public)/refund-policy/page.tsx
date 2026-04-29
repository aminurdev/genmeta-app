import Link from "next/link";

export default function RefundPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl border-b border-muted/20">
      <h1 className="text-3xl font-bold mb-8 text-center">Return & Refund Policy</h1>
      <div className="bg-background rounded-lg shadow-md p-6 md:p-8">
        <p className="text-sm text-muted-foreground mb-6 text-right">
          Last Updated: April 29, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Overview</h2>
          <p className="text-muted-foreground">
            At GenMeta, we are committed to customer satisfaction. This Return & Refund Policy 
            outlines the terms and conditions for refunds on our digital services and products. 
            Please read this policy carefully before making a purchase.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Digital Products & Services</h2>
          <p className="text-muted-foreground mb-4">
            GenMeta offers digital products and services, including:
          </p>
          <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
            <li>Subscription plans (Monthly, Yearly)</li>
            <li>Credit packages for API usage</li>
            <li>Desktop application licenses</li>
            <li>Enterprise solutions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Refund Eligibility</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">3.1 Subscription Plans</h3>
              <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
                <li>
                  <strong>7-Day Money-Back Guarantee:</strong> If you are not satisfied with 
                  our service, you may request a full refund within 7 days of your initial 
                  purchase or subscription renewal.
                </li>
                <li>
                  Refunds are only applicable if you have used less than 20% of your allocated 
                  credits or processing quota.
                </li>
                <li>
                  Refund requests must be submitted through our support email with a valid reason.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3.2 Credit Packages</h3>
              <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
                <li>
                  Credit packages are refundable within 7 days of purchase if less than 10% 
                  of the credits have been used.
                </li>
                <li>
                  Unused credits do not expire and can be used at any time, so refunds are 
                  only granted in exceptional circumstances.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3.3 Desktop Application</h3>
              <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
                <li>
                  Desktop application licenses are refundable within 14 days of purchase if 
                  you experience technical issues that cannot be resolved by our support team.
                </li>
                <li>
                  You must provide evidence of the technical issue and demonstrate that you 
                  have worked with our support team to resolve it.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Non-Refundable Situations</h2>
          <p className="text-muted-foreground mb-4">
            Refunds will NOT be granted in the following situations:
          </p>
          <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
            <li>
              After the applicable refund period has expired (7 days for subscriptions and 
              credits, 14 days for desktop application).
            </li>
            <li>
              If you have violated our Terms and Conditions or engaged in prohibited activities.
            </li>
            <li>
              If you have used more than the allowed percentage of credits or services as 
              specified in the eligibility criteria.
            </li>
            <li>
              Change of mind after the refund period has expired.
            </li>
            <li>
              Promotional or discounted purchases (unless otherwise stated).
            </li>
            <li>
              Enterprise custom solutions after development has commenced.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. How to Request a Refund</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>To request a refund, please follow these steps:</p>
            <ol className="space-y-3 pl-6 list-decimal">
              <li>
                <strong>Contact Support:</strong> Send an email to{" "}
                <a
                  href="mailto:support@genmeta.app"
                  className="text-blue-600 hover:underline"
                >
                  support@genmeta.app
                </a>{" "}
                with the subject line &quot;Refund Request&quot;.
              </li>
              <li>
                <strong>Provide Details:</strong> Include your account email, order/transaction 
                ID, purchase date, and a detailed reason for the refund request.
              </li>
              <li>
                <strong>Wait for Review:</strong> Our team will review your request within 
                2-3 business days and respond with a decision.
              </li>
              <li>
                <strong>Refund Processing:</strong> If approved, refunds will be processed 
                within 5-7 business days to your original payment method.
              </li>
            </ol>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Refund Processing Time</h2>
          <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
            <li>
              <strong>Credit/Debit Card:</strong> 5-7 business days after approval
            </li>
            <li>
              <strong>Mobile Banking (bKash, Nagad, Rocket):</strong> 2-3 business days after approval
            </li>
            <li>
              <strong>Bank Transfer:</strong> 7-10 business days after approval
            </li>
            <li>
              <strong>PayPal:</strong> 3-5 business days after approval
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Note: Processing times may vary depending on your financial institution.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Cancellation Policy</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              <strong>Subscription Cancellation:</strong> You may cancel your subscription at 
              any time from your account dashboard. Upon cancellation:
            </p>
            <ul className="space-y-2 pl-6 list-disc">
              <li>
                You will retain access to your subscription benefits until the end of your 
                current billing period.
              </li>
              <li>
                No refund will be provided for the remaining days of your current billing cycle 
                (unless within the 7-day refund period).
              </li>
              <li>
                Your subscription will not auto-renew for the next billing period.
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Partial Refunds</h2>
          <p className="text-muted-foreground">
            In certain circumstances, we may offer partial refunds at our discretion. This may 
            include situations where you have used a portion of the service but experienced 
            significant issues that affected your ability to use the full service. Partial 
            refund decisions are made on a case-by-case basis.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">9. Chargebacks</h2>
          <p className="text-muted-foreground mb-4">
            If you initiate a chargeback with your payment provider without first contacting 
            our support team:
          </p>
          <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
            <li>Your account will be immediately suspended pending investigation.</li>
            <li>
              If the chargeback is found to be unjustified, your account may be permanently 
              terminated.
            </li>
            <li>
              We encourage you to contact us first to resolve any billing disputes before 
              initiating a chargeback.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">10. Changes to This Policy</h2>
          <p className="text-muted-foreground">
            GenMeta reserves the right to modify this Return & Refund Policy at any time. 
            Changes will be effective immediately upon posting on our website. Your continued 
            use of our services after changes are posted constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">11. Contact Information</h2>
          <p className="text-muted-foreground mb-4">
            For refund requests or questions about this policy, please contact us:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <strong>Email:</strong>{" "}
              <a
                href="mailto:support@genmeta.app"
                className="text-blue-600 hover:underline"
              >
                support@genmeta.app
              </a>
            </li>
            <li>
              <strong>Phone:</strong>{" "}
              <a href="tel:+8801812345678" className="text-blue-600 hover:underline">
                +880 1812-345678
              </a>
            </li>
            <li>
              <strong>Address:</strong> GenMeta Technologies, House #45, Road #12, Block-C, 
              Niphamari, Rangpur - 5400, Bangladesh
            </li>
          </ul>
        </section>

        <section className="bg-muted/20 rounded-lg p-6">
          <h3 className="font-semibold mb-2">Legal Information</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <strong>Trade License Number:</strong> TRAD/DNCC/123456/2024
            </p>
            <p>
              <strong>Business Registration:</strong> Registered under the laws of Bangladesh
            </p>
          </div>
        </section>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-blue-600 hover:underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
