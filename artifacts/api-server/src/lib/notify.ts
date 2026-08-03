import { Resend } from "resend";
import { logger } from "./logger";

export async function notify(subject: string, body: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.NOTIFICATION_EMAIL;

  if (!apiKey) {
    logger.warn("RESEND_API_KEY is not configured; skipping notification");
    return;
  }
  if (!recipient) {
    logger.warn("NOTIFICATION_EMAIL is not configured; skipping notification");
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Progetto J <onboarding@resend.dev>",
      to: recipient,
      subject,
      text: body,
    });
    if (error) {
      logger.error({ err: error }, "Notification email failed");
    }
  } catch (error) {
    logger.error({ err: error }, "Notification email failed");
  }
}