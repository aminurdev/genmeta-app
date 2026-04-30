import Link from "next/link";
import { Building2, Users, Target, Award } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl border-b border-muted/20">
      <h1 className="text-4xl font-bold mb-8 text-center">About GenMeta</h1>
      
      <div className="bg-background rounded-lg shadow-md p-6 md:p-10 mb-8">
        {/* Company Story */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Our Story
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Founded in 2024, GenMeta emerged from a simple yet powerful vision: to revolutionize 
              how content creators, photographers, and digital marketers manage their image metadata. 
              We recognized that in today&apos;s digital-first world, properly optimized images are 
              crucial for online visibility and success.
            </p>
            <p>
              What started as a small project in Rangpur, Bangladesh, has grown into a comprehensive 
              AI-powered platform serving thousands of users worldwide. Our team of dedicated developers, 
              AI specialists, and digital marketing experts work tirelessly to provide cutting-edge 
              solutions that save time and enhance productivity.
            </p>
            <p>
              At GenMeta, we believe in the power of technology to simplify complex tasks. Our 
              AI-driven platform automatically generates accurate titles, descriptions, and SEO-optimized 
              keywords for images, helping businesses and individuals maximize their online presence 
              while adhering to ethical practices and Islamic principles.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="mb-12">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Our Mission
              </h3>
              <p className="text-muted-foreground">
                To empower content creators and businesses with intelligent, efficient, and 
                ethical AI-powered tools that streamline image metadata generation, enhance 
                SEO performance, and drive digital success while maintaining the highest 
                standards of quality and integrity.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Our Vision
              </h3>
              <p className="text-muted-foreground">
                To become the world&apos;s leading AI-powered image metadata solution, 
                recognized for innovation, reliability, and commitment to helping businesses 
                and individuals achieve their digital marketing goals through cutting-edge 
                technology and exceptional service.
              </p>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Our Core Values
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-muted rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Innovation</h3>
              <p className="text-sm text-muted-foreground">
                We continuously evolve our technology to stay ahead of industry trends 
                and provide the most advanced solutions to our users.
              </p>
            </div>
            <div className="border border-muted rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Integrity</h3>
              <p className="text-sm text-muted-foreground">
                We operate with transparency, honesty, and ethical practices in all 
                aspects of our business, aligned with Islamic principles.
              </p>
            </div>
            <div className="border border-muted rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Excellence</h3>
              <p className="text-sm text-muted-foreground">
                We are committed to delivering exceptional quality in our products, 
                services, and customer support.
              </p>
            </div>
            <div className="border border-muted rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">User-Centric</h3>
              <p className="text-sm text-muted-foreground">
                Our users are at the heart of everything we do. We listen, adapt, 
                and build solutions that truly meet their needs.
              </p>
            </div>
            <div className="border border-muted rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Accessibility</h3>
              <p className="text-sm text-muted-foreground">
                We believe powerful tools should be accessible to everyone, from 
                individual creators to large enterprises.
              </p>
            </div>
            <div className="border border-muted rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Sustainability</h3>
              <p className="text-sm text-muted-foreground">
                We are committed to building a sustainable business that creates 
                long-term value for our users and community.
              </p>
            </div>
          </div>
        </section>

        {/* What We Offer */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">What We Offer</h2>
          <div className="space-y-4 text-muted-foreground">
            <ul className="space-y-3 pl-6 list-disc">
              <li>
                <strong>AI-Powered Metadata Generation:</strong> Automatically generate 
                accurate titles, descriptions, and keywords for your images using advanced 
                artificial intelligence.
              </li>
              <li>
                <strong>Bulk Processing:</strong> Process multiple images simultaneously, 
                saving hours of manual work.
              </li>
              <li>
                <strong>SEO Optimization:</strong> Enhance your online visibility with 
                SEO-optimized metadata that helps your images rank higher in search results.
              </li>
              <li>
                <strong>Desktop Application:</strong> Work offline with our powerful 
                Windows desktop application.
              </li>
              <li>
                <strong>Cloud Storage Integration:</strong> Seamlessly integrate with 
                popular cloud storage solutions.
              </li>
              <li>
                <strong>Analytics Dashboard:</strong> Track your usage, monitor performance, 
                and gain insights into your metadata optimization efforts.
              </li>
            </ul>
          </div>
        </section>

        {/* Trade License */}
        <section className="mb-8 bg-muted/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Legal Information</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Trade License Number:</strong> 8875151896
            </p>
            <p>
              <strong>Business Registration:</strong> Registered under the laws of Bangladesh
            </p>
            <p>
              <strong>Tax Identification Number (TIN):</strong> 892080214766
            </p>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="text-center bg-primary/5 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
          <p className="text-muted-foreground mb-6">
            Have questions or want to learn more about how GenMeta can help your business?
          </p>
          <Link
            href="/contact"
            className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Contact Us
          </Link>
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
