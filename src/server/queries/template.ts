import type { MergedErrorMap, ORPCErrorConstructorMap } from "@orpc/server"

import type { Template } from "@/schemas/template"
import { db } from "@/server/db"

export async function resolveTemplate(
  idOrSlug: string,
  errors: ORPCErrorConstructorMap<
    MergedErrorMap<Record<never, never>, { NOT_FOUND: { message: string } }>
  >,
): Promise<Template> {
  const template = await db.query.templateTable.findFirst({
    where: (t, { or, eq }) => or(eq(t.id, idOrSlug), eq(t.slug, idOrSlug)),
  })
  if (!template)
    throw errors.NOT_FOUND({
      message: `Template with id or slug "${idOrSlug}" not found`,
    })
  return template
}
