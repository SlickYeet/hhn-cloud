import { openapi } from "@orpc/openapi"
import * as z from "zod"

import { selectTemplateSchema } from "@/schemas/template"
import { publicProcedure } from "@/server/api/base"

const mockTemplates: z.infer<typeof selectTemplateSchema>[] = [
  {
    cloudInitEnabled: true,
    cores: 2,
    createdAt: new Date(),
    description: "Ubuntu 20.04 LTS",
    disk: 20,
    id: "1",
    memory: 4,
    name: "Ubuntu 20.04",
    os: "ubuntu",
    pveVmid: 100,
    slug: "ubuntu-20.04",
    status: "active",
    updatedAt: new Date(),
    version: "20.04",
  },
  {
    cloudInitEnabled: true,
    cores: 2,
    createdAt: new Date(),
    description: "Debian 11 Bullseye",
    disk: 20,
    id: "2",
    memory: 4,
    name: "Debian 11",
    os: "debian",
    pveVmid: 101,
    slug: "debian-11",
    status: "active",
    updatedAt: new Date(),
    version: "11",
  },
  {
    cloudInitEnabled: true,
    cores: 2,
    createdAt: new Date(),
    description: "CentOS 8 Stream",
    disk: 20,
    id: "3",
    memory: 4,
    name: "CentOS 8",
    os: "centos",
    pveVmid: 102,
    slug: "centos-8",
    status: "active",
    updatedAt: new Date(),
    version: "8",
  },
  {
    cloudInitEnabled: true,
    cores: 2,
    createdAt: new Date(),
    description: "Fedora 34 Workstation",
    disk: 20,
    id: "4",
    memory: 4,
    name: "Fedora 34",
    os: "fedora",
    pveVmid: 103,
    slug: "fedora-34",
    status: "active",
    updatedAt: new Date(),
    version: "34",
  },
]

export const templateRouter = {
  get: publicProcedure
    .meta(
      openapi({
        method: "GET",
        path: "/template/{id}",
        summary: "Get a template by ID",
        tags: ["Templates"],
      }),
    )
    .input(z.object({ id: z.string() }))
    .output(selectTemplateSchema)
    .errors({
      BAD_REQUEST: {
        message: "Invalid request",
      },
      NOT_FOUND: {
        message: "Template not found",
      },
    })
    .handler(({ errors, input }) => {
      if (!input.id) throw errors.BAD_REQUEST()

      const template = mockTemplates.find(
        (template) => template.id === input.id,
      )

      if (!template) throw errors.NOT_FOUND()

      return template
    }),

  list: publicProcedure
    .meta(
      openapi({
        method: "GET",
        path: "/templates",
        summary: "List all templates",
        tags: ["Templates"],
      }),
    )
    .output(z.array(selectTemplateSchema))
    .errors({
      NOT_FOUND: {
        message: "Templates not found",
      },
    })
    .handler(({ errors }) => {
      const templates = mockTemplates
      if (!templates) throw errors.NOT_FOUND()
      return templates
    }),
}
