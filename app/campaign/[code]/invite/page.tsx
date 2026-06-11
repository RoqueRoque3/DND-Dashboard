"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "../../../../lib/supabase"
import type { Campaign } from "../../../../lib/types"

export default function CampaignInvitePage() {
  const params = useParams()
  const router = useRouter()
  const campaignCode = String(params.code || "").toUpperCase()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadCampaign() {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("code", campaignCode)
      .single()

    if (error || !data) {
      console.log("CAMPAIGN INVITE ERROR:", error?.message)
      setLoading(false)
      return
    }

    setCampaign(data)
    setLoading(false)
  }

  async function continueToSetup() {
    if (!campaign) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push(`/login?next=/campaign/${campaignCode}/invite`)
      return
    }

    const { error: memberError } = await supabase
      .from("campaign_members")
      .insert({
        campaign_id: campaign.id,
        user_id: user.id,
        role: "player",
      })

    if (memberError && !memberError.message.includes("duplicate")) {
      console.log("INVITE JOIN ERROR:", memberError.message)
      return
    }

    router.push(`/campaign/${campaignCode}/setup`)
  }

  useEffect(() => {
    if (!campaignCode) return
    loadCampaign()
  }, [campaignCode])

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Loading invite...
      </main>
    )
  }

  if (!campaign) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-8">
        <div className="max-w-xl text-center">
          <h1 className="text-4xl font-black text-red-400 mb-4">
            Campaign Not Found
          </h1>

          <p className="text-zinc-400">
            The campaign code "{campaignCode}" does not exist.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-zinc-900 border border-yellow-700 rounded-3xl p-10 shadow-2xl text-center">
        <p className="text-yellow-400 uppercase tracking-[0.4em] text-sm font-bold mb-4">
          Campaign Invite
        </p>

        <h1 className="text-5xl font-black text-yellow-500 mb-4">
          {campaign.name}
        </h1>

        <p className="text-zinc-400 mb-8">
          You have been invited to join this D&D campaign.
        </p>

        <div className="bg-zinc-950 border border-zinc-700 rounded-2xl p-5 mb-8">
          <p className="text-zinc-500 text-sm mb-2">Campaign Code</p>
          <p className="text-4xl font-black text-white tracking-widest">
            {campaign.code}
          </p>
        </div>

        <button
          onClick={continueToSetup}
          className="w-full bg-yellow-600 hover:bg-yellow-500 text-black rounded-2xl p-5 text-2xl font-black"
        >
          Join Campaign
        </button>
      </div>
    </main>
  )
}