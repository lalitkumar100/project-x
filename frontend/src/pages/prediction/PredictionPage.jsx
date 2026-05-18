import React, { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import SectionHeader from "@/components/SectionHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  BrainCircuit,
  CalendarDays,
  FolderOpen,
  Loader2,
  TrendingUp,
  Package,
  ShieldAlert,
  BarChart3,
  AlertCircle,
  ChevronRight,
  Activity,
  ShoppingCart,
  Layers,
  ArrowUpRight,
  Database,
  ArrowLeft,
} from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts"

const API_BASE =
  (import.meta.env.VITE_BACKEND_URL || "http://localhost:6000") 

/* ─── Season color helper ───────────────────────────────── */
const seasonColors = {
  summer: { fill: "#f59e0b", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  monsoon: { fill: "#3b82f6", bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  autumn: { fill: "#f97316", bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  winter: { fill: "#8b5cf6", bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-300" },
  spring: { fill: "#10b981", bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300" },
}

const getSeasonStyle = (s) => seasonColors[s] || seasonColors.summer

/* ─── Custom bar shape with season colors ───────────────── */
const SeasonBar = (props) => {
  const { x, y, width, height, payload } = props
  const color = getSeasonStyle(payload?.season).fill
  return (
    <rect x={x} y={y} width={width} height={height} rx={4} ry={4} fill={color} opacity={0.85} />
  )
}

/* ─── Custom tooltip for bar chart ──────────────────────── */
const PredictionTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-theme-200 rounded-xl p-3 shadow-xl min-w-[180px]">
      <p className="text-xs font-medium text-muted-foreground mb-1">{d.week_date}</p>
      <p className="text-lg font-bold text-theme-900">{d.predicted_sales} units</p>
      <div className="flex items-center gap-2 mt-1.5">
        <Badge className={`text-[10px] ${getSeasonStyle(d.season).bg} ${getSeasonStyle(d.season).text} border ${getSeasonStyle(d.season).border}`}>
          {d.season}
        </Badge>
        {d.event !== "none" && (
          <Badge variant="outline" className="text-[10px] border-pink-300 text-pink-600 bg-pink-50">
            🎉 {d.event}
          </Badge>
        )}
      </div>
    </div>
  )
}

/* ─── Custom tooltip for line chart ─────────────────────── */
const HistoryTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-theme-200 rounded-xl p-3 shadow-xl min-w-[180px]">
      <p className="text-xs font-medium text-muted-foreground mb-1">{d.week_date}</p>
      <p className="text-lg font-bold text-theme-900">{d.units_sold} units sold</p>
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <Badge className={`text-[10px] ${getSeasonStyle(d.season).bg} ${getSeasonStyle(d.season).text}`}>
          {d.season}
        </Badge>
        <span className="text-[10px] text-muted-foreground">{d.avg_temp}°C</span>
        {d.event_name !== "none" && (
          <Badge variant="outline" className="text-[10px] border-pink-300 text-pink-600 bg-pink-50">
            {d.event_name}
          </Badge>
        )}
      </div>
    </div>
  )
}

/* ─── Stat card ─────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, color = "text-theme-600", bgColor = "bg-theme-50" }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={`${bgColor} rounded-lg p-2.5`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent ${bgColor}`} />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════ */
export default function PredictionPage() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const { itemId, itemName, datasetPath: stateDatasetPath } = location.state || {}

  const [datasetPath, setDatasetPath] = useState(stateDatasetPath || "")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Prediction result
  const [result, setResult] = useState(null)

  // Historical CSV data
  const [historyData, setHistoryData] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // If no dataset is provided in state, we can prompt the user or let them enter manually,
  // but ideally they should be redirected back.
  useEffect(() => {
    if (!stateDatasetPath) {
      // Could redirect, but for flexibility we just leave it empty.
      // navigate("/prediction/datasets")
    }
  }, [stateDatasetPath, navigate])

  /* ── Run prediction ─────────────────────────── */
  const handlePredict = async () => {
    if (!datasetPath.trim() || !startDate || !endDate) {
      setError("Please fill in all fields: Dataset Path, From Date, To Date")
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError("From Date must be before To Date")
      return
    }

    setError(null)
    setLoading(true)
    setResult(null)

    try {
      // 1. Predict
      const predRes = await axios.post(`${API_BASE}/v1/api/prediction/demand`, {
        dataset_path: datasetPath.trim(),
        start_date: startDate,
        end_date: endDate,
        item_id: itemId || undefined,
      })
      setResult(predRes.data)

      // 2. Load historical CSV
      setHistoryLoading(true)
      try {
        const histRes = await axios.post(`${API_BASE}/v1/api/prediction/dataset`, {
          dataset_path: datasetPath.trim(),
        })
        setHistoryData(histRes.data?.data || [])
      } catch {
        setHistoryData([])
      } finally {
        setHistoryLoading(false)
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Prediction failed")
    } finally {
      setLoading(false)
    }
  }

  const summary = result?.order_summary

  return (
    <>
      <SectionHeader
        title="Demand Prediction"
        description="Use AI-powered analytics to forecast future product demand and plan your inventory orders."
      />

      {/* ── INPUT FORM ──────────────────────────────────── */}
      <Card className="shadow-sm border-t-4 border-t-theme-500 mb-6">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <BrainCircuit className="h-5 w-5 text-theme-600" />
            Prediction Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {/* ── PREDICTION CONTEXT ── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-theme-100">
            <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg border border-border flex-1">
              <div className="bg-theme-100 p-2.5 rounded-md">
                <Database className="w-5 h-5 text-theme-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Active Dataset</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">{itemName || "Manual Path"}</span>
                  <Badge variant="outline" className="text-[10px] bg-white font-mono truncate max-w-[200px] sm:max-w-xs" title={datasetPath}>
                    {datasetPath || "No path selected"}
                  </Badge>
                </div>
              </div>
            </div>
            
            <Button variant="outline" onClick={() => navigate("/prediction/datasets")} className="shrink-0 text-theme-700">
              <ArrowLeft className="w-4 h-4 mr-2" /> Change Dataset
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {!stateDatasetPath && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="dataset_path" className="text-xs font-semibold uppercase text-muted-foreground">
                  Manual Dataset Path
                </Label>
                <Input
                  id="dataset_path"
                  value={datasetPath}
                  onChange={(e) => setDatasetPath(e.target.value)}
                  placeholder="e.g. dataset/file.csv"
                  className="h-10"
                />
              </div>
            )}
            {/* From Date */}
            <div className="space-y-2">
              <Label
                htmlFor="start_date"
                className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5"
              >
                <CalendarDays className="w-3.5 h-3.5" /> From Date
              </Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10"
              />
            </div>

            {/* To Date */}
            <div className="space-y-2">
              <Label
                htmlFor="end_date"
                className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5"
              >
                <CalendarDays className="w-3.5 h-3.5" /> To Date
              </Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          {/* Submit button */}
          <div className="mt-5 flex items-center gap-3">
            <Button
              onClick={handlePredict}
              disabled={loading}
              className="h-11 px-8 text-sm font-semibold shadow-md bg-theme-600 hover:bg-theme-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  Run Prediction
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive" className="flex-1 py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-sm">Error</AlertTitle>
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── RESULTS ─────────────────────────────────────── */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* ── ORDER SUMMARY STATS ─────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={TrendingUp}
              label="Total Predicted Demand"
              value={`${summary?.total_predicted_demand?.toLocaleString()} units`}
              sub={`Over ${summary?.period_weeks} weeks`}
              color="text-theme-700"
              bgColor="bg-theme-100"
            />
            <StatCard
              icon={Activity}
              label="Avg Weekly Demand"
              value={`${summary?.avg_weekly_demand?.toLocaleString()} units`}
              sub="Per week average"
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              icon={ShoppingCart}
              label="Recommended Order Qty"
              value={`${summary?.recommended_order_quantity?.toLocaleString()} units`}
              sub={`+${summary?.safety_buffer_percent}% safety buffer`}
              color="text-emerald-600"
              bgColor="bg-emerald-50"
            />
            <StatCard
              icon={ShieldAlert}
              label="Safety Buffer"
              value={`${summary?.safety_buffer_units?.toLocaleString()} units`}
              sub={`${summary?.safety_buffer_percent}% of demand`}
              color="text-amber-600"
              bgColor="bg-amber-50"
            />
          </div>

          {/* ── MODEL INFO BAR ──────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3 px-1">
            <Badge variant="outline" className="bg-white border-theme-300 text-theme-700 gap-1.5 py-1 px-3">
              <Layers className="h-3 w-3" /> Model MAE: {result.model_mae}
            </Badge>
            <Badge variant="outline" className="bg-white border-theme-300 text-theme-700 gap-1.5 py-1 px-3">
              <BarChart3 className="h-3 w-3" /> {result.total_predictions} Predictions
            </Badge>
            <Badge variant="outline" className="bg-white border-emerald-300 text-emerald-700 gap-1.5 py-1 px-3">
              <ArrowUpRight className="h-3 w-3" /> Order: {summary?.recommended_order_quantity?.toLocaleString()} units
            </Badge>
          </div>

          {/* ── PREDICTED SALES BAR CHART ───────────────── */}
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-5 border-b bg-gradient-to-r from-white to-theme-50/30">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-theme-600" />
                Predicted Weekly Sales
                <Badge variant="secondary" className="ml-auto text-[10px] bg-theme-100 text-theme-700">
                  Forecast
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.predictions} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="week_date"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tickLine={false}
                      axisLine={{ stroke: "#d1d5db" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={false}
                      label={{
                        value: "Predicted Sales",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 12, fill: "#9ca3af" },
                      }}
                    />
                    <Tooltip content={<PredictionTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    {summary && (
                      <ReferenceLine
                        y={summary.avg_weekly_demand}
                        stroke="#14b8a6"
                        strokeDasharray="6 4"
                        strokeWidth={2}
                        label={{
                          value: `Avg: ${summary.avg_weekly_demand}`,
                          position: "right",
                          style: { fontSize: 11, fill: "#14b8a6", fontWeight: 600 },
                        }}
                      />
                    )}
                    <Bar
                      dataKey="predicted_sales"
                      shape={<SeasonBar />}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={42}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* ── Season Legend ────────── */}
              <div className="flex flex-wrap items-center gap-3 mt-3 px-1">
                {Object.entries(seasonColors).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="inline-block h-3 w-3 rounded-sm" style={{ background: val.fill }} />
                    <span className="capitalize">{key}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── PREDICTION TABLE ────────────────────────── */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5 border-b bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-theme-600" />
                Weekly Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="bg-theme-50/60 sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Week Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Season</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Event</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Window</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Predicted Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.predictions.map((p, i) => {
                      const sc = getSeasonStyle(p.season)
                      return (
                        <tr key={i} className="border-t border-theme-100 hover:bg-theme-50/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">{p.week_date}</td>
                          <td className="px-4 py-3">
                            <Badge className={`text-[10px] px-2 ${sc.bg} ${sc.text} border ${sc.border}`}>{p.season}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {p.event !== "none" ? (
                              <Badge variant="outline" className="text-[10px] border-pink-300 text-pink-600 bg-pink-50">
                                🎉 {p.event}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground capitalize">
                            {p.event_window !== "none" ? p.event_window : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-theme-700">{p.predicted_sales}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ── HISTORICAL DATA LINE CHART ──────────────── */}
          {historyLoading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading historical data…
            </div>
          )}

          {historyData.length > 0 && (
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-5 border-b bg-gradient-to-r from-white to-theme-50/30">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-theme-600" />
                  Historical Sales Data
                  <Badge variant="secondary" className="ml-auto text-[10px] bg-blue-50 text-blue-700">
                    {historyData.length} Weeks
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[360px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis
                        dataKey="week_date"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tickLine={false}
                        axisLine={{ stroke: "#d1d5db" }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        tickLine={false}
                        axisLine={false}
                        label={{
                          value: "Units Sold",
                          angle: -90,
                          position: "insideLeft",
                          style: { fontSize: 12, fill: "#9ca3af" },
                        }}
                      />
                      <Tooltip content={<HistoryTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="units_sold"
                        stroke="#14b8a6"
                        strokeWidth={2.5}
                        fill="url(#salesGradient)"
                        dot={{ fill: "#14b8a6", strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2.5, fill: "#14b8a6" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  )
}
