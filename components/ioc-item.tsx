"use client"

import type { IOC } from "@/lib/types"
import { AlertTriangle, ExternalLink } from "lucide-react"

interface IocItemProps {
  ioc: IOC
  onViewDetails: () => void
}

export default function IocItem({ ioc, onViewDetails }: IocItemProps) {
  // Format date properly
  const formatDate = (dateStr: string | undefined | number): string => {
    if (!dateStr) return "N/A"

    try {
      // If it's a timestamp (number or string that can be parsed as a number)
      if (typeof dateStr === "number" || !isNaN(Number(dateStr))) {
        return new Date(typeof dateStr === "number" ? dateStr * 1000 : Number(dateStr) * 1000).toLocaleString()
      }

      // If it's a date string
      return new Date(dateStr).toLocaleString()
    } catch (e) {
      return String(dateStr)
    }
  }

  return (
    <div className="glass-card rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
          <span className="font-mono font-medium text-blue-100">{ioc.ioc}</span>
        </div>
        <span className="bg-red-900/40 text-red-300 px-2 py-1 rounded text-xs">{ioc.ioc_type}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-sm">
        <div>
          <span className="text-blue-400">Malware: </span>
          <span className="text-blue-100">{ioc.malware_printable}</span>
        </div>
        <div>
          <span className="text-blue-400">First Seen: </span>
          <span className="text-blue-100">{formatDate(ioc.first_seen)}</span>
        </div>
      </div>

      <div className="mb-3 text-sm">
        <span className="text-blue-400">Threat Type: </span>
        <span className="text-blue-100">{ioc.threat_type_desc}</span>
      </div>

      <button
        className="text-sm bg-blue-900/30 hover:bg-blue-800/50 text-blue-300 hover:text-blue-100 px-3 py-1 rounded border border-blue-800/30 transition-colors flex items-center"
        onClick={onViewDetails}
      >
        <ExternalLink className="h-3 w-3 mr-1" />
        View Details
      </button>
    </div>
  )
}
