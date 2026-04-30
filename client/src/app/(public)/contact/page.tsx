import Link from "next/link";
import { Mail, MapPin, Phone, Clock, MessageSquare } from "lucide-react";

export default function ContactUs() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl border-b border-muted/20">
      <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>
      
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Contact Information */}
        <div className="bg-background rounded-lg shadow-md p-6 md:p-8">
          <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
          <p className="text-muted-foreground mb-8">
            We&apos;re here to help! Reach out to us through any of the following channels, 
            and our team will get back to you as soon as possible.
          </p>

          <div className="space-y-6">
            {/* Business Address */}
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Business Address</h3>
                <p className="text-sm text-muted-foreground">
                  GenMeta Technologies<br />
                  Gayabari, 5 No. Ward<br />
                  Gayabari Union, Dimla<br />
                  Nilphamari, Rangpur<br />
                  Bangladesh
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Email Address</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    General Inquiries:{" "}
                    <a
                      href="mailto:info@genmeta.app"
                      className="text-blue-600 hover:underline"
                    >
                      info@genmeta.app
                    </a>
                  </p>
                  <p>
                    Support:{" "}
                    <a
                      href="mailto:support@genmeta.app"
                      className="text-blue-600 hover:underline"
                    >
                      support@genmeta.app
                    </a>
                  </p>
                  <p>
                    Sales:{" "}
                    <a
                      href="mailto:sales@genmeta.app"
                      className="text-blue-600 hover:underline"
                    >
                      sales@genmeta.app
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Phone Number</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    Office:{" "}
                    <a
                      href="tel:+8801797890685"
                      className="text-blue-600 hover:underline"
                    >
                      +880 1797-890685
                    </a>
                  </p>
                  <p>
                    Support:{" "}
                    <a
                      href="tel:+8801817710493"
                      className="text-blue-600 hover:underline"
                    >
                      +880 1817-710493
                    </a>
                  </p>
                  <p className="text-xs mt-2">
                    WhatsApp available on support number
                  </p>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Business Hours</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Saturday - Thursday: 9:00 AM - 6:00 PM (BST)</p>
                  <p>Friday: Closed</p>
                  <p className="text-xs mt-2">
                    Email support available 24/7
                  </p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Follow Us</h3>
                <div className="flex gap-4 mt-2">
                  <a
                    href="https://facebook.com/genmeta"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Facebook
                  </a>
                  <a
                    href="https://twitter.com/genmeta"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Twitter
                  </a>
                  <a
                    href="https://linkedin.com/company/genmeta"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form or Additional Info */}
        <div className="bg-background rounded-lg shadow-md p-6 md:p-8">
          <h2 className="text-2xl font-semibold mb-6">Quick Support</h2>
          
          <div className="space-y-6">
            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="font-semibold mb-3">Technical Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                For technical issues, bug reports, or feature requests, please email 
                our support team with detailed information about your issue.
              </p>
              <a
                href="mailto:support@genmeta.app?subject=Technical Support Request"
                className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Email Support
              </a>
            </div>

            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="font-semibold mb-3">Sales Inquiries</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Interested in our enterprise plans or have questions about pricing? 
                Our sales team is ready to help you find the perfect solution.
              </p>
              <a
                href="mailto:sales@genmeta.app?subject=Sales Inquiry"
                className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Contact Sales
              </a>
            </div>

            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="font-semibold mb-3">Partnership Opportunities</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Interested in partnering with GenMeta? We&apos;re always looking for 
                strategic partnerships and collaboration opportunities.
              </p>
              <a
                href="mailto:info@genmeta.app?subject=Partnership Inquiry"
                className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Discuss Partnership
              </a>
            </div>

            <div className="border border-muted rounded-lg p-6">
              <h3 className="font-semibold mb-3">Legal Information</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Trade License:</strong> 8875151896
                </p>
                <p>
                  <strong>TIN:</strong> 892080214766
                </p>
                <p>
                  <strong>Registered:</strong> Bangladesh
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section (Optional) */}
      <div className="bg-background rounded-lg shadow-md p-6 md:p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-6">Visit Our Office</h2>
        <div className="bg-muted/20 rounded-lg p-8 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            We welcome visitors by appointment. Please contact us in advance to schedule a visit.
          </p>
          <p className="text-sm text-muted-foreground">
            GenMeta Technologies<br />
            Gayabari, 5 No. Ward, Gayabari Union<br />
            Dimla, Nilphamari, Rangpur, Bangladesh
          </p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-blue-600 hover:underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
