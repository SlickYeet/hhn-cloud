import { api } from "@/lib/api/client"

export default async function Page() {
  const instance = await api.instance.getAll()

  return (
    <main>
      <h1>Home Page</h1>
      {instance.map((i) => (
        <div key={i.id}>
          <p>{i.name}</p>
        </div>
      ))}
    </main>
  )
}
