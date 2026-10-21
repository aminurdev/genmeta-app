import {
  A,
  B,
  Facts,
  LEGAL_INFO,
  LegalLayout,
  OL,
  P,
  Sec,
  SUPPORT_CONTACT,
  UL,
} from "@/components/legal/legal";

export const metadata = {
  title: "Refund Policy | GenMeta",
};

export default function RefundPolicy() {
  return (
    <LegalLayout
      title="Refund Policy"
      updated="August 31, 2026"
      intro="At GenMeta, we are committed to customer satisfaction. This Refund Policy outlines the terms and conditions for refunds on our services and products."
    >
      <Sec title="1. Refund Eligibility">
        <P>We offer refunds under the following conditions:</P>
        <div className="border-l-2 border-foreground/20 pl-5">
          <p className="font-medium">7-Day Money-Back Guarantee</p>
          <P className="mt-2">
            If you contact us within <B>7 days</B> of your purchase, we will
            provide an instant refund if you have not used more than{" "}
            <B>30% of your allocated credits</B>.
          </P>
          <div className="mt-3">
            <UL
              items={[
                "Applies to all subscription plans and credit packages",
                "Must be requested within 7 days of purchase",
                "Credit usage must be 30% or less",
                "Instant processing upon approval",
              ]}
            />
          </div>
        </div>
      </Sec>

      <Sec title="2. Non-Refundable Situations">
        <P>
          Refunds will <B>NOT</B> be granted in the following situations:
        </P>
        <UL
          items={[
            "After 7 days from the date of purchase",
            "If you have used more than 30% of your allocated credits",
            "If you have violated our Terms and Conditions",
            "Engagement in prohibited or fraudulent activities",
          ]}
        />
      </Sec>

      <Sec title="3. How to Request a Refund">
        <P>To request a refund, please follow these simple steps:</P>
        <OL
          items={[
            <>
              <B>Contact Support.</B> Send an email to{" "}
              <A href="mailto:support@genmeta.app">support@genmeta.app</A> with
              the subject line &quot;Refund Request&quot;.
            </>,
            <>
              <B>Provide Details.</B> Include your account email, transaction
              ID, and purchase date.
            </>,
            <>
              <B>Receive Instant Refund.</B> If you meet the eligibility
              criteria, your refund will be processed instantly.
            </>,
          ]}
        />
      </Sec>

      <Sec title="4. Refund Processing">
        <P>
          Once your refund is approved, it will be processed to your original
          payment method. Processing times may vary:
        </P>
        <UL
          items={[
            <>
              <B>Mobile Banking (bKash, Nagad, Rocket):</B> 1-2 business days
            </>,
            <>
              <B>Credit/Debit Card:</B> 3-5 business days
            </>,
            <>
              <B>Bank Transfer:</B> 5-7 business days
            </>,
          ]}
        />
        <p className="text-sm text-muted-foreground">
          Note: Processing times may vary depending on your financial
          institution.
        </p>
      </Sec>

      <Sec title="5. Changes to This Policy">
        <P>
          GenMeta reserves the right to modify this Refund Policy at any time.
          Changes will be effective immediately upon posting on our website.
          Your continued use of our services after changes are posted
          constitutes acceptance of the updated policy.
        </P>
      </Sec>

      <Sec title="6. Contact Information">
        <P>
          For refund requests or questions about this policy, please contact
          us:
        </P>
        <Facts rows={SUPPORT_CONTACT} />
      </Sec>

      <Sec title="Legal Information">
        <Facts rows={LEGAL_INFO} />
      </Sec>
    </LegalLayout>
  );
}
