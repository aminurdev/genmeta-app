export const QUERY_KEYS = {
  overview: ["dashboard", "overview"] as const,
  profile: ["dashboard", "profile"] as const,
};

export const MUTATION_KEYS = {
  login: "login",
  logout: "logout",
} as const;
