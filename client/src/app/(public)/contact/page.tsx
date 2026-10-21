import {
  A,
  Facts,
  LEGAL_INFO,
  LegalLayout,
  P,
  Sec,
  SUPPORT_CONTACT,
} from "@/components/legal/legal";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Contact & Support — Get in Touch | GenMeta",
  description:
    "Contact the GenMeta support team for assistance with desktop app installation, billing, account queries, or partnership opportunities.",
  path: "/contact",
});

export default function ContactUs() {
  return (
    <LegalLayout title="Contact us" intro="Get in touch with our team.">
      <Sec title="Business contact">
        <P>For support, sales inquiries, or general questions about GenMeta.</P>
        <Facts rows={SUPPORT_CONTACT} />
        <P>
          Prefer a specific topic?{" "}
          <A href="mailto:support@genmeta.app?subject=Technical Support">
            Technical support
          </A>
          ,{" "}
          <A href="mailto:support@genmeta.app?subject=Sales Inquiry">
            sales inquiry
          </A>{" "}
          or{" "}
          <A href="mailto:support@genmeta.app?subject=General Inquiry">
            general inquiry
          </A>
          .
        </P>
      </Sec>

      <Sec title="Developer contact">
        <P>For technical discussions, collaboration, or development inquiries.</P>
        <Facts
          rows={[
            ["Developer", "Aminur Rahman"],
            [
              "Email",
              <A key="e" href="mailto:aminurrahman.me@gmail.com">
                aminurrahman.me@gmail.com
              </A>,
            ],
            [
              "Phone",
              <A key="p" href="tel:+8801755143182">
                +880 1755-143182
              </A>,
            ],
            [
              "WhatsApp",
              <A key="w" href="https://wa.me/8801755143182">
                +880 1755-143182
              </A>,
            ],
            [
              "GitHub",
              <A key="g" href="https://github.com/aminurdev">
                github.com/aminurdev
              </A>,
            ],
          ]}
        />
      </Sec>

      <Sec title="Legal information">
        <Facts rows={LEGAL_INFO} />
      </Sec>
    </LegalLayout>
  );
}
