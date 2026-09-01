import { getApiVersion, getBaseUrl } from "@/lib/utils"

export const APP_NAME = "HHN Cloud"
export const APP_DESCRIPTION =
  "A PVE Cloud Compute Platform | Create and manage virtual compute on demand"

export const DEFAULT_PAGE_SIZE = 10

export const CLOUD_LOCATIONS = [
  {
    id: 1,
    lat: 49.294,
    lng: -122.8059,
    location: "Coquitlam, Canada",
    name: "Primary Private Cloud",
    region: "ca-west-1",
  },
]

export const DASHBOARD_INFO_CARDS = [
  {
    description:
      "Find all our services and features in one place. Enjoy services from media streaming to cloud computing, and everything in between, all in one convenient location.",
    link: "https://hub.famlam.ca",
    title: "HHN Hub",
  },
  {
    description:
      "Discover our extensive library of tutorials and guides. Learn how to create and manage virtual machines, configure networking, and optimize your cloud infrastructure.",
    link: "https://wiki.famlam.ca",
    title: "Tutorials",
  },
  {
    description:
      "Explore our comprehensive REST API documentation. Access detailed documentation, review API versioning, and discover all the features available to virtualize your infrastructure.",
    link: `${getBaseUrl()}/api/v${getApiVersion()}`,
    title: "API Docs",
  },
]
