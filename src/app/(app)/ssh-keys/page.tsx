export default async function Page({ searchParams }: PageProps<"/ssh-keys">) {
  const { new: newParam } = await searchParams

  return (
    <div>
      <h1>Page</h1>
      {newParam === "generate" && <p>Generate new SSH key</p>}
      {newParam === "import" && <p>Import existing SSH key</p>}
    </div>
  )
}
