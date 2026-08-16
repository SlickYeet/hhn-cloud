import { getCloudNetwork } from "@/helpers/get-cloud-network"
import { api } from "@/server/api/client"

export default async function Page() {
  const cloudNetwork = await getCloudNetwork()

  const instance = await api.instance.list({
    organizationId: "org1",
  })

  return (
    <main className="p-6">
      <h1 className="font-bold text-2xl">Home Page</h1>
      {instance.map((i) => (
        <div className="mt-4 border border-neutral-600 p-4" key={i.id}>
          <p>{i.hostname}</p>
          <p>CPU: {i.cores}</p>
          <p>Memory: {i.memory}</p>
          <p>Disk: {i.disk}</p>
        </div>
      ))}

      <p className="mt-4">Cloud Network: {JSON.stringify(cloudNetwork)}</p>
    </main>
  )
}
