import { useCallback, useEffect, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createTipCheckout } from "@/utils/payments.functions";
import { TIP_AMOUNTS } from "@/lib/tips";
import { toast } from "sonner";

const testMode = (import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined)?.startsWith("pk_test_");

export function SupportForkcast() {
  const [amount, setAmount] = useState<number>(TIP_AMOUNTS[1]);
  const [open, setOpen] = useState(false);
  const [thanks, setThanks] = useState(false);
  const createTip = useServerFn(createTipCheckout);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("tip") === "thanks") {
      setThanks(true);
      url.searchParams.delete("tip"); url.searchParams.delete("session_id");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const fetchClientSecret = useCallback(async () => {
    const result = await createTip({ data: {
      amountInCents: amount,
      returnUrl: `${window.location.origin}/settings?tip=thanks&session_id={CHECKOUT_SESSION_ID}`,
      environment: getStripeEnvironment(),
    } });
    if ("error" in result) throw new Error(result.error);
    return result.clientSecret;
  }, [amount, createTip]);

  function start() {
    try { getStripeEnvironment(); setOpen(true); }
    catch (e) { toast.error((e as Error).message); }
  }

  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="text-xl">Support Forkcast</h2>
      {thanks ? (
        <p className="mt-1 text-sm text-muted-foreground">Thank you. That's the next coffee sorted.</p>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">Forkcast is made by one person. If it saves you a weekly headache, a coffee keeps it going.</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Tip amount">
        {TIP_AMOUNTS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={amount === c} onClick={() => setAmount(c)}
            className={`tabular rounded-lg border px-4 py-2 text-sm transition-colors ${amount === c ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>
            €{c / 100}
          </button>
        ))}
      </div>
      <Button className="mt-4 w-full rounded-lg" onClick={start}>Buy me a coffee · €{amount / 100}</Button>
      {testMode && <p className="mt-2 text-xs text-muted-foreground">Test mode in the preview — no real money moves. Use card 4242 4242 4242 4242.</p>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buy me a coffee</DialogTitle>
            <DialogDescription>€{amount / 100}, once. Thank you.</DialogDescription>
          </DialogHeader>
          {open && (
            <EmbeddedCheckoutProvider key={amount} stripe={getStripe()} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
