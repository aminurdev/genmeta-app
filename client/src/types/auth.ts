export interface OtpResponse {
  otpToken: string;
}

export interface TempTokenResponse {
  tempToken: string;
}

export interface LoginResponse {
  user: {
    _id: string;
    name: string;
    email: string;
    avatar: string | null;
    isVerified: boolean;
    loginProvider: ("email" | "google")[];
    role: "user" | "admin";
    accessToken: string;
    refreshToken: string;
  };
}

export interface RefreshAccessTokenResponse {
  accessToken: string;
  refreshToken: string;
}
