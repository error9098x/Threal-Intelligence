import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { minutes = 5, days } = body

    // Get API key from environment
    const THREATFOX_API_KEY = process.env.THREATFOX_API_KEY?.trim()
    
    if (!THREATFOX_API_KEY) {
      return NextResponse.json({ error: "THREATFOX_API_KEY is not configured" }, { status: 500 })
    }

    const response = await fetch(`https://threatfox-api.abuse.ch/api/v1/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Auth-Key": THREATFOX_API_KEY,
      },
      body: JSON.stringify({
        query: "get_iocs",
        days: days || undefined,
        minutes: !days ? minutes : undefined,
      }),
    })

    if (!response.ok) {
      throw new Error(`ThreatFox API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in ThreatFox API route::", error)
    return NextResponse.json({ error: "Failed to fetch threat data" }, { status: 500 })
  }
}
