import { loadStripe } from "@stripe/stripe-js";

// Stripe.js singleton — loaded once, reused everywhere
let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function getStripe() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
