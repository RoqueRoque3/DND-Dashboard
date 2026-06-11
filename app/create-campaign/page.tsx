"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

export default function CreateCampaignPage() {
  const router = useRouter()

  const [campaignName, setCampaignName] = useState("")
  const [campaignCode, setCampaignCode] = useState("")
  const [createdInviteLink, setCreatedInviteLink] = useState("")
  const [createdCode, setCreatedCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  function cleanCode(value: string) {
    return value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 12)
  }

  async function createCampaign() {
    setLoading(true)
    setErrorMessage("")

    const cleanCampaignCode = cleanCode(campaignCode)

    if (!campaignName.trim()) {
      setErrorMessage("Please enter a campaign name.")
      setLoading(false)
      return
    }

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
      .insert({
        name: campaignName.trim(),
        code: cleanCampaignCode,
      })
      .select("*")
      .single()

    if (campaignError || !campaignData) {
      setErrorMessage(campaignError?.message ?? "Could not create campaign.")
      setLoading(false)
      return
    }

    const { error: memberError } = await supabase
      .from("campaign_members")
      .insert({
        campaign_id: campaignData.id,
        user_id: user.id,
        role: "dm",
      })

    if (memberError) {
      setErrorMessage(memberError.message)
      setLoading(false)
      return
    }

    const { error: encounterError } = await supabase
      .from("encounter_state")
      .insert({
        id: crypto.randomUUID(),
        campaign_id: campaignData.id,
        active_character_id: null,
        round_number: 1,
        background_url: null,
      })

    if (encounterError) {
      setErrorMessage(encounterError.message)
      setLoading(false)
      return
    }

    const inviteLink = `${window.location.origin}/campaign/${cleanCampaignCode}/invite`

    setCreatedCode(cleanCampaignCode)
    setCreatedInviteLink(inviteLink)
    setLoading(false)
  }

  async function copyInviteLink() {
    if (!createdInviteLink) return
    await navigator.clipboard.writeText(createdInviteLink)
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-8">
      <div className="w-full max-w-2xl bg-zinc-900 border border-yellow-700 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-yellow-500">
            Create Campaign
          </h1>

          <p className="text-zinc-400 mt-3">
            Name your campaign and choose a code your players will use to join.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-950 border border-red-700 text-red-300 rounded-xl p-3 mb-5">
            {errorMessage}
          </div>
        )}

        {!createdInviteLink ? (
          <div className="space-y-5">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Campaign Name
              </label>

              <input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Curse of Strahd"
                className="w-full rounded-xl bg-zinc-800 border border-zinc-600 p-4 text-lg"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Campaign Code
              </label>

              <input
                value={campaignCode}
                onChange={(e) => setCampaignCode(cleanCode(e.target.value))}
                placeholder="STRAHD"
                className="w-full rounded-xl bg-zinc-800 border border-zinc-600 p-4 text-lg uppercase tracking-widest"
              />

              <p className="text-xs text-zinc-500 mt-2">
                Use letters and numbers only. Example: STRAHD, TEST, DRAGON42.
              </p>
            </div>

            <button
              onClick={createCampaign}
              disabled={loading}
              className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-black rounded-2xl p-4 text-xl font-black"
            >
              {loading ? "Creating Campaign..." : "Create Campaign"}
            </button>

            <button
              onClick={() => router.push("/home")}
              className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 rounded-2xl p-4 font-bold"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-zinc-950 border border-yellow-700 rounded-2xl p-5 text-center">
              <p className="text-zinc-400 text-sm mb-2">
                Campaign Created
              </p>

              <p className="text-5xl font-black text-yellow-400 tracking-widest">
                {createdCode}
              </p>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Invite Link
              </label>

              <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-4 text-sm break-all text-zinc-300">
                {createdInviteLink}
              </div>
            </div>

            <button
              onClick={copyInviteLink}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-black rounded-2xl p-4 text-xl font-black"
            >
              Copy Invite Link
            </button>

            <button
              onClick={() => router.push(`/campaign/${createdCode}/dm`)}
              className="w-full bg-green-700 hover:bg-green-600 text-white rounded-2xl p-4 text-xl font-black"
            >
              Go to DM Dashboard
            </button>
          </div>
        )}
      </div>
    </main>
  )
}