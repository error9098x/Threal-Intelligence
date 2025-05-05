"use client"

import { useState, useEffect } from "react"
import { fetchThreatFoxData } from "@/lib/api"
import type { IOC } from "@/lib/types"
import IocItem from "@/components/ioc-item"
import IocDetailsSidebar from "@/components/ioc-details-sidebar"
import { Loader2 } from "lucide-react"

export default function MaliciousDomainFeed() {
  const [iocs, setIocs] = useState<IOC[]>([])
  const [visibleIocs, setVisibleIocs] = useState<IOC[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [selectedIoc, setSelectedIoc] = useState<IOC | null>(null)
  const [page, setPage] = useState(1)
  const IOC_PAGE_SIZE = 10

  const loadThreatFoxData = async () => {
    try {
      setLoading(true)
      const data = await fetchThreatFoxData()

      if (data && data.data && data.data.length > 0) {
        // Filter for URL/domain IOCs
        const urlIocs = data.data.filter((ioc: IOC) => ioc.ioc_type === "url" || ioc.ioc_type === "domain")
        setIocs(urlIocs)
        setVisibleIocs(urlIocs.slice(0, page * IOC_PAGE_SIZE))
      } else {
        setIocs([])
        setVisibleIocs([])
      }

      setLastUpdateTime(new Date())
      setError(null)
    } catch (err) {
      setError("Failed to fetch malicious domain data. Please try again later.")
      console.error("Error fetching ThreatFox data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadThreatFoxData()

    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(loadThreatFoxData, 30000)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    setVisibleIocs(iocs.slice(0, page * IOC_PAGE_SIZE))
  }, [page, iocs])

  const handleViewMore = () => {
    setPage((prevPage) => prevPage + 1)
  }

  const handleViewDetails = (ioc: IOC) => {
    setSelectedIoc(ioc)
  }

  const handleCloseSidebar = () => {
    setSelectedIoc(null)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-blue-100">Malicious Domain Feed</h2>
        <div className="flex items-center text-sm text-blue-300">
          {lastUpdateTime ? (
            <span>Last updated: {lastUpdateTime.toLocaleString()}</span>
          ) : (
            <span>Loading initial data...</span>
          )}
        </div>
      </div>

      {loading && iocs.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-blue-300">Loading malicious domain data...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-md">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {visibleIocs.length > 0 ? (
          visibleIocs.map((ioc, index) => (
            <IocItem key={`${ioc.ioc}-${index}`} ioc={ioc} onViewDetails={() => handleViewDetails(ioc)} />
          ))
        ) : !loading && !error ? (
          <div className="text-center py-8 text-blue-300">No malicious domains detected in the last 5 minutes.</div>
        ) : null}
      </div>

      {iocs.length > visibleIocs.length && (
        <div className="mt-6 text-center">
          <button
            onClick={handleViewMore}
            className="bg-blue-900/30 hover:bg-blue-800/50 text-blue-300 hover:text-blue-100 px-4 py-2 rounded border border-blue-800/30 transition-colors"
          >
            View More
          </button>
        </div>
      )}

      {selectedIoc && <IocDetailsSidebar ioc={selectedIoc} onClose={handleCloseSidebar} />}
    </div>
  )
}
