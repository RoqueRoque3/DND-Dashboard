export type Attack = {
  weapon: string
  attack_bonus: string
  damage: string
  damage_type: string
}

export type CreatureType = "player" | "npc" | "major_enemy"

export type Campaign = {
  id: string
  name: string
  code: string
  created_at: string
}

export type CampaignMember = {
  id: string
  campaign_id: string
  user_id: string
  role: "dm" | "player"
  created_at: string
  campaigns?: Campaign
}

export type Character = {
  id: string
  campaign_id: string
  user_id?: string | null
  player_name: string
  name: string
  class_name: string
  image_url: string
  sound_url: string
  hp: number
  max_hp: number
  ac: number
  initiative: number
  amount: number
  gold: number
  attacks: Attack[]
  creature_type: CreatureType
  display_hp: boolean
  display_ac: boolean
  is_active: boolean
}

export type EncounterState = {
  id: string
  campaign_id: string
  active_character_id: string | null
  round_number: number
  background_url: string | null
}

export type SavedNpc = {
  id: string
  campaign_id: string
  name: string
  class_name: string
  image_url: string
  hp: number
  max_hp: number
  ac: number
  display_hp: boolean
  display_ac: boolean
}

export type SavedMajorEnemy = {
  id: string
  campaign_id: string
  name: string
  class_name: string
  image_url: string
  sound_url: string
  hp: number
  max_hp: number
  ac: number
  display_hp: boolean
  display_ac: boolean
}

export type EncounterPreset = {
  id: string
  campaign_id: string
  name: string
  description: string
  background_url: string
  created_at: string
}

export type EncounterPresetCharacter = {
  id: string
  preset_id: string
  name: string
  class_name: string
  image_url: string
  sound_url: string
  hp: number
  max_hp: number
  ac: number
  initiative: number
  amount: number
  gold: number
  attacks: Attack[]
  creature_type: CreatureType
  display_hp: boolean
  display_ac: boolean
  created_at: string
}