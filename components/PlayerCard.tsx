"use client"

import { useState } from "react"
import type { Attack } from "../lib/types"

type CreatureType = "player" | "npc" | "major_enemy"
type CardSize = "normal" | "small" | "large"

type PlayerCardProps = {
  playerName?: string
  name: string
  className: string
  imageUrl: string
  hp: number
  maxHp: number
  ac: number
  initiative: number
  amount?: number
  gold?: number
  attacks?: Attack[]
  creatureType?: CreatureType
  size?: CardSize
  isCurrentTurn?: boolean
  isOwnTurn?: boolean
  displayHp?: boolean
  displayAc?: boolean
  forceShowStats?: boolean
  canEditHealth?: boolean
  canEditCharacter?: boolean
  canEditInitiative?: boolean
  canControlDisplayStats?: boolean
  canEditAttacks?: boolean
  showAttacks?: boolean
  onAmountChange?: (value: number) => void
  onDamage?: () => void
  onHeal?: () => void
  onCharacterChange?: (updates: {
    player_name?: string
    name?: string
    class_name?: string
    max_hp?: number
    ac?: number
    initiative?: number
    gold?: number
    attacks?: Attack[]
    display_hp?: boolean
    display_ac?: boolean
  }) => void
  onImageUpload?: (file: File) => void
}

