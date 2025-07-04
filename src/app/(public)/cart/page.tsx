import React from "react";
import Cart from "./cart";

const CartPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ planId: string }>;
}) => {
  const planId = (await searchParams).planId;
  return <Cart planId={planId} />;
};

export default CartPage;
