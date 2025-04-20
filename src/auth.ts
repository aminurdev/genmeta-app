import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { cookies } from "next/headers";

const baseApi = process.env.NEXT_PUBLIC_API_BASE_URL as string;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  pages: {
    error: "/login",
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const res = await fetch(`${baseApi}/users/google-login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: user.name,
              email: user.email,
              googleId: account.providerAccountId,
              image: user.image,
            }),
          });

          const result = await res.json();

          if (!result.success) {
            throw new Error(result.message);
          }

          if (result.success) {
            (await cookies()).set("accessToken", result.data.accessToken);
            (await cookies()).set("refreshToken", result.data.refreshToken);
          }
        } catch (error) {
          console.error("Error during API call:", error);
          return false;
        }
      }
      return true;
    },
  },
});
