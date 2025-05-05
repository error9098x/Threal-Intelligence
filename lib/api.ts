import type { CVE, IOC, GeoIPData } from "@/lib/types"

// Cache for API responses
interface CacheItem<T> {
  data: T
  timestamp: number
}

const API_CACHE: Record<string, CacheItem<any>> = {}
const CACHE_DURATION = 30000 // 30 seconds

// Helper to get data from cache or fetch it
async function getCachedData<T>(cacheKey: string, fetchFn: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const cachedItem = API_CACHE[cacheKey]

  if (cachedItem && now - cachedItem.timestamp < CACHE_DURATION) {
    return cachedItem.data
  }

  const data = await fetchFn()
  API_CACHE[cacheKey] = { data, timestamp: now }
  return data
}

// Fetch CVE data from API with date range
export async function fetchCVEData(): Promise<{ results: CVE[] }> {
  // Get today's date and yesterday's date in YYYY-MM-DD format
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStr = today.toISOString().split("T")[0]
  const yesterdayStr = yesterday.toISOString().split("T")[0]

  return getCachedData(`cve-${todayStr}-${yesterdayStr}`, async () => {
    try {
      const response = await fetch(`/api/cve?startDate=${yesterdayStr}&endDate=${todayStr}`)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching CVE data:", error)
      throw error
    }
  })
}

// Fetch ThreatFox IOCs with support for days parameter
export async function fetchThreatFoxData(minutes = 5, days?: number): Promise<{ data: IOC[] }> {
  const cacheKey = days ? `threatfox-days-${days}` : `threatfox-minutes-${minutes}`

  return getCachedData(cacheKey, async () => {
    try {
      const response = await fetch("/api/threatfox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes, days }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching ThreatFox data:", error)
      throw error
    }
  })
}

// Lookup a specific IP address
export async function lookupIP(ip: string): Promise<GeoIPData> {
  try {
    const response = await fetch(`/api/ip-lookup?ip=${encodeURIComponent(ip)}`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! Status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error looking up IP:", error)
    throw error
  }
}
