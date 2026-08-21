export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/api/server")
    await import("./server/workers/provision-worker")
    await import("./server/workers/delete-instance-worker")
  }
}
