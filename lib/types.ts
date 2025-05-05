// CVE Types
export interface CVE {
  cveId: string
  publishDate: string
  updateDate?: string
  summary: string
  maxCvssBaseScore?: string
  maxCvssBaseScorev3?: string
  epssScore?: string
  epssPercentile?: string
  exploitExists?: string
  isInCISAKEV?: string
  isUsedForRansomware?: string
  isOverflow?: string
  isDenialOfService?: string
  assignerSourceName?: string
  nvdVulnStatus?: string
  referenceCount?: string
  weaknessCount?: string
}

// ThreatFox IOC Types
export interface IOC {
  id: string
  ioc: string
  ioc_type: string
  ioc_type_desc?: string
  threat_type: string
  threat_type_desc: string
  malware: string
  malware_printable: string
  malware_alias?: string
  malware_malpedia?: string
  confidence_level: number
  first_seen: string
  last_seen?: string
  reporter?: string
  reference?: string
  tags?: string[] | null
}

// FindIP.net API Response
export interface FindIPResponse {
  city?: {
    geoname_id?: number
    names?: {
      de?: string
      en?: string
      es?: string
      fa?: string
      fr?: string
      ja?: string
      ko?: string
      "pt-BR"?: string
      ru?: string
      "zh-CN"?: string
    }
  }
  continent?: {
    code?: string
    geoname_id?: number
    names?: {
      de?: string
      en?: string
      es?: string
      fa?: string
      fr?: string
      ja?: string
      ko?: string
      "pt-BR"?: string
      ru?: string
      "zh-CN"?: string
    }
  }
  country?: {
    geoname_id?: number
    is_in_european_union?: boolean
    iso_code?: string
    names?: {
      de?: string
      en?: string
      es?: string
      fa?: string
      fr?: string
      ja?: string
      ko?: string
      "pt-BR"?: string
      ru?: string
      "zh-CN"?: string
    }
  }
  location?: {
    latitude?: number
    longitude?: number
    time_zone?: string
    weather_code?: string
  }
  traits?: {
    autonomous_system_number?: number
    autonomous_system_organization?: string
    connection_type?: string
    isp?: string
    organization?: string
    user_type?: string
  }
}

// GeoIP Data Types
export interface GeoIPData {
  ip: string
  country: string
  region: string
  city: string
  location: [number, number] // [latitude, longitude]
  timezone: string
  isp?: string
  organization?: string
  connectionType?: string
  continent?: string
  fallback?: boolean // Indicates if this is fallback/estimated data
  threat: {
    malware: string
    type: string
    confidence: number
    firstSeen: string
    isMalicious?: boolean
  }
}

// Statistics Types
export interface ThreatStats {
  totalThreats: number
  countryCounts: Record<string, number>
  malwareCounts: Record<string, number>
  threatTypeCounts: Record<string, number>
  confidenceLevels: {
    high: number
    medium: number
    low: number
  }
  timeDistribution: {
    label: string
    count: number
  }[]
}
