"use client"

import { useEffect, useRef, useState } from "react"
import PlayerCard from "../../components/PlayerCard"
import { supabase } from "../../lib/supabase"
import type { Character, EncounterState } from "../../lib/types"

export default function DisplayPage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [encounter, setEncounter] = useState<EncounterState | null>(null)

  const [majorEnemyAlert, setMajorEnemyAlert] = useState(false)
  const [majorEnemyFlash, setMajorEnemyFlash] = useState(false)
  const [majorEnemyBannerName, setMajorEnemyBannerName] = useState("")

  const previousMajorEnemyIds = useRef<string[] | null>(null)

  async function loadData() {
    const { data: characterData, error: characterError } = await supabase
      .from("characters")
      .select("*")
      .eq("is_active", true)
      .order("initiative", { ascending: false })

    if (characterError) {
      console.log("DISPLAY CHARACTER ERROR:", characterError.message)
      return
    }

    if (characterData) {
      setCharacters(characterData)
    }

    const { data: encounterData, error: encounterError } = await supabase
      .from("encounter_state")
      .select("*")
      .eq("id", "main")
      .single()

    if (encounterError) {
      console.log("DISPLAY ENCOUNTER ERROR:", encounterError.message)
      return
    }

    if (encounterData) {
      setEncounter(encounterData)
    }
  }

  function playMajorEnemySound(soundUrl?: string) {
    if (!soundUrl) return

    try {
      const audio = new Audio(soundUrl)
      audio.volume = 1

      audio.play().catch((err) => {
        console.log("Audio blocked:", err)
      })
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel("display-major-enemy-banner-sync")
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
  }, [])

  useEffect(() => {
    const currentMajorEnemies = characters.filter(
      (character) => character.creature_type === "major_enemy"
    )

    const currentMajorEnemyIds = currentMajorEnemies.map(
      (character) => character.id
    )

    if (previousMajorEnemyIds.current === null) {
      previousMajorEnemyIds.current = currentMajorEnemyIds
      return
    }

    const newestMajorEnemy = currentMajorEnemies.find(
      (enemy) => !previousMajorEnemyIds.current?.includes(enemy.id)
    )

    if (newestMajorEnemy) {
      setMajorEnemyAlert(true)
      setMajorEnemyFlash(true)
      setMajorEnemyBannerName(newestMajorEnemy.name)

      playMajorEnemySound(newestMajorEnemy.sound_url)

      setTimeout(() => {
        setMajorEnemyFlash(false)
      }, 1500)

      setTimeout(() => {
        setMajorEnemyAlert(false)
        setMajorEnemyBannerName("")
      }, 4200)
    }

    previousMajorEnemyIds.current = currentMajorEnemyIds
  }, [characters])

  const combatStarted = Boolean(encounter?.active_character_id)

  const majorEnemies = characters.filter(
    (character) => character.creature_type === "major_enemy"
  )

  const playerCharacters = characters.filter(
    (character) => character.creature_type === "player"
  )

  const npcCharacters = characters.filter(
    (character) => character.creature_type === "npc"
  )

  const initiativeOrder = [...characters]
    .filter(
      (character) =>
        character.creature_type === "player" || character.hp > 0
    )
    .sort((a, b) => {
      if (b.initiative !== a.initiative) return b.initiative - a.initiative
      return a.name.localeCompare(b.name)
    })

  return (
    <>
      <style jsx global>{`
        @keyframes majorEnemyShake {
          0% { transform: translate(0, 0); }
          10% { transform: translate(-12px, 0); }
          20% { transform: translate(12px, 0); }
          30% { transform: translate(-10px, 0); }
          40% { transform: translate(10px, 0); }
          50% { transform: translate(-8px, 0); }
          60% { transform: translate(8px, 0); }
          70% { transform: translate(-5px, 0); }
          80% { transform: translate(5px, 0); }
          100% { transform: translate(0, 0); }
        }

        @keyframes bossBannerEnter {
          0% {
            opacity: 0;
            transform: scale(0.65) translateY(60px);
            filter: blur(10px);
          }
          20% {
            opacity: 1;
            transform: scale(1.08) translateY(0);
            filter: blur(0);
          }
          70% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.95) translateY(-30px);
            filter: blur(4px);
          }
        }

        .major-enemy-shake {
          animation: majorEnemyShake 2.5s ease-in-out;
        }

        .boss-banner-animation {
          animation: bossBannerEnter 4.2s ease-out forwards;
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "#ff0000",
          opacity: majorEnemyFlash ? 0.75 : 0,
          transition: "opacity 1.5s ease-out",
          zIndex: 999999,
          pointerEvents: "none",
        }}
      />

      {majorEnemyAlert && (
  <div className="fixed inset-0 z-[1000000] boss-banner-animation pointer-events-none">
    <div className="absolute inset-0 bg-black/70" />

    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="text-purple-300 text-5xl font-black tracking-[0.8em] uppercase mb-8">
        BOSS
      </div>

      <div
        className="text-red-500 font-black uppercase text-center leading-none"
        style={{
          fontSize: "clamp(5rem, 12vw, 12rem)",
          textShadow:
            "0 0 20px rgba(255,0,0,1), 0 0 60px rgba(255,0,0,0.8)",
        }}
      >
        {majorEnemyBannerName}
      </div>

      <div className="mt-8 text-white text-4xl font-bold tracking-[0.4em] uppercase">
        HAS ENTERED THE BATTLE
      </div>
    </div>
  </div>
)}

      <main
        className={`min-h-screen text-white pt-2 px-8 pb-8 bg-cover bg-center bg-no-repeat transition-all duration-700 ${
          majorEnemyAlert ? "major-enemy-shake" : ""
        }`}
        style={{
          backgroundImage:
            combatStarted && encounter?.background_url
              ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.82)), url(${encounter.background_url})`
              : undefined,
          backgroundColor: "#09090b",
        }}
      >
        
        {majorEnemies.length > 0 && (
          <section className="mb-8">
            <h2 className="text-4xl font-black text-purple-400 mb-6 text-center">
              BOSS
            </h2>

            <div className="flex flex-wrap gap-8 justify-center">
              {majorEnemies.map((enemy) => (
                <PlayerCard
                  key={enemy.id}
                  name={enemy.name}
                  className={enemy.class_name}
                  imageUrl={enemy.image_url}
                  hp={enemy.hp}
                  maxHp={enemy.max_hp}
                  ac={enemy.ac}
                  initiative={enemy.initiative}
                  amount={enemy.amount}
                  attacks={enemy.attacks ?? []}
                  creatureType="major_enemy"
                  size="large"
                  displayHp={enemy.display_hp}
                  displayAc={enemy.display_ac}
                  isCurrentTurn={encounter?.active_character_id === enemy.id}
                  showAttacks={false}
                />
              ))}
            </div>
          </section>
        )}

        <section className="mb-10">
          <h2 className="text-3xl font-bold text-yellow-400 mb-6">
            Party
          </h2>

          <div className="flex flex-wrap gap-8">
            {playerCharacters.map((player) => (
              <PlayerCard
                key={player.id}
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
                isCurrentTurn={encounter?.active_character_id === player.id}
                showAttacks={false}
              />
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-red-400 mb-6">
            Enemies
          </h2>

          <div className="flex flex-wrap gap-6 items-start justify-start">
            {npcCharacters.map((npc) => (
              <PlayerCard
                key={npc.id}
                name={npc.name}
                className={npc.class_name}
                imageUrl={npc.image_url}
                hp={npc.hp}
                maxHp={npc.max_hp}
                ac={npc.ac}
                initiative={npc.initiative}
                amount={npc.amount}
                attacks={npc.attacks ?? []}
                creatureType="npc"
                size="small"
                displayHp={npc.display_hp}
                displayAc={npc.display_ac}
                isCurrentTurn={encounter?.active_character_id === npc.id}
                showAttacks={false}
              />
            ))}
          </div>
        </section>

        <section className="bg-zinc-900/90 border border-zinc-700 rounded-xl p-3">
          <h2 className="text-lg font-bold text-yellow-400 mb-3">
            Initiative Order
          </h2>

          <div className="flex flex-wrap gap-2">
            {initiativeOrder.map((character, index) => {
              const active = character.id === encounter?.active_character_id

              const playerLabel =
                character.creature_type === "player"
                  ? character.player_name || "Unnamed"
                  : character.creature_type === "major_enemy"
                    ? "Major Enemy"
                    : "Enemy"

              return (
                <div
                  key={character.id}
                  className="flex-none flex flex-col items-center gap-1 px-2 py-2 rounded-lg border shadow-sm"
                  style={{
                    width: "8rem",
                    backgroundColor: active ? "#b8860b" : "#27272a",
                    color: active ? "#000" : "#fff",
                    borderColor: active ? "#fde68a" : "#3f3f46",
                    fontSize: "0.75rem",
                  }}
                >
                  <span className="font-black">{index + 1}.</span>

                  <span className="font-bold truncate text-center w-full">
                    {active ? "▶ " : ""}
                    {character.name}
                  </span>

                  <span
                    className={`truncate text-center w-full ${
                      active ? "text-black/70" : "text-zinc-300"
                    }`}
                  >
                    {playerLabel}
                  </span>

                  <span className="font-black px-1 rounded bg-zinc-700 text-yellow-400">
                    {character.initiative}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </>
  )
}