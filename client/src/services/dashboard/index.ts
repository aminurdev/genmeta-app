import { apiRequest } from "../api";

export const getOverview = async () => {
  const result = await apiRequest({
    method: "GET",
    endpoint: "/users/dashboard/overview",
  });

  return result;
};
