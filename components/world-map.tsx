"use client"

import { useState, useCallback, useEffect } from "react"
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps"
import type { GeoIPData } from "@/lib/types"
import { Tooltip } from "react-tooltip"

// World map GeoJSON - using a more reliable source
const geoUrl = "https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-110m.json"

interface WorldMapProps {
  ipData: GeoIPData | null
}

export default function WorldMap({ ipData }: WorldMapProps) {
  const [tooltipContent, setTooltipContent] = useState("")
  const [tooltipId, setTooltipId] = useState("")
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 20],
    zoom: 1,
  })

  // Handle map zoom
  const handleZoomIn = () => {
    if (position.zoom >= 4) return
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }))
  }

  const handleZoomOut = () => {
    if (position.zoom <= 1) return
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }))
  }

  const handleMoveEnd = useCallback((position: { coordinates: [number, number]; zoom: number }) => {
    setPosition(position)
  }, [])

  // Reset map view
  const resetView = () => {
    setPosition({
      coordinates: [0, 20],
      zoom: 1,
    })
  }

  // Center on IP location when it changes
  useEffect(() => {
    if (ipData && ipData.location && ipData.location[0] && ipData.location[1]) {
      setPosition({
        coordinates: [ipData.location[1] * -1, ipData.location[0] * -1],
        zoom: 4,
      })
    }
  }, [ipData])

  return (
    <div className="relative h-full">
      {/* Map controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="bg-blue-900/60 hover:bg-blue-800 text-blue-100 w-8 h-8 rounded flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-blue-900/60 hover:bg-blue-800 text-blue-100 w-8 h-8 rounded flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button
          onClick={resetView}
          className="bg-blue-900/60 hover:bg-blue-800 text-blue-100 w-8 h-8 rounded flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 z-10 bg-blue-900/60 p-2 rounded text-xs text-blue-100">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
          <span>Malicious IP</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
          <span>Non-Malicious IP</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full border border-amber-500"></span>
          <span>Estimated Location</span>
        </div>
      </div>

      <ComposableMap
        projection="geoEquirectangular"
        style={{ width: "100%", height: "100%", backgroundColor: "#061029" }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={handleMoveEnd}
          translateExtent={[
            [-180, -90],
            [180, 90],
          ]}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1e3a8a"
                  stroke="#3b82f6"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#1e40af" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {ipData && ipData.location && ipData.location[0] && ipData.location[1] && (
            <Marker
              key={ipData.ip}
              coordinates={[ipData.location[1], ipData.location[0]]}
              data-tooltip-id={`marker-${ipData.ip.replace(/\./g, "-")}`}
              onMouseEnter={() => {
                const tooltipId = `marker-${ipData.ip.replace(/\./g, "-")}`
                setTooltipId(tooltipId)
                setTooltipContent(`
                <div>
                  <strong>IP:</strong> ${ipData.ip}${ipData.fallback ? ' <span style="color:#f59e0b">(Estimated Location)</span>' : ""}<br/>
                  <strong>Location:</strong> ${ipData.city || "Unknown"}, ${ipData.country || "Unknown"}<br/>
                  <strong>ISP:</strong> ${ipData.isp || "Unknown"}<br/>
                  <strong>Organization:</strong> ${ipData.organization || "Unknown"}<br/>
                  <strong>Connection:</strong> ${ipData.connectionType || "Unknown"}<br/>
                  <strong>Status:</strong> ${ipData.threat.isMalicious ? '<span style="color:#ef4444">Malicious</span>' : '<span style="color:#3b82f6">Not Known to be Malicious</span>'}<br/>
                  ${
                    ipData.threat.isMalicious
                      ? `<strong>Malware:</strong> ${ipData.threat.malware}<br/>
                         <strong>Threat Type:</strong> ${ipData.threat.type}<br/>
                         <strong>Confidence:</strong> ${ipData.threat.confidence}%<br/>
                         <strong>First Seen:</strong> ${new Date(ipData.threat.firstSeen).toLocaleString()}`
                      : ""
                  }
                </div>
              `)
              }}
            >
              <g>
                {/* Pulse effect circle */}
                <circle
                  r={10}
                  fill="none"
                  stroke={ipData.threat.isMalicious ? "#ef4444" : "#3b82f6"}
                  strokeWidth={1}
                  strokeOpacity={0.5}
                  className="animate-ping"
                />

                {/* Main marker */}
                <circle
                  r={6}
                  fill={ipData.threat.isMalicious ? "#ef4444" : "#3b82f6"}
                  stroke="#fff"
                  strokeWidth={2}
                  opacity={0.8}
                />

                {/* Fallback indicator */}
                {ipData.fallback && (
                  <circle r={8} fill="none" stroke="#f59e0b" strokeWidth={1} strokeDasharray="2,2" opacity={0.8} />
                )}
              </g>
            </Marker>
          )}
        </ZoomableGroup>
      </ComposableMap>

      <Tooltip id={tooltipId} html={tooltipContent} />
    </div>
  )
}
