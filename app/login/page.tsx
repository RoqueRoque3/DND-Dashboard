"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  async function login() {
    setErrorMessage("")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMessage(error.message)
      return
    }

    router.push("/player")
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-8">
      <div className="bg-zinc-800 border border-yellow-700 rounded-2xl p-8 shadow-2xl w-full max-w-md">
        <h1 className="text-xl font-bold text-yellow-500 mb-2">
          Roque's DND Game Dashboard!
        </h1>

        <p className="text-zinc-400 mb-8">
          Sign in as a player or DM.
        </p>

        <label className="block text-sm text-zinc-400 mb-2">
          Email
        </label>

        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl bg-zinc-900 border border-zinc-600 p-3 text-white mb-4"
        />

        <label className="block text-sm text-zinc-400 mb-2">
          Password
        </label>

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl bg-zinc-900 border border-zinc-600 p-3 text-white mb-6"
        />

        {errorMessage && (
          <p className="text-red-400 mb-4">{errorMessage}</p>
        )}

        <button
          onClick={login}
          className="w-full bg-yellow-600 hover:bg-yellow-500 transition-colors p-3 rounded-xl font-bold text-black"
        >
          Login
        </button>
      </div>
    </main>
  )
}