"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Database, ExternalLink } from "lucide-react"

export function DatabaseSetupWarning() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="w-5 h-5" />
            Database Setup Required
          </CardTitle>
          <CardDescription className="text-orange-700">
            Your database tables haven't been created yet. Please run the setup scripts in Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-orange-700">
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Database className="w-4 h-4" />
              Setup Instructions:
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Go to your Supabase project dashboard</li>
              <li>Navigate to the SQL Editor</li>
              <li>Run the following scripts in order:</li>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>
                  <code className="bg-orange-100 px-1 rounded">scripts/001-initial-schema.sql</code>
                </li>
                <li>
                  <code className="bg-orange-100 px-1 rounded">scripts/002-oauth-providers.sql</code>
                </li>
              </ul>
              <li>Refresh this page after running the scripts</li>
            </ol>
          </div>

          <div className="flex gap-3">
            <Button asChild variant="outline">
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                Open Supabase Dashboard
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
