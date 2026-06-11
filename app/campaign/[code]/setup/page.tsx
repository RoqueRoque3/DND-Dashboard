"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "../../../../lib/supabase"
import type { Campaign, Character } from "../../../../lib/types"

export default function CampaignSetupPage() {
  const params = useParams()
  const router = useRouter()
  const campaignCode = String(params.code || "").toUpperCase()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [existingCharacter, setExistingCharacter] = useState<Character | null>(
    null
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [playerName, setPlayerName] = useState("")
  const [characterName, setCharacterName] = useState("")
  const [className, setClassName] = useState("")
  const [maxHp, setMaxHp] = useState(30)
  const [ac, setAc] = useState(10)

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push(`/login?next=/campaign/${campaignCode}/setup`)
      return
    }

    const { data: campaignData, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("code", campaignCode)
      .single()

    if (campaignError || !campaignData) {
      console.log("SETUP CAMPAIGN ERROR:", campaignError?.message)
      setLoading(false)
      return
    }

    setCampaign(campaignData)

    const { data: characterData } = await supabase
      .from("characters")
      .select("*")
      .eq("campaign_id", campaignData.id)
      .eq("user_id", user.id)
      .eq("creature_type", "player")
      .eq("is_active", true)
      .maybeSingle()

    if (characterData) {
      setExistingCharacter(characterData)
      setPlayerName(characterData.player_name || "")
      setCharacterName(characterData.name || "")
      setClassName(characterData.class_name || "")
      setMaxHp(characterData.max_hp || 30)
      setAc(characterData.ac || 10)
    }

    setLoading(false)
  }

  async function saveSetup() {
    if (!campaign) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push(`/login?next=/campaign/${campaignCode}/setup`)
      return
    }

    if (!playerName.trim() || !characterName.trim()) {
      alert("Please enter both player name and character name.")
      return
    }

    setSaving(true)

    if (existingCharacter) {
      const { error } = await supabase
        .from("characters")
        .update({
          player_name: playerName,
          name: characterName,
          class_name: className,
          max_hp: maxHp,
          hp: Math.min(existingCharacter.hp, maxHp),
          ac,
        })
        .eq("id", existingCharacter.id)

      if (error) {
        console.log("UPDATE SETUP ERROR:", error.message)
        alert(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from("characters").insert({
        id: crypto.randomUUID(),
        campaign_id: campaign.id,
        user_id: user.id,
        player_name: playerName,
        name: characterName,
        class_name: className || "Adventurer",
        image_url: "",
        sound_url: "",
        hp: maxHp,
        max_hp: maxHp,
        ac,
        initiative: 0,
        amount: 5,
        gold: 0,
        attacks: [],
        creature_type: "player",
        display_hp: true,
        display_ac: true,
        is_active: true,
      })

      if (error) {
        console.log("CREATE SETUP ERROR:", error.message)
        alert(error.message)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    router.push(`/campaign/${campaignCode}/player`)
  }

  useEffect(() => {
    if (!campaignCode) return
    loadData()
  }, [campaignCode])

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Loading setup...
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
      <div className="max-w-2xl w-full bg-zinc-900 border border-yellow-700 rounded-3xl p-10 shadow-2xl">
        <div className="text-center mb-8">
          <p className="text-yellow-400 uppercase tracking-[0.4em] text-sm font-bold mb-4">
            Character Setup
          </p>

          <h1 className="text-5xl font-black text-yellow-500">
            {campaign.name}
          </h1>

          <p className="text-zinc-400 mt-2">
            Campaign Code: {campaign.code}
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Player Name
            </label>

            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Bob"
              className="w-full rounded-xl bg-zinc-800 border border-zinc-600 p-4 text-lg"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Character Name
            </label>

            <input
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Arannis"
              className="w-full rounded-xl bg-zinc-800 border border-zinc-600 p-4 text-lg"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Class / Type
            </label>

            <input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Fighter"
              className="w-full rounded-xl bg-zinc-800 border border-zinc-600 p-4 text-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Max HP
              </label>

              <input
                type="number"
                value={maxHp}
                onChange={(e) => setMaxHp(Number(e.target.value))}
                className="w-full rounded-xl bg-zinc-800 border border-zinc-600 p-4 text-lg"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Armor Class
              </label>

              <input
                type="number"
                value={ac}
                onChange={(e) => setAc(Number(e.target.value))}
                className="w-full rounded-xl bg-zinc-800 border border-zinc-600 p-4 text-lg"
              />
            </div>
          </div>

          <button
            onClick={saveSetup}
            disabled={saving}
            className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-black rounded-2xl p-5 text-2xl font-black mt-4"
          >
            {saving
              ? "Saving..."
              : existingCharacter
                ? "Update Character"
                : "Create Character"}
          </button>
        </div>
      </div>
    </main>
  )
}