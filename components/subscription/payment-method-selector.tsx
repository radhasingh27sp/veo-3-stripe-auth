"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Loader2, Crown, CreditCard, Globe } from "lucide-react"
import { PLANS } from "@/lib/stripe"
import { toast } from "@/hooks/use-toast"
import { getPaddleClient } from "@/lib/paddle-client"

interface PaymentMethodSelectorProps {
  userSubscription?: string
  videosGenerated: number
}

export function PaymentMethodSelector({ userSubscription = "free", videosGenerated }: PaymentMethodSelectorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<"stripe" | "paddle">("stripe")

  const isPro = userSubscription === "active"
  const freeVideosLeft = Math.max(0, PLANS.FREE.videosPerMonth - videosGenerated)
  const proVideosLeft = Math.max(0, PLANS.PRO.videosPerMonth - videosGenerated)

  const handleStripeUpgrade = async () => {
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

      window.location.href = data.url
    } catch (error) {
      console.error("Stripe checkout error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout process",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaddleUpgrade = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/paddle/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create Paddle checkout")
      }

      const data = await response.json()

      // Initialize Paddle and open checkout
      const paddle = await getPaddleClient()

      paddle.Checkout.open({
        items: [{ priceId: data.priceId, quantity: 1 }],
        customer: {
          id: data.customerId,
          email: data.customerEmail,
        },
        customData: {
          userId: data.userId,
        },
        settings: {
          successUrl: `${window.location.origin}/subscription?success=true&method=paddle`,
          theme: "light",
        },
      })
    } catch (error) {
      console.error("Paddle checkout error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start Paddle checkout",
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

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {/* Free Plan Card */}
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

      {/* Pro Plan Card */}
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

          {isPro ? (
            <>
              <div className="text-sm text-muted-foreground">{proVideosLeft} videos remaining this month</div>
              <Button onClick={handleManageSubscription} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Manage Subscription"}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <Tabs value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as "stripe" | "paddle")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="stripe" className="flex items-center gap-2">
                    <CreditCard className="w-3 h-3" />
                    Stripe
                  </TabsTrigger>
                  <TabsTrigger value="paddle" className="flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    Paddle
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="stripe" className="mt-4">
                  <div className="space-y-2 mb-3">
                    <p className="text-xs text-muted-foreground">• Credit/Debit Cards</p>
                    <p className="text-xs text-muted-foreground">• PayPal, Apple Pay, Google Pay</p>
                    <p className="text-xs text-muted-foreground">• Bank transfers (ACH)</p>
                  </div>
                  <Button onClick={handleStripeUpgrade} disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upgrade with Stripe"}
                  </Button>
                </TabsContent>

                <TabsContent value="paddle" className="mt-4">
                  <div className="space-y-2 mb-3">
                    <p className="text-xs text-muted-foreground">• Global payment methods</p>
                    <p className="text-xs text-muted-foreground">• Automatic tax handling</p>
                    <p className="text-xs text-muted-foreground">• Local currencies</p>
                  </div>
                  <Button onClick={handlePaddleUpgrade} disabled={isLoading} className="w-full" variant="outline">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upgrade with Paddle"}
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
