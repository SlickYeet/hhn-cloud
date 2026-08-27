import type { NextConfig } from "next"

import "./src/env"

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: {
      exclude: ["error"],
    },
  },
  typedRoutes: true,
}

export default nextConfig
