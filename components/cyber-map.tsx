"use client"

import type React from "react"

import { useState } from "react"
import { lookupIP } from "@/lib/api"
import type { GeoIPData } from "@/lib/types"
import { Loader2, Search, Globe } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import the map component to avoid SSR issues
const WorldMap = dynamic(() => import("@/components/world-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  ),
})

export default function CyberMap() {
  const [searchIP, setSearchIP] = useState("")
  const [ipData, setIpData] = useState<GeoIPData | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<GeoIPData[]>([])

  // Search for a specific IP
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchIP.trim()) return

    try {
      setSearchLoading(true)
      setSearchError(null)

      // Use our API route to lookup the IP
      const result = await lookupIP(searchIP)
      setIpData(result)

      // Add to search history if not already there
      if (!searchHistory.some((item) => item.ip === result.ip)) {
        setSearchHistory((prev) => [result, ...prev].slice(0, 10)) // Keep last 10 searches
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Failed to search IP")
      console.error("Error searching IP:", err)
    } finally {
      setSearchLoading(false)
    }
  }

  // Load a previous search from history
  const loadFromHistory = (ip: GeoIPData) => {
    setIpData(ip)
    setSearchIP(ip.ip)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-blue-100">Cyber Threat Map</h2>
        <div className="text-sm text-blue-300">Enter an IP address to check its location and threat status</div>
      </div>

      {/* IP Search Form */}
      <div className="mb-6 bg-blue-900/20 p-4 rounded-lg border border-blue-800/30">
        <h3 className="text-lg font-medium text-blue-100 mb-2">IP Lookup</h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={searchIP}
              onChange={(e) => setSearchIP(e.target.value)}
              placeholder="Enter IP address (e.g., 139.180.203.104)"
              className="w-full px-3 py-2 bg-blue-900/30 border border-blue-800/30 rounded text-blue-100 placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
          >
            {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Lookup
          </button>
        </form>

        {searchError && <div className="mt-2 text-red-400 text-sm">{searchError}</div>}

        {ipData && (
          <div className="mt-4 bg-blue-900/30 p-3 rounded border border-blue-800/40">
            <h4 className="font-medium text-blue-100 mb-2 flex items-center">
              Results for {ipData.ip}
              <span
                className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  ipData.threat.isMalicious
                    ? "bg-red-900/50 text-red-200 border border-red-700/50"
                    : "bg-blue-900/50 text-blue-200 border border-blue-700/50"
                }`}
              >
                {ipData.threat.isMalicious ? "Malicious" : "Not Known to be Malicious"}
              </span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p>
                  <span className="text-blue-300">Location:</span> {ipData.city}, {ipData.country}
                </p>
                <p>
                  <span className="text-blue-300">Continent:</span> {ipData.continent}
                </p>
                <p>
                  <span className="text-blue-300">Coordinates:</span> {ipData.location[0]}, {ipData.location[1]}
                </p>
              </div>
              <div>
                <p>
                  <span className="text-blue-300">ISP:</span> {ipData.isp}
                </p>
                <p>
                  <span className="text-blue-300">Organization:</span> {ipData.organization}
                </p>
                <p>
                  <span className="text-blue-300">Connection Type:</span> {ipData.connectionType}
                </p>
              </div>
            </div>
            {ipData.threat.isMalicious && (
              <div className="mt-3 p-2 bg-red-900/20 border border-red-800/30 rounded">
                <h5 className="text-red-300 font-medium">Threat Information</h5>
                <p>
                  <span className="text-blue-300">Malware:</span> {ipData.threat.malware}
                </p>
                <p>
                  <span className="text-blue-300">Threat Type:</span> {ipData.threat.type}
                </p>
                <p>
                  <span className="text-blue-300">Confidence:</span> {ipData.threat.confidence}%
                </p>
                <p>
                  <span className="text-blue-300">First Seen:</span>{" "}
                  {new Date(ipData.threat.firstSeen).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="mb-6 bg-blue-900/20 p-4 rounded-lg border border-blue-800/30">
          <h3 className="text-lg font-medium text-blue-100 mb-2">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((item) => (
              <button
                key={item.ip}
                onClick={() => loadFromHistory(item)}
                className={`text-xs px-2 py-1 rounded-full ${
                  item.threat.isMalicious
                    ? "bg-red-900/30 text-red-200 border border-red-700/30 hover:bg-red-900/50"
                    : "bg-blue-900/30 text-blue-200 border border-blue-700/30 hover:bg-blue-900/50"
                }`}
              >
                {item.ip}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="h-[500px] bg-blue-900/10 rounded-lg border border-blue-800/20 overflow-hidden">
        {ipData ? (
          <WorldMap ipData={ipData} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-blue-300">
            <Globe className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg">Enter an IP address above to view its location on the map</p>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-blue-300">
        <p>Enter an IP address above to check its location and threat status.</p>
        <p className="mt-1">
          The map will display the IP location and indicate whether it is known to be malicious based on ThreatFox
          intelligence data.
        </p>
      </div>
    </div>
  )
}
