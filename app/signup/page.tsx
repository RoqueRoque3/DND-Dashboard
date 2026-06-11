"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

type SignupRole = "dm" | "player"

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<SignupRole>("player")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function signup() {
    setLoading(true)
    setErrorMessage("")

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter an email and password.")
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    if (role === "dm") {
      router.push("/create-campaign")
    } else {
      router.push("/join-campaign")
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-zinc-900 border border-yellow-700 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-yellow-500">
            New User
          </h1>

          <p className="text-zinc-400 mt-3">
            Create an account and choose how you want to start.
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
              className="w-full rounded-xl bg-zinc-800 border border-zinc-600 p-4 text-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setRole("player")}
              className={`rounded-xl p-4 font-black border ${
                role === "player"
                  ? "bg-blue-700 border-blue-400 text-white"
                  : "bg-zinc-800 border-zinc-600 text-zinc-300"
              }`}
            >
              Player
            </button>

            <button
              onClick={() => setRole("dm")}
              className={`rounded-xl p-4 font-black border ${
                role === "dm"
                  ? "bg-yellow-600 border-yellow-300 text-black"
                  : "bg-zinc-800 border-zinc-600 text-zinc-300"
              }`}
            >
              DM
            </button>
          </div>

          <button
            onClick={signup}
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-black rounded-2xl p-4 text-xl font-black"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <button
            onClick={() => router.push("/login")}
            className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 rounded-2xl p-4 font-bold"
          >
            Back to Login
          </button>
        </div>
      </div>
    </main>
  )
}