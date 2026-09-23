import { hash, compare } from "bcryptjs";
import { getModels } from "@/lib/db/models";
import type { LoginInput, RegisterInput } from "@/lib/validators/auth";

const BCRYPT_COST = 12;

export class EmailTakenError extends Error {
  readonly code = "EMAIL_TAKEN" as const;

  constructor() {
    super("EMAIL_TAKEN");
    this.name = "EmailTakenError";
  }
}

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
}

interface UserRow {
  id: string;
  email: string | null;
  name: string | null;
  passwordHash: string | null;
}

/** Hashes a password with bcrypt (cost 12) before it is stored. */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_COST);
}

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email ?? "",
    name: row.name,
  };
}

function isDuplicateEmailError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const withParent = error as { parent?: { code?: string }; name?: string };
  return (
    withParent.parent?.code === "ER_DUP_ENTRY" ||
    withParent.name === "SequelizeUniqueConstraintError"
  );
}

/** Creates a credentials user. Rejects if the email is already registered. */
export async function registerUser(input: RegisterInput): Promise<PublicUser> {
  const { User } = getModels();
  const email = input.email.toLowerCase();
  const passwordHash = await hashPassword(input.password);

  try {
    const created = await User.create({
      id: crypto.randomUUID(),
      name: input.name,
      email,
      passwordHash,
    });
    const row = created.get({ plain: true }) as UserRow;
    return toPublicUser(row);
  } catch (error: unknown) {
    if (isDuplicateEmailError(error)) {
      throw new EmailTakenError();
    }
    throw error;
  }
}

/** Verifies email/password. Returns null for any failure (no user enumeration). */
export async function verifyCredentials(
  input: LoginInput,
): Promise<PublicUser | null> {
  const { User } = getModels();
  const email = input.email.toLowerCase();
  const found = await User.unscoped().findOne({ where: { email } });
  if (!found) {
    return null;
  }

  const row = found.get({ plain: true }) as UserRow;
  if (!row.passwordHash) {
    return null;
  }

  const matches = await compare(input.password, row.passwordHash);
  if (!matches) {
    return null;
  }

  return toPublicUser(row);
}

/** Blocks Google sign-in when the email already has a password and no Google account. */
export async function canSignInWithGoogle(
  email: string | null | undefined,
): Promise<{ ok: true } | { ok: false; code: "password_account" }> {
  if (!email) {
    return { ok: true };
  }

  const { User, Account } = getModels();
  const normalized = email.toLowerCase();
  const found = await User.unscoped().findOne({ where: { email: normalized } });
  if (!found) {
    return { ok: true };
  }

  const row = found.get({ plain: true }) as UserRow;
  const googleAccount = await Account.findOne({
    where: { userId: row.id, provider: "google" },
  });
  if (googleAccount) {
    return { ok: true };
  }

  if (row.passwordHash) {
    return { ok: false, code: "password_account" };
  }

  return { ok: true };
}
