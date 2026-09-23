import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import SequelizeAdapter from "@auth/sequelize-adapter";
import { encode as encodeJwt } from "@auth/core/jwt";
import { getSequelize } from "@/lib/db/sequelize";
import { getAuthAdapterModels } from "@/lib/db/models";
import { loginSchema } from "@/lib/validators/auth";
import {
  canSignInWithGoogle,
  verifyCredentials,
} from "@/lib/services/authService";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const googleId = process.env.AUTH_GOOGLE_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET;

function createAdapter() {
  return SequelizeAdapter(getSequelize(), {
    synchronize: false,
    models: getAuthAdapterModels() as NonNullable<
      NonNullable<Parameters<typeof SequelizeAdapter>[1]>["models"]
    >,
  });
}

const adapter = hasDatabase ? createAdapter() : undefined;

/** Configures Auth.js: database sessions, Credentials + optional Google. */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: hasDatabase ? "database" : "jwt",
    maxAge: 60 * 60 * 24,
  },
  adapter,
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse({
          email: typeof raw?.email === "string" ? raw.email : "",
          password: typeof raw?.password === "string" ? raw.password : "",
        });
        if (!parsed.success) {
          return null;
        }
        const user = await verifyCredentials(parsed.data);
        if (!user) {
          return null;
        }
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    ...(googleId && googleSecret
      ? [Google({ clientId: googleId, clientSecret: googleSecret })]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }
      const result = await canSignInWithGoogle(user.email);
      if (!result.ok) {
        return `/login?error=${result.code}`;
      }
      return true;
    },
    async jwt({ token, account, user }) {
      if (account?.provider === "credentials") {
        token.credentials = true;
        if (user?.id) {
          token.sub = user.id;
        }
      }
      return token;
    },
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.name = user.name;
        session.user.email = user.email;
        session.user.image = user.image;
      }
      return session;
    },
  },
  jwt: {
    encode: async (params) => {
      if (params.token?.credentials) {
        const sessionToken = crypto.randomUUID();
        if (!params.token.sub) {
          throw new Error("No user ID found in token");
        }
        const created = await adapter?.createSession?.({
          sessionToken,
          userId: params.token.sub,
          expires: new Date(Date.now() + 60 * 60 * 24 * 1000),
        });
        if (!created) {
          throw new Error("Failed to create session");
        }
        return sessionToken;
      }
      return encodeJwt(params);
    },
  },
});
