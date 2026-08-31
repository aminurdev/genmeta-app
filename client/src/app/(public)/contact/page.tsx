import Link from "next/link";
import { Mail, Phone, Github, MessageCircle, User } from "lucide-react";

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 animate-gradient-x">
            Contact Us
          </h1>
          <p className="text-muted-foreground text-lg">
            Get in touch with our team
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Business Contact */}
          <div className="bg-card rounded-lg shadow-lg border p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Business Contact</h2>
            <p className="text-muted-foreground mb-8">
              For support, sales inquiries, or general questions about GenMeta
            </p>

            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">Email</h3>
                  <a
                    href="mailto:support@genmeta.app"
                    className="text-primary hover:underline font-medium"
                  >
                    support@genmeta.app
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">Phone</h3>
                  <a
                    href="tel:+8801817710493"
                    className="text-primary hover:underline font-medium"
                  >
                    +880 1817-710493
                  </a>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">WhatsApp</h3>
                  <a
                    href="https://wa.me/8801817710493"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    +880 1817-710493
                  </a>
                </div>
              </div>

              {/* Legal Info */}
              <div className="bg-muted/50 rounded-lg p-6 mt-8">
                <h3 className="font-semibold text-foreground mb-4">Legal Information</h3>
                <div className="space-y-2 text-sm text-foreground">
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

          {/* Developer Contact */}
          <div className="bg-card rounded-lg shadow-lg border p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Developer Contact</h2>
            <p className="text-muted-foreground mb-8">
              For technical discussions, collaboration, or development inquiries
            </p>

            <div className="space-y-6">
              {/* Developer Name */}
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">Developer</h3>
                  <p className="text-foreground font-medium">Aminur Rahman</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">Email</h3>
                  <a
                    href="mailto:aminurrahman.me@gmail.com"
                    className="text-primary hover:underline font-medium break-all"
                  >
                    aminurrahman.me@gmail.com
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">Phone</h3>
                  <a
                    href="tel:+8801755143182"
                    className="text-primary hover:underline font-medium"
                  >
                    +880 1755-143182
                  </a>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">WhatsApp</h3>
                  <a
                    href="https://wa.me/8801755143182"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    +880 1755-143182
                  </a>
                </div>
              </div>

              {/* GitHub */}
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Github className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">GitHub</h3>
                  <a
                    href="https://github.com/aminurdev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    github.com/aminurdev
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card rounded-lg shadow-lg border p-6 text-center">
            <h3 className="font-semibold text-foreground mb-3">Technical Support</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Need help with the app or have a technical issue?
            </p>
            <a
              href="mailto:support@genmeta.app?subject=Technical Support"
              className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Get Support
            </a>
          </div>

          <div className="bg-card rounded-lg shadow-lg border p-6 text-center">
            <h3 className="font-semibold text-foreground mb-3">Sales Inquiry</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Interested in our plans or have questions about pricing?
            </p>
            <a
              href="mailto:support@genmeta.app?subject=Sales Inquiry"
              className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Contact Sales
            </a>
          </div>

          <div className="bg-card rounded-lg shadow-lg border p-6 text-center">
            <h3 className="font-semibold text-foreground mb-3">General Inquiry</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Have a question or feedback? We&apos;d love to hear from you
            </p>
            <a
              href="mailto:support@genmeta.app?subject=General Inquiry"
              className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Send Message
            </a>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="text-center">
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
