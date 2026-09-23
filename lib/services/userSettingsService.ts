import type { Currency } from "@/lib/db/enums";
import { CURRENCIES } from "@/lib/db/enums";
import { getModels } from "@/lib/db/models";
import type { UpdateProfileInput } from "@/lib/validators/profile";

export class UserSettingsNotFoundError extends Error {
  constructor() {
    super("USER_SETTINGS_NOT_FOUND");
    this.name = "UserSettingsNotFoundError";
  }
}

export interface UserSettings {
  name: string;
  email: string;
  defaultCurrency: Currency;
  goalsCountAsCommitted: boolean;
}

interface UserSettingsRow {
  id: string;
  name: string | null;
  email: string | null;
  defaultCurrency: string;
  goalsCountAsCommitted: boolean | number;
}

function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

function toSettings(row: UserSettingsRow): UserSettings {
  return {
    name: row.name?.trim() ?? "",
    email: row.email ?? "",
    defaultCurrency: isCurrency(row.defaultCurrency) ? row.defaultCurrency : "ARS",
    goalsCountAsCommitted: Boolean(row.goalsCountAsCommitted),
  };
}

/** Loads the signed-in user's profile prefs, or null if the row is gone. */
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const { User } = getModels();
  const found = await User.findByPk(userId);
  if (!found) {
    return null;
  }
  return toSettings(found.get({ plain: true }) as UserSettingsRow);
}

/** Default currency for new accounts, cards, goals, and budgets. */
export async function getDefaultCurrency(userId: string): Promise<Currency> {
  const settings = await getUserSettings(userId);
  return settings?.defaultCurrency ?? "ARS";
}

/** Updates name, default currency, and whether goals subtract from Libre. */
export async function updateUserSettings(
  userId: string,
  input: UpdateProfileInput,
): Promise<UserSettings> {
  const { User } = getModels();
  const [updated] = await User.update(
    {
      name: input.name,
      defaultCurrency: input.defaultCurrency,
      goalsCountAsCommitted: input.goalsCountAsCommitted,
    },
    { where: { id: userId } },
  );
  if (updated === 0) {
    throw new UserSettingsNotFoundError();
  }
  const next = await getUserSettings(userId);
  if (!next) {
    throw new UserSettingsNotFoundError();
  }
  return next;
}
