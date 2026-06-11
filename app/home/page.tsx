"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"
import type { CampaignMember } from "../../lib/types"

export default function HomePage() {
  const router = useRouter()

  const [memberships, setMemberships] = useState<CampaignMember[]>([])
  const [loading, setLoading] = useState(true)

  async function loadHome() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    const { data, error } = await supabase
  .from("campaign_members")
  .select(`
    id,
    campaign_id,
    user_id,
    role,
    created_at,
    campaigns!campaign_members_campaign_id_fkey (
      id,
      name,
      code,
      created_at
    )
  `)
  .eq("user_id", user.id)
  .order("created_at", { ascending: true })

    if (error) {
      console.log("HOME MEMBERSHIP ERROR:", error.message)
      setLoading(false)
      return
    }

    setMemberships(data ?? [])
    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  useEffect(() => {
    loadHome()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Loading home...
      </main>
    )
  }

  const dmMemberships = memberships.filter((member) => member.role === "dm")
  const playerMemberships = memberships.filter(
    (member) => member.role === "player"
  )

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-5xl font-black text-yellow-500">
            D&D Dashboard
          </h1>

          <p className="text-zinc-400 mt-2">
            Choose a campaign or create a new one.
          </p>
        </div>

        <button
          onClick={logout}
          className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-xl px-5 py-3 font-bold"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-zinc-900 border border-yellow-700 rounded-3xl p-6">
          <h2 className="text-3xl font-black text-yellow-400 mb-5">
            DM Campaigns
          </h2>

          {dmMemberships.length === 0 ? (
            <p className="text-zinc-400 mb-5">
              You are not currently the DM of any campaigns.
            </p>
          ) : (
            <div className="space-y-4 mb-5">
              {dmMemberships.map((member) => (
                <div
                  key={member.id}
                  className="bg-zinc-950 border border-zinc-700 rounded-2xl p-5"
                >
                  <h3 className="text-2xl font-bold text-yellow-400">
                    {member.campaigns?.name ?? "Unnamed Campaign"}
                  </h3>

                  <p className="text-zinc-400 mt-1">
                    Code: {member.campaigns?.code}
                  </p>

                  <button
                    onClick={() =>
                      router.push(
                        `/campaign/${member.campaigns?.code}/dm`
                      )
                    }
                    className="mt-4 w-full bg-yellow-600 hover:bg-yellow-500 text-black rounded-xl p-3 font-black"
                  >
                    Open DM Dashboard
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => router.push("/create-campaign")}
            className="w-full bg-zinc-800 hover:bg-zinc-700 border border-yellow-700 text-yellow-400 rounded-xl p-4 font-black"
          >
            Create New Campaign
          </button>
        </section>

        <section className="bg-zinc-900 border border-blue-700 rounded-3xl p-6">
          <h2 className="text-3xl font-black text-blue-400 mb-5">
            Player Campaigns
          </h2>

          {playerMemberships.length === 0 ? (
            <p className="text-zinc-400 mb-5">
              You do not have any player campaigns yet.
            </p>
          ) : (
            <div className="space-y-4 mb-5">
              {playerMemberships.map((member) => (
                <div
                  key={member.id}
                  className="bg-zinc-950 border border-zinc-700 rounded-2xl p-5"
                >
                  <h3 className="text-2xl font-bold text-blue-400">
                    {member.campaigns?.name ?? "Unnamed Campaign"}
                  </h3>

                  <p className="text-zinc-400 mt-1">
                    Code: {member.campaigns?.code}
                  </p>

                  <button
                    onClick={() =>
                      router.push(
                        `/campaign/${member.campaigns?.code}/player`
                      )
                    }
                    className="mt-4 w-full bg-blue-700 hover:bg-blue-600 text-white rounded-xl p-3 font-black"
                  >
                    Open Player Page
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => router.push("/join-campaign")}
            className="w-full bg-zinc-800 hover:bg-zinc-700 border border-blue-700 text-blue-400 rounded-xl p-4 font-black"
          >
            Join Campaign / Create Character
          </button>
        </section>
      </div>
    </main>
  )
}