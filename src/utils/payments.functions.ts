import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";
import { isValidTip } from "@/lib/tips";

type CheckoutSessionResult = { clientSecret: string } | { error: string };

export const createTipCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { amountInCents: number; returnUrl: string; environment: StripeEnv }) => {
    if (!isValidTip(data.amountInCents)) throw new Error("Pick an amount between €1 and €100");
    if (data.environment !== "sandbox" && data.environment !== "live") throw new Error("Invalid environment");
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutSessionResult> => {
    try {
      const email = typeof context.claims?.email === "string" ? context.claims.email : undefined;
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.create({
        line_items: [{
          price_data: { currency: "eur", product_data: { name: "Support Forkcast" }, unit_amount: data.amountInCents },
          quantity: 1,
        }],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        payment_intent_data: { description: "Support Forkcast" },
        metadata: { userId: context.userId, kind: "tip" },
        ...(email && { customer_email: email }),
      });
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
