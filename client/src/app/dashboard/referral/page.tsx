import React from "react";
import { ReferralDashboard } from "./referral";
import { getReferralDetails } from "@/services/referral";

const page = async () => {
  const data = await getReferralDetails();
  console.log(data);
  return (
    <div>
      <ReferralDashboard referralData={data.data} />
    </div>
  );
};

export default page;
