"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, Crown, AlertTriangle } from "lucide-react"
import { PLANS } from "@/lib/stripe"
import { toast } from "@/hooks/use-toast"

interface PricingCardProps {
  userSubscription?: string
  videosGenerated: number
}

export function PricingCard({ userSubscription = "free", videosGenerated }: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Check if Stripe is properly configured
  const isStripeConfigured = Boolean(process.env.NEXT_PUBLIC_STRIPE_CONFIGURED === "true")

  const handleUpgrade = async () => {
    if (!isStripeConfigured) {
      toast({
        title: "Payment System Not Available",
        description: "Stripe is not configured. Please contact support to upgrade your plan.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create checkout session")
      }

      const data = await response.json()

      if (!data.url) {
        throw new Error("No checkout URL received from server")
      }

      // Redirect to Stripe checkout
      window.location.href = data.url
    } catch (error) {
      console.error("Checkout error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout process",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/stripe/create-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to open billing portal")
      }

      const data = await response.json()

      if (!data.url) {
        throw new Error("No portal URL received from server")
      }

      // Redirect to Stripe billing portal
      window.location.href = data.url
    } catch (error) {
      console.error("Portal error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open billing portal",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isPro = userSubscription === "active"
  const freeVideosLeft = Math.max(0, PLANS.FREE.videosPerMonth - videosGenerated)
  const proVideosLeft = Math.max(0, PLANS.PRO.videosPerMonth - videosGenerated)

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <Card className={`relative ${!isPro ? "ring-2 ring-purple-500" : ""}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Free Plan
            {!isPro && <Badge variant="secondary">Current</Badge>}
          </CardTitle>
          <CardDescription>Perfect for trying out video generation</CardDescription>
          <div className="text-3xl font-bold">
            $0<span className="text-sm font-normal">/month</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>3 videos per month</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Standard quality</span>
            </div>
          </div>
          {!isPro && <div className="text-sm text-muted-foreground">{freeVideosLeft} videos remaining this month</div>}
        </CardContent>
      </Card>

      <Card className={`relative ${isPro ? "ring-2 ring-yellow-500" : ""}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Pro Plan
            </div>
            {isPro && <Badge className="bg-yellow-500">Current</Badge>}
          </CardTitle>
          <CardDescription>For serious video creators</CardDescription>
          <div className="text-3xl font-bold">
            $29.99<span className="text-sm font-normal">/month</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>50 videos per month</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>High quality generation</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Priority support</span>
            </div>
          </div>

          {!isStripeConfigured && (
            <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-orange-800 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Payment system setup required</span>
            </div>
          )}

          {isPro ? (
            <>
              <div className="text-sm text-muted-foreground">{proVideosLeft} videos remaining this month</div>
              <Button onClick={handleManageSubscription} disabled={isLoading || !isStripeConfigured} className="w-full">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Manage Subscription"}
              </Button>
            </>
          ) : (
            <Button onClick={handleUpgrade} disabled={isLoading || !isStripeConfigured} className="w-full">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upgrade to Pro"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
