import Link from "next/link";

export default function TermsAndConditions() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl border-b border-muted/20">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Terms and Conditions
      </h1>
      <div className="bg-background rounded-lg shadow-md p-6 md:p-8">
        <p className="text-sm text-muted-foreground mb-6 text-right">
          Last Updated: 18 March 2025
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Definitions</h2>
          <ul className="space-y-2 pl-6 list-disc">
            <li>
              <strong>&quot;App&quot;:</strong> Refers to GenMeta.app, including
              all its features and services.
            </li>
            <li>
              <strong>&quot;User&quot;:</strong> Any individual or entity using
              GenMeta.app.
            </li>
            <li>
              <strong>&quot;Content&quot;:</strong> Any data, text, images, or
              other material generated, uploaded, or shared through the App.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Acceptance of Terms</h2>
          <p>
            By accessing or using GenMeta.app, you agree to comply with these
            Terms and Conditions. If you do not agree, please refrain from using
            the App.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            3. User Responsibilities
          </h2>
          <ul className="space-y-2 pl-6 list-disc">
            <li>
              <strong>Lawful Use:</strong> Users must use the App in compliance
              with all applicable local, national, and international laws and
              regulations.
            </li>
            <li>
              <strong>Islamic Compliance:</strong> Users are expected to ensure
              that their use of the App aligns with Islamic principles and does
              not promote or engage in activities contrary to Islamic teachings.
            </li>
            <li>
              <strong>Content Ownership:</strong> Users retain ownership of the
              Content they create or upload but grant GenMeta.app a license to
              use, display, and distribute such Content as necessary to operate
              the App.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            4. Prohibited Activities
          </h2>
          <p className="mb-2">Users are prohibited from:</p>
          <ul className="space-y-2 pl-6 list-disc">
            <li>
              Uploading or sharing Content that is offensive, defamatory,
              obscene, or violates any laws or Islamic principles.
            </li>
            <li>
              Engaging in activities that harm, disrupt, or interfere with the
              App&apos;s functionality or security.
            </li>
            <li>
              Attempting unauthorized access to other users&apos;s accounts or
              GenMeta.app&apos;s systems.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            5. Intellectual Property
          </h2>
          <ul className="space-y-2 pl-6 list-disc">
            <li>
              All intellectual property rights related to the App, including but
              not limited to software, design, and trademarks, are owned by
              GenMeta.app.
            </li>
            <li>
              Users may not use GenMeta.app&apos;s intellectual property without
              prior written consent.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            6. Limitation of Liability
          </h2>
          <p>
            GenMeta.app is provided &quot;as is&quot; without warranties of any
            kind. We are not liable for any damages arising from the use or
            inability to use the App, including but not limited to direct,
            indirect, incidental, or consequential damages.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Account Termination</h2>
          <p>
            We reserve the right to suspend or terminate user accounts at our
            discretion, especially in cases of violation of these Terms and
            Conditions or engagement in prohibited activities.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Changes to Terms</h2>
          <p>
            GenMeta.app may update these Terms and Conditions periodically.
            Users will be notified of significant changes, and continued use of
            the App constitutes acceptance of the updated terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">9. Governing Law</h2>
          <p>
            These Terms and Conditions are governed by the laws of Bangladesh,
            in accordance with Islamic principles. Any disputes arising from
            these terms shall be resolved in the competent courts of Bangladesh.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            10. Contact Information
          </h2>
          <p>
            For questions or concerns regarding these Terms and Conditions,
            please contact us at{" "}
            <a
              href="mailto:support@genmeta.app"
              className="text-blue-600 hover:underline"
            >
              support@genmeta.app
            </a>
          </p>
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
