import PlayerCard from "@/components/PlayerCard"

const players = [
  {
    name: "Arannis",
    className: "Elf Ranger",
    imageUrl:
      "https://images.unsplash.com/photo-1511367461989-f85a21fda167",
    hp: 32,
    maxHp: 40,
    ac: 17,
    initiative: 12,
  },
  {
    name: "Thorgar",
    className: "Dwarf Barbarian",
    imageUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
    hp: 54,
    maxHp: 60,
    ac: 15,
    initiative: 8,
  },
  {
    name: "Selene",
    className: "Human Wizard",
    imageUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    hp: 18,
    maxHp: 30,
    ac: 13,
    initiative: 16,
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-10">
          <h1 className="text-5xl font-bold text-yellow-500">
            D&D Combat Dashboard
          </h1>

          <p className="text-zinc-400 mt-2">
            Live Session Tracker
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          
          {players.map((player) => (
            <PlayerCard
              key={player.name}
              name={player.name}
              className={player.className}
              imageUrl={player.imageUrl}
              hp={player.hp}
              maxHp={player.maxHp}
              ac={player.ac}
              initiative={player.initiative}
            />
          ))}

        </div>

      </div>
    </main>
  )
}