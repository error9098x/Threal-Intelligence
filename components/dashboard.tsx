"use client"

import { useState } from "react"
import Header from "@/components/header"
import TabNavigation from "@/components/tab-navigation"
import CveFeed from "@/components/cve-feed"
import MaliciousIpFeed from "@/components/malicious-ip-feed"
import MaliciousDomainFeed from "@/components/malicious-domain-feed"
import CyberMap from "@/components/cyber-map"
import PeAnalyzer from "@/components/pe-analyzer"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("cve-feed")

  const tabs = [
    { id: "cve-feed", label: "CVE Feed" },
    { id: "ip-feed", label: "Malicious IP Feed" },
    { id: "domain-feed", label: "Malicious Domain Feed" },
    { id: "cyber-map", label: "Cyber Threat Map" },
    { id: "pe-analyzer", label: "PE Analyzer" },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-6 flex-1">
        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-6 glass-panel rounded-lg p-6">
          {activeTab === "cve-feed" && <CveFeed />}
          {activeTab === "ip-feed" && <MaliciousIpFeed />}
          {activeTab === "domain-feed" && <MaliciousDomainFeed />}
          {activeTab === "cyber-map" && <CyberMap />}
          {activeTab === "pe-analyzer" && <PeAnalyzer />}
        </div>
      </div>
    </div>
  )
}
