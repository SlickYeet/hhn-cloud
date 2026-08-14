import { api } from "@/server/api/client"

export default async function Page() {
  const instance = await api.instance.list({
    organizationId: "org1",
  })

  return (
    <main className="p-6">
      <h1 className="font-bold text-2xl">Home Page</h1>
      {instance.map((i) => (
        <div className="mt-4 border border-neutral-600 p-4" key={i.id}>
          <p>{i.hostname}</p>
          <p>CPU: {i.cpu}</p>
          <p>Memory: {i.memory}</p>
          <p>Disk: {i.disk}</p>
        </div>
      ))}
    </main>
  )
}
