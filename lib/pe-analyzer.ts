// PE Analyzer logic adapted from the provided prototype

// Minimum length for initial string extraction before filtering
const MIN_STRING_LENGTH = 5

/**
 * Analyzes an executable file for potentially suspicious DLLs
 * @param file The executable file to analyze
 * @param setStatus Optional callback to update status during analysis
 * @returns Analysis result with potentially suspicious DLLs and summary
 */
export async function analyzeExecutable(
  file: File,
  setStatus?: (status: { message: string; type: string }) => void,
): Promise<{ potentially_suspicious_dlls: string[]; analysis_summary: string }> {
  // Update status if callback provided
  const updateStatus = (message: string, type: "info" | "loading" | "error" | "success") => {
    if (setStatus) {
      setStatus({ message, type })
    }
    console.log(`[PE Analyzer] ${type}: ${message}`)
  }

  return new Promise((resolve, reject) => {
    updateStatus("Reading file...", "loading")

    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        updateStatus("Extracting and filtering strings...", "loading")
        const arrayBuffer = event.target?.result as ArrayBuffer
        if (!arrayBuffer) {
          throw new Error("Failed to read file")
        }

        const allReadableStrings = extractStrings(arrayBuffer, MIN_STRING_LENGTH)

        // Filter for DLL names
        const dllNames = filterForDllNames(allReadableStrings)

        if (dllNames.length === 0) {
          updateStatus("No potential DLL names found in the file's strings.", "error")
          throw new Error("Could not find any strings ending in '.dll' to analyze.")
        }

        updateStatus(`Found ${dllNames.length} potential DLL(s). Analyzing...`, "loading")
        console.log("DLLs found:", dllNames)

        // For demo purposes, we'll simulate an AI analysis with a mock response
        // In a real implementation, this would call an AI service like in the prototype
        const analysisResult = await simulateAIAnalysis(dllNames)

        updateStatus("Analysis complete.", "success")
        resolve(analysisResult)
      } catch (error) {
        console.error("Error during file processing or analysis:", error)
        updateStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`, "error")
        reject(error)
      }
    }

    reader.onerror = () => {
      const errorMessage = "Error reading file"
      updateStatus(errorMessage, "error")
      reject(new Error(errorMessage))
    }

    reader.readAsArrayBuffer(file)
  })
}

/**
 * Extracts potentially readable printable strings from an ArrayBuffer
 * @param arrayBuffer The binary data from the file
 * @param minLength Minimum sequence length for a potential string before filtering
 * @returns An array of extracted strings that passed the readability filters
 */
function extractStrings(arrayBuffer: ArrayBuffer, minLength = 5): string[] {
  const uint8Array = new Uint8Array(arrayBuffer)
  const strings: string[] = []
  const decoder = new TextDecoder("utf-8", { fatal: false })
  let sequenceStartIndex = -1

  for (let i = 0; i < uint8Array.length; i++) {
    const byte = uint8Array[i]
    const isPrintable = (byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13

    if (isPrintable && sequenceStartIndex === -1) {
      sequenceStartIndex = i
    } else if (!isPrintable && sequenceStartIndex !== -1) {
      const length = i - sequenceStartIndex
      if (length >= minLength) {
        const stringSlice = uint8Array.slice(sequenceStartIndex, i)
        const decodedString = decoder.decode(stringSlice)
        if (isPotentiallyReadable(decodedString)) {
          strings.push(decodedString)
        }
      }
      sequenceStartIndex = -1
    }
  }

  // Check for string at the end of the file
  if (sequenceStartIndex !== -1) {
    const length = uint8Array.length - sequenceStartIndex
    if (length >= minLength) {
      const stringSlice = uint8Array.slice(sequenceStartIndex, uint8Array.length)
      const decodedString = decoder.decode(stringSlice)
      if (isPotentiallyReadable(decodedString)) {
        strings.push(decodedString)
      }
    }
  }

  console.log(`Found ${strings.length} potentially readable strings with initial min length ${minLength}`)
  return strings
}

/**
 * Checks if a string is likely "readable" text rather than random printable bytes
 * @param str The candidate string
 * @returns True if the string seems readable, false otherwise
 */
function isPotentiallyReadable(str: string): boolean {
  const MIN_ALPHANUM_RATIO_LONG = 0.5
  const LONG_STRING_THRESHOLD = 20
  const MAX_CONSECUTIVE_CHAR_REPEAT = 10
  const MAX_CONSECUTIVE_NON_ALPHANUM = 15

  let alphaNumCount = 0
  let consecutiveChar = ""
  let consecutiveCharCount = 0
  let consecutiveNonAlphaNumCount = 0
  let maxConsecutiveCharFound = 0
  let maxConsecutiveNonAlphaNumFound = 0
  let hasLetter = false

  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    const isLetter = (char >= "a" && char <= "z") || (char >= "A" && char <= "Z")
    const isNumber = char >= "0" && char <= "9"
    const isAlphaNum = isLetter || isNumber

    if (isLetter) hasLetter = true
    if (isAlphaNum) alphaNumCount++

    if (char === consecutiveChar) {
      consecutiveCharCount++
    } else {
      consecutiveChar = char
      consecutiveCharCount = 1
    }

    maxConsecutiveCharFound = Math.max(maxConsecutiveCharFound, consecutiveCharCount)

    if (!isAlphaNum) {
      consecutiveNonAlphaNumCount++
    } else {
      consecutiveNonAlphaNumCount = 0
    }

    maxConsecutiveNonAlphaNumFound = Math.max(maxConsecutiveNonAlphaNumFound, consecutiveNonAlphaNumCount)
  }

  if (maxConsecutiveCharFound > MAX_CONSECUTIVE_CHAR_REPEAT) return false
  if (maxConsecutiveNonAlphaNumFound > MAX_CONSECUTIVE_NON_ALPHANUM) return false

  if (str.length >= LONG_STRING_THRESHOLD) {
    const alphaNumRatio = alphaNumCount / str.length
    if (alphaNumRatio < MIN_ALPHANUM_RATIO_LONG || !hasLetter) return false
  }

  return true
}

/**
 * Filters an array of strings, returning only those that end with ".dll" (case-insensitive)
 * @param stringsArray Array of strings extracted from the file
 * @returns An array of unique potential DLL filenames
 */
function filterForDllNames(stringsArray: string[]): string[] {
  const dllRegex = /\.dll$/i // Case-insensitive regex for ".dll" at the end of a string
  const potentialDlls = new Set<string>() // Use a Set to store unique names automatically

  for (const str of stringsArray) {
    // Trim whitespace just in case
    const trimmedStr = str.trim()
    // Check minimum length (e.g., "a.dll") and if it matches the regex
    if (trimmedStr.length > 4 && dllRegex.test(trimmedStr)) {
      // Basic sanity check: does it contain invalid filename chars? (optional)
      if (!/[<>:"/\\|?*]/.test(trimmedStr)) {
        // Avoid illegal chars
        potentialDlls.add(trimmedStr)
      }
    }
  }

  // Convert the Set back to an Array
  return Array.from(potentialDlls)
}

/**
 * Simulates an AI analysis of DLL names
 * In a real implementation, this would call an AI service
 * @param dllNames Array of DLL names to analyze
 * @returns Analysis result with potentially suspicious DLLs and summary
 */
async function simulateAIAnalysis(
  dllNames: string[],
): Promise<{ potentially_suspicious_dlls: string[]; analysis_summary: string }> {
  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Common system DLLs that are generally not suspicious
  const commonSystemDlls = new Set([
    "kernel32.dll",
    "user32.dll",
    "gdi32.dll",
    "ntdll.dll",
    "shell32.dll",
    "advapi32.dll",
    "ole32.dll",
    "msvcrt.dll",
    "comctl32.dll",
    "comdlg32.dll",
    "ws2_32.dll",
    "wininet.dll",
    "oleaut32.dll",
    "shlwapi.dll",
    "rpcrt4.dll",
  ])

  // Potentially suspicious DLL patterns
  const suspiciousPatterns = [
    { pattern: /7z.*\.dll$/i, category: "compression" },
    { pattern: /rar.*\.dll$/i, category: "compression" },
    { pattern: /crypt.*\.dll$/i, category: "cryptography" },
    { pattern: /inject.*\.dll$/i, category: "injection" },
    { pattern: /hook.*\.dll$/i, category: "hooking" },
    { pattern: /keylog.*\.dll$/i, category: "keylogging" },
    { pattern: /screen.*\.dll$/i, category: "screen capture" },
    { pattern: /net.*\.dll$/i, category: "networking" },
    { pattern: /ssl.*\.dll$/i, category: "encryption" },
    { pattern: /tor.*\.dll$/i, category: "anonymization" },
  ]

  // Filter for potentially suspicious DLLs
  const suspiciousDlls: string[] = []
  const categories = new Set<string>()

  for (const dll of dllNames) {
    // Skip common system DLLs
    if (commonSystemDlls.has(dll.toLowerCase())) continue

    // Check against suspicious patterns
    for (const { pattern, category } of suspiciousPatterns) {
      if (pattern.test(dll)) {
        suspiciousDlls.push(dll)
        categories.add(category)
        break
      }
    }

    // If not matched by patterns but looks unusual, add it
    if (
      !suspiciousDlls.includes(dll) &&
      !commonSystemDlls.has(dll.toLowerCase()) &&
      (dll.length > 15 || /[0-9]{3,}/.test(dll))
    ) {
      suspiciousDlls.push(dll)
    }
  }

  // Generate analysis summary based on findings
  let analysisSummary = ""

  if (suspiciousDlls.length === 0) {
    analysisSummary = "No suspicious DLLs were identified. The executable appears to use standard system libraries."
  } else {
    const categoryList = Array.from(categories).join(", ")
    analysisSummary = `The presence of ${suspiciousDlls.length} potentially suspicious DLLs suggests capabilities related to ${categoryList}, which could be indicative of malware attempting to hide or transmit data.`
  }

  return {
    potentially_suspicious_dlls: suspiciousDlls,
    analysis_summary: analysisSummary,
  }
}
