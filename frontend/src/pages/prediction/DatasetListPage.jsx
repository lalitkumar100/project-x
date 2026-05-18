import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import SectionHeader from "@/components/SectionHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Loader2,
  FileSpreadsheet,
  BrainCircuit,
  Search,
  AlertCircle
} from "lucide-react"

const API_BASE = (import.meta.env.VITE_BACKEND_URL || "http://localhost:6000")

export default function DatasetListPage() {
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDatasets()
  }, [])

  const fetchDatasets = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/v1/api/prediction/datasets`)
      if (res.data.success) {
        setDatasets(res.data.data)
      }
    } catch (err) {
      setError(err.message || "Failed to fetch datasets")
    } finally {
      setLoading(false)
    }
  }

  const handlePredict = (dataset) => {
    navigate("/prediction", {
      state: {
        itemId: dataset.item_id,
        itemName: dataset.item_name,
        datasetPath: dataset.dataset_path
      }
    })
  }

  return (
    <>
      <SectionHeader
        title="Dataset Registry"
        description="Manage your uploaded forecasting datasets and execute prediction models."
      />

      <div className="flex justify-end mb-4">
        <Button 
          onClick={() => navigate("/prediction/upload")} 
          className="bg-theme-600 hover:bg-theme-700 text-white shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" /> Upload New Dataset
        </Button>
      </div>

      <Card className="shadow-sm border-t-4 border-t-theme-500">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2 text-theme-500" /> Loading datasets...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-12 text-destructive">
              <AlertCircle className="w-5 h-5 mr-2" /> {error}
            </div>
          ) : datasets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-muted-foreground bg-muted/20">
              <FileSpreadsheet className="w-12 h-12 mb-4 text-theme-300" />
              <p className="text-lg font-medium text-foreground">No datasets found</p>
              <p className="text-sm mt-1 mb-6 text-center max-w-md">You haven't linked any inventory items to a dataset yet. Upload a CSV file to get started with forecasting.</p>
              <Button onClick={() => navigate("/prediction/upload")} variant="outline" className="border-theme-200 text-theme-700 hover:bg-theme-50">
                Go to Upload Page
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-theme-50/50">
                <TableRow>
                  <TableHead className="w-[30%] font-semibold text-theme-800">Target Item</TableHead>
                  <TableHead className="w-[40%] font-semibold text-theme-800">Dataset Path</TableHead>
                  <TableHead className="font-semibold text-theme-800">Uploaded On</TableHead>
                  <TableHead className="text-right font-semibold text-theme-800">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((ds) => (
                  <TableRow key={ds.dataset_id} className="hover:bg-theme-50/30 transition-colors">
                    <TableCell>
                      <div className="font-medium text-foreground">{ds.item_name}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] bg-white">ID: {ds.item_id}</Badge>
                        <span>Stock: {ds.quantity}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-mono bg-muted p-1.5 rounded text-muted-foreground truncate max-w-[300px]" title={ds.dataset_path}>
                        {ds.dataset_path}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(ds.uploaded_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handlePredict(ds)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                      >
                        <BrainCircuit className="w-3.5 h-3.5 mr-1.5" /> Predict
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}
