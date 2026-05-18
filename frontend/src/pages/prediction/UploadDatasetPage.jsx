import React, { useState, useRef, useEffect } from "react"
import axios from "axios"
import SectionHeader from "@/components/SectionHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Search,
  UploadCloud,
  Link as LinkIcon,
  CheckCircle2,
  Loader2,
  AlertCircle
} from "lucide-react"

const API_BASE = (import.meta.env.VITE_BACKEND_URL || "http://localhost:6000")
const RETAIL_API_BASE = (import.meta.env.VITE_RETAIL_API_URL || "http://localhost:5000") + (import.meta.env.VITE_RETAIL_API_URL?.endsWith('/v1/api') ? "" : "/v1/api")

/* ─── Item Search Bar ───────────────────────────────────── */
function ItemSearchBar({ search, suggestions, activeIndex, isSearching, onSearchChange, onKeyDown, onSelect }) {
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search items by name, brand..."
          className="pl-10 h-11 text-base shadow-sm border-theme-200 focus-visible:ring-theme-500"
          autoComplete="off"
        />
        {isSearching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-theme-600" />}
      </div>

      {(suggestions.length > 0 || isSearching) && (
        <div className="absolute left-0 right-0 top-12 z-50 mt-1 rounded-md border bg-popover shadow-md overflow-hidden animate-in fade-in zoom-in-95">
          {isSearching && suggestions.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching...
            </div>
          )}
          {!isSearching && suggestions.slice(0, 5).map((item, index) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelect(item); }}
              className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                activeIndex === index ? "bg-theme-100 text-theme-700" : "bg-transparent hover:bg-muted"
              }`}
            >
              <div>
                <span className="font-medium block">{item.name}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{item.brand || item.subcategory || ""}</span>
              </div>
              <Badge variant="outline" className="text-xs bg-background">
                Stock: {item.quantity || 0}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function UploadDatasetPage() {
  const [search, setSearch] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  
  const [datasetPath, setDatasetPath] = useState("")
  const [uploadFile, setUploadFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [linkSuccess, setLinkSuccess] = useState(false)
  
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const searchTimer = useRef(null)

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    const term = search.trim()
    if (!term) {
      setSuggestions([])
      setActiveIndex(0)
      setIsSearching(false)
      return
    }

    searchTimer.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const { data } = await axios.get(`${RETAIL_API_BASE}/admin/items/suggestions`, {
          params: { q: term },
        })
        setSuggestions(Array.isArray(data) ? data.slice(0, 5) : [])
        setActiveIndex(0)
      } catch {
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 180)

    return () => clearTimeout(searchTimer.current)
  }, [search])

  const handleSearchKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, Math.max(suggestions.length - 1, 0)))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    } else if (event.key === "Enter") {
      event.preventDefault()
      if (suggestions[activeIndex]) handleSelectItem(suggestions[activeIndex])
    }
  }

  const handleSelectItem = async (item) => {
    setSelectedItem(item)
    setSearch(item.name)
    setSuggestions([])
    setLinkSuccess(false)
    setDatasetPath("")
    setError(null)
    
    try {
      const res = await axios.get(`${API_BASE}/v1/api/prediction/item-dataset/${item.id}`)
      if (res.data.success && res.data.data) {
        setDatasetPath(res.data.data.dataset_path)
      }
    } catch (e) {
      // no existing dataset, that's fine
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadFile(file)
    setIsUploading(true)
    setError(null)
    setLinkSuccess(false)
    
    const formData = new FormData()
    formData.append("file", file)
    
    try {
      const res = await axios.post(`${API_BASE}/v1/api/prediction/upload-dataset`, formData)
      if (res.data.success) {
        setDatasetPath(res.data.dataset_path)
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const handleAssociateDataset = async () => {
    if (!selectedItem || !datasetPath) {
      setError("Please select an item and upload/enter a dataset path first.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      await axios.post(`${API_BASE}/v1/api/prediction/associate-dataset`, {
        item_id: selectedItem.id,
        dataset_name: selectedItem.name + " Dataset",
        dataset_path: datasetPath
      })
      setLinkSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Association failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SectionHeader
        title="Upload Dataset"
        description="Link a CSV dataset to an inventory item to enable AI-powered sales demand forecasting."
      />

      <Card className="shadow-sm border-t-4 border-t-theme-500 mb-6 max-w-4xl mx-auto mt-6">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <UploadCloud className="h-5 w-5 text-theme-600" />
            Dataset Association
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" /> 1. Select Target Item
                </Label>
                <ItemSearchBar
                  search={search}
                  suggestions={suggestions}
                  activeIndex={activeIndex}
                  isSearching={isSearching}
                  onSearchChange={setSearch}
                  onKeyDown={handleSearchKeyDown}
                  onSelect={handleSelectItem}
                />
                {selectedItem && (
                  <div className="text-xs text-theme-600 font-medium flex items-center gap-1 mt-2 bg-theme-50 p-2 rounded-md border border-theme-100">
                     <CheckCircle2 className="w-4 h-4"/> Selected: {selectedItem.name}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5" /> 2. Upload CSV Dataset
                </Label>
                <div className="relative border-2 border-dashed border-theme-200 rounded-lg p-6 bg-theme-50/50 text-center hover:bg-theme-50 transition-colors">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 text-theme-500 animate-spin mb-2" />
                    ) : (
                      <UploadCloud className="h-8 w-8 text-theme-400 mb-2" />
                    )}
                    <p className="text-sm font-medium text-theme-700">Drag & drop your CSV file here</p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 flex flex-col justify-end bg-muted/20 p-6 rounded-lg border border-border">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" /> Dataset Path Details
                </Label>
                <Input
                  value={datasetPath}
                  onChange={(e) => setDatasetPath(e.target.value)}
                  placeholder="Auto-filled on upload..."
                  className="h-11 bg-white"
                  readOnly
                />
                <p className="text-xs text-muted-foreground">This path will be associated with the selected item in the database.</p>
              </div>

              <Button 
                onClick={handleAssociateDataset}
                disabled={!selectedItem || !datasetPath || loading}
                variant={linkSuccess ? "outline" : "default"}
                size="lg"
                className={`w-full h-12 text-sm font-semibold shadow-sm transition-all ${
                  linkSuccess 
                    ? 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100' 
                    : 'bg-theme-600 hover:bg-theme-700 text-white'
                }`}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : linkSuccess ? (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" /> Dataset Linked Successfully
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-5 w-5" /> Link Dataset to Item
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
