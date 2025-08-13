import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl  border-b border-muted/20">
      <h1 className="text-3xl font-bold mb-8 text-center">Privacy Policy</h1>
      <div className="rounded-lg shadow-md p-6 md:p-8">
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Introduction</h2>
          <p>
            At GenMeta.app, we are committed to safeguarding your privacy and
            ensuring that your personal information is protected in compliance
            with Islamic principles and applicable laws. This Privacy Policy
            outlines how we collect, use, and protect your data when you use our
            services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Information We Collect</h2>
          <ul className="space-y-4 pl-6 list-disc">
            <li>
              <strong>Personal Information:</strong> When you register or
              interact with our app, we may collect personal details such as
              your name, email address, and contact information.
            </li>
            <li>
              <strong>Usage Data:</strong> We gather information on how you use
              our services, including your interactions within the app, to
              enhance user experience.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Use of Collected Information
          </h2>
          <ul className="space-y-4 pl-6 list-disc">
            <li>
              <strong>Service Provision:</strong> Your personal information is
              utilized to provide and improve our services, ensuring they align
              with your needs and preferences.
            </li>
            <li>
              <strong>Communication:</strong> We may use your contact details to
              inform you about updates, new features, or changes to our
              services.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Data Sharing and Disclosure
          </h2>
          <ul className="space-y-4 pl-6 list-disc">
            <li>
              <strong>Third-Party Services:</strong> We do not share your
              personal information with third parties for their own marketing
              purposes. Any data shared with third-party service providers is
              solely to assist in delivering our services and is handled with
              strict confidentiality.
            </li>
            <li>
              <strong>Legal Obligations:</strong> We may disclose your
              information if required by law or to protect our rights and comply
              with legal proceedings.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Data Security</h2>
          <p>
            We implement robust security measures to protect your personal data
            from unauthorized access, alteration, or disclosure, adhering to
            both industry standards and Islamic ethical guidelines.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">User Rights</h2>
          <ul className="space-y-4 pl-6 list-disc">
            <li>
              <strong>Access and Correction:</strong> You have the right to
              access the personal information we hold about you and request
              corrections if necessary.
            </li>
            <li>
              <strong>Consent Withdrawal:</strong> You may withdraw your consent
              for us to process your data at any time, understanding that this
              may affect your ability to use certain features of our app.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Children&apos;s Privacy
          </h2>
          <p>
            Our services are not intended for individuals under the age of 13.
            We do not knowingly collect personal information from children under
            13. If we become aware of such data collection, we will take steps
            to delete the information promptly.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Changes to This Privacy Policy
          </h2>
          <p>
            We may update this Privacy Policy periodically. We will notify you
            of any significant changes through our app or via email.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
          <p className="mb-4">
            If you have any questions or concerns about this Privacy Policy,
            please contact us at:
          </p>
          <ul className="space-y-2">
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
              <strong>Address:</strong> Niphamari, Rangpur, Bangladesh
            </li>
          </ul>
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
