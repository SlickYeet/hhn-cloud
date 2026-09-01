import { NextResponse } from "next/server"

import { getApiVersion, getBaseUrl } from "@/lib/utils"

export async function GET() {
  return NextResponse.redirect(`${getBaseUrl()}/api/v${getApiVersion()}`, 302)
}
