import { GameController } from "@/components/GameController";

export default function Home() {
  return (
    <div className="h-full bg-neutral-950 text-neutral-100 flex flex-col touch-none">
      <GameController />
      <div className="mt-12 max-w-md text-center text-neutral-500 text-sm">
        <p>Connect numbers 1 to N.</p>
        <p>Visit every cell exactly once.</p>
        <p>Don&apos;t cross the walls.</p>
      </div>
    </div>
  );
}
