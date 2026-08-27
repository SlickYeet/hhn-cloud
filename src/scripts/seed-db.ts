import { randomUUID } from "node:crypto"

import { db } from "@/server/db"
import {
  operatingSystemCategoryTable,
  operatingSystemReleaseTable,
  operatingSystemTable,
} from "@/server/db/schema"

async function main() {
  const [linuxCategory, windowsCategory] = await Promise.all([
    db
      .insert(operatingSystemCategoryTable)
      .values({
        id: randomUUID(),
        name: "linux",
      })
      .onConflictDoUpdate({
        set: { updatedAt: new Date() },
        target: operatingSystemCategoryTable.name,
      })
      .returning(),
    db
      .insert(operatingSystemCategoryTable)
      .values({
        id: randomUUID(),
        name: "windows",
      })
      .onConflictDoUpdate({
        set: { updatedAt: new Date() },
        target: operatingSystemCategoryTable.name,
      })
      .returning(),
  ])

  const categories = [linuxCategory[0], windowsCategory[0]]

  const releases = await db
    .insert(operatingSystemReleaseTable)
    .values([
      {
        categoryId: categories[0].id,
        codename: "noble numbat",
        family: "ubuntu",
        id: randomUUID(),
        isLts: true,
        version: "24.04",
      },
      {
        categoryId: categories[0].id,
        codename: "resolute raccoon",
        family: "ubuntu",
        id: randomUUID(),
        isLts: true,
        version: "26.04",
      },
      {
        categoryId: categories[0].id,
        codename: "bookworm",
        family: "debian",
        id: randomUUID(),
        isLts: true,
        version: "12",
      },
      {
        categoryId: categories[1].id,
        codename: "windows server 2022",
        family: "windows",
        id: randomUUID(),
        isLts: true,
        version: "2022",
      },
    ])
    .onConflictDoUpdate({
      set: { updatedAt: new Date() },
      target: [
        operatingSystemReleaseTable.family,
        operatingSystemReleaseTable.version,
      ],
    })
    .returning()

  function findReleaseId(family: string, version: string) {
    const matched = releases.find(
      (r) => r.family === family && r.version === version,
    )
    if (!matched)
      throw new Error(
        `Could not find seeded release id for ${family} ${version}`,
      )
    return matched.id
  }

  await db
    .insert(operatingSystemTable)
    .values([
      {
        cloudInitEnabled: true,
        id: randomUUID(),
        name: "Ubuntu 24.04 LTS",
        pveVmid: 9001,
        releaseId: findReleaseId("ubuntu", "24.04"),
        slug: "ubuntu-24.04-lts",
        status: "active",
      },
      {
        cloudInitEnabled: true,
        id: randomUUID(),
        name: "Ubuntu 26.04 LTS",
        pveVmid: 9000,
        releaseId: findReleaseId("ubuntu", "26.04"),
        slug: "ubuntu-26.04-lts",
        status: "active",
      },
      {
        cloudInitEnabled: true,
        id: randomUUID(),
        name: "Debian 12",
        pveVmid: 9002,
        releaseId: findReleaseId("debian", "12"),
        slug: "debian-12",
        status: "inactive",
      },
    ])
    .onConflictDoUpdate({
      set: { updatedAt: new Date() },
      target: operatingSystemTable.pveVmid,
    })
}

main()
  .then(() => {
    console.info("Database seeded successfully.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Failed to seed database:", error)
    process.exit(1)
  })
