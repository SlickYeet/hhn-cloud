import type { NextConfig } from "next"

import "./src/env"

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: {
      exclude: ["error", "warn", "info"],
    },
  },
  typedRoutes: true,
}

export default nextConfig
