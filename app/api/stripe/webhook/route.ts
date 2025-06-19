import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"
import type Stripe from "stripe"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createServerClient()

  try {
    console.log("Processing webhook event:", event.type)

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        console.log("Updating subscription for customer:", customerId)
        console.log("Subscription status:", subscription.status)

        const { data, error } = await supabase
          .from("profiles")
          .update({
            subscription_status: subscription.status,
            stripe_subscription_id: subscription.id,
          })
          .eq("stripe_customer_id", customerId)
          .select()

        if (error) {
          console.error("Error updating profile:", error)
        } else {
          console.log("Successfully updated profile:", data)
        }

        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        console.log("Canceling subscription for customer:", customerId)

        const { data, error } = await supabase
          .from("profiles")
          .update({
            subscription_status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("stripe_customer_id", customerId)
          .select()

        if (error) {
          console.error("Error updating profile:", error)
        } else {
          console.log("Successfully canceled subscription:", data)
        }

        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        console.log("Payment succeeded for customer:", customerId)

        // Reset monthly usage on successful payment
        const { data, error } = await supabase
          .from("profiles")
          .update({
            videos_generated: 0,
          })
          .eq("stripe_customer_id", customerId)
          .select()

        if (error) {
          console.error("Error resetting usage:", error)
        } else {
          console.log("Successfully reset monthly usage:", data)
        }

        break
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string

        console.log("Checkout completed for customer:", customerId)

        // Ensure the customer has the correct subscription status
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

          const { data, error } = await supabase
            .from("profiles")
            .update({
              subscription_status: subscription.status,
              stripe_subscription_id: subscription.id,
            })
            .eq("stripe_customer_id", customerId)
            .select()

          if (error) {
            console.error("Error updating profile after checkout:", error)
          } else {
            console.log("Successfully updated profile after checkout:", data)
          }
        }

        break
      }

      default:
        console.log("Unhandled event type:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error handling webhook:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
