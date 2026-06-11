"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

export default function JoinCampaignPage() {
  const router = useRouter()

  const [campaignCode, setCampaignCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  function cleanCode(value: string) {
    return value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 12)
  }

  async function joinCampaign() {
    setLoading(true)
    setErrorMessage("")

    const cleanCampaignCode = cleanCode(campaignCode)

    if (!cleanCampaignCode) {
      setErrorMessage("Please enter a campaign code.")
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    const { data: campaignData, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("code", cleanCampaignCode)
      .single()

    if (campaignError || !campaignData) {
      setErrorMessage("Campaign not found.")
      setLoading(false)
      return
    }

    const { error: memberError } = await supabase
      .from("campaign_members")
      .insert({
        campaign_id: campaignData.id,
        user_id: user.id,
        role: "player",
      })

    if (memberError && !memberError.message.includes("duplicate")) {
      setErrorMessage(memberError.message)
      setLoading(false)
      return
    }

    router.push(`/campaign/${cleanCampaignCode}/setup`)
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-8">
      <div className="w-full max-w-xl bg-zinc-900 border border-blue-700 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-blue-400">
            Join Campaign
          </h1>

          <p className="text-zinc-400 mt-3">
            Enter the campaign code your DM gave you.
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
              Campaign Code
            </label>

            <input
              value={campaignCode}
              onChange={(e) => setCampaignCode(cleanCode(e.target.value))}
              placeholder="TEST"
              className="w-full rounded-xl bg-zinc-800 border border-zinc-600 p-4 text-lg uppercase tracking-widest"
            />
          </div>

          <button
            onClick={joinCampaign}
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded-2xl p-4 text-xl font-black"
          >
            {loading ? "Joining..." : "Continue to Character Creation"}
          </button>

          <button
            onClick={() => router.push("/home")}
            className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 rounded-2xl p-4 font-bold"
          >
            Back to Home
          </button>
        </div>
      </div>
    </main>
  )
}