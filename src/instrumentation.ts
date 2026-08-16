export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./server/api/server")
    await import("./server/workers/provision-worker")
  }
}
