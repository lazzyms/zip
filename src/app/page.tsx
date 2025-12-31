import { GameController } from "@/components/GameController";

export default function Home() {
  return (
    <div className="h-full bg-neutral-950 text-neutral-100 flex flex-col touch-none">
      <GameController />
    </div>
  );
}