export default function PlayerCard({
  playerName = "",
  name,
  className,
  imageUrl,
  hp,
  maxHp,
  ac,
  initiative,
  amount = 5,
  gold = 0,
  attacks = [],
  creatureType = "player",
  size = "normal",
  isCurrentTurn = false,
  isOwnTurn = false,
  displayHp = true,
  displayAc = true,
  forceShowStats = false,
  canEditHealth = false,
  canEditCharacter = false,
  canEditInitiative = false,
  canControlDisplayStats = false,
  canEditAttacks = false,
  showAttacks = false,
  onAmountChange,
  onDamage,
  onHeal,
  onCharacterChange,
  onImageUpload,
}: PlayerCardProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showWeaponEditor, setShowWeaponEditor] = useState(false)

  const isSmall = size === "small"
  const isLarge = size === "large"
  const isMajorEnemy = creatureType === "major_enemy"

  const isDefeatedEnemy =
    (creatureType === "npc" || creatureType === "major_enemy") && hp <= 0

  const shouldShowHp = forceShowStats || displayHp
  const shouldShowAc = forceShowStats || displayAc

  const hpPercent = maxHp > 0 ? Math.round((hp / maxHp) * 100) : 0

  const healthColor =
    hpPercent > 60 ? "green" : hpPercent > 30 ? "gold" : "red"

  function updateWeapon(index: number, updates: Partial<Attack>) {
    const nextAttacks = attacks.map((attack, attackIndex) =>
      attackIndex === index ? { ...attack, ...updates } : attack
    )

    onCharacterChange?.({ attacks: nextAttacks })
  }

  function addWeapon() {
    onCharacterChange?.({
      attacks: [
        ...attacks,
        {
          weapon: "Longsword",
          attack_bonus: "+5",
          damage: "1d8+3",
          damage_type: "Slashing",
        },
      ],
    })
  }

  function removeWeapon(index: number) {
    onCharacterChange?.({
      attacks: attacks.filter((_, attackIndex) => attackIndex !== index),
    })
  }

  return (
    <>
      {showSettings && (
        <div className="fixed left-0 top-0 h-screen w-80 bg-zinc-950 border-r border-yellow-700 p-6 shadow-2xl z-50 overflow-y-auto text-white">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-yellow-400">Settings</h2>

            <button
              onClick={() => setShowSettings(false)}
              className="text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {creatureType === "player" && (
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Player Name
                </label>

                <input
                  value={playerName}
                  onChange={(e) =>
                    onCharacterChange?.({ player_name: e.target.value })
                  }
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-600 p-3"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Character Name
              </label>

              <input
                value={name}
                onChange={(e) => onCharacterChange?.({ name: e.target.value })}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-600 p-3"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Class / Type
              </label>

              <input
                value={className}
                onChange={(e) =>
                  onCharacterChange?.({ class_name: e.target.value })
                }
                className="w-full rounded-lg bg-zinc-800 border border-zinc-600 p-3"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Upload Portrait
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onImageUpload?.(file)
                }}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-600 p-3"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Maximum Health
              </label>

              <input
                type="number"
                value={maxHp}
                onChange={(e) =>
                  onCharacterChange?.({ max_hp: Number(e.target.value) })
                }
                className="w-full rounded-lg bg-zinc-800 border border-zinc-600 p-3"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Armor Class
              </label>

              <input
                type="number"
                value={ac}
                onChange={(e) =>
                  onCharacterChange?.({ ac: Number(e.target.value) })
                }
                className="w-full rounded-lg bg-zinc-800 border border-zinc-600 p-3"
              />
            </div>

            {creatureType === "player" && (
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Gold
                </label>

                <input
                  type="number"
                  value={gold}
                  onChange={(e) =>
                    onCharacterChange?.({ gold: Number(e.target.value) })
                  }
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-600 p-3"
                />
              </div>
            )}

            {canEditInitiative && (
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Initiative
                </label>

                <input
                  type="number"
                  value={initiative}
                  onChange={(e) =>
                    onCharacterChange?.({ initiative: Number(e.target.value) })
                  }
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-600 p-3"
                />
              </div>
            )}

            {canControlDisplayStats && (
              <div className="border-t border-zinc-700 pt-4 space-y-3">
                <p className="font-bold text-zinc-300">Display Visibility</p>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={displayHp}
                    onChange={(e) =>
                      onCharacterChange?.({ display_hp: e.target.checked })
                    }
                  />
                  Show HP on display
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={displayAc}
                    onChange={(e) =>
                      onCharacterChange?.({ display_ac: e.target.checked })
                    }
                  />
                  Show AC on display
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {showWeaponEditor && (
        <div className="fixed right-0 top-0 h-screen w-[72rem] max-w-[96vw] bg-zinc-950 border-l border-red-700 p-6 shadow-2xl z-50 overflow-y-auto text-white">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-red-400">Weapons</h2>

            <button
              onClick={() => setShowWeaponEditor(false)}
              className="text-zinc-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {attacks.length === 0 && (
            <p className="text-zinc-400 mb-4">No weapons added yet.</p>
          )}

          <div className="space-y-4">
            {attacks.map((attack, index) => (
              <div
                key={index}
                className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-zinc-400 mb-2">
                      Weapon / Attack
                    </label>

                    <input
                      value={attack.weapon}
                      onChange={(e) =>
                        updateWeapon(index, { weapon: e.target.value })
                      }
                      className="w-full h-12 rounded-lg bg-zinc-800 border border-zinc-600 p-3 text-sm"
                    />
                  </div>

                  <div className="w-36">
                    <label className="block text-xs text-zinc-400 mb-2">
                      Attack Bonus
                    </label>

                    <input
                      value={attack.attack_bonus}
                      onChange={(e) =>
                        updateWeapon(index, {
                          attack_bonus: e.target.value,
                        })
                      }
                      className="w-full h-12 rounded-lg bg-zinc-800 border border-zinc-600 p-3 text-sm"
                    />
                  </div>

                  <div className="w-48">
                    <label className="block text-xs text-zinc-400 mb-2">
                      Damage
                    </label>

                    <input
                      value={attack.damage}
                      onChange={(e) =>
                        updateWeapon(index, { damage: e.target.value })
                      }
                      className="w-full h-12 rounded-lg bg-zinc-800 border border-zinc-600 p-3 text-sm"
                    />
                  </div>

                  <div className="w-48">
                    <label className="block text-xs text-zinc-400 mb-2">
                      Damage Type
                    </label>

                    <input
                      value={attack.damage_type}
                      onChange={(e) =>
                        updateWeapon(index, {
                          damage_type: e.target.value,
                        })
                      }
                      className="w-full h-12 rounded-lg bg-zinc-800 border border-zinc-600 p-3 text-sm"
                    />
                  </div>

                  <button
                    onClick={() => removeWeapon(index)}
                    className="mt-6 h-12 w-12 bg-red-800 hover:bg-red-700 rounded-lg font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addWeapon}
            className="mt-6 w-full bg-red-700 hover:bg-red-600 rounded-xl p-4 font-bold text-lg"
          >
            Add Weapon
          </button>
        </div>
      )}

      <div
        style={{
  width: isSmall ? "16rem" : undefined,
  maxWidth: isSmall ? "16rem" : undefined,
  flex: isSmall ? "0 0 16rem" : undefined,

  backgroundColor: isDefeatedEnemy
    ? "#7f1d1d"
    : isCurrentTurn
      ? "#d4a017"
      : undefined,

  borderColor: isMajorEnemy ? "#a855f7" : undefined,

  boxShadow: isMajorEnemy
    ? isCurrentTurn
      ? "0 0 80px rgba(168,85,247,1)"
      : "0 0 40px rgba(168,85,247,0.7)"
    : undefined,
}}
        className={`relative border-4 rounded-2xl transition-all duration-500 ${
            isSmall ? "w-[16rem]" : "w-full"
        } ${
          isLarge
            ? "max-w-md p-5"
            : isSmall
              ? "max-w-[16rem] p-4"
              : "max-w-md p-8"
        } ${
          isDefeatedEnemy
            ? "text-white border-red-500 shadow-[0_0_45px_rgba(239,68,68,0.65)] opacity-90"
            : isCurrentTurn
                 ? isMajorEnemy
                 ? "text-white border-purple-500 shadow-[0_0_80px_rgba(168,85,247,1)] scale-105"
                : `text-black border-yellow-100 shadow-[0_0_55px_rgba(250,204,21,0.85)] ${isSmall ? "" : "scale-105"}`
              : isMajorEnemy
                ? "bg-zinc-800 text-white border-[#a855f7] shadow-[0_0_50px_rgba(168,85,247,0.75)] hover:border-purple-400"                : "bg-zinc-800 text-white border-yellow-700 shadow-2xl hover:border-yellow-400"
        }`}
      >
        {isDefeatedEnemy && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 bg-red-600 text-white px-5 py-1 rounded-full font-black shadow-lg border border-red-300 text-sm">
            DEFEATED
          </div>
        )}

        {canEditCharacter && (
          <button
            onClick={() => setShowSettings(true)}
            className={`absolute bottom-4 left-4 bg-yellow-600 hover:bg-yellow-500 text-black rounded-xl font-bold shadow-lg z-20 ${
              isSmall ? "px-3 py-1 text-xs" : "px-4 py-2"
            }`}
          >
            ⚙ Settings
          </button>
        )}

        {canEditAttacks && (
          <button
            onClick={() => setShowWeaponEditor(true)}
            className={`absolute bottom-4 right-4 bg-red-700 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg z-20 ${
              isSmall ? "px-3 py-1 text-xs" : "px-4 py-2"
            }`}
          >
            ⚔ Weapons
          </button>
        )}

        <div
          className={`flex flex-col items-center ${
            isSmall ? "pb-12" : "pb-16"
          }`}
        >
          <div className="relative">
            <img
              src={imageUrl || "/placeholder.png"}
              alt={`${name} portrait`}
              className={`${
                isLarge
                  ? "w-36 h-36"
                  : isSmall
                    ? "w-24 h-24"
                    : "w-40 h-40"
              } rounded-full border-4 object-cover bg-zinc-900 transition-all duration-500 ${
                isDefeatedEnemy
                  ? "border-red-300 grayscale opacity-70"
                  : isCurrentTurn && isMajorEnemy
                    ? "border-purple-200 shadow-[0_0_45px_rgba(168,85,247,1)]"
                    : isCurrentTurn
                      ? "border-black shadow-[0_0_30px_rgba(0,0,0,0.45)]"
                      : isMajorEnemy
                        ? "border-[#a855f7] shadow-[0_0_25px_rgba(168,85,247,0.6)]"
                        : "border-yellow-500"
              }`}
            />

            {isDefeatedEnemy && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={`text-red-500 font-black leading-none drop-shadow-[0_0_8px_rgba(0,0,0,0.9)] ${
                    isLarge ? "text-7xl" : isSmall ? "text-6xl" : "text-8xl"
                  }`}
                >
                  ✕
                </div>
              </div>
            )}
          </div>

          {isOwnTurn && (
            <p className="mt-4 text-2xl font-black text-yellow-300 animate-pulse">
              YOUR TURN
            </p>
          )}

          {creatureType === "player" && playerName && (
            <p
              className={`mt-5 uppercase tracking-widest ${
                isSmall ? "text-[10px]" : "text-sm"
              } ${isCurrentTurn ? "text-black/70" : "text-zinc-500"}`}
            >
              Player: {playerName}
            </p>
          )}

          <h1
            className={`font-bold mt-2 text-center leading-tight break-words ${
              isLarge ? "text-4xl" : isSmall ? "text-xl" : "text-4xl"
            } ${
              isDefeatedEnemy
                ? "text-red-100"
                : isCurrentTurn
                  ? "text-black"
                  : isMajorEnemy
                    ? "text-purple-300"
                    : "text-yellow-400"
            }`}
          >
            {name}
          </h1>

          <p
            className={`mt-1 text-center leading-tight break-words ${
              isLarge ? "text-base" : isSmall ? "text-xs" : "text-base"
            } ${
              isMajorEnemy
                ? "text-purple-300"
                : isDefeatedEnemy
                  ? "text-red-100/80"
                  : isCurrentTurn
                    ? "text-black/75"
                    : "text-zinc-400"
            }`}
          >
            {creatureType === "major_enemy"
              ? "Major Enemy • "
              : creatureType === "npc"
                ? "Enemy • "
                : ""}
            {className}
          </p>

          <div
            className={`w-full ${
              isSmall ? "mt-5 text-xs" : isLarge ? "mt-5 text-sm" : "mt-7"
            }`}
          >
            <div className="flex justify-between mb-2">
              <span>Health</span>
              <span>{shouldShowHp ? `${hp} / ${maxHp}` : "Hidden"}</span>
            </div>

            {shouldShowHp ? (
  <div
    style={{
      width: "100%",
      height: isSmall ? "16px" : isLarge ? "20px" : "24px",
      backgroundColor: "#3f3f46",
      borderRadius: "9999px",
      overflow: "hidden",
      border: "1px solid rgba(0,0,0,0.4)",
    }}
  >
    <div
      style={{
        height: "100%",
        width: `${Math.max(Math.min(hpPercent, 100), 0)}%`,
        backgroundColor:
          hpPercent > 60
            ? "#22c55e"
            : hpPercent > 30
              ? "#eab308"
              : "#ef4444",
        transition: "width 0.5s ease",
      }}
    />
  </div>
) : (
  <div
    style={{
      width: "100%",
      height: isSmall ? "16px" : isLarge ? "20px" : "24px",
      backgroundColor: "#3f3f46",
      borderRadius: "9999px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "12px",
      color: "#d4d4d8",
      border: "1px solid rgba(0,0,0,0.4)",
    }}
  >
    Hidden
  </div>
)}
          </div>

          <div
            className={`grid grid-cols-2 gap-3 w-full ${
              isSmall ? "mt-5" : isLarge ? "mt-5" : "mt-7"
            }`}
          >
            <div className="bg-black/15 border border-black/30 rounded-xl p-3 text-center">
              <p className={isSmall ? "text-[10px]" : "text-base"}>AC</p>

              <p
                className={`font-bold ${
                  isLarge ? "text-3xl" : isSmall ? "text-2xl" : "text-3xl"
                }`}
              >
                {shouldShowAc ? ac : "?"}
              </p>
            </div>

            <div className="bg-black/15 border border-black/30 rounded-xl p-3 text-center">
              <p className={isSmall ? "text-[10px]" : "text-base"}>Init</p>

              <p
                className={`font-bold ${
                  isLarge ? "text-3xl" : isSmall ? "text-2xl" : "text-3xl"
                } ${isDefeatedEnemy ? "line-through" : ""}`}
              >
                {initiative}
              </p>
            </div>
          </div>

          {showAttacks && attacks.length > 0 && (
            <div className={`w-full ${isSmall ? "mt-5" : "mt-7"}`}>
              <h3
                className={`font-bold mb-3 ${
                  isSmall ? "text-sm" : "text-lg"
                } ${
                  isDefeatedEnemy
                    ? "text-red-100"
                    : isCurrentTurn
                      ? "text-black"
                      : isMajorEnemy
                        ? "text-purple-300"
                        : "text-red-400"
                }`}
              >
                Weapons
              </h3>

              <div className="space-y-3">
                {attacks.map((attack, index) => (
                  <div
                    key={index}
                    className={
                      isDefeatedEnemy
                        ? "rounded-xl border border-red-300/40 bg-black/20 p-3"
                        : isCurrentTurn
                          ? "rounded-xl border border-black/30 bg-black/15 p-3"
                          : "rounded-xl border border-zinc-700 bg-zinc-900 p-3"
                    }
                  >
                    <div className="flex gap-2 text-center">
                      <div className="flex-1 rounded-lg bg-black/10 p-2">
                        <p className="text-[10px] uppercase opacity-70">
                          Weapon
                        </p>
                        <p className="font-bold break-words">
                          {attack.weapon}
                        </p>
                      </div>

                      <div className="w-16 rounded-lg bg-black/10 p-2">
                        <p className="text-[10px] uppercase opacity-70">
                          Bonus
                        </p>
                        <p className="font-bold">{attack.attack_bonus}</p>
                      </div>

                      <div className="w-24 rounded-lg bg-black/10 p-2">
                        <p className="text-[10px] uppercase opacity-70">
                          Damage
                        </p>
                        <p className="font-bold">{attack.damage}</p>
                      </div>

                      <div className="w-28 rounded-lg bg-black/10 p-2">
                        <p className="text-[10px] uppercase opacity-70">
                          Type
                        </p>
                        <p className="font-bold break-words">
                          {attack.damage_type}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {creatureType === "player" && (
            <div
              className={`w-full rounded-xl px-4 py-3 font-bold text-center ${
                isSmall ? "mt-5 text-sm" : "mt-7"
              } ${
                isCurrentTurn
                  ? "bg-black/15 border border-black/30 text-black"
                  : "bg-zinc-700 text-yellow-400"
              }`}
            >
              Gold: {gold}
            </div>
          )}

          {canEditHealth && (
            <>
              <div className={`w-full ${isSmall ? "mt-5" : "mt-6"}`}>
                <label
                  className={
                    isDefeatedEnemy
                      ? "block text-sm text-red-100/80 mb-2"
                      : isCurrentTurn
                        ? "block text-sm text-black/75 mb-2"
                        : "block text-sm text-zinc-400 mb-2"
                  }
                >
                  Damage / Healing Amount
                </label>

                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => onAmountChange?.(Number(e.target.value))}
                  className={`w-full rounded-xl bg-zinc-900 border border-zinc-600 p-3 text-white text-center ${
                    isSmall ? "text-base" : "text-xl"
                  }`}
                />
              </div>

              <div className="flex gap-3 mt-4 w-full">
                <button
                  onClick={onDamage}
                  className={`flex-1 bg-red-700 hover:bg-red-600 text-white rounded-xl font-bold ${
                    isSmall ? "p-2 text-sm" : "p-3"
                  }`}
                >
                  Damage
                </button>

                <button
                  onClick={onHeal}
                  className={`flex-1 bg-green-700 hover:bg-green-600 text-white rounded-xl font-bold ${
                    isSmall ? "p-2 text-sm" : "p-3"
                  }`}
                >
                  Heal
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}