import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { adminUsers, customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyCustomerToken } from "@/lib/customer-auth";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        customerToken: { label: "Customer Token", type: "text" },
      },
      async authorize(credentials) {
        const customerToken = credentials?.customerToken as string;

        // Bridge login: customer JWT → admin session
        if (customerToken) {
          try {
            const { customerId } = await verifyCustomerToken(customerToken);
            const [customer] = await db
              .select()
              .from(customers)
              .where(eq(customers.id, customerId))
              .limit(1);

            if (!customer) throw new InvalidCredentialsError();

            // Check if this customer is also an admin
            const [admin] = await db
              .select()
              .from(adminUsers)
              .where(eq(adminUsers.email, customer.email))
              .limit(1);

            if (!admin) throw new InvalidCredentialsError();

            return {
              id: String(admin.id),
              name: admin.name,
              email: admin.email,
              image: admin.image,
            };
          } catch {
            throw new InvalidCredentialsError();
          }
        }

        // Standard email/password login
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) {
          throw new InvalidCredentialsError();
        }

        const [user] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.email, email))
          .limit(1);

        if (!user || !user.passwordHash) {
          throw new InvalidCredentialsError();
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          throw new InvalidCredentialsError();
        }

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        const [existingUser] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.email, email))
          .limit(1);

        if (!existingUser) {
          // Only allow existing admin users to sign in with Google
          return false;
        }

        // Update Google ID and image if not set
        if (!existingUser.googleId || !existingUser.image) {
          await db
            .update(adminUsers)
            .set({
              googleId: user.id,
              image: user.image || existingUser.image,
            })
            .where(eq(adminUsers.email, email));
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
