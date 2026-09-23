import { z } from "zod";
import { CURRENCIES } from "@/lib/db/enums";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    defaultCurrency: z.enum(CURRENCIES),
    goalsCountAsCommitted: z.enum(["true", "false"]).transform((value) => value === "true"),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
