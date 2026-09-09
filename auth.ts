import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import SequelizeAdapter from "@auth/sequelize-adapter";
import { getSequelize } from "@/lib/db/sequelize";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const googleId = process.env.AUTH_GOOGLE_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET;

/** Configures Auth.js with optional Google and a MySQL session store when DATABASE_URL is set. */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: hasDatabase ? "database" : "jwt",
    maxAge: 60 * 60 * 24,
  },
  adapter: hasDatabase
    ? SequelizeAdapter(getSequelize(), { synchronize: false })
    : undefined,
  providers: [
    ...(googleId && googleSecret
      ? [Google({ clientId: googleId, clientSecret: googleSecret })]
      : []),
  ],
});
