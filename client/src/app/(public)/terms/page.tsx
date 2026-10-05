import {
  A,
  B,
  Facts,
  LEGAL_INFO,
  LegalLayout,
  P,
  Sec,
  SUPPORT_CONTACT,
  UL,
} from "@/components/legal/legal";

export const metadata = {
  title: "Terms and Conditions | GenMeta",
};

export default function TermsAndConditions() {
  return (
    <LegalLayout title="Terms and Conditions" updated="August 31, 2026">
      <Sec title="1. Definitions">
        <UL
          items={[
            <>
              <B>&quot;App&quot;:</B> Refers to GenMeta.app, including all its
              features and services.
            </>,
            <>
              <B>&quot;User&quot;:</B> Any individual or entity using
              GenMeta.app.
            </>,
            <>
              <B>&quot;Content&quot;:</B> Any data, text, images, or other
              material generated, uploaded, or shared through the App.
            </>,
          ]}
        />
      </Sec>

      <Sec title="2. Acceptance of Terms">
        <P>
          By accessing or using GenMeta.app, you agree to comply with these
          Terms and Conditions. If you do not agree, please refrain from using
          the App.
        </P>
      </Sec>

      <Sec title="3. User Responsibilities">
        <UL
          items={[
            <>
              <B>Lawful Use:</B> Users must use the App in compliance with all
              applicable local, national, and international laws and
              regulations.
            </>,
            <>
              <B>Islamic Compliance:</B> Users are expected to ensure that
              their use of the App aligns with Islamic principles and does not
              promote or engage in activities contrary to Islamic teachings.
            </>,
            <>
              <B>Content Ownership:</B> Users retain ownership of the Content
              they create or upload but grant GenMeta.app a license to use,
              display, and distribute such Content as necessary to operate the
              App.
            </>,
          ]}
        />
      </Sec>

      <Sec title="4. Prohibited Activities">
        <P>Users are prohibited from:</P>
        <UL
          items={[
            "Uploading or sharing Content that is offensive, defamatory, obscene, or violates any laws or Islamic principles.",
            "Engaging in activities that harm, disrupt, or interfere with the App's functionality or security.",
            "Attempting unauthorized access to other users' accounts or GenMeta.app's systems.",
          ]}
        />
      </Sec>

      <Sec title="5. Intellectual Property">
        <UL
          items={[
            "All intellectual property rights related to the App, including but not limited to software, design, and trademarks, are owned by GenMeta.app.",
            "Users may not use GenMeta.app's intellectual property without prior written consent.",
          ]}
        />
      </Sec>

      <Sec title="6. Limitation of Liability">
        <P>
          GenMeta.app is provided &quot;as is&quot; without warranties of any
          kind. We are not liable for any damages arising from the use or
          inability to use the App, including but not limited to direct,
          indirect, incidental, or consequential damages.
        </P>
      </Sec>

      <Sec title="7. Account Termination">
        <P>
          We reserve the right to suspend or terminate user accounts at our
          discretion, especially in cases of violation of these Terms and
          Conditions or engagement in prohibited activities.
        </P>
      </Sec>

      <Sec title="8. Changes to Terms">
        <P>
          GenMeta.app may update these Terms and Conditions periodically. Users
          will be notified of significant changes, and continued use of the App
          constitutes acceptance of the updated terms.
        </P>
      </Sec>

      <Sec title="9. Governing Law">
        <P>
          These Terms and Conditions are governed by the laws of Bangladesh, in
          accordance with Islamic principles. Any disputes arising from these
          terms shall be resolved in the competent courts of Bangladesh.
        </P>
      </Sec>

      <Sec title="10. Contact Information">
        <P>
          For questions or concerns regarding these Terms and Conditions,
          please contact us:
        </P>
        <Facts rows={SUPPORT_CONTACT} />
      </Sec>

      <Sec title="Legal Information">
        <Facts rows={LEGAL_INFO} />
      </Sec>
    </LegalLayout>
  );
}
