export default async function Page({
  params,
}: PageProps<"/dashboard/instance/[id]">) {
  const { id } = await params

  return (
    <main>
      <h1>Page</h1>
      <p>Instance ID: {id}</p>
    </main>
  )
}
