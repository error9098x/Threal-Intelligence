import { type NextRequest, NextResponse } from "next/server"

// Access token for CVE Details API (from environment)
const CVEDETAILS_ACCESS_TOKEN = process.env.CVEDETAILS_ACCESS_TOKEN?.trim()

export async function GET(request: NextRequest) {
  try {
    // Get date range from query parameters or use current date as fallback
    const searchParams = request.nextUrl.searchParams
    const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0]

    // If startDate is not provided, use the same as endDate (current date only)
    const startDate = searchParams.get("startDate") || endDate

    // Forward the request to CVE Details API
    if (!CVEDETAILS_ACCESS_TOKEN) {
      return NextResponse.json({ error: "CVEDETAILS_ACCESS_TOKEN is not configured" }, { status: 500 })
    }

    const response = await fetch(
      `https://www.cvedetails.com/api/v1/vulnerability/search?publishDateStart=${startDate}&publishDateEnd=${endDate}&orderBy=publishDate&sort=DESC&outputFormat=json&pageNumber=1&resultsPerPage=10`,
      {
        headers: {
          Authorization: `Bearer ${CVEDETAILS_ACCESS_TOKEN}`,
          Accept: "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`CVE API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error proxying request to CVE Details API:", error)

    return NextResponse.json(
      {
        error: "Error fetching CVE data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
