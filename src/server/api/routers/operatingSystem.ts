import { openapi } from "@orpc/openapi"
import * as z from "zod"

import { selectOperatingSystemSchema } from "@/schemas/operatingSystem"
import { publicProcedure } from "@/server/api/base"

const mockOperatingSystems: z.infer<typeof selectOperatingSystemSchema>[] = [
  {
    cloudInitEnabled: true,
    createdAt: new Date(),
    id: "1",
    name: "Ubuntu 22.04 LTS",
    pveVmid: 9000,
    release: {
      category: {
        createdAt: new Date(),
        id: "1",
        name: "linux",
        updatedAt: new Date(),
      },
      categoryId: "1",
      codename: "Jammy Jellyfish",
      createdAt: new Date(),
      family: "ubuntu",
      id: "1",
      isLts: true,
      updatedAt: new Date(),
      version: "22.04",
    },
    releaseId: "1",
    slug: "ubuntu-22.04-lts",
    status: "active",
    updatedAt: new Date(),
  },
  {
    cloudInitEnabled: true,
    createdAt: new Date(),
    id: "2",
    name: "Debian 11",
    pveVmid: 9001,
    release: {
      category: {
        createdAt: new Date(),
        id: "1",
        name: "linux",
        updatedAt: new Date(),
      },
      categoryId: "1",
      codename: "Bullseye",
      createdAt: new Date(),
      family: "debian",
      id: "2",
      isLts: true,
      updatedAt: new Date(),
      version: "11",
    },
    releaseId: "2",
    slug: "debian-11",
    status: "active",
    updatedAt: new Date(),
  },
  {
    cloudInitEnabled: true,
    createdAt: new Date(),
    id: "3",
    name: "CentOS 8",
    pveVmid: 9002,
    release: {
      category: {
        createdAt: new Date(),
        id: "1",
        name: "linux",
        updatedAt: new Date(),
      },
      categoryId: "1",
      codename: "CentOS 8",
      createdAt: new Date(),
      family: "centos",
      id: "3",
      isLts: false,
      updatedAt: new Date(),
      version: "8",
    },
    releaseId: "3",
    slug: "centos-8",
    status: "inactive",
    updatedAt: new Date(),
  },
  {
    cloudInitEnabled: true,
    createdAt: new Date(),
    id: "4",
    name: "Fedora 36",
    pveVmid: 9003,
    release: {
      category: {
        createdAt: new Date(),
        id: "1",
        name: "linux",
        updatedAt: new Date(),
      },
      categoryId: "1",
      codename: "Fedora 36",
      createdAt: new Date(),
      family: "fedora",
      id: "4",
      isLts: false,
      updatedAt: new Date(),
      version: "36",
    },
    releaseId: "4",
    slug: "fedora-36",
    status: "active",
    updatedAt: new Date(),
  },
  {
    cloudInitEnabled: true,
    createdAt: new Date(),
    id: "5",
    name: "Windows Server 2022",
    pveVmid: 9004,
    release: {
      category: {
        createdAt: new Date(),
        id: "2",
        name: "windows",
        updatedAt: new Date(),
      },
      categoryId: "2",
      codename: "Windows Server 2022",
      createdAt: new Date(),
      family: "windows",
      id: "5",
      isLts: true,
      updatedAt: new Date(),
      version: "2022",
    },
    releaseId: "5",
    slug: "windows-server-2022",
    status: "active",
    updatedAt: new Date(),
  },
]

export const operatingSystemRouter = {
  get: publicProcedure
    .meta(
      openapi({
        method: "GET",
        path: "/operating-systems/{id}",
        summary: "Get an operating system by ID",
        tags: ["Operating Systems"],
      }),
    )
    .input(z.object({ id: z.string() }))
    .output(selectOperatingSystemSchema)
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
      NOT_FOUND: {
        message: "Operating system not found",
      },
    })
    .handler(({ errors, input }) => {
      if (!input.id) throw errors.BAD_REQUEST()

      const operatingSystem = mockOperatingSystems.find(
        (os) => os.id === input.id,
      )

      if (!operatingSystem) throw errors.NOT_FOUND()

      return operatingSystem
    }),

  list: publicProcedure
    .meta(
      openapi({
        method: "GET",
        path: "/operating-systems",
        summary: "List all operating systems",
        tags: ["Operating Systems"],
      }),
    )
    .output(z.array(selectOperatingSystemSchema))
    .errors({
      NOT_FOUND: {
        message: "Operating systems not found",
      },
    })
    .handler(({ errors }) => {
      const operatingSystems = mockOperatingSystems
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter((os) => os.status === "active")
      if (!operatingSystems) throw errors.NOT_FOUND()
      return operatingSystems
    }),
}
