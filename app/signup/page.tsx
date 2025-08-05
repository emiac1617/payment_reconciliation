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

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`, // Redirect to our app's callback route
      },
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
      setMessage("Sign up successful! Please check your email to confirm your account.")
    }
    setLoading(false)
  }

  const handleGoogleSignup = async () => {
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
          <CardTitle className="text-2xl font-bold">Sign Up</CardTitle>
          <CardDescription>Create an account to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
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
              {loading ? "Signing up..." : "Sign Up"}
            </Button>
            {message && (
              <p
                className={`text-center text-sm ${message.includes("successful") ? "text-green-600" : "text-red-600"}`}
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
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <ChromeIcon className="h-5 w-5" />
            Sign up with Google
          </Button>
          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
