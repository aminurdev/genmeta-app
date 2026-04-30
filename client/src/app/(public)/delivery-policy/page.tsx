import Link from "next/link";

export default function DeliveryPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl border-b border-muted/20">
      <h1 className="text-3xl font-bold mb-8 text-center">Delivery Policy</h1>
      <div className="bg-background rounded-lg shadow-md p-6 md:p-8">
        <p className="text-sm text-muted-foreground mb-6 text-right">
          Last Updated: April 29, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Overview</h2>
          <p className="text-muted-foreground">
            GenMeta provides digital products and services that are delivered electronically. 
            This Delivery Policy outlines how and when you will receive access to our products 
            and services after purchase. As we offer digital goods, there is no physical shipping 
            involved.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Types of Digital Delivery</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">2.1 Subscription Plans</h3>
              <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
                <li>
                  <strong>Instant Activation:</strong> Upon successful payment, your subscription 
                  is activated immediately and automatically.
                </li>
                <li>
                  You will receive a confirmation email within 5 minutes containing your account 
                  details and access instructions.
                </li>
                <li>
                  You can log in to your account dashboard immediately to start using the service.
                </li>
                <li>
                  Credits and features associated with your plan are available instantly.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">2.2 Credit Packages</h3>
              <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
                <li>
                  Credits are added to your account automatically within 2-5 minutes of successful 
                  payment.
                </li>
                <li>
                  You will receive an email confirmation once credits are added to your account.
                </li>
                <li>
                  You can verify your credit balance in your account dashboard.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">2.3 Desktop Application</h3>
              <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
                <li>
                  <strong>Download Link:</strong> After purchase, you will receive an email with 
                  a secure download link for the Windows desktop application.
                </li>
                <li>
                  The download link is sent within 5-10 minutes of payment confirmation.
                </li>
                <li>
                  Your license key will be included in the email and automatically activated 
                  upon installation.
                </li>
                <li>
                  You can also download the application from your account dashboard at any time.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">2.4 API Access</h3>
              <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
                <li>
                  API keys are generated instantly upon subscription or purchase.
                </li>
                <li>
                  You can access your API keys from your account dashboard immediately.
                </li>
                <li>
                  API documentation and integration guides are available in your account.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Delivery Timeframes</h2>
          <div className="bg-muted/30 rounded-lg p-6">
            <ul className="space-y-3 text-muted-foreground">
              <li>
                <strong>Immediate (0-5 minutes):</strong> Account activation, subscription access, 
                API key generation
              </li>
              <li>
                <strong>5-10 minutes:</strong> Email confirmations, download links, license keys
              </li>
              <li>
                <strong>Up to 30 minutes:</strong> Manual verification for large enterprise orders 
                or unusual payment methods
              </li>
              <li>
                <strong>Up to 24 hours:</strong> Custom enterprise solutions requiring manual setup
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Payment Verification</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              In some cases, we may need to verify your payment before delivering access to our 
              services. This typically occurs when:
            </p>
            <ul className="space-y-2 pl-6 list-disc">
              <li>The payment method requires manual verification (bank transfer, mobile banking)</li>
              <li>The transaction is flagged by our fraud prevention system</li>
              <li>It&apos;s your first purchase with us and the amount is significant</li>
              <li>You&apos;re purchasing an enterprise plan</li>
            </ul>
            <p className="mt-4">
              If verification is required, our team will contact you via email within 2-4 hours 
              during business hours (Saturday-Thursday, 9 AM - 6 PM BST).
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Delivery Confirmation</h2>
          <p className="text-muted-foreground mb-4">
            You will receive delivery confirmation through multiple channels:
          </p>
          <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
            <li>
              <strong>Email Notification:</strong> Sent to your registered email address with 
              access details and instructions
            </li>
            <li>
              <strong>Account Dashboard:</strong> Your account status will be updated to reflect 
              your active subscription or credits
            </li>
            <li>
              <strong>SMS (Optional):</strong> For mobile banking payments, you may receive an 
              SMS confirmation
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Delivery Issues</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">6.1 If You Don&apos;t Receive Access</h3>
              <p className="text-muted-foreground mb-3">
                If you haven&apos;t received access within the expected timeframe:
              </p>
              <ol className="space-y-2 pl-6 list-decimal text-muted-foreground">
                <li>Check your spam/junk email folder for our confirmation email</li>
                <li>Verify that you used the correct email address during registration</li>
                <li>Check your account dashboard to see if access has been granted</li>
                <li>
                  Contact our support team at{" "}
                  <a
                    href="mailto:support@genmeta.app"
                    className="text-blue-600 hover:underline"
                  >
                    support@genmeta.app
                  </a>{" "}
                  with your transaction details
                </li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">6.2 Technical Issues</h3>
              <p className="text-muted-foreground">
                If you experience technical issues accessing your purchased products or services, 
                our support team is available to assist you. We will work to resolve any technical 
                issues within 24 hours of your report.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Re-Delivery & Access Recovery</h2>
          <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
            <li>
              <strong>Lost Email:</strong> You can request a new confirmation email at any time 
              from your account dashboard or by contacting support.
            </li>
            <li>
              <strong>Download Links:</strong> Desktop application download links remain valid 
              for 30 days. After expiration, you can generate a new link from your account.
            </li>
            <li>
              <strong>License Keys:</strong> Your license keys are permanently stored in your 
              account and can be retrieved at any time.
            </li>
            <li>
              <strong>Account Recovery:</strong> If you lose access to your account, use the 
              password reset feature or contact support for assistance.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Enterprise & Custom Solutions</h2>
          <p className="text-muted-foreground mb-4">
            For enterprise customers and custom solutions:
          </p>
          <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
            <li>
              Delivery timelines are agreed upon during the contract negotiation phase
            </li>
            <li>
              A dedicated account manager will coordinate the delivery and setup process
            </li>
            <li>
              Custom integrations may require 2-5 business days for setup and testing
            </li>
            <li>
              Training and onboarding sessions will be scheduled as per the agreement
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">9. Service Availability</h2>
          <p className="text-muted-foreground mb-4">
            GenMeta services are delivered digitally and are available 24/7, subject to:
          </p>
          <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
            <li>
              <strong>Scheduled Maintenance:</strong> We may perform scheduled maintenance with 
              advance notice. During maintenance, service access may be temporarily limited.
            </li>
            <li>
              <strong>Uptime Guarantee:</strong> We maintain a 99.9% uptime guarantee for our 
              services (excluding scheduled maintenance).
            </li>
            <li>
              <strong>Service Status:</strong> You can check our service status at any time 
              from your account dashboard.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">10. International Delivery</h2>
          <p className="text-muted-foreground">
            As our products are delivered digitally, they are available worldwide instantly. 
            There are no geographical restrictions or additional delivery charges based on 
            location. However, you are responsible for ensuring that your use of our services 
            complies with local laws and regulations in your jurisdiction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">11. Support & Assistance</h2>
          <p className="text-muted-foreground mb-4">
            If you need assistance with delivery or access to your purchased products:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <strong>Email Support:</strong>{" "}
              <a
                href="mailto:support@genmeta.app"
                className="text-blue-600 hover:underline"
              >
                support@genmeta.app
              </a>
            </li>
            <li>
              <strong>Phone Support:</strong>{" "}
              <a href="tel:+8801797890685" className="text-blue-600 hover:underline">
                +880 1797-890685
              </a>{" "}
              |{" "}
              <a href="tel:+8801817710493" className="text-blue-600 hover:underline">
                +880 1817-710493
              </a>
            </li>
            <li>
              <strong>Business Hours:</strong> Saturday-Thursday, 9:00 AM - 6:00 PM (BST)
            </li>
            <li>
              <strong>Emergency Support:</strong> Available 24/7 via email for critical issues
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">12. Changes to This Policy</h2>
          <p className="text-muted-foreground">
            GenMeta reserves the right to modify this Delivery Policy at any time. Changes will 
            be effective immediately upon posting on our website. Continued use of our services 
            after changes are posted constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="bg-muted/20 rounded-lg p-6">
          <h3 className="font-semibold mb-2">Legal Information</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <strong>Trade License Number:</strong> 8875151896
            </p>
            <p>
              <strong>TIN:</strong> 892080214766
            </p>
            <p>
              <strong>Business Address:</strong> GenMeta Technologies, Gayabari, 5 No. Ward, 
              Gayabari Union, Dimla, Nilphamari, Rangpur, Bangladesh
            </p>
            <p>
              <strong>Contact:</strong> support@genmeta.app | +880 1797-890685 | +880 1817-710493
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
