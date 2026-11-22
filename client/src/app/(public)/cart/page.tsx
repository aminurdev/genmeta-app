import React from "react";
import Cart from "./cart";

interface CartPageProps {
  searchParams: Promise<{ planId?: string }>;
}

const CartPage = async ({ searchParams }: CartPageProps) => {
  const { planId } = await searchParams;
  return <Cart planId={planId} />;
};

export default CartPage;
