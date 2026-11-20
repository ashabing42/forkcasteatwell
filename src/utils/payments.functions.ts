import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";
import { isValidTip, tipPriceId } from "@/lib/tips";

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
      const priceId = tipPriceId(data.amountInCents);
      if (!priceId) return { error: "Pick €3, €5 or €10" };
      const prices = await stripe.prices.list({ lookup_keys: [priceId], expand: ["data.product"] });
      const price = prices.data[0];
      if (!price) return { error: "That tip isn't available right now" };
      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
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
