"use server";

// All scheduler logic is a no-op in DB-less mode
export function startScheduler() {
  console.log("[scheduler] No-op: DB-less mode, scheduler disabled.");
}

export function stopScheduler() {
  console.log("[scheduler] No-op: DB-less mode, scheduler disabled.");
}
