"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import PlayerCard from "../../../../components/PlayerCard"
import { supabase } from "../../../../lib/supabase"
import type { Campaign, Character, EncounterState } from "../../../../lib/types"

export default function CampaignPlayerPage() {
  const params = useParams()
  const router = useRouter()
  const campaignCode = String(params.code || "").toUpperCase()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [character, setCharacter] = useState<Character | null>(null)
  const [encounter, setEncounter] = useState<EncounterState | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadData() {
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
      .eq("code", campaignCode)
      .single()

    if (campaignError || !campaignData) {
      console.log("CAMPAIGN ERROR:", campaignError?.message)
      setLoading(false)
      return
    }

    setCampaign(campaignData)

    const { data: characterData, error: characterError } = await supabase
      .from("characters")
      .select("*")
      .eq("campaign_id", campaignData.id)
      .eq("user_id", user.id)
      .eq("creature_type", "player")
      .eq("is_active", true)
      .maybeSingle()

    if (characterError) {
      console.log("PLAYER CHARACTER ERROR:", characterError.message)
      setLoading(false)
      return
    }

    setCharacter(characterData)

    const { data: encounterData } = await supabase
      .from("encounter_state")
      .select("*")
      .eq("campaign_id", campaignData.id)
      .single()

    if (encounterData) {
      setEncounter(encounterData)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!campaignCode) return

    loadData()

    const channel = supabase
      .channel(`player-campaign-${campaignCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "characters" },
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "encounter_state" },
        () => loadData()
      )
      .subscribe()

    const interval = setInterval(() => {
      loadData()
    }, 1000)

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [campaignCode])

  async function updateCharacter(updates: Partial<Character>) {
    if (!character) return

    const { error } = await supabase
      .from("characters")
      .update(updates)
      .eq("id", character.id)

    if (error) {
      console.log("PLAYER UPDATE ERROR:", error.message)
      return
    }

    await loadData()
  }

  async function uploadPortrait(file: File) {
    if (!character) return

    const fileExt = file.name.split(".").pop()
    const filePath = `${character.id}/${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from("character-portraits")
      .upload(filePath, file, { upsert: true })

    if (error) {
      console.log("UPLOAD ERROR:", error.message)
      return
    }

    const { data } = supabase.storage
      .from("character-portraits")
      .getPublicUrl(filePath)

    await updateCharacter({
      image_url: data.publicUrl,
    })
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Loading player page...
      </main>
    )
  }

  if (!campaign) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Campaign not found.
      </main>
    )
  }

  if (!character) {
  router.push(`/campaign/${campaignCode}/setup`)
  return null
}

  return (
    <main
      className="min-h-screen text-white p-8 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          encounter?.active_character_id && encounter?.background_url
            ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.82)), url(${encounter.background_url})`
            : undefined,
        backgroundColor: "#09090b",
      }}
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black text-yellow-500">
            {campaign.name}
          </h1>

          <p className="text-zinc-400">
            Campaign Code: {campaign.code}
          </p>
        </div>

        <button
          onClick={logout}
          className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-2"
        >
          Logout
        </button>
      </div>

      <div className="flex justify-center">
        <PlayerCard
          playerName={character.player_name}
          name={character.name}
          className={character.class_name}
          imageUrl={character.image_url}
          hp={character.hp}
          maxHp={character.max_hp}
          ac={character.ac}
          initiative={character.initiative}
          amount={character.amount}
          gold={character.gold}
          attacks={character.attacks ?? []}
          creatureType="player"
          displayHp={true}
          displayAc={true}
          isCurrentTurn={encounter?.active_character_id === character.id}
          isOwnTurn={encounter?.active_character_id === character.id}
          canEditHealth
          canEditCharacter
          showAttacks
          onCharacterChange={(updates) => updateCharacter(updates)}
          onImageUpload={(file) => uploadPortrait(file)}
          onAmountChange={(value) =>
            updateCharacter({
              amount: value,
            })
          }
          onDamage={() =>
            updateCharacter({
              hp: Math.max(character.hp - character.amount, 0),
            })
          }
          onHeal={() =>
            updateCharacter({
              hp: Math.min(character.hp + character.amount, character.max_hp),
            })
          }
        />
      </div>
    </main>
  )
}