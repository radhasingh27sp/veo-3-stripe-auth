"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export function SubscriptionSuccess() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Wait a moment for webhook to process
    await new Promise((resolve) => setTimeout(resolve, 2000))
    router.refresh()
    setIsRefreshing(false)
  }

  // Auto-refresh after 3 seconds to check for updated subscription status
  useEffect(() => {
    const timer = setTimeout(() => {
      router.refresh()
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <Card className="mb-8 border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <CheckCircle className="w-5 h-5" />
          Payment Successful!
        </CardTitle>
        <CardDescription className="text-green-700">
          Your subscription is being activated. This may take a few moments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-green-700">
        <div className="space-y-2">
          <p className="text-sm">✅ Payment processed successfully</p>
          <p className="text-sm">⏳ Activating your Pro subscription...</p>
          <p className="text-sm">🎉 You'll have access to 50 videos per month</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
            {isRefreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {isRefreshing ? "Refreshing..." : "Refresh Status"}
          </Button>
          <Button asChild size="sm">
            <a href="/">Start Creating Videos</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
