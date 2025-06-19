"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Play, Download, Crown, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { PLANS } from "@/lib/stripe"
import Link from "next/link"

interface VideoGeneratorClientProps {
  user: any
  profile: any
  videos: any[]
}

export function VideoGeneratorClient({ user, profile, videos }: VideoGeneratorClientProps) {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [generationTime, setGenerationTime] = useState<number | null>(null)

  const isPro = profile?.subscription_status === "active"
  const videosThisMonth = profile?.videos_generated || 0
  const maxVideos = isPro ? PLANS.PRO.videosPerMonth : PLANS.FREE.videosPerMonth
  const videosLeft = Math.max(0, maxVideos - videosThisMonth)
  const canGenerate = videosLeft > 0

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast({
        title: "Limit Reached",
        description: "You've reached your monthly video limit. Upgrade to Pro for more videos.",
        variant: "destructive",
      })
      return
    }

    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for your video",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setVideoUrl(null)
    const startTime = Date.now()

    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error ?? "Failed to generate video")
      }

      const data = await response.json()
      setVideoUrl(data.videoUrl)
      setGenerationTime(Math.round((Date.now() - startTime) / 1000))

      toast({
        title: "Success!",
        description: "Your video has been generated successfully",
      })
    } catch (error) {
      console.error("Error generating video:", error)
      toast({
        title: "Error",
        description: "Failed to generate video. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement("a")
      link.href = videoUrl
      link.download = "veo-generated-video.mp4"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Welcome back, {profile?.full_name}!
        </h1>
        <div className="flex items-center justify-center gap-4">
          <Badge variant={isPro ? "default" : "secondary"} className={isPro ? "bg-yellow-500" : ""}>
            {isPro ? (
              <>
                <Crown className="w-3 h-3 mr-1" />
                Pro Plan
              </>
            ) : (
              "Free Plan"
            )}
          </Badge>
          <span className="text-sm text-muted-foreground">{videosLeft} videos remaining this month</span>
        </div>
      </div>

      {!canGenerate && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Monthly limit reached</p>
                <p className="text-sm">
                  You've used all {maxVideos} videos for this month.
                  {!isPro && (
                    <>
                      {" "}
                      <Link href="/subscription" className="underline font-medium">
                        Upgrade to Pro
                      </Link>{" "}
                      for 50 videos per month.
                    </>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Create Your Video
          </CardTitle>
          <CardDescription>
            Describe the video you want to generate. Be as detailed as possible for best results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prompt">Video Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="A breaking news ident, followed by a TV news presenter excitedly telling us: We interrupt this programme to bring you some breaking news... Veo 3 is now live on Replicate. Then she shouts: Let's go!

The TV presenter is an epic and cool punk with pink and green hair and a t-shirt that says 'Veo 3 on Replicate'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-32 resize-none"
              disabled={isGenerating || !canGenerate}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || !canGenerate}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Generate Video ({videosLeft} left)
              </>
            )}
          </Button>

          {isGenerating && (
            <div className="text-center text-sm text-muted-foreground">
              This may take several minutes. Please be patient...
            </div>
          )}
        </CardContent>
      </Card>

      {videoUrl && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Video
              {generationTime && (
                <span className="text-sm font-normal text-muted-foreground">Generated in {generationTime}s</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video src={videoUrl} controls className="w-full aspect-video" preload="metadata">
                Your browser does not support the video tag.
              </video>
            </div>
            <Button onClick={handleDownload} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Video
            </Button>
          </CardContent>
        </Card>
      )}

      {videos.length > 0 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Recent Videos</CardTitle>
            <CardDescription>Your previously generated videos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {videos.slice(0, 5).map((video) => (
                <div key={video.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{video.prompt}</p>
                    <p className="text-xs text-muted-foreground">{new Date(video.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={video.status === "completed" ? "default" : "secondary"}>{video.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
