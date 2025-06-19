import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VideoGeneratorClient } from "@/components/video-generator-client"
import { Navbar } from "@/components/layout/navbar"

export default async function HomePage() {
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

    // Get user videos (with error handling)
    const { data: videos } = await supabase
      .from("videos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Navbar user={user} profile={finalProfile} />
        <VideoGeneratorClient user={user} profile={finalProfile} videos={videos || []} />
      </div>
    )
  } catch (error) {
    console.error("HomePage error:", error)
    // If there's any error, redirect to auth
    redirect("/auth")
  }
}
