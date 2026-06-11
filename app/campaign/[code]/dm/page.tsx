"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import PlayerCard from "../../../../components/PlayerCard"
import { supabase } from "../../../../lib/supabase"
import type {
  Campaign,
  Character,
  EncounterState,
  SavedMajorEnemy,
  SavedNpc,
} from "../../../../lib/types"

export default function CampaignDMPage() {
  const params = useParams()
  const router = useRouter()
  const campaignCode = String(params.code || "").toUpperCase()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [allCharacters, setAllCharacters] = useState<Character[]>([])
  const [encounter, setEncounter] = useState<EncounterState | null>(null)
  const [savedNpcs, setSavedNpcs] = useState<SavedNpc[]>([])
  const [savedMajorEnemies, setSavedMajorEnemies] = useState<SavedMajorEnemy[]>([])
  const [loading, setLoading] = useState(true)

  const [showSettings, setShowSettings] = useState(false)
  const [showBackgroundControls, setShowBackgroundControls] = useState(false)
  const [showSavedNpcs, setShowSavedNpcs] = useState(false)
  const [showSavedMajorEnemies, setShowSavedMajorEnemies] = useState(false)
  const [showAddEnemy, setShowAddEnemy] = useState(false)
  const [showAddMajorEnemy, setShowAddMajorEnemy] = useState(false)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [copiedInvite, setCopiedInvite] = useState(false)

  const [newEnemyName, setNewEnemyName] = useState("Goblin")
  const [newEnemyHp, setNewEnemyHp] = useState(10)
  const [newEnemyAc, setNewEnemyAc] = useState(12)
  const [newEnemyInitiative, setNewEnemyInitiative] = useState(10)

  const [newMajorName, setNewMajorName] = useState("Dragon")
  const [newMajorHp, setNewMajorHp] = useState(300)
  const [newMajorAc, setNewMajorAc] = useState(20)
  const [newMajorInitiative, setNewMajorInitiative] = useState(15)

  async function verifyDm() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return false
    }

    const { data: isDm, error } = await supabase.rpc("is_dm")

    if (error || !isDm) {
      router.push(`/campaign/${campaignCode}/player`)
      return false
    }

    return true
  }

  async function ensureEncounterState(campaignId: string) {
    const { data } = await supabase
      .from("encounter_state")
      .select("*")
      .eq("campaign_id", campaignId)
      .maybeSingle()

    if (data) return data as EncounterState

    const { data: created, error } = await supabase
      .from("encounter_state")
      .insert({
        id: crypto.randomUUID(),
        campaign_id: campaignId,
        active_character_id: null,
        round_number: 1,
        background_url: null,
      })
      .select("*")
      .single()

    if (error) {
      console.log("CREATE ENCOUNTER ERROR:", error.message)
      return null
    }

    return created as EncounterState
  }

  async function loadAll() {
    const ok = await verifyDm()
    if (!ok) return

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

    const { data: characters } = await supabase
      .from("characters")
      .select("*")
      .eq("campaign_id", campaignData.id)
      .eq("is_active", true)
      .order("initiative", { ascending: false })

    if (characters) setAllCharacters(characters)

    const encounterData = await ensureEncounterState(campaignData.id)
    if (encounterData) setEncounter(encounterData)

    const { data: npcTemplates } = await supabase
      .from("saved_npcs")
      .select("*")
      .eq("campaign_id", campaignData.id)
      .order("name", { ascending: true })

    if (npcTemplates) setSavedNpcs(npcTemplates)

    const { data: majorTemplates } = await supabase
      .from("saved_major_enemies")
      .select("*")
      .eq("campaign_id", campaignData.id)
      .order("name", { ascending: true })

    if (majorTemplates) setSavedMajorEnemies(majorTemplates)

    setLoading(false)
  }

  useEffect(() => {
    if (!campaignCode) return

    loadAll()

    const channel = supabase
      .channel(`dm-campaign-${campaignCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "characters" },
        () => loadAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "encounter_state" },
        () => loadAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "saved_npcs" },
        () => loadAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "saved_major_enemies" },
        () => loadAll()
      )
      .subscribe()

    const interval = setInterval(() => {
      loadAll()
    }, 1000)

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [campaignCode])

  function isCombatEligible(character: Character) {
    return character.creature_type === "player" || character.hp > 0
  }

  async function updateCharacter(id: string, updates: Partial<Character>) {
    const { error } = await supabase
      .from("characters")
      .update(updates)
      .eq("id", id)

    if (error) {
      console.log("DM UPDATE ERROR:", error.message)
      return
    }

    await loadAll()
  }

  async function updateEncounter(updates: Partial<EncounterState>) {
    if (!encounter) return

    const { error } = await supabase
      .from("encounter_state")
      .update(updates)
      .eq("id", encounter.id)

    if (error) {
      console.log("ENCOUNTER UPDATE ERROR:", error.message)
      return
    }

    await loadAll()
  }

  async function uploadPortrait(characterId: string, file: File) {
    const fileExt = file.name.split(".").pop()
    const filePath = `${characterId}/${Date.now()}.${fileExt}`

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

    await updateCharacter(characterId, {
      image_url: data.publicUrl,
    })
  }

  async function uploadMajorEnemySound(characterId: string, file: File) {
    const fileExt = file.name.split(".").pop()
    const filePath = `${characterId}/${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from("major-enemy-sounds")
      .upload(filePath, file, { upsert: true })

    if (error) {
      console.log("SOUND UPLOAD ERROR:", error.message)
      return
    }

    const { data } = supabase.storage
      .from("major-enemy-sounds")
      .getPublicUrl(filePath)

    await updateCharacter(characterId, {
      sound_url: data.publicUrl,
    })
  }

  async function uploadCombatBackground(file: File) {
    const fileExt = file.name.split(".").pop()
    const filePath = `${campaign?.id || "campaign"}/${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from("combat-backgrounds")
      .upload(filePath, file, { upsert: true })

    if (error) {
      console.log("BACKGROUND UPLOAD ERROR:", error.message)
      return
    }

    const { data } = supabase.storage
      .from("combat-backgrounds")
      .getPublicUrl(filePath)

    await updateEncounter({
      background_url: data.publicUrl,
    })
  }

  async function clearCombatBackground() {
    await updateEncounter({
      background_url: null,
    })
  }

  function getInitiativeOrder() {
    return [...allCharacters]
      .filter(isCombatEligible)
      .sort((a, b) => {
        if (b.initiative !== a.initiative) return b.initiative - a.initiative
        return a.name.localeCompare(b.name)
      })
  }

  async function startCombat() {
    const order = getInitiativeOrder()
    if (order.length === 0) return

    await updateEncounter({
      active_character_id: order[0].id,
      round_number: 1,
    })
  }

  async function endCombat() {
    await updateEncounter({
      active_character_id: null,
      round_number: 1,
    })
  }

  async function toggleCombat() {
    if (encounter?.active_character_id) {
      await endCombat()
    } else {
      await startCombat()
    }
  }

  async function nextTurn() {
    const order = getInitiativeOrder()

    if (order.length === 0) {
      await endCombat()
      return
    }

    const currentIndex = order.findIndex(
      (character) => character.id === encounter?.active_character_id
    )

    if (currentIndex === -1) {
      await updateEncounter({
        active_character_id: order[0].id,
        round_number: encounter?.round_number ?? 1,
      })
      return
    }

    const nextIndex = (currentIndex + 1) % order.length

    await updateEncounter({
      active_character_id: order[nextIndex].id,
      round_number:
        nextIndex === 0
          ? (encounter?.round_number ?? 1) + 1
          : encounter?.round_number ?? 1,
    })
  }

  async function previousTurn() {
    const order = getInitiativeOrder()

    if (order.length === 0) {
      await endCombat()
      return
    }

    const currentIndex = order.findIndex(
      (character) => character.id === encounter?.active_character_id
    )

    if (currentIndex === -1) {
      await updateEncounter({
        active_character_id: order[0].id,
        round_number: encounter?.round_number ?? 1,
      })
      return
    }

    const previousIndex =
      currentIndex === 0 ? order.length - 1 : currentIndex - 1

    await updateEncounter({
      active_character_id: order[previousIndex].id,
      round_number:
        currentIndex === 0
          ? Math.max((encounter?.round_number ?? 1) - 1, 1)
          : encounter?.round_number ?? 1,
    })
  }

  async function addEnemy() {
    if (!campaign) return

    const npcId = `npc-${crypto.randomUUID()}`

    const { error } = await supabase.from("characters").insert({
      id: npcId,
      campaign_id: campaign.id,
      user_id: null,
      player_name: "",
      name: newEnemyName,
      class_name: "Enemy",
      image_url: "",
      sound_url: "",
      hp: newEnemyHp,
      max_hp: newEnemyHp,
      ac: newEnemyAc,
      initiative: newEnemyInitiative,
      amount: 5,
      gold: 0,
      attacks: [],
      creature_type: "npc",
      display_hp: false,
      display_ac: false,
      is_active: true,
    })

    if (error) {
      console.log("ADD ENEMY ERROR:", error.message)
      return
    }

    await loadAll()
  }

  async function addMajorEnemy() {
    if (!campaign) return

    const majorId = `major-${crypto.randomUUID()}`

    const { error } = await supabase.from("characters").insert({
      id: majorId,
      campaign_id: campaign.id,
      user_id: null,
      player_name: "",
      name: newMajorName,
      class_name: "Major Enemy",
      image_url: "",
      sound_url: "",
      hp: newMajorHp,
      max_hp: newMajorHp,
      ac: newMajorAc,
      initiative: newMajorInitiative,
      amount: 10,
      gold: 0,
      attacks: [],
      creature_type: "major_enemy",
      display_hp: true,
      display_ac: true,
      is_active: true,
    })

    if (error) {
      console.log("ADD MAJOR ENEMY ERROR:", error.message)
      return
    }

    await loadAll()
  }

  async function duplicateEnemy(enemy: Character) {
    if (!campaign) return

    const enemyId = `${enemy.creature_type}-${crypto.randomUUID()}`

    const { error } = await supabase.from("characters").insert({
      id: enemyId,
      campaign_id: campaign.id,
      user_id: null,
      player_name: "",
      name: `${enemy.name} Copy`,
      class_name: enemy.class_name,
      image_url: enemy.image_url,
      sound_url: enemy.sound_url,
      hp: enemy.max_hp,
      max_hp: enemy.max_hp,
      ac: enemy.ac,
      initiative: enemy.initiative,
      amount: enemy.amount,
      gold: 0,
      attacks: enemy.attacks ?? [],
      creature_type: enemy.creature_type,
      display_hp: enemy.display_hp,
      display_ac: enemy.display_ac,
      is_active: true,
    })

    if (error) {
      console.log("DUPLICATE ERROR:", error.message)
      return
    }

    await loadAll()
  }

  async function removeEnemy(id: string) {
    const { error } = await supabase.from("characters").delete().eq("id", id)

    if (error) {
      console.log("REMOVE ERROR:", error.message)
      return
    }

    if (encounter?.active_character_id === id) {
      await nextTurn()
    }

    await loadAll()
  }

  async function saveNpcTemplate(enemy: Character) {
    if (!campaign) return

    const { error } = await supabase.from("saved_npcs").insert({
      campaign_id: campaign.id,
      name: enemy.name,
      class_name: enemy.class_name,
      image_url: enemy.image_url,
      hp: enemy.max_hp,
      max_hp: enemy.max_hp,
      ac: enemy.ac,
      display_hp: enemy.display_hp,
      display_ac: enemy.display_ac,
    })

    if (error) {
      console.log("SAVE ENEMY ERROR:", error.message)
      return
    }

    await loadAll()
  }

  async function saveMajorEnemyTemplate(enemy: Character) {
    if (!campaign) return

    const { error } = await supabase.from("saved_major_enemies").insert({
      campaign_id: campaign.id,
      name: enemy.name,
      class_name: enemy.class_name,
      image_url: enemy.image_url,
      sound_url: enemy.sound_url || "",
      hp: enemy.max_hp,
      max_hp: enemy.max_hp,
      ac: enemy.ac,
      display_hp: enemy.display_hp,
      display_ac: enemy.display_ac,
    })

    if (error) {
      console.log("SAVE MAJOR ERROR:", error.message)
      return
    }

    await loadAll()
  }

  async function addSavedNpcToEncounter(template: SavedNpc) {
    if (!campaign) return

    const npcId = `npc-${crypto.randomUUID()}`

    const { error } = await supabase.from("characters").insert({
      id: npcId,
      campaign_id: campaign.id,
      user_id: null,
      player_name: "",
      name: template.name,
      class_name: template.class_name,
      image_url: template.image_url,
      sound_url: "",
      hp: template.max_hp,
      max_hp: template.max_hp,
      ac: template.ac,
      initiative: 10,
      amount: 5,
      gold: 0,
      attacks: [],
      creature_type: "npc",
      display_hp: template.display_hp,
      display_ac: template.display_ac,
      is_active: true,
    })

    if (error) {
      console.log("LOAD SAVED ENEMY ERROR:", error.message)
      return
    }

    await loadAll()
  }

  async function addSavedMajorEnemyToEncounter(template: SavedMajorEnemy) {
    if (!campaign) return

    const majorId = `major-${crypto.randomUUID()}`

    const { error } = await supabase.from("characters").insert({
      id: majorId,
      campaign_id: campaign.id,
      user_id: null,
      player_name: "",
      name: template.name,
      class_name: template.class_name,
      image_url: template.image_url,
      sound_url: template.sound_url || "",
      hp: template.max_hp,
      max_hp: template.max_hp,
      ac: template.ac,
      initiative: 15,
      amount: 10,
      gold: 0,
      attacks: [],
      creature_type: "major_enemy",
      display_hp: template.display_hp,
      display_ac: template.display_ac,
      is_active: true,
    })

    if (error) {
      console.log("LOAD SAVED MAJOR ERROR:", error.message)
      return
    }

    await loadAll()
  }

  async function deleteSavedNpc(id: string) {
    await supabase.from("saved_npcs").delete().eq("id", id)
    await loadAll()
  }

  async function deleteSavedMajorEnemy(id: string) {
    await supabase.from("saved_major_enemies").delete().eq("id", id)
    await loadAll()
  }

  async function copyInviteLink() {
    const inviteLink = `${window.location.origin}/campaign/${campaignCode}/invite`

    await navigator.clipboard.writeText(inviteLink)

    setCopiedInvite(true)

    setTimeout(() => {
      setCopiedInvite(false)
    }, 2000)
  }

  async function copyDisplayLink() {
    const displayLink = `${window.location.origin}/campaign/${campaignCode}/display`

    await navigator.clipboard.writeText(displayLink)

    alert("Display link copied!")
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const combatStarted = Boolean(encounter?.active_character_id)

  const playerCharacters = allCharacters.filter(
    (character) => character.creature_type === "player"
  )

  const majorEnemies = allCharacters.filter(
    (character) => character.creature_type === "major_enemy"
  )

  const enemyCharacters = allCharacters.filter(
    (character) => character.creature_type === "npc"
  )

  const initiativeCharacters = getInitiativeOrder()

  const activeCharacter = initiativeCharacters.find(
    (character) => character.id === encounter?.active_character_id
  )

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Loading DM Dashboard...
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

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="flex justify-between items-start mb-10">
        <div className="relative">
          <button
            onClick={() => setShowSettings((prev) => !prev)}
            className="bg-zinc-900 hover:bg-zinc-800 border border-yellow-700 rounded-xl px-5 py-3 font-bold text-yellow-400"
          >
            ⚙ Settings {showSettings ? "▲" : "▼"}
          </button>

          {showSettings && (
            <div className="absolute left-0 top-16 w-[34rem] max-w-[90vw] bg-zinc-900 border border-yellow-700 rounded-2xl shadow-2xl z-40 overflow-hidden">
              <button
                onClick={() => setShowBackgroundControls((prev) => !prev)}
                className="w-full flex justify-between items-center p-5 text-left border-b border-zinc-700"
              >
                <span className="text-xl font-bold text-yellow-400">
                  Combat Background
                </span>
                <span>{showBackgroundControls ? "▲" : "▼"}</span>
              </button>

              {showBackgroundControls && (
                <div className="p-5 border-b border-zinc-700">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadCombatBackground(file)
                    }}
                    className="w-full rounded-xl bg-zinc-800 border border-zinc-600 p-3"
                  />

                  <button
                    onClick={clearCombatBackground}
                    className="mt-4 bg-red-800 hover:bg-red-700 rounded-xl px-5 py-3 font-bold"
                  >
                    Clear Background
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowSavedNpcs((prev) => !prev)}
                className="w-full flex justify-between items-center p-5 text-left"
              >
                <span className="text-xl font-bold text-yellow-400">
                  Saved Enemies
                </span>
                <span>{showSavedNpcs ? "▲" : "▼"}</span>
              </button>

              {showSavedNpcs && (
                <div className="p-5 border-t border-zinc-700 max-h-[28rem] overflow-y-auto">
                  {savedNpcs.map((npc) => (
                    <div
                      key={npc.id}
                      className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 mb-3"
                    >
                      <h3 className="text-lg font-bold text-yellow-400">
                        {npc.name}
                      </h3>
                      <p>HP: {npc.max_hp}</p>
                      <p>AC: {npc.ac}</p>

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => addSavedNpcToEncounter(npc)}
                          className="flex-1 bg-green-700 hover:bg-green-600 rounded-lg p-2 font-bold"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => deleteSavedNpc(npc.id)}
                          className="flex-1 bg-red-800 hover:bg-red-700 rounded-lg p-2 font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowSavedMajorEnemies((prev) => !prev)}
                className="w-full flex justify-between items-center p-5 text-left border-t border-zinc-700"
              >
                <span className="text-xl font-bold text-purple-400">
                  Saved Major Enemies
                </span>
                <span>{showSavedMajorEnemies ? "▲" : "▼"}</span>
              </button>

              {showSavedMajorEnemies && (
                <div className="p-5 border-t border-zinc-700 max-h-[28rem] overflow-y-auto">
                  {savedMajorEnemies.map((enemy) => (
                    <div
                      key={enemy.id}
                      className="bg-zinc-800 border border-purple-700 rounded-xl p-4 mb-3"
                    >
                      <h3 className="text-lg font-bold text-purple-400">
                        {enemy.name}
                      </h3>
                      <p>HP: {enemy.max_hp}</p>
                      <p>AC: {enemy.ac}</p>
                      <p className="text-xs text-zinc-500 mt-2">
                        Sound: {enemy.sound_url ? "Uploaded" : "None"}
                      </p>

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => addSavedMajorEnemyToEncounter(enemy)}
                          className="flex-1 bg-purple-800 hover:bg-purple-700 rounded-lg p-2 font-bold"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => deleteSavedMajorEnemy(enemy.id)}
                          className="flex-1 bg-red-800 hover:bg-red-700 rounded-lg p-2 font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-center">
          <h1 className="text-5xl font-bold text-yellow-500">
            Dungeon Master Dashboard
          </h1>
          <p className="text-zinc-400 mt-2">
            Campaign: {campaign.name} / Code: {campaign.code}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowAccountMenu((prev) => !prev)}
            className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-2 font-bold"
          >
            ⚙ Menu {showAccountMenu ? "▲" : "▼"}
          </button>

          {showAccountMenu && (
            <div className="fixed right-0 top-12 w-[28rem] bg-zinc-900 border border-yellow-700 rounded-2xl shadow-2xl p-5 z-50">
              <h3 className="text-xl font-bold text-yellow-400 mb-3">
                Campaign Invite
              </h3>

              <p className="text-sm text-zinc-400 mb-3">
                Send this link to players so they can join this campaign and create their character.
              </p>

              <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-300 break-all mb-4">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/campaign/${campaignCode}/invite`
                  : `/campaign/${campaignCode}/invite`}
              </div>

              <button
                onClick={copyInviteLink}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-black rounded-xl p-3 font-bold mb-3"
              >
                {copiedInvite ? "Copied!" : "Copy Invite Link"}
              </button>            

              <button
                onClick={copyDisplayLink}
                className="w-full bg-green-700 hover:bg-green-600 text-white rounded-xl p-3 font-bold mb-3"
              >
                Copy Display Link
              </button>

              <button
                onClick={logout}
                className="w-full bg-red-800 hover:bg-red-700 rounded-xl p-3 font-bold"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6">
          Player Characters
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
              displayHp
              displayAc
              forceShowStats
              isCurrentTurn={encounter?.active_character_id === player.id}
              canEditHealth
              canEditCharacter
              canEditInitiative
              canEditAttacks
              showAttacks
              onCharacterChange={(updates) =>
                updateCharacter(player.id, updates)
              }
              onImageUpload={(file) => uploadPortrait(player.id, file)}
              onAmountChange={(value) =>
                updateCharacter(player.id, { amount: value })
              }
              onDamage={() =>
                updateCharacter(player.id, {
                  hp: Math.max(player.hp - player.amount, 0),
                })
              }
              onHeal={() =>
                updateCharacter(player.id, {
                  hp: Math.min(player.hp + player.amount, player.max_hp),
                })
              }
            />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <button
          onClick={toggleCombat}
          className={`w-full rounded-2xl px-8 py-6 text-4xl font-black transition-all ${
            combatStarted
              ? "bg-red-800 hover:bg-red-700 text-white border border-red-500"
              : "bg-blue-800 hover:bg-blue-700 text-white border border-blue-500"
          }`}
        >
          {combatStarted ? "In Combat" : "Out of Combat"}
        </button>

        {combatStarted && (
          <div className="bg-zinc-900 border border-yellow-700 rounded-2xl p-6 mt-6">
            <h2 className="text-3xl font-bold text-yellow-400 mb-2">
              Initiative Control
            </h2>

            <p className="text-zinc-400 mb-6">
              Round {encounter?.round_number ?? 1} • Current Turn:{" "}
              <span className="text-yellow-400 font-bold">
                {activeCharacter?.name ?? "Unknown"}
              </span>
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={previousTurn}
                className="bg-zinc-700 hover:bg-zinc-600 rounded-xl px-5 py-3 font-bold"
              >
                Previous Turn
              </button>

              <button
                onClick={nextTurn}
                className="bg-green-700 hover:bg-green-600 rounded-xl px-5 py-3 font-bold"
              >
                Next Turn
              </button>
            </div>
          </div>
        )}
      </section>

      {combatStarted && (
        <>
          <section className="bg-zinc-900 border border-purple-700 rounded-2xl mb-10 overflow-hidden">
            <button
              onClick={() => setShowAddMajorEnemy((prev) => !prev)}
              className="w-full flex justify-between items-center p-6 text-left"
            >
              <span className="text-3xl font-bold text-purple-400">
                Add Major Enemy
              </span>
              <span className="text-2xl">{showAddMajorEnemy ? "▲" : "▼"}</span>
            </button>

            {showAddMajorEnemy && (
              <div className="border-t border-zinc-700 p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    value={newMajorName}
                    onChange={(e) => setNewMajorName(e.target.value)}
                    className="rounded-xl bg-zinc-800 border border-zinc-600 p-3"
                  />
                  <input
                    type="number"
                    value={newMajorHp}
                    onChange={(e) => setNewMajorHp(Number(e.target.value))}
                    className="rounded-xl bg-zinc-800 border border-zinc-600 p-3"
                  />
                  <input
                    type="number"
                    value={newMajorAc}
                    onChange={(e) => setNewMajorAc(Number(e.target.value))}
                    className="rounded-xl bg-zinc-800 border border-zinc-600 p-3"
                  />
                  <input
                    type="number"
                    value={newMajorInitiative}
                    onChange={(e) =>
                      setNewMajorInitiative(Number(e.target.value))
                    }
                    className="rounded-xl bg-zinc-800 border border-zinc-600 p-3"
                  />
                </div>

                <button
                  onClick={addMajorEnemy}
                  className="mt-4 bg-purple-800 hover:bg-purple-700 rounded-xl px-6 py-3 font-bold"
                >
                  Add Major Enemy
                </button>
              </div>
            )}
          </section>

          {majorEnemies.length > 0 && (
            <section className="mb-12">
              <h2 className="text-4xl font-black text-purple-400 mb-6">
                Major Enemies
              </h2>

              <div className="flex flex-wrap gap-8">
                {majorEnemies.map((enemy) => (
                  <div key={enemy.id} className="flex flex-col gap-3">
                    <PlayerCard
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
                      forceShowStats
                      isCurrentTurn={encounter?.active_character_id === enemy.id}
                      canEditHealth
                      canEditCharacter
                      canEditInitiative
                      canControlDisplayStats
                      canEditAttacks
                      showAttacks
                      onCharacterChange={(updates) =>
                        updateCharacter(enemy.id, updates)
                      }
                      onImageUpload={(file) => uploadPortrait(enemy.id, file)}
                      onAmountChange={(value) =>
                        updateCharacter(enemy.id, { amount: value })
                      }
                      onDamage={() =>
                        updateCharacter(enemy.id, {
                          hp: Math.max(enemy.hp - enemy.amount, 0),
                        }).then(() => {
                          if (encounter?.active_character_id === enemy.id) {
                            nextTurn()
                          }
                        })
                      }
                      onHeal={() =>
                        updateCharacter(enemy.id, {
                          hp: Math.min(enemy.hp + enemy.amount, enemy.max_hp),
                        })
                      }
                    />

                    <div className="bg-zinc-900 border border-purple-700 rounded-xl p-4">
                      <label className="block text-sm text-zinc-400 mb-2">
                        Major Enemy MP3 Sound
                      </label>

                      <input
                        type="file"
                        accept="audio/mpeg,audio/mp3"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) uploadMajorEnemySound(enemy.id, file)
                        }}
                        className="w-full rounded-xl bg-zinc-800 border border-zinc-600 p-3"
                      />

                      <p className="text-xs text-zinc-500 mt-2">
                        {enemy.sound_url
                          ? "Sound uploaded."
                          : "No sound uploaded yet."}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => duplicateEnemy(enemy)}
                        className="bg-blue-800 hover:bg-blue-700 rounded-xl p-2 font-bold"
                      >
                        Duplicate
                      </button>

                      <button
                        onClick={() => saveMajorEnemyTemplate(enemy)}
                        className="bg-purple-800 hover:bg-purple-700 rounded-xl p-2 font-bold"
                      >
                        Save Major
                      </button>

                      <button
                        onClick={() => removeEnemy(enemy.id)}
                        className="bg-red-800 hover:bg-red-700 rounded-xl p-2 font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="bg-zinc-900 border border-zinc-700 rounded-2xl mb-10 overflow-hidden">
            <button
              onClick={() => setShowAddEnemy((prev) => !prev)}
              className="w-full flex justify-between items-center p-6 text-left"
            >
              <span className="text-3xl font-bold text-red-400">
                Add Enemy
              </span>
              <span className="text-2xl">{showAddEnemy ? "▲" : "▼"}</span>
            </button>

            {showAddEnemy && (
              <div className="border-t border-zinc-700 p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    value={newEnemyName}
                    onChange={(e) => setNewEnemyName(e.target.value)}
                    className="rounded-xl bg-zinc-800 border border-zinc-600 p-3"
                  />
                  <input
                    type="number"
                    value={newEnemyHp}
                    onChange={(e) => setNewEnemyHp(Number(e.target.value))}
                    className="rounded-xl bg-zinc-800 border border-zinc-600 p-3"
                  />
                  <input
                    type="number"
                    value={newEnemyAc}
                    onChange={(e) => setNewEnemyAc(Number(e.target.value))}
                    className="rounded-xl bg-zinc-800 border border-zinc-600 p-3"
                  />
                  <input
                    type="number"
                    value={newEnemyInitiative}
                    onChange={(e) =>
                      setNewEnemyInitiative(Number(e.target.value))
                    }
                    className="rounded-xl bg-zinc-800 border border-zinc-600 p-3"
                  />
                </div>

                <button
                  onClick={addEnemy}
                  className="mt-4 bg-red-700 hover:bg-red-600 rounded-xl px-6 py-3 font-bold"
                >
                  Add Enemy to Encounter
                </button>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-3xl font-bold text-red-400 mb-6">
              Enemies in Encounter
            </h2>

            <div className="flex flex-wrap gap-8">
              {enemyCharacters.map((enemy) => (
                <div key={enemy.id} className="flex flex-col gap-3">
                  <PlayerCard
                    name={enemy.name}
                    className={enemy.class_name}
                    imageUrl={enemy.image_url}
                    hp={enemy.hp}
                    maxHp={enemy.max_hp}
                    ac={enemy.ac}
                    initiative={enemy.initiative}
                    amount={enemy.amount}
                    attacks={enemy.attacks ?? []}
                    creatureType="npc"
                    displayHp={enemy.display_hp}
                    displayAc={enemy.display_ac}
                    forceShowStats
                    isCurrentTurn={encounter?.active_character_id === enemy.id}
                    canEditHealth
                    canEditCharacter
                    canEditInitiative
                    canControlDisplayStats
                    canEditAttacks
                    showAttacks
                    onCharacterChange={(updates) =>
                      updateCharacter(enemy.id, updates)
                    }
                    onImageUpload={(file) => uploadPortrait(enemy.id, file)}
                    onAmountChange={(value) =>
                      updateCharacter(enemy.id, { amount: value })
                    }
                    onDamage={() =>
                      updateCharacter(enemy.id, {
                        hp: Math.max(enemy.hp - enemy.amount, 0),
                      }).then(() => {
                        if (encounter?.active_character_id === enemy.id) {
                          nextTurn()
                        }
                      })
                    }
                    onHeal={() =>
                      updateCharacter(enemy.id, {
                        hp: Math.min(enemy.hp + enemy.amount, enemy.max_hp),
                      })
                    }
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => duplicateEnemy(enemy)}
                      className="bg-blue-800 hover:bg-blue-700 rounded-xl p-2 font-bold"
                    >
                      Duplicate
                    </button>

                    <button
                      onClick={() => saveNpcTemplate(enemy)}
                      className="bg-green-800 hover:bg-green-700 rounded-xl p-2 font-bold"
                    >
                      Save
                    </button>

                    <button
                      onClick={() => removeEnemy(enemy.id)}
                      className="bg-red-800 hover:bg-red-700 rounded-xl p-2 font-bold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}