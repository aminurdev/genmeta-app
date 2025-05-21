import PaymentSuccess from "./paymentSuccess";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId: string }>;
}) {
  const orderId = (await searchParams).orderId;
  return <PaymentSuccess orderId={orderId} />;
}
