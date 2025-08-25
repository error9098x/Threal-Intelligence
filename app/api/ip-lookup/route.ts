import { NextResponse } from "next/server"
import type { FindIPResponse, GeoIPData } from "@/lib/types"

// FindIP.net API token (from environment)
const FINDIP_API_TOKEN = process.env.FINDIP_API_TOKEN?.trim()

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper function to fetch with retry
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, options)

    // If the request was successful, return the response
    if (response.ok) return response

    // If we have retries left and it's a 429 (rate limit) or 5xx (server error), retry
    if (retries > 0 && (response.status === 429 || response.status >= 500)) {
      console.log(
        `Retrying fetch to ${url} after error: ${response.status} ${response.statusText}. Retries left: ${retries}`,
      )
      await delay(RETRY_DELAY)
      return fetchWithRetry(url, options, retries - 1)
    }

    // Otherwise, return the error response
    return response
  } catch (error) {
    // If we have retries left and it's a network error, retry
    if (retries > 0) {
      console.log(`Retrying fetch to ${url} after network error. Retries left: ${retries}`)
      await delay(RETRY_DELAY)
      return fetchWithRetry(url, options, retries - 1)
    }

    // Create a Response object for network errors
    return new Response(JSON.stringify({ error: "Network error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Fallback geolocation data based on IP ranges
function getFallbackGeoData(ip: string) {
  // Extract the first octet of the IP address
  const firstOctet = Number.parseInt(ip.split(".")[0], 10)

  // Very basic IP range to region mapping
  // This is a simplified fallback and not accurate for all IPs
  if (firstOctet >= 1 && firstOctet <= 126)
    return { continent: "North America", country: "United States", lat: 37.0902, lon: -95.7129 }
  if (firstOctet >= 128 && firstOctet <= 191)
    return { continent: "Europe", country: "Various", lat: 48.8566, lon: 2.3522 }
  if (firstOctet >= 192 && firstOctet <= 223)
    return { continent: "Asia", country: "Various", lat: 34.6937, lon: 135.5022 }

  // Default fallback
  return { continent: "Unknown", country: "Unknown", lat: 0, lon: 0 }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const ip = url.searchParams.get("ip")

    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 })
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(ip)) {
      return NextResponse.json({ error: "Invalid IP address format" }, { status: 400 })
    }

    // Ensure token is configured
    if (!FINDIP_API_TOKEN) {
      return NextResponse.json({ error: "FINDIP_API_TOKEN is not configured" }, { status: 500 })
    }

    // Fetch IP data from findip.net with retry
    const geoResponse = await fetchWithRetry(`https://api.findip.net/${ip}/?token=${FINDIP_API_TOKEN}`)

    // Check ThreatFox for malicious activity
    const threatResponse = await fetch("/api/threatfox-lookup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ip }),
    })

    let threatData = { query_status: "error", data: [] }
    if (threatResponse.ok) {
      threatData = await threatResponse.json()
    }

    // Process geolocation data
    let geoData: FindIPResponse = {}
    let isFallback = false

    if (geoResponse.ok) {
      geoData = await geoResponse.json()
    } else {
      console.error(`Failed to get geolocation for IP ${ip}: ${geoResponse.status} ${geoResponse.statusText}`)
      const fallback = getFallbackGeoData(ip)
      isFallback = true
      geoData = {
        country: { names: { en: fallback.country } },
        continent: { names: { en: fallback.continent } },
        location: { latitude: fallback.lat, longitude: fallback.lon },
      }
    }

    // Determine if the IP is malicious based on ThreatFox data
    const isMalicious = threatData.query_status === "ok" && threatData.data && threatData.data.length > 0
    const threatInfo = isMalicious ? threatData.data[0] : null

    // Format the response
    const result: GeoIPData = {
      ip,
      country: geoData.country?.names?.en || geoData.country?.iso_code || "Unknown",
      region: "N/A",
      city: geoData.city?.names?.en || "Unknown",
      location: [geoData.location?.latitude || 0, geoData.location?.longitude || 0] as [number, number],
      timezone: geoData.location?.time_zone || "Unknown",
      isp: geoData.traits?.isp || "Unknown",
      organization: geoData.traits?.organization || geoData.traits?.autonomous_system_organization || "Unknown",
      connectionType: geoData.traits?.connection_type || "Unknown",
      continent: geoData.continent?.names?.en || geoData.continent?.code || "Unknown",
      threat: isMalicious
        ? {
            malware: threatInfo.malware_printable || "Unknown",
            type: threatInfo.threat_type_desc || "Unknown",
            confidence: threatInfo.confidence_level || 0,
            firstSeen: threatInfo.first_seen || new Date().toISOString(),
            isMalicious: true,
          }
        : {
            malware: "N/A",
            type: "N/A",
            confidence: 0,
            firstSeen: new Date().toISOString(),
            isMalicious: false,
          },
      fallback: isFallback,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in IP lookup API route:", error)

    // If we have an IP, return fallback data
    const url = new URL(request.url)
    const ip = url.searchParams.get("ip")

    if (ip) {
      const fallback = getFallbackGeoData(ip)

      return NextResponse.json({
        ip,
        country: fallback.country,
        region: "N/A",
        city: "Unknown",
        location: [fallback.lat, fallback.lon],
        timezone: "Unknown",
        isp: "Unknown",
        organization: "Unknown",
        connectionType: "Unknown",
        continent: fallback.continent,
        threat: {
          malware: "N/A",
          type: "N/A",
          confidence: 0,
          firstSeen: new Date().toISOString(),
          isMalicious: false,
        },
        fallback: true,
      })
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to lookup IP" }, { status: 500 })
  }
}
