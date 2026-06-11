"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import PlayerCard from "../../components/PlayerCard"
import { supabase } from "../../lib/supabase"
import type { Character, EncounterState } from "../../lib/types"

export default function PlayerPage() {
  const router = useRouter()

  const [player, setPlayer] = useState<Character | null>(null)
  const [encounter, setEncounter] = useState<EncounterState | null>(null)

  async function loadPlayer() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    const { data } = await supabase
      .from("characters")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (data) {
      setPlayer(data)
    }

    const { data: encounterData } = await supabase
      .from("encounter_state")
      .select("*")
      .eq("id", "main")
      .single()

    if (encounterData) {
      setEncounter(encounterData)
    }
  }

  useEffect(() => {
    loadPlayer()

    const channel = supabase
      .channel("player-realtime-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "characters",
        },
        () => {
          loadPlayer()
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "encounter_state",
        },
        () => {
          loadPlayer()
        }
      )
      .subscribe()

    const interval = setInterval(() => {
      loadPlayer()
    }, 1000)

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  async function updateCharacter(updates: Partial<Character>) {
    if (!player) return

    const { error } = await supabase
      .from("characters")
      .update(updates)
      .eq("id", player.id)

    if (error) {
      console.log("PLAYER UPDATE ERROR:", error.message)
      return
    }

    await loadPlayer()
  }

  async function uploadPortrait(file: File) {
    if (!player) return

    const fileExt = file.name.split(".").pop()
    const filePath = `${player.id}/${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from("character-portraits")
      .upload(filePath, file, {
        upsert: true,
      })

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

  if (!player) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Loading...
      </main>
    )
  }

  const combatStarted = Boolean(encounter?.active_character_id)

  return (
    <main
      className="min-h-screen text-white p-8 bg-cover bg-center bg-no-repeat transition-all duration-700"
      style={{
        backgroundImage:
          combatStarted && encounter?.background_url
            ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.85)), url(${encounter.background_url})`
            : undefined,
        backgroundColor: "#09090b",
      }}
    >
      <div className="flex justify-end mb-8">
        <button
          onClick={logout}
          className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-2"
        >
          Logout
        </button>
      </div>

      <div className="flex justify-center">
        <PlayerCard
          playerName={player.player_name}
          name={player.name}
          className={player.class_name}
          imageUrl={player.image_url}
          hp={player.hp}
          maxHp={player.max_hp}
          ac={player.ac}
          initiative={player.initiative}
          amount={player.amount}
          gold={player.gold}
          attacks={player.attacks ?? []}
          creatureType="player"
          displayHp={true}
          displayAc={true}
          forceShowStats
          isCurrentTurn={encounter?.active_character_id === player.id}
          isOwnTurn={encounter?.active_character_id === player.id}
          canEditHealth
          canEditCharacter
          canEditAttacks
          showAttacks
          onCharacterChange={(updates) => updateCharacter(updates)}
          onImageUpload={uploadPortrait}
          onAmountChange={(value) => updateCharacter({ amount: value })}
          onDamage={() =>
            updateCharacter({
              hp: Math.max(player.hp - player.amount, 0),
            })
          }
          onHeal={() =>
            updateCharacter({
              hp: Math.min(player.hp + player.amount, player.max_hp),
            })
          }
        />
      </div>
    </main>
  )
}