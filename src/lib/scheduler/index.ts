"use server";

// All scheduler logic is a no-op in DB-less mode
export function startScheduler() {
  console.log("[scheduler] No-op: JSON store in use, scheduler disabled.");
}

export function stopScheduler() {
  console.log("[scheduler] No-op: JSON store in use, scheduler disabled.");
}
