import { api } from "@/server/api/client"

export default async function Page() {
  const instance = await api.instance.list({
    organizationId: "org1",
  })

  return (
    <main className="p-6">
      <h1 className="font-bold text-2xl">Home Page</h1>
      {instance.map((i) => (
        <div
          className="mt-4 grid grid-cols-1 gap-2 border border-neutral-600 p-4 md:grid-cols-3"
          key={i.id}
        >
          <p>{i.hostname}</p>
          <p>CPU: {i.cores}</p>
          <p>Memory: {i.memory}</p>
          <p>Disk: {i.disk}</p>
          <p>Status: {i.status}</p>
          <p>Template: {i.templateId}</p>
          <p>Network: {i.networkId}</p>
          <p>VMID: {i.pveVmid}</p>
          <p>Created At: {i.createdAt?.toISOString()}</p>
          <p>Updated At: {i.updatedAt?.toISOString()}</p>
          <p>Deleted At: {i.deletedAt?.toISOString() || "Not deleted"}</p>
          <p>Organization ID: {i.organizationId}</p>
          <p>IP Address: {i.ipAllocations[0]?.ipAddress}</p>
          <p>MAC Address: {i.ipAllocations[0]?.macAddress}</p>
          <p>Gateway: {i.ipAllocations[0]?.gateway}</p>
          <p>VMID: {i.pveVmid}</p>
          <p>Root Password: {i.rootPassword}</p>
          <p>Status: {i.status}</p>
        </div>
      ))}
    </main>
  )
}
