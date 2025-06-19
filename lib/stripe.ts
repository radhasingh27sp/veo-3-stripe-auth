import Stripe from "stripe"

/**
 * Singleton getter so Stripe is instantiated only on demand
 * and ONLY when STRIPE_SECRET_KEY is available.
 */
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set. Add it to your environment variables to use Stripe.")
  }

  _stripe = new Stripe(secretKey, {
    apiVersion: "2024-06-20",
    typescript: true,
  })
  return _stripe
}

/**
 * Central plan definitions
 */
export const PLANS = {
  FREE: {
    name: "Free",
    videosPerMonth: 3,
    price: 0,
  },
  PRO: {
    name: "Pro",
    videosPerMonth: 50,
    price: 2999, // $29.99 in cents
    priceId: process.env.STRIPE_PRO_PRICE_ID || "",
  },
}
