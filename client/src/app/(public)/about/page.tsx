import {
  A,
  B,
  Facts,
  LEGAL_INFO,
  LegalLayout,
  P,
  Sec,
  UL,
} from "@/components/legal/legal";

export const metadata = {
  title: "About | GenMeta",
};

export default function AboutUs() {
  return (
    <LegalLayout
      title="About GenMeta"
      intro="AI-powered metadata for microstock contributors, built in Rangpur, Bangladesh."
    >
      <Sec title="Our Story">
        <P>
          Founded in 2024, GenMeta emerged from a simple yet powerful vision:
          to revolutionize how content creators, photographers, and digital
          marketers manage their image metadata. We recognized that in
          today&apos;s digital-first world, properly optimized images are
          crucial for online visibility and success.
        </P>
        <P>
          What started as a small project in Rangpur, Bangladesh, has grown
          into a comprehensive AI-powered platform serving thousands of users
          worldwide. Our team of dedicated developers, AI specialists, and
          digital marketing experts work tirelessly to provide cutting-edge
          solutions that save time and enhance productivity.
        </P>
        <P>
          At GenMeta, we believe in the power of technology to simplify complex
          tasks. Our AI-driven platform automatically generates accurate
          titles, descriptions, and SEO-optimized keywords for images, helping
          businesses and individuals maximize their online presence while
          adhering to ethical practices and Islamic principles.
        </P>
      </Sec>

      <Sec title="Our Mission">
        <P>
          To empower content creators and businesses with intelligent,
          efficient, and ethical AI-powered tools that streamline image
          metadata generation, enhance SEO performance, and drive digital
          success while maintaining the highest standards of quality and
          integrity.
        </P>
      </Sec>

      <Sec title="Our Vision">
        <P>
          To become the world&apos;s leading AI-powered image metadata
          solution, recognized for innovation, reliability, and commitment to
          helping businesses and individuals achieve their digital marketing
          goals through cutting-edge technology and exceptional service.
        </P>
      </Sec>

      <Sec title="Our Core Values">
        <UL
          items={[
            <>
              <B>Innovation:</B> We continuously evolve our technology to stay
              ahead of industry trends and provide the most advanced solutions
              to our users.
            </>,
            <>
              <B>Integrity:</B> We operate with transparency, honesty, and
              ethical practices in all aspects of our business, aligned with
              Islamic principles.
            </>,
            <>
              <B>Excellence:</B> We are committed to delivering exceptional
              quality in our products, services, and customer support.
            </>,
            <>
              <B>User-Centric:</B> Our users are at the heart of everything we
              do. We listen, adapt, and build solutions that truly meet their
              needs.
            </>,
            <>
              <B>Accessibility:</B> We believe powerful tools should be
              accessible to everyone, from individual creators to large
              enterprises.
            </>,
            <>
              <B>Sustainability:</B> We are committed to building a sustainable
              business that creates long-term value for our users and
              community.
            </>,
          ]}
        />
      </Sec>

      <Sec title="What We Offer">
        <UL
          items={[
            <>
              <B>AI-Powered Metadata Generation:</B> Automatically generate
              accurate titles, descriptions, and keywords for your images using
              advanced artificial intelligence.
            </>,
            <>
              <B>Bulk Processing:</B> Process multiple images simultaneously,
              saving hours of manual work.
            </>,
            <>
              <B>SEO Optimization:</B> Enhance your online visibility with
              SEO-optimized metadata that helps your images rank higher in
              search results.
            </>,
            <>
              <B>Desktop Application:</B> Process your files locally with our
              powerful Windows desktop application.
            </>,
            <>
              <B>Analytics Dashboard:</B> Track your usage, monitor
              performance, and gain insights into your metadata optimization
              efforts.
            </>,
          ]}
        />
      </Sec>

      <Sec title="Legal Information">
        <Facts rows={LEGAL_INFO} />
      </Sec>

      <Sec title="Get in Touch">
        <P>
          Have questions or want to learn more about how GenMeta can help your
          business? <A href="/contact">Contact us</A>.
        </P>
      </Sec>
    </LegalLayout>
  );
}
