"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "../../lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const nextUrl = searchParams.get("next") || "/home"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function login() {
    setLoading(true)
    setErrorMessage("")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    router.push(nextUrl)
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-zinc-900 border border-yellow-700 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-yellow-500">
            D&D Dashboard
          </h1>

          <p className="text-zinc-400 mt-3">
            Login to manage or join your campaign.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-950 border border-red-700 text-red-300 rounded-xl p-3 mb-5">
            {errorMessage}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-zinc-800 border border-zinc-600 p-4 text-lg"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") login()
              }}
              className="w-full rounded-xl bg-zinc-800 border border-zinc-600 p-4 text-lg"
            />
          </div>

          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-black rounded-2xl p-4 text-xl font-black"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <button
            onClick={() => router.push("/signup")}
            className="w-full bg-zinc-800 hover:bg-zinc-700 border border-yellow-700 text-yellow-400 rounded-2xl p-4 text-xl font-black"
          >
            New User
          </button>
        </div>
      </div>
    </main>
  )
}