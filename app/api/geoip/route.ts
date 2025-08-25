import { NextResponse } from "next/server"
import { fetchThreatFoxData } from "@/lib/api"
import type { FindIPResponse, GeoIPData } from "@/lib/types"

// FindIP.net API token (from environment)
const FINDIP_API_TOKEN = process.env.FINDIP_API_TOKEN?.trim()

// Global cache to store processed IPs
let geoCache: Record<string, GeoIPData> = {}
const processingQueue: string[] = []
let isProcessing = false
let lastProcessedTimestamp = 0

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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

// Process a single IP
async function processIP(ip: string, iocData: any): Promise<GeoIPData | null> {
  try {
    console.log(`Processing IP: ${ip}`)

    // Check if we already have this IP in cache
    if (geoCache[ip]) {
      console.log(`Using cached data for IP: ${ip}`)
      return geoCache[ip]
    }

    if (!FINDIP_API_TOKEN) {
      console.error("FINDIP_API_TOKEN is not configured")
      throw new Error("FINDIP_API_TOKEN is not configured")
    }

    const response = await fetch(`https://api.findip.net/${ip}/?token=${FINDIP_API_TOKEN}`)

    if (!response.ok) {
      console.error(`Failed to get geolocation for IP ${ip}: ${response.status} ${response.statusText}`)

      // Use fallback data if the API call fails
      const fallback = getFallbackGeoData(ip)

      const fallbackData = {
        ip,
        country: fallback.country,
        region: "N/A",
        city: "Unknown",
        location: [fallback.lat, fallback.lon] as [number, number],
        timezone: "Unknown",
        isp: "Unknown",
        organization: "Unknown",
        connectionType: "Unknown",
        continent: fallback.continent,
        threat: {
          malware: iocData?.malware_printable || "Unknown",
          type: iocData?.threat_type_desc || "Unknown",
          confidence: iocData?.confidence_level || 0,
          firstSeen: iocData?.first_seen || "",
        },
        fallback: true,
      }

      // Cache the result
      geoCache[ip] = fallbackData
      return fallbackData
    }

    const geoData: FindIPResponse = await response.json()

    // Extract relevant data from the response
    const result = {
      ip,
      country: geoData.country?.names?.en || geoData.country?.iso_code || "Unknown",
      region: "N/A", // Not provided in this API
      city: geoData.city?.names?.en || "Unknown",
      location: [geoData.location?.latitude || 0, geoData.location?.longitude || 0] as [number, number],
      timezone: geoData.location?.time_zone || "Unknown",
      isp: geoData.traits?.isp || "Unknown",
      organization: geoData.traits?.organization || geoData.traits?.autonomous_system_organization || "Unknown",
      connectionType: geoData.traits?.connection_type || "Unknown",
      continent: geoData.continent?.names?.en || geoData.continent?.code || "Unknown",
      threat: {
        malware: iocData?.malware_printable || "Unknown",
        type: iocData?.threat_type_desc || "Unknown",
        confidence: iocData?.confidence_level || 0,
        firstSeen: iocData?.first_seen || "",
      },
      fallback: false,
    }

    // Cache the result
    geoCache[ip] = result
    return result
  } catch (error) {
    console.error(`Error processing IP ${ip}:`, error)

    // Use fallback data if there's an exception
    const fallback = getFallbackGeoData(ip)

    const fallbackData = {
      ip,
      country: fallback.country,
      region: "N/A",
      city: "Unknown",
      location: [fallback.lat, fallback.lon] as [number, number],
      timezone: "Unknown",
      isp: "Unknown",
      organization: "Unknown",
      connectionType: "Unknown",
      continent: fallback.continent,
      threat: {
        malware: iocData?.malware_printable || "Unknown",
        type: iocData?.threat_type_desc || "Unknown",
        confidence: iocData?.confidence_level || 0,
        firstSeen: iocData?.first_seen || "",
      },
      fallback: true,
    }

    // Cache the result
    geoCache[ip] = fallbackData
    return fallbackData
  }
}

// Process the queue sequentially
async function processQueue(ipIocs: any[]) {
  if (isProcessing) return

  isProcessing = true

  while (processingQueue.length > 0) {
    const ip = processingQueue.shift()!

    // Find the original IOC data for this IP
    const iocData = ipIocs.find((ioc) => {
      const iocIp = ioc.ioc_type === "ip:port" ? ioc.ioc.split(":")[0] : ioc.ioc
      return iocIp === ip
    })

    await processIP(ip, iocData)

    // Wait 5 seconds between API calls
    lastProcessedTimestamp = Date.now()
    await delay(5000)
  }

  isProcessing = false
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const forceRefresh = url.searchParams.get("refresh") === "true"

    // If force refresh is requested, clear the cache
    if (forceRefresh) {
      geoCache = {}
    }

    // Fetch malicious IPs from the last 7 days
    const threatData = await fetchThreatFoxData(undefined, 7)

    if (!threatData || !threatData.data) {
      throw new Error("Failed to fetch threat data")
    }

    // Filter for IP addresses
    const ipIocs = threatData.data.filter((ioc) => ioc.ioc_type === "ip" || ioc.ioc_type === "ip:port")

    // Extract unique IPs
    const uniqueIps = new Set<string>()
    ipIocs.forEach((ioc) => {
      // Extract IP from IP:PORT format if needed
      const ip = ioc.ioc_type === "ip:port" ? ioc.ioc.split(":")[0] : ioc.ioc
      uniqueIps.add(ip)
    })

    // Add IPs to processing queue if not already processed
    Array.from(uniqueIps).forEach((ip) => {
      if (!geoCache[ip] && !processingQueue.includes(ip)) {
        processingQueue.push(ip)
      }
    })

    // Start processing the queue if not already processing
    if (!isProcessing) {
      // Don't await this - let it run in the background
      processQueue(ipIocs)
    }

    // Return whatever data we have so far
    const currentResults = Array.from(uniqueIps)
      .map((ip) => geoCache[ip])
      .filter(Boolean)

    // Include processing status in the response
    const response = {
      data: currentResults,
      status: {
        totalIPs: uniqueIps.size,
        processedIPs: currentResults.length,
        remainingIPs: processingQueue.length,
        isProcessing,
        lastProcessed: lastProcessedTimestamp ? new Date(lastProcessedTimestamp).toISOString() : null,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in GeoIP API route:", error)
    return NextResponse.json({ error: "Failed to fetch GeoIP data" }, { status: 500 })
  }
}
