import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const passwordSchema = z.string().min(1).max(200);

export const verifyControlPassword = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => ({ password: passwordSchema.parse(data.password) }))
  .handler(async ({ data }) => {
    const { checkControlPassword } = await import("./control-room.server");
    return { ok: await checkControlPassword(data.password) };
  });

export const updateControlPassword = createServerFn({ method: "POST" })
  .inputValidator((data: { currentPassword: string; newPassword: string }) => ({
    currentPassword: passwordSchema.parse(data.currentPassword),
    newPassword: z.string().min(8).max(200).parse(data.newPassword),
  }))
  .handler(async ({ data }) => {
    const { checkControlPassword, saveControlPassword } = await import("./control-room.server");
    if (!(await checkControlPassword(data.currentPassword))) {
      return { ok: false as const, reason: "invalid_current" as const };
    }
    await saveControlPassword(data.newPassword);
    return { ok: true as const };
  });
