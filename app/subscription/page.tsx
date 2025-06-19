import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PricingCard } from "@/components/subscription/pricing-card"
import { Navbar } from "@/components/layout/navbar"
import { SubscriptionSuccess } from "@/components/subscription/subscription-success"

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string }
}) {
  try {
    const supabase = createServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log("No authenticated user, redirecting to auth")
      redirect("/auth")
    }

    // Try to get existing profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    let finalProfile = profile

    // If profile doesn't exist, try to create it
    if (profileError && profileError.code === "PGRST116") {
      console.log("Profile not found, creating new profile for user:", user.id)

      try {
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            subscription_status: "free",
            videos_generated: 0,
          })
          .select()
          .single()

        if (createError) {
          console.error("Error creating profile:", createError)
          // Use a default profile if creation fails
          finalProfile = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            subscription_status: "free",
            videos_generated: 0,
            stripe_customer_id: null,
            stripe_subscription_id: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        } else {
          finalProfile = newProfile
        }
      } catch (insertError) {
        console.error("Failed to insert profile:", insertError)
        // Use a default profile
        finalProfile = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          subscription_status: "free",
          videos_generated: 0,
          stripe_customer_id: null,
          stripe_subscription_id: null,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }
    } else if (profileError) {
      console.error("Unexpected profile error:", profileError)
      // Use a default profile for any other error
      finalProfile = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        subscription_status: "free",
        videos_generated: 0,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Navbar user={user} profile={finalProfile} />
        <div className="max-w-7xl mx-auto p-4 pt-8">
          {searchParams.success && <SubscriptionSuccess />}
          {searchParams.canceled && (
            <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-center">
              <p>Payment was canceled. You can try again anytime.</p>
            </div>
          )}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Choose Your Plan
            </h1>
            <p className="text-lg text-muted-foreground">Upgrade to Pro for unlimited video generation</p>
          </div>
          <PricingCard
            userSubscription={finalProfile?.subscription_status || "free"}
            videosGenerated={finalProfile?.videos_generated || 0}
          />
        </div>
      </div>
    )
  } catch (error) {
    console.error("SubscriptionPage error:", error)
    // If there's any error, redirect to auth
    redirect("/auth")
  }
}
