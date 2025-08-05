"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Separator } from "@/components/ui/separator" // Assuming you have a Separator component
import { ChromeIcon } from "lucide-react" // Using ChromeIcon for Google, assuming it's available from lucide-react

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        setMessage(
          "Network error: Could not connect to the authentication server. Please check your internet connection or Supabase CORS settings.",
        )
      } else {
        setMessage(error.message)
      }
    } else {
      setMessage("Logged in successfully!")
      router.push("/") // Redirect to dashboard
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setMessage("")
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`, // This must match your Google Cloud Console redirect URIs
      },
    })

    if (error) {
      setMessage(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Sign in to your payment reconciliation dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
            {message && (
              <p
                className={`text-center text-sm ${message.includes("successfully") ? "text-green-600" : "text-red-600"}`}
              >
                {message}
              </p>
            )}
          </form>
          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
              OR
            </span>
          </div>
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 bg-transparent"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <ChromeIcon className="h-5 w-5" />
            Sign in with Google
          </Button>
          <p className="text-center text-sm text-gray-600 mt-4">
            Don't have an account?{" "}
            <Link href="/signup" className="font-medium text-blue-600 hover:underline">
              Sign Up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
