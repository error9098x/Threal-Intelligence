"use client"

import type { IOC } from "@/lib/types"
import { X } from "lucide-react"

interface IocDetailsSidebarProps {
  ioc: IOC
  onClose: () => void
}

export default function IocDetailsSidebar({ ioc, onClose }: IocDetailsSidebarProps) {
  // Format dates properly
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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] md:w-[550px] glass-panel border-l border-blue-900/30 shadow-xl overflow-y-auto">
      <div className="sticky top-0 flex justify-between items-center p-4 border-b border-blue-900/30 bg-background/80 backdrop-blur-md">
        <h2 className="text-xl font-bold text-blue-100">IOC Details</h2>
        <button onClick={onClose} className="text-blue-400 hover:text-blue-100 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b border-blue-900/20">
              <th className="text-left py-2 pr-4 text-blue-400">IOC</th>
              <td className="py-2 break-words">{ioc.ioc}</td>
            </tr>
            <tr className="border-b border-blue-900/20">
              <th className="text-left py-2 pr-4 text-blue-400">Type</th>
              <td className="py-2">
                {ioc.ioc_type} - {ioc.ioc_type_desc || ""}
              </td>
            </tr>
            <tr className="border-b border-blue-900/20">
              <th className="text-left py-2 pr-4 text-blue-400">Malware</th>
              <td className="py-2">
                {ioc.malware_printable} {ioc.malware_alias ? `(${ioc.malware_alias})` : ""}
              </td>
            </tr>
            <tr className="border-b border-blue-900/20">
              <th className="text-left py-2 pr-4 text-blue-400">Threat Type</th>
              <td className="py-2">{ioc.threat_type_desc}</td>
            </tr>
            <tr className="border-b border-blue-900/20">
              <th className="text-left py-2 pr-4 text-blue-400">First Seen</th>
              <td className="py-2">{formatDate(ioc.first_seen)}</td>
            </tr>
            {ioc.last_seen && (
              <tr className="border-b border-blue-900/20">
                <th className="text-left py-2 pr-4 text-blue-400">Last Seen</th>
                <td className="py-2">{formatDate(ioc.last_seen)}</td>
              </tr>
            )}
            <tr className="border-b border-blue-900/20">
              <th className="text-left py-2 pr-4 text-blue-400">Confidence</th>
              <td className="py-2">{ioc.confidence_level}%</td>
            </tr>
            {ioc.reporter && (
              <tr className="border-b border-blue-900/20">
                <th className="text-left py-2 pr-4 text-blue-400">Reporter</th>
                <td className="py-2">{ioc.reporter}</td>
              </tr>
            )}
            {ioc.reference && (
              <tr className="border-b border-blue-900/20">
                <th className="text-left py-2 pr-4 text-blue-400">Reference</th>
                <td className="py-2 break-words">
                  {ioc.reference.startsWith("http") ? (
                    <a
                      href={ioc.reference}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {ioc.reference}
                    </a>
                  ) : (
                    ioc.reference
                  )}
                </td>
              </tr>
            )}
            {ioc.tags && ioc.tags.length > 0 && (
              <tr className="border-b border-blue-900/20">
                <th className="text-left py-2 pr-4 text-blue-400 align-top">Tags</th>
                <td className="py-2">
                  <div className="flex flex-wrap gap-2">
                    {ioc.tags.map((tag, index) => (
                      <span key={index} className="bg-blue-900/40 text-blue-200 px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            )}
            {ioc.malware_malpedia && (
              <tr className="border-b border-blue-900/20">
                <th className="text-left py-2 pr-4 text-blue-400">Malpedia</th>
                <td className="py-2">
                  <a
                    href={ioc.malware_malpedia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    View on Malpedia
                  </a>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
