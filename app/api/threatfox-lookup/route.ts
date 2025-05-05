import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ip } = body

    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 })
    }

    // Extract just the IP if it's in IP:PORT format
    const cleanIp = ip.includes(":") ? ip.split(":")[0] : ip

    // Query ThreatFox API to check if this IP is known to be malicious
    const response = await fetch("https://threatfox-api.abuse.ch/api/v1/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "search_ioc",
        search_term: cleanIp,
        exact_match: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`ThreatFox API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in ThreatFox lookup API route:", error)
    return NextResponse.json({ error: "Failed to check IP in ThreatFox" }, { status: 500 })
  }
}
