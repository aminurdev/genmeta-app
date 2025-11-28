import Overview from "@/components/dashboard/overview";

interface Props {
  searchParams: Promise<{ status?: string; amount?: number; trxID?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const { amount, status, trxID } = await searchParams;

  console.log(amount, status, trxID);

  return <Overview />;
}

