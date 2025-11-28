export const QUERY_KEYS = {
  overview: ["dashboard", "overview"],
  profile: ["dashboard", "profile"],
  referralDetails: ["dashboard", "referralDetails"],

  adminOverview: ["admin", "overview"],
  usersStats: ["users", "stats"],
  allUsers: (queryParams: string) => ["users", "all", queryParams],
} as const;

export const MUTATION_KEYS = {
  login: "login",
  logout: "logout",
} as const;
