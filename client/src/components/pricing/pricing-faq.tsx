"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function PricingFaq() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>
            What&apos;s the difference between subscription and credit plans?
          </AccordionTrigger>
          <AccordionContent>
            Subscription plans offer ongoing access to our services for a set
            period, while credit plans allow you to pay for exactly what you
            use. Subscriptions are ideal for regular users, while credits work
            better for occasional usage.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger>Can I upgrade my plan later?</AccordionTrigger>
          <AccordionContent>
            Yes, you can upgrade or downgrade your subscription plan at any
            time. Credits are non-refundable once purchased but never expire, so
            you can use them whenever you need.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger>How do promo codes work?</AccordionTrigger>
          <AccordionContent>
            Promo codes provide additional discounts on your purchase. Some
            codes work for both subscription and credit plans, while others are
            specific to one plan type. You can apply promo codes during checkout
            for instant savings.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger>
            What payment methods do you accept?
          </AccordionTrigger>
          <AccordionContent>
            We currently support bKash as our payment processor. We plan to add
            more payment methods in the future to give you more options for
            purchasing our services.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5">
          <AccordionTrigger>Do credits expire?</AccordionTrigger>
          <AccordionContent>
            No, once purchased, your credits never expire and can be used
            whenever you need them. They&apos;ll remain in your account until
            you use them all.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-6">
          <AccordionTrigger>
            What happens when my subscription ends?
          </AccordionTrigger>
          <AccordionContent>
            When your subscription period ends, you&apos;ll need to renew it to
            continue accessing premium features. We&apos;ll send you reminders
            before your subscription expires so you can decide whether to renew.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
