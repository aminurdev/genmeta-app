import { Cart } from "@/components/main/cart";
import React from "react";

const CartPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type: string }>;
}) => {
  const id = (await params).id;
  const type = (await searchParams).type;
  return (
    <div>
      <Cart id={id} type={type} />
    </div>
  );
};

export default CartPage;
