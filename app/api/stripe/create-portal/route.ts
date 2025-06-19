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

    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      console.error("NEXT_PUBLIC_SITE_URL is not set")
      return NextResponse.json({ error: "Site URL is not configured. Please contact support." }, { status: 500 })
    }

    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "You must be logged in to manage your subscription" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: "No subscription found to manage" }, { status: 404 })
    }

    const stripe = getStripe()
    console.log("Creating billing portal session for customer:", profile.stripe_customer_id)

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription`,
    })

    console.log("Billing portal session created:", portalSession.id)
    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error("Error creating portal session:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create billing portal session",
      },
      { status: 500 },
    )
  }
}
