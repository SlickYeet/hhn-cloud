export default async function Page({
  params,
}: PageProps<"/organization/activity/[id]">) {
  const { id } = await params

  return (
    <main>
      <h1>Page</h1>
      {id}
    </main>
  )
}
