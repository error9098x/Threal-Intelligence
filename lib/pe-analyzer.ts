"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Loader2, FileUp, AlertTriangle, Shield, FileCode } from "lucide-react"

// Import the analyzer logic from the prototype
import { analyzeExecutable } from "@/lib/pe-analyzer"

interface AnalysisResult {
  potentially_suspicious_dlls: string[]
  analysis_summary: string
}

export default function PeAnalyzer() {
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [status, setStatus] = useState<{ message: string; type: "info" | "loading" | "error" | "success" }>({
    message: "Select an .exe or .dll file to begin analysis.",
    type: "info",
  })
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setResult(null)

    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith(".exe") && !selectedFile.name.endsWith(".dll")) {
        setStatus({
          message: "Please select a valid .exe or .dll file.",
          type: "error",
        })
        setFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }

      setStatus({
        message: `Selected file: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`,
        type: "info",
      })
    } else {
      setStatus({
        message: "Select an .exe or .dll file to begin analysis.",
        type: "info",
      })
    }
  }

  const handleAnalyze = async () => {
    if (!file) {
      setStatus({
        message: "Please select a file first.",
        type: "error",
      })
      return
    }

    try {
      setIsAnalyzing(true)
      setStatus({
        message: "Analyzing file... This may take a moment.",
        type: "loading",
      })

      // Call the analyzer function from the prototype
      const analysisResult = await analyzeExecutable(file, setStatus)
      setResult(analysisResult)

      setStatus({
        message: "Analysis complete.",
        type: "success",
      })
    } catch (error) {
      console.error("Analysis error:", error)
      setStatus({
        message: `Error during analysis: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: "error",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setFile(null)
    setResult(null)
    setStatus({
      message: "Select an .exe or .dll file to begin analysis.",
      type: "info",
    })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-blue-100">PE Analyzer</h2>
        <div className="text-sm text-blue-300">Analyze executable files for potentially suspicious DLLs</div>
      </div>

      <div className="mb-6 glass-panel p-6 rounded-lg">
        <h3 className="text-lg font-medium text-blue-100 mb-4">Upload Executable</h3>
        <p className="text-sm text-blue-300 mb-4">
          Select an .exe or .dll file. The analyzer will extract strings, identify potentially suspicious DLLs, and
          provide a security analysis.
        </p>

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center w-full h-32 px-4 transition bg-blue-900/20 border-2 border-blue-800/30 border-dashed rounded-lg appearance-none cursor-pointer hover:border-blue-600/50 focus:outline-none"
            >
              <div className="flex flex-col items-center space-y-2">
                <FileUp className="w-6 h-6 text-blue-400" />
                <span className="font-medium text-blue-300">{file ? file.name : "Drop file or click to upload"}</span>
                {file && <span className="text-xs text-blue-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>}
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".exe,.dll"
                className="hidden"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </label>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              {isAnalyzing ? "Analyzing..." : "Analyze File"}
            </button>
            <button
              onClick={resetAnalysis}
              disabled={isAnalyzing}
              className="flex items-center justify-center gap-2 bg-blue-900/30 hover:bg-blue-800/50 text-blue-300 hover:text-blue-100 px-6 py-2 rounded border border-blue-800/30 transition-colors disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>

        <div
          className={`status-message p-3 rounded text-sm ${
            status.type === "loading"
              ? "bg-blue-900/30 text-blue-300 border border-blue-800/50"
              : status.type === "error"
                ? "bg-red-900/20 text-red-300 border border-red-800/30"
                : status.type === "success"
                  ? "bg-green-900/20 text-green-300 border border-green-800/30"
                  : "bg-blue-900/20 text-blue-300 border border-blue-800/30"
          }`}
        >
          {status.type === "loading" && <Loader2 className="inline-block h-4 w-4 mr-2 animate-spin" />}
          {status.type === "error" && <AlertTriangle className="inline-block h-4 w-4 mr-2" />}
          {status.message}
        </div>
      </div>

      {result && (
        <div className="glass-panel p-6 rounded-lg mb-6 animate-fadeIn">
          <h3 className="text-lg font-medium text-blue-100 mb-4 flex items-center">
            <FileCode className="mr-2 h-5 w-5 text-blue-400" />
            Analysis Results
          </h3>

          <div className="mb-6">
            <h4 className="text-md font-medium text-blue-300 mb-2">Analysis Summary</h4>
            <div className="bg-blue-900/20 p-4 rounded border border-blue-800/30 text-blue-100">
              {result.analysis_summary}
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-blue-300 mb-2">
              Potentially Suspicious DLLs{" "}
              <span className="text-sm font-normal text-blue-400">
                ({result.potentially_suspicious_dlls.length} found)
              </span>
            </h4>

            {result.potentially_suspicious_dlls.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.potentially_suspicious_dlls.map((dll, index) => (
                  <div key={index} className="bg-red-900/10 border border-red-800/30 rounded p-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
                    <span className="text-red-200 font-mono text-sm truncate" title={dll}>
                      {dll}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-900/10 border border-green-800/30 rounded p-4 text-green-300">
                No suspicious DLLs were identified in this executable.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-sm text-blue-300">
        <p className="mb-2">
          <strong>Note:</strong> This analysis is based on static examination of the file's strings and does not execute
          the binary. It may not detect all malicious indicators.
        </p>
        <p>
          For comprehensive security analysis, consider using specialized tools like VirusTotal, Cuckoo Sandbox, or
          professional malware analysis services.
        </p>
      </div>
    </div>
  )
}
