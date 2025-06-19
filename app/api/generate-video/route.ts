import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { PLANS } from "@/lib/stripe"
import Replicate from "replicate"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(request: NextRequest) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: "Server mis-configuration: REPLICATE_API_TOKEN not set." }, { status: 500 })
  }

  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Check usage limits
    const isPro = profile.subscription_status === "active"
    const maxVideos = isPro ? PLANS.PRO.videosPerMonth : PLANS.FREE.videosPerMonth
    const videosLeft = Math.max(0, maxVideos - (profile.videos_generated || 0))

    if (videosLeft <= 0) {
      return NextResponse.json(
        {
          error: "Monthly video limit reached. Upgrade to Pro for more videos.",
        },
        { status: 403 },
      )
    }

    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Create video record
    const { data: video } = await supabase
      .from("videos")
      .insert({
        user_id: user.id,
        prompt,
        status: "generating",
      })
      .select()
      .single()

    console.log("Generating video with prompt:", prompt)

    // ---- call Replicate --------------------------------------------------
    const rawOutput = await replicate.run("google/veo-3", {
      input: { prompt },
    })

    // Veo-3 returns an array of URLs; grab the first one
    const videoUrl = Array.isArray(rawOutput) ? rawOutput[0] : (rawOutput as string)

    if (!videoUrl) {
      return NextResponse.json({ error: "Replicate did not return a video URL." }, { status: 502 })
    }
    // ----------------------------------------------------------------------

    // Update video record and user usage
    await Promise.all([
      supabase.from("videos").update({ video_url: videoUrl, status: "completed" }).eq("id", video.id),

      supabase
        .from("profiles")
        .update({
          videos_generated: (profile.videos_generated || 0) + 1,
        })
        .eq("id", user.id),
    ])

    console.log("Video generated successfully:", videoUrl)

    return NextResponse.json({ success: true, videoUrl })
  } catch (error) {
    console.error("Error generating video:", error)
    return NextResponse.json({ error: "Failed to generate video" }, { status: 500 })
  }
}
