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
        campaigns (
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

    const fixedMemberships =
      data?.map((member: any) => ({
        ...member,
        campaigns: Array.isArray(member.campaigns)
          ? member.campaigns[0]
          : member.campaigns,
      })) ?? []

    setMemberships(fixedMemberships as unknown as CampaignMember[])
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
        Loading Home...
      </main>
    )
  }

  const dmMemberships = memberships.filter(
    (membership) => membership.role === "dm"
  )

  const playerMemberships = memberships.filter(
    (membership) => membership.role === "player"
  )

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-black text-yellow-500">
              D&D Dashboard
            </h1>

            <p className="text-zinc-400 mt-2">
              Select a campaign or create a new one.
            </p>
          </div>

          <button
            onClick={logout}
            className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-xl px-5 py-3 font-bold"
          >
            Logout
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* DM Campaigns */}

          <section className="bg-zinc-900 border border-yellow-700 rounded-3xl p-6">
            <h2 className="text-3xl font-black text-yellow-400 mb-6">
              DM Campaigns
            </h2>

            {dmMemberships.length === 0 ? (
              <div className="bg-zinc-950 border border-zinc-700 rounded-2xl p-6 text-zinc-400">
                No DM campaigns found.
              </div>
            ) : (
              <div className="space-y-4">
                {dmMemberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="bg-zinc-950 border border-zinc-700 rounded-2xl p-5"
                  >
                    <h3 className="text-2xl font-bold text-yellow-400">
                      {membership.campaigns?.name}
                    </h3>

                    <p className="text-zinc-400 mt-1">
                      Code: {membership.campaigns?.code}
                    </p>

                    <button
                      onClick={() =>
                        router.push(
                          `/campaign/${membership.campaigns?.code}/dm`
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
              className="w-full mt-6 bg-zinc-800 hover:bg-zinc-700 border border-yellow-700 text-yellow-400 rounded-xl p-4 font-black"
            >
              Create New Campaign
            </button>
          </section>

          {/* Player Campaigns */}

          <section className="bg-zinc-900 border border-blue-700 rounded-3xl p-6">
            <h2 className="text-3xl font-black text-blue-400 mb-6">
              Player Campaigns
            </h2>

            {playerMemberships.length === 0 ? (
              <div className="bg-zinc-950 border border-zinc-700 rounded-2xl p-6 text-zinc-400">
                No player campaigns found.
              </div>
            ) : (
              <div className="space-y-4">
                {playerMemberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="bg-zinc-950 border border-zinc-700 rounded-2xl p-5"
                  >
                    <h3 className="text-2xl font-bold text-blue-400">
                      {membership.campaigns?.name}
                    </h3>

                    <p className="text-zinc-400 mt-1">
                      Code: {membership.campaigns?.code}
                    </p>

                    <button
                      onClick={() =>
                        router.push(
                          `/campaign/${membership.campaigns?.code}/player`
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
              className="w-full mt-6 bg-zinc-800 hover:bg-zinc-700 border border-blue-700 text-blue-400 rounded-xl p-4 font-black"
            >
              Join Campaign / Create Character
            </button>
          </section>
        </div>
      </div>
    </main>
  )
}