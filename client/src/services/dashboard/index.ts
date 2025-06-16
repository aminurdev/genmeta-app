import { apiRequest } from "../api";

export const getOverview = async () => {
  const result = await apiRequest({
    method: "GET",
    endpoint: "/users/dashboard/overview",
  });

  return result;
};
export const getProfile = async () => {
  const result = await apiRequest({
    method: "GET",
    endpoint: "/users/dashboard/profile",
  });

  return result;
};
