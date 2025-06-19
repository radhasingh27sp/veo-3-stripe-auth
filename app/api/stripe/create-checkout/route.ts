import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    // Check if required environment variables are set
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not set")
      return NextResponse.json({ error: "Stripe is not configured. Please contact support." }, { status: 500 })
    }

    if (!process.env.STRIPE_PRO_PRICE_ID) {
      console.error("STRIPE_PRO_PRICE_ID is not set")
      return NextResponse.json({ error: "Stripe pricing is not configured. Please contact support." }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      console.error("NEXT_PUBLIC_SITE_URL is not set")
      return NextResponse.json({ error: "Site URL is not configured. Please contact support." }, { status: 500 })
    }

    // Validate that the price ID looks correct
    if (!process.env.STRIPE_PRO_PRICE_ID.startsWith("price_")) {
      console.error(
        "STRIPE_PRO_PRICE_ID does not appear to be a valid Stripe price ID:",
        process.env.STRIPE_PRO_PRICE_ID,
      )
      return NextResponse.json(
        { error: "Invalid Stripe price configuration. Please contact support." },
        { status: 500 },
      )
    }

    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "You must be logged in to upgrade" }, { status: 401 })
    }

    const stripe = getStripe()

    // First, let's verify the price exists and is recurring
    try {
      const price = await stripe.prices.retrieve(process.env.STRIPE_PRO_PRICE_ID)
      console.log("Retrieved price:", price)

      if (price.type !== "recurring") {
        console.error("Price is not recurring:", price)
        return NextResponse.json(
          { error: "Invalid price configuration - must be recurring for subscriptions." },
          { status: 500 },
        )
      }
    } catch (priceError) {
      console.error("Error retrieving price:", priceError)
      return NextResponse.json({ error: "Invalid price ID. Please check your Stripe configuration." }, { status: 500 })
    }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Check if user is already subscribed
    if (profile.subscription_status === "active") {
      return NextResponse.json({ error: "You already have an active subscription" }, { status: 400 })
    }

    let customerId = profile.stripe_customer_id

    // Create customer if doesn't exist
    if (!customerId) {
      console.log("Creating new Stripe customer for user:", user.id)
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id)
      console.log("Created Stripe customer:", customerId)
    }

    console.log("Creating checkout session for customer:", customerId)
    console.log("Using price ID:", process.env.STRIPE_PRO_PRICE_ID)

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      billing_address_collection: "required",
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      allow_promotion_codes: true,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription?canceled=true`,
    })

    console.log("Checkout session created:", session.id)
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create checkout session",
      },
      { status: 500 },
    )
  }
}
