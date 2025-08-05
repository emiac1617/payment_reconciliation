"use client"

import React, { useState, useEffect, useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import { supabase, DatabaseService } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Search,
  RefreshCw,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  LogOut,
  ReceiptText,
  Download,
  Database,
  Edit,
  Save,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type { Session } from "@supabase/supabase-js"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuthApiError } from "@supabase/supabase-js"
import { exportToCsv } from "@/lib/csv-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ReconciliationDetailDialog } from "@/components/reconciliation-detail-dialog"

interface DashboardStats {
  totalOrders: number
  totalReceivedAmount: number
  matchPendingOrders: number
  discrepancies: number
  matchedOrders: number
  orphanedOrders: number
  totalOrderAmount: number
}

interface Order {
  id: string
  order_id: string
  order_number: string
  final_amount: number
  prepaid_amount: number
  cod_amount: number
  shipping_amount: number
  state: string
  payment_method: string
  payment_source: string
  shipping_partner: string
  order_date: string
  shipped_date: string
  product_name: string
  quantity: number
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  "Shipping Amount"?: number
  adjusted_amount?: number
  remark?: string
}

interface PaymentTableData {
  razorpay: any[]
  gokwik: any[]
  shiprocket: any[]
  nimbus: any[]
  bluedart: any[]
  delhivery: any[]
  snapmint: any[]
  shipway: any[]
}

interface ReconciliationRecord {
  order_id: string
  order_number: string
  shipping_date: string
  order_amount: number
  payment_amount: number
  original_payment_amount: number
  status: "matched" | "discrepancy" | "match_pending" | "orphaned_order"
  difference: number
  payment_sources: string[]
  adjusted_amount?: number
  remark?: string
}

// Memoized table row component to prevent unnecessary re-renders
const ReconciliationTableRow = memo(({ 
  record, 
  editingRecord, 
  editValues, 
  isSaving, 
  reconciliationColumnsExist,
  handleReconciliationRowClick,
  handleEditStart,
  handleEditSave,
  handleEditCancel,
  setEditValues,
  formatDateForDisplay,
  getStatusBadge,
  originalAdjustedAmount
}: {
  record: ReconciliationRecord
  editingRecord: string | null
  editValues: { adjusted_amount: string; remark: string }
  isSaving: boolean
  reconciliationColumnsExist: boolean
  handleReconciliationRowClick: (record: ReconciliationRecord) => void
  handleEditStart: (record: ReconciliationRecord) => void
  handleEditSave: (orderId: string) => void
  handleEditCancel: () => void
  setEditValues: React.Dispatch<React.SetStateAction<{ adjusted_amount: string; remark: string }>>
  formatDateForDisplay: (dateString: string | null | undefined) => string
  getStatusBadge: (status: string) => React.JSX.Element
  originalAdjustedAmount: number
}) => {
  const isEditing = editingRecord === record.order_id
  
  // Helper function to check if remark is required
  const isRemarkRequired = () => {
    const currentAdjustedAmount = Number.parseFloat(editValues.adjusted_amount) || 0
    return currentAdjustedAmount !== originalAdjustedAmount
  }
  
  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="w-[140px] font-medium">
        <div className="truncate" title={record.order_number || "N/A"}>
          {record.order_number || "N/A"}
        </div>
      </TableCell>
      <TableCell className="w-[120px] text-right">
        ₹{record.order_amount.toFixed(2)}
      </TableCell>
      <TableCell className="w-[120px] text-right">
        <div>
          <div>₹{record.payment_amount.toFixed(2)}</div>
          {(record.adjusted_amount || 0) > 0 && (
            <div className="text-xs text-gray-500">
              (₹{record.original_payment_amount.toFixed(2)} - ₹
              {(record.adjusted_amount || 0).toFixed(2)})
            </div>
          )}
        </div>
      </TableCell>
      <TableCell
        className={`w-[100px] text-right ${
          record.difference !== 0 ? "text-red-600" : "text-green-600"
        }`}
      >
        ₹{record.difference.toFixed(2)}
      </TableCell>
      <TableCell className="w-[130px] text-right">
        {isEditing ? (
          <Input
            type="number"
            step="0.01"
            value={editValues.adjusted_amount}
            onChange={(e) =>
              setEditValues((prev) => ({ ...prev, adjusted_amount: e.target.value }))
            }
            className="w-full h-8 text-right"
            placeholder="0.00"
            disabled={isSaving}
          />
        ) : (
          <span>₹{(record.adjusted_amount || 0).toFixed(2)}</span>
        )}
      </TableCell>
      <TableCell className="w-[180px]">
        {isEditing ? (
          <div className="relative">
            <Input
              value={editValues.remark}
              onChange={(e) => setEditValues((prev) => ({ ...prev, remark: e.target.value }))}
              className={`w-full h-8 ${
                isRemarkRequired() && (!editValues.remark || editValues.remark.trim() === "")
                  ? "border-red-500 focus:border-red-500"
                  : ""
              }`}
              placeholder={isRemarkRequired() ? "Remark required for adjustment..." : "Add remark..."}
              disabled={isSaving}
            />
            {isRemarkRequired() && (
              <span className="text-red-500 text-xs mt-1 block">* Required when adjusting amount</span>
            )}
          </div>
        ) : (
          <div className="truncate text-sm" title={record.remark || ""}>
            {record.remark || "-"}
          </div>
        )}
      </TableCell>
      <TableCell className="w-[140px]">
        <div className="flex flex-wrap gap-1">
          {record.payment_sources.map((source, index) => (
            <Badge key={`${record.order_id}-${source}-${index}`} variant="outline" className="text-xs">
              {source}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="w-[110px]">
        <div className="text-sm">{formatDateForDisplay(record.shipping_date)}</div>
      </TableCell>
      <TableCell className="w-[120px]">
        {getStatusBadge(record.status)}
      </TableCell>
      <TableCell className="w-[100px] text-center">
        {isEditing ? (
          <div className="flex gap-1 justify-center">
            <Button
              size="sm"
              onClick={() => handleEditSave(record.order_id)}
              className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
              disabled={isSaving}
            >
              <Save className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleEditCancel}
              className="h-8 w-8 p-0 bg-transparent"
              disabled={isSaving}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-1 justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReconciliationRowClick(record)}
              className="h-8 w-8 p-0"
              title="View Details"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEditStart(record)}
              className="h-8 w-8 p-0"
              disabled={!reconciliationColumnsExist}
              title="Edit"
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  )
})

ReconciliationTableRow.displayName = 'ReconciliationTableRow'

// Pagination component
const PaginationControls = memo(({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange,
  label = "items"
}: {
  currentPage: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  label?: string
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-2 py-3 border-t">
      <div className="text-sm text-muted-foreground">
        Showing {startItem}-{endItem} of {totalItems} {label}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }
            
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            )
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})

PaginationControls.displayName = 'PaginationControls'

export default function PaymentReconciliationDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalReceivedAmount: 0,
    matchPendingOrders: 0,
    discrepancies: 0,
    matchedOrders: 0,
    orphanedOrders: 0,
    totalOrderAmount: 0,
  })

  const [orders, setOrders] = useState<Order[]>([])
  const [paymentTables, setPaymentTables] = useState<PaymentTableData>({
    razorpay: [],
    gokwik: [],
    shiprocket: [],
    nimbus: [],
    bluedart: [],
    delhivery: [],
    snapmint: [],
    shipway: [],
  })
  const [reconciliation, setReconciliation] = useState<ReconciliationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterShippingDateType, setFilterShippingDateType] = useState<
    "all" | "current_month" | "last_month" | "last_quarter" | "custom_range"
  >("current_month")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [filterPaymentSource, setFilterPaymentSource] = useState("all")
  const [uniquePaymentSources, setUniquePaymentSources] = useState<string[]>([])
  const [activePaymentTab, setActivePaymentTab] = useState("razorpay")
  const [activeMainTab, setActiveMainTab] = useState("reconciliation")
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)

  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedReconciliationRecord, setSelectedReconciliationRecord] = useState<ReconciliationRecord | null>(null)
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | undefined>(undefined)
  const [selectedPayments, setSelectedPayments] = useState<any[]>([])
  const [selectedShipping, setSelectedShipping] = useState<any[]>([])

  const [editingRecord, setEditingRecord] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{
    adjusted_amount: string
    remark: string
  }>({
    adjusted_amount: "",
    remark: "",
  })
  const [originalAdjustedAmount, setOriginalAdjustedAmount] = useState<number>(0)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [reconciliationColumnsExist, setReconciliationColumnsExist] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  // Pagination states
  const [reconciliationPage, setReconciliationPage] = useState(1)
  const [ordersPage, setOrdersPage] = useState(1)
  const [paymentTabPages, setPaymentTabPages] = useState<{[key: string]: number}>({
    razorpay: 1,
    gokwik: 1,
    snapmint: 1,
    shiprocket: 1,
    nimbus: 1,
    bluedart: 1,
    delhivery: 1,
    shipway: 1
  })
  const itemsPerPage = 50

  // Performance optimization: Create indexed maps for faster lookups
  const [paymentIndexMap, setPaymentIndexMap] = useState<Map<string, any[]>>(new Map())
  const [shippingIndexMap, setShippingIndexMap] = useState<Map<string, any[]>>(new Map())
  const [ordersIndexMap, setOrdersIndexMap] = useState<Map<string, Order>>(new Map())

  const formatDateForDisplay = (dateString: string | null | undefined): string => {
    if (!dateString || dateString.trim() === "" || dateString === "N/A") {
      return "N/A"
    }
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "N/A"
      }
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (e) {
      console.error("Error parsing date for display:", dateString, e)
      return "N/A"
    }
  }

  const getDateRange = (type: string, customStart?: string, customEnd?: string) => {
    const now = new Date()
    let start: Date | null = null
    let end: Date | null = null

    switch (type) {
      case "current_month":
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case "last_month":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case "last_quarter":
        const currentMonth = now.getMonth()
        let quarterStartMonth
        if (currentMonth >= 0 && currentMonth <= 2) {
          quarterStartMonth = 9
          start = new Date(now.getFullYear() - 1, quarterStartMonth, 1)
          end = new Date(now.getFullYear() - 1, quarterStartMonth + 3, 0)
        } else if (currentMonth >= 3 && currentMonth <= 5) {
          quarterStartMonth = 0
          start = new Date(now.getFullYear(), quarterStartMonth, 1)
          end = new Date(now.getFullYear(), quarterStartMonth + 3, 0)
        } else {
          quarterStartMonth = 6
          start = new Date(now.getFullYear(), quarterStartMonth, 1)
          end = new Date(now.getFullYear(), quarterStartMonth + 3, 0)
        }
        break
      case "custom_range":
        if (customStart) start = new Date(customStart)
        if (customEnd) end = new Date(customEnd)
        break
      case "all":
      default:
        return { start: null, end: null }
    }

    if (start && isNaN(start.getTime())) start = null
    if (end && isNaN(end.getTime())) end = null

    return { start, end }
  }

  // Performance optimization: Build indexed maps for faster lookups
  const buildIndexedMaps = (paymentTablesData: PaymentTableData, ordersData: Order[]) => {
    const paymentMap = new Map<string, any[]>()
    const shippingMap = new Map<string, any[]>()
    const ordersMap = new Map<string, Order>()

    // Build orders index map
    ordersData.forEach((order) => {
      ordersMap.set(order.order_id, order)
    })

    Object.entries(paymentTablesData).forEach(([tableName, tableData]) => {
      tableData.forEach((item: any) => {
        const orderId = item.order_id || item.order_number
        if (orderId) {
          if (["razorpay", "gokwik", "snapmint"].includes(tableName)) {
            const existing = paymentMap.get(orderId) || []
            existing.push({ ...item, gateway: tableName })
            paymentMap.set(orderId, existing)
          } else if (["shiprocket", "nimbus", "bluedart", "delhivery"].includes(tableName)) {
            const existing = shippingMap.get(orderId) || []
            existing.push({ ...item, partner: tableName })
            shippingMap.set(orderId, existing)
          }
        }
      })
    })

    setPaymentIndexMap(paymentMap)
    setShippingIndexMap(shippingMap)
    setOrdersIndexMap(ordersMap)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      console.log("Loading dashboard data...")

      // Check if reconciliation columns exist in orders table
      const columnsExist = await DatabaseService.ensureReconciliationColumns()
      setReconciliationColumnsExist(columnsExist)

      if (!columnsExist) {
        console.warn("⚠️ Reconciliation columns (adjusted_amount, remark) do not exist in orders table")
      }

      const [ordersData, paymentTablesData] = await Promise.all([
        DatabaseService.getOrders(),
        DatabaseService.getAllPaymentTables(),
      ])

      console.log("Data loaded:", {
        orders: ordersData.length,
        paymentTables: Object.entries(paymentTablesData).map(([key, value]) => `${key}: ${value.length}`),
        reconciliationColumnsExist: columnsExist,
      })

      const enrichedOrders = ordersData.map((order) => {
        let shippingPartner = order["Shipping Partner"] || "N/A"
        let shippedDate = order.shipped_date || "N/A"

        const shippingTableNames = ["shiprocket", "nimbus", "bluedart", "delhivery"] as const

        for (const tableName of shippingTableNames) {
          const records = paymentTablesData[tableName].filter((s: any) => s.order_id === order.order_id)
          if (records.length > 0) {
            const record = records[0]

            shippingPartner = tableName

            if (tableName === "shiprocket" && record.courier) {
              shippingPartner = record.courier
            } else if (["nimbus", "bluedart", "delhivery"].includes(tableName) && record.carrier) {
              shippingPartner = record.carrier
            }

            if (record.delivered_date) {
              shippedDate = record.delivered_date
            } else if (record.created_at) {
              shippedDate = record.created_at
            } else if (record.pick_up_date) {
              shippedDate = record.pick_up_date
            } else if (record.pickup_date) {
              shippedDate = record.pickup_date
            }
            break
          }
        }

        return {
          ...order,
          shipping_partner: shippingPartner,
          shipped_date: shippedDate,
        }
      })

      setOrders(enrichedOrders)
      setPaymentTables(paymentTablesData)
      
      // Build indexed maps for performance optimization
      buildIndexedMaps(paymentTablesData, enrichedOrders)

      const reconciliationData = calculateReconciliation(enrichedOrders, paymentTablesData)
      setReconciliation(reconciliationData)

      console.log("✅ Data loading completed successfully")
    } catch (error) {
      console.error("Error loading data:", error)
      setOrders([])
      setPaymentTables({
        razorpay: [],
        gokwik: [],
        shiprocket: [],
        nimbus: [],
        bluedart: [],
        delhivery: [],
        snapmint: [],
        shipway: [],
      })
      setReconciliation([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkUserAndLoadData = async () => {
      setLoading(true)
      let currentSession: Session | null = null
      try {
        const {
          data: { session: fetchedSession },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          if (error instanceof AuthApiError && error.message === "Invalid Refresh Token: Refresh Token Not Found") {
            console.error("AuthApiError: Invalid Refresh Token. Forcing logout and redirect.")
            await supabase.auth.signOut()
            router.push("/login")
            return
          }
          console.error("Error fetching session:", error)
        }
        currentSession = fetchedSession
      } catch (e) {
        console.error("Unexpected error during session check:", e)
      }

      setSession(currentSession)

      if (!currentSession) {
        router.push("/login")
      } else {
        loadData()
      }
    }
    checkUserAndLoadData()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) {
        router.push("/login")
      }
      // Removed automatic loadData() call to prevent reload on tab focus
    })

    return () => {
      authListener.subscription?.unsubscribe()
    }
  }, [router])

  const calculateReconciliation = (orders: Order[], paymentTables: PaymentTableData): ReconciliationRecord[] => {
    console.log("Starting reconciliation calculation...")

    const paymentMap = new Map<string, { total: number; sources: string[] }>()

    Object.entries(paymentTables).forEach(([tableName, tableData]) => {
      console.log(`Processing ${tableName} with ${tableData.length} records`)

      tableData.forEach((record: any) => {
        const orderId = record.order_id
        if (!orderId) return

        let amount = 0

        switch (tableName) {
          case "razorpay":
            amount = Number(record.amount) || 0
            break
          case "gokwik":
            amount = Number(record.Amount) || 0
            break
          case "shiprocket":
            amount = Number(record.amount) || 0
            break
          case "nimbus":
            amount = Number(record.amount) || 0
            break
          case "bluedart":
            amount = Number(record.amount) || 0
            break
          case "delhivery":
            amount = Number(record.cod_amount) || 0
            break
          case "snapmint":
            amount = Number(record["Order Value"]) || 0
            break
          case "shipway":
            amount = Number(record["Order Value"]) || 0
            break
          default:
            amount = Number(record.amount) || 0
        }

        if (amount > 0) {
          const existing = paymentMap.get(orderId) || { total: 0, sources: [] }
          paymentMap.set(orderId, {
            total: existing.total + amount,
            sources: [...existing.sources, tableName],
          })
        }
      })
    })

    console.log(`Payment map created with ${paymentMap.size} unique order IDs`)

    const reconciliationRecords: ReconciliationRecord[] = orders.map((order) => {
      // Use "Shipping Amount" for order amount
      const orderAmount = Number(order["Shipping Amount"]) || 0
      const paymentData = paymentMap.get(order.order_id) || { total: 0, sources: [] }
      const originalPaymentAmount = paymentData.total
      const adjustedAmount = Number(order.adjusted_amount) || 0

      // BIDIRECTIONAL LOGIC: Add or subtract adjusted amount based on its sign
      let finalPaymentAmount = originalPaymentAmount
      if (adjustedAmount !== 0) {
        finalPaymentAmount = originalPaymentAmount + adjustedAmount
        console.log(
          `Order ${order.order_id}: Original payment: ${originalPaymentAmount}, Adjusted: ${adjustedAmount >= 0 ? '+' : ''}${adjustedAmount}, Final: ${finalPaymentAmount}`,
        )
      }

      const difference = orderAmount - finalPaymentAmount

      let status: "matched" | "discrepancy" | "match_pending" | "orphaned_order"

      if (finalPaymentAmount === 0) {
        status = "match_pending"
      } else if (orderAmount > finalPaymentAmount && difference > 1) {
        status = "discrepancy"
      } else if (orderAmount < finalPaymentAmount && Math.abs(difference) > 1) {
        status = "orphaned_order"
      } else {
        status = "matched"
      }

      return {
        order_id: order.order_id,
        order_number: order.order_number,
        shipping_date: order.shipped_date,
        order_amount: orderAmount,
        payment_amount: finalPaymentAmount, // This is the adjusted payment amount
        original_payment_amount: originalPaymentAmount, // Keep track of original for reference
        status,
        difference,
        payment_sources: paymentData.sources,
        adjusted_amount: adjustedAmount,
        remark: order.remark || "",
      }
    })

    console.log("Reconciliation completed:", {
      total: reconciliationRecords.length,
      matched: reconciliationRecords.filter((r) => r.status === "matched").length,
      discrepancies: reconciliationRecords.filter((r) => r.status === "discrepancy").length,
      matchPending: reconciliationRecords.filter((r) => r.status === "match_pending").length,
      orphaned: reconciliationRecords.filter((r) => r.status === "orphaned_order").length,
    })

    return reconciliationRecords
  }

  const calculateStats = (ordersToCount: Order[], reconciliationToCount: ReconciliationRecord[]): DashboardStats => {
    const totalOrders = ordersToCount.length
    const totalReceivedAmount = reconciliationToCount.reduce((sum, record) => sum + record.payment_amount, 0)
    const matchPendingOrders = reconciliationToCount.filter((r) => r.status === "match_pending").length
    const discrepancies = reconciliationToCount.filter((r) => r.status === "discrepancy").length
    const matchedOrders = reconciliationToCount.filter((r) => r.status === "matched").length
    const orphanedOrders = reconciliationToCount.filter((r) => r.status === "orphaned_order").length
    const totalOrderAmount = ordersToCount.reduce((sum, order) => sum + (Number(order["Shipping Amount"]) || 0), 0)

    return {
      totalOrders,
      totalReceivedAmount,
      matchPendingOrders,
      discrepancies,
      matchedOrders,
      orphanedOrders,
      totalOrderAmount,
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "matched":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Matched
          </Badge>
        )
      case "discrepancy":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Discrepancy
          </Badge>
        )
      case "match_pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <XCircle className="h-3 w-3 mr-1" />
            Match Pending
          </Badge>
        )
      case "orphaned_order":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Orphaned Order
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  useEffect(() => {
    // Performance optimization: Debounce payment sources calculation
    const timeoutId = setTimeout(() => {
      const sources = new Set<string>()
      reconciliation.forEach((record) => {
        record.payment_sources.forEach((source) => sources.add(source))
      })
      setUniquePaymentSources(Array.from(sources).sort())
    }, 50) // 50ms debounce

    return () => clearTimeout(timeoutId)
  }, [reconciliation])

  const filteredReconciliation = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return reconciliation.filter((record) => {
      const correspondingOrder = ordersIndexMap.get(record.order_id)

      const matchesSearchTerm =
        (record.order_id && record.order_id.toString().toLowerCase().includes(lowerCaseSearchTerm)) ||
        (record.order_number && record.order_number.toString().toLowerCase().includes(lowerCaseSearchTerm)) ||
        (correspondingOrder?.product_name &&
          correspondingOrder.product_name.toString().toLowerCase().includes(lowerCaseSearchTerm))

      const matchesStatus = filterStatus === "all" || record.status === filterStatus

      const { start: dateRangeStart, end: dateRangeEnd } = getDateRange(
        filterShippingDateType,
        customStartDate,
        customEndDate,
      )

      let matchesShippingDate = true
      if (dateRangeStart && dateRangeEnd && record.shipping_date && record.shipping_date !== "N/A") {
        const recordDate = new Date(record.shipping_date)
        recordDate.setHours(0, 0, 0, 0)
        dateRangeStart.setHours(0, 0, 0, 0)
        dateRangeEnd.setHours(0, 0, 0, 0)

        matchesShippingDate = recordDate >= dateRangeStart && recordDate <= dateRangeEnd
      } else if (filterShippingDateType !== "all" && (!record.shipping_date || record.shipping_date === "N/A")) {
        matchesShippingDate = false
      }

      const matchesPaymentSource = filterPaymentSource === "all" || record.payment_sources.includes(filterPaymentSource)

      return matchesSearchTerm && matchesStatus && matchesShippingDate && matchesPaymentSource
    })
  }, [
    reconciliation,
    ordersIndexMap,
    searchTerm,
    filterStatus,
    filterShippingDateType,
    customStartDate,
    customEndDate,
    filterPaymentSource,
  ])

  const filteredOrders = useMemo(() => {
    const reconciledOrderIds = new Set(filteredReconciliation.map((record) => record.order_id))
    return orders.filter((order) => reconciledOrderIds.has(order.order_id))
  }, [orders, filteredReconciliation])

  const filteredPaymentTables = useMemo(() => {
    const reconciledOrderIds = new Set(filteredReconciliation.map((record) => record.order_id))
    const newFilteredPaymentTables: PaymentTableData = {
      razorpay: [],
      gokwik: [],
      shiprocket: [],
      nimbus: [],
      bluedart: [],
      delhivery: [],
      snapmint: [],
      shipway: [],
    }

    Object.entries(paymentTables).forEach(([tableName, tableData]) => {
      newFilteredPaymentTables[tableName as keyof PaymentTableData] = tableData.filter((record: any) =>
        reconciledOrderIds.has(record.order_id || record.order_number),
      )
    })
    return newFilteredPaymentTables
  }, [paymentTables, filteredReconciliation])

  // Pagination utility functions
  const getPaginatedData = <T,>(data: T[], page: number, itemsPerPage: number) => {
    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (totalItems: number, itemsPerPage: number) => {
    return Math.ceil(totalItems / itemsPerPage)
  }

  // Paginated data calculations
  const paginatedReconciliation = useMemo(() => {
    return getPaginatedData(filteredReconciliation, reconciliationPage, itemsPerPage)
  }, [filteredReconciliation, reconciliationPage, itemsPerPage])

  const paginatedOrders = useMemo(() => {
    return getPaginatedData(filteredOrders, ordersPage, itemsPerPage)
  }, [filteredOrders, ordersPage, itemsPerPage])

  const paginatedPaymentTables = useMemo(() => {
    const result: PaymentTableData = {
      razorpay: [],
      gokwik: [],
      shiprocket: [],
      nimbus: [],
      bluedart: [],
      delhivery: [],
      snapmint: [],
      shipway: [],
    }

    Object.entries(filteredPaymentTables).forEach(([tableName, tableData]) => {
      const page = paymentTabPages[tableName] || 1
      result[tableName as keyof PaymentTableData] = getPaginatedData(tableData, page, itemsPerPage)
    })

    return result
  }, [filteredPaymentTables, paymentTabPages, itemsPerPage])

  // Reset pagination when filters change
  useEffect(() => {
    setReconciliationPage(1)
    setOrdersPage(1)
    setPaymentTabPages({
      razorpay: 1,
      gokwik: 1,
      snapmint: 1,
      shiprocket: 1,
      nimbus: 1,
      bluedart: 1,
      delhivery: 1,
      shipway: 1
    })
  }, [searchTerm, filterStatus, filterShippingDateType, customStartDate, customEndDate, filterPaymentSource])

  useEffect(() => {
    // Performance optimization: Debounce stats calculation to avoid blocking UI
    const timeoutId = setTimeout(() => {
      const newStats = calculateStats(filteredOrders, filteredReconciliation)

      setStats((prev) => {
        const hasChanged =
          prev.totalOrders !== newStats.totalOrders ||
          prev.totalReceivedAmount !== newStats.totalReceivedAmount ||
          prev.matchPendingOrders !== newStats.matchPendingOrders ||
          prev.discrepancies !== newStats.discrepancies ||
          prev.matchedOrders !== newStats.matchedOrders ||
          prev.orphanedOrders !== newStats.orphanedOrders ||
          prev.totalOrderAmount !== newStats.totalOrderAmount

        return hasChanged ? newStats : prev
      })
    }, 100) // 100ms debounce

    return () => clearTimeout(timeoutId)
  }, [filteredOrders, filteredReconciliation])

  const runReconciliation = async () => {
    setLoading(true)
    try {
      console.log("Running manual reconciliation...")
      await loadData()
      console.log("Manual reconciliation completed!")
    } catch (error) {
      console.error("Error in reconciliation process:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        if (error.message !== "Auth session missing!") {
          console.error("Error during Supabase signOut:", error.message)
        } else {
          console.log("Supabase signOut: No active session found, proceeding with redirect.")
        }
      } else {
        console.log("Supabase signOut successful.")
      }
    } catch (err) {
      console.error("Unexpected error in handleLogout:", err)
    } finally {
      router.push("/login")
      setLoading(false)
    }
  }

  const handleReconciliationRowClick = (record: ReconciliationRecord) => {
    setSelectedReconciliationRecord(record)
    const orderDetail = ordersIndexMap.get(record.order_id)
    setSelectedOrderDetail(orderDetail)

    // Performance optimization: Use indexed maps for O(1) lookup instead of O(n) iteration
    const paymentsForOrder = paymentIndexMap.get(record.order_id) || []
    const shippingForOrder = shippingIndexMap.get(record.order_id) || []

    setSelectedPayments(paymentsForOrder)
    setSelectedShipping(shippingForOrder)
    setIsDetailDialogOpen(true)
  }

  const handleEditStart = (record: ReconciliationRecord) => {
    console.log("Starting edit for record:", record.order_id)
    console.log("Reconciliation columns exist:", reconciliationColumnsExist)

    if (!reconciliationColumnsExist) {
      setSaveError(
        "Reconciliation columns do not exist in the orders table. Please run the SQL migration script first.",
      )
      return
    }

    setEditingRecord(record.order_id)
    setOriginalAdjustedAmount(record.adjusted_amount || 0)
    setEditValues({
      adjusted_amount: (record.adjusted_amount || 0).toString(),
      remark: record.remark || "",
    })
    setSaveError(null)
    console.log("Edit mode activated for:", record.order_id)
  }

  const handleEditCancel = () => {
    console.log("Canceling edit for:", editingRecord)
    setEditingRecord(null)
    setEditValues({
      adjusted_amount: "",
      remark: "",
    })
    setSaveError(null)
  }

  const handleEditSave = async (orderId: string) => {
    console.log("Saving edit for:", orderId, editValues)

    try {
      setSaveError(null)
      setIsSaving(true)

      if (!reconciliationColumnsExist) {
        throw new Error(
          "Reconciliation columns do not exist in the orders table. Please run the SQL migration script first.",
        )
      }

      const adjustedAmount = Number.parseFloat(editValues.adjusted_amount) || 0
      console.log("Parsed adjusted amount:", adjustedAmount)

      // Find the original record to compare adjusted amount
      const originalRecord = reconciliation.find(record => record.order_id === orderId)
      const originalAdjustedAmount = originalRecord?.adjusted_amount || 0

      // Validation: If adjusted amount has been changed, remark is required
      if (adjustedAmount !== originalAdjustedAmount && (!editValues.remark || editValues.remark.trim() === "")) {
        setSaveError("⚠️ Warning: Remark is required when adjusting the amount. Please add a remark before saving.")
        setIsSaving(false)
        return
      }

      // Update the order record and get the updated data back
      const updatedRecord = await DatabaseService.updateOrderReconciliation(orderId, adjustedAmount, editValues.remark)

      console.log("Database update successful:", updatedRecord)

      // Performance optimization: Batch state updates together
      setReconciliation((prev) =>
        prev.map((record) =>
          record.order_id === orderId
            ? {
                ...record,
                adjusted_amount: updatedRecord.adjusted_amount,
                remark: updatedRecord.remark,
              }
            : record,
        ),
      )

      // Reset editing state
      setEditingRecord(null)
      setEditValues({
        adjusted_amount: "",
        remark: "",
      })

      console.log("Edit saved successfully and local state updated")

      // Show success message
      console.log("✅ Record updated successfully in database")
      setSaveSuccess(`Record for order ${orderId} updated successfully!`)
      setTimeout(() => setSaveSuccess(null), 3000) // Clear after 3 seconds

      // Performance optimization: No need to recalculate entire reconciliation
      // The reconciliation state is already updated above with the new adjusted_amount
    } catch (error) {
      console.error("Error saving reconciliation record:", error)
      setSaveError(error instanceof Error ? error.message : "Failed to save record")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadCsv = () => {
    let dataToExport: any[] = []
    let filename = ""

    switch (activeMainTab) {
      case "reconciliation":
        dataToExport = filteredReconciliation.map((record) => ({
          "Order Number": record.order_number || "N/A",
          "Order Amount": record.order_amount.toFixed(2),
          "Received Amount": record.payment_amount.toFixed(2),
          "Original Payment Amount": record.original_payment_amount.toFixed(2),
          Difference: record.difference.toFixed(2),
          "Adjusted Amount": (record.adjusted_amount || 0).toFixed(2),
          Remark: record.remark || "",
          "Payment Sources": record.payment_sources.join(", "),
          "Shipping Date": formatDateForDisplay(record.shipping_date),
          Status: record.status,
        }))
        filename = "reconciliation_data.csv"
        break
      case "orders":
        dataToExport = filteredOrders.map((order) => ({
          "Order Number": order.order_number,
          Product: order.product_name || "N/A",
          Quantity: order.quantity || 0,
          "Final Amount": (order["Shipping Amount"] || 0).toFixed(2),
          "Payment Method": order.payment_method || "N/A",
          "Shipping Partner": order.shipping_partner || "N/A",
          State: order.state || "N/A",
          "Order Date": formatDateForDisplay(order.order_date),
          "Shipping Date": formatDateForDisplay(order.shipped_date),
          "Adjusted Amount": (order.adjusted_amount || 0).toFixed(2),
          Remark: order.remark || "",
        }))
        filename = "orders_data.csv"
        break
      case "payments":
        const currentPaymentTableData = filteredPaymentTables[activePaymentTab as keyof PaymentTableData]
        dataToExport = currentPaymentTableData.map((record) => {
          const baseRecord = {
            "Order ID": record.order_id || "N/A",
            Amount: (record.amount || record.Amount || record.cod_amount || record.shipping_charges || 0).toFixed(2),
            Date: formatDateForDisplay(
              record.createdAt ||
                record["Transaction Date"] ||
                record.delivered_date ||
                record.created_at ||
                record.pick_up_date ||
                record.pickup_date,
            ),
          }

          if (activePaymentTab === "razorpay" || activePaymentTab === "gokwik" || activePaymentTab === "snapmint") {
            return {
              ...baseRecord,
              "Payment ID": record.payment_id || record["Payment Id"] || "N/A",
              Method: record.method || record["Payment Method"] || "N/A",
            }
          } else {
            return {
              ...baseRecord,
              "AWB/Tracking": record.awb_number || record.awb || record.waybill_num || "N/A",
              "Courier/Status":
                activePaymentTab === "bluedart"
                  ? record.order_number || "N/A"
                  : record.courier || record.status || record.carrier || "N/A",
            }
          }
        })
        filename = `${activePaymentTab}_payments_data.csv`
        break
      default:
        console.warn("No active tab selected for CSV download.")
        return
    }

    exportToCsv(dataToExport, filename)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-4 md:p-6 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Reconciliation Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor and reconcile payments across all channels</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={runReconciliation} className="flex items-center gap-2 bg-transparent" variant="outline">
              <AlertTriangle className="h-4 w-4" />
              Run Reconciliation
            </Button>
            <Button onClick={loadData} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
            <Button
              onClick={handleLogout}
              className="flex items-center gap-2"
              variant="destructive"
              disabled={loading || !session}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {!reconciliationColumnsExist && (
          <Alert className="border-orange-200 bg-orange-50">
            <Database className="h-4 w-4" />
            <AlertTitle>Database Setup Required</AlertTitle>
            <AlertDescription>
              The reconciliation columns (adjusted_amount, remark) do not exist in the orders table. Please run the SQL
              migration script{" "}
              <code className="bg-orange-100 px-1 py-0.5 rounded text-sm">add-reconciliation-columns.sql</code> to add
              the required columns. Edit functionality will be disabled until the columns are added.
            </AlertDescription>
          </Alert>
        )}

        {saveError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        {saveSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{saveSuccess}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Matched Orders</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.matchedOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Received Amount</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The total sum of all payments received from various payment gateways (after adjustments).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <CardContent>
              <div className="text-xl font-bold min-w-0 truncate whitespace-nowrap">
                ₹{stats.totalReceivedAmount.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Order Amount</CardTitle>
                    <ReceiptText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The total monetary value of all orders placed.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <CardContent>
              <div className="text-xl font-bold min-w-0 truncate">₹{stats.totalOrderAmount.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Match Pending</CardTitle>
              <XCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.matchPendingOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Discrepancies</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.discrepancies}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orphaned Orders</CardTitle>
              <AlertTriangle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.orphanedOrders}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative flex-1 max-w-sm w-full sm:w-auto">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders, products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="matched">Matched</SelectItem>
              <SelectItem value="discrepancy">Discrepancy</SelectItem>
              <SelectItem value="match_pending">Match Pending</SelectItem>
              <SelectItem value="orphaned_order">Orphaned Order</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPaymentSource} onValueChange={setFilterPaymentSource}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Payment Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {uniquePaymentSources.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterShippingDateType} onValueChange={(value: string) => setFilterShippingDateType(value as "all" | "current_month" | "last_month" | "last_quarter" | "custom_range")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Shipping Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="current_month">Current Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="last_quarter">Last Quarter</SelectItem>
              <SelectItem value="custom_range">Date Range</SelectItem>
            </SelectContent>
          </Select>
          {filterShippingDateType === "custom_range" && (
            <>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full sm:w-[180px]"
                placeholder="Start Date"
              />
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full sm:w-[180px]"
                placeholder="End Date"
              />
            </>
          )}
          <Button onClick={handleDownloadCsv} className="flex items-center gap-2 w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
        </div>

        <Tabs defaultValue="reconciliation" className="space-y-4" onValueChange={setActiveMainTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="payments">Payment Tables</TabsTrigger>
          </TabsList>

          <TabsContent value="reconciliation">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Payment Reconciliation Results</CardTitle>
                <CardDescription>
                  Orders matched with payments from all tables (Razorpay, GoKwik, Shiprocket, Nimbus, BlueDart,
                  Delhivery). Received Amount is adjusted by subtracting the Adjusted Amount when greater than 0.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[1200px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[140px]">Order Number</TableHead>
                          <TableHead className="w-[120px] text-right">Order Amount</TableHead>
                          <TableHead className="w-[120px] text-right">Received Amount</TableHead>
                          <TableHead className="w-[100px] text-right">Difference</TableHead>
                          <TableHead className="w-[130px] text-right">Adjusted Amount</TableHead>
                          <TableHead className="w-[180px]">Remark</TableHead>
                          <TableHead className="w-[140px]">Payment Sources</TableHead>
                          <TableHead className="w-[110px]">Shipping Date</TableHead>
                          <TableHead className="w-[120px]">Status</TableHead>
                          <TableHead className="w-[100px] text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                    </Table>
                    <div className="overflow-y-auto max-h-[450px]">
                      <Table>
                        <TableBody>
                          {paginatedReconciliation.map((record) => (
                            <ReconciliationTableRow
                              key={record.order_id}
                              record={record}
                              editingRecord={editingRecord}
                              editValues={editValues}
                              isSaving={isSaving}
                              reconciliationColumnsExist={reconciliationColumnsExist}
                              handleReconciliationRowClick={handleReconciliationRowClick}
                              handleEditStart={handleEditStart}
                              handleEditSave={handleEditSave}
                              handleEditCancel={handleEditCancel}
                              setEditValues={setEditValues}
                              formatDateForDisplay={formatDateForDisplay}
                              getStatusBadge={getStatusBadge}
                              originalAdjustedAmount={originalAdjustedAmount}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <PaginationControls
                      currentPage={reconciliationPage}
                      totalItems={filteredReconciliation.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setReconciliationPage}
                      label="reconciliation records"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Orders Details</CardTitle>
                <CardDescription>Complete list of all orders with payment and shipping information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[1000px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[140px]">Order Number</TableHead>
                          <TableHead className="w-[200px]">Product</TableHead>
                          <TableHead className="w-[120px]">Shipping Amount</TableHead>
                          <TableHead className="w-[130px]">Payment Method</TableHead>
                          <TableHead className="w-[140px]">Shipping Partner</TableHead>
                          <TableHead className="w-[100px]">State</TableHead>
                          <TableHead className="w-[120px]">Order Date</TableHead>
                          <TableHead className="w-[120px]">Shipping Date</TableHead>
                        </TableRow>
                      </TableHeader>
                    </Table>
                    <div className="overflow-y-auto max-h-[450px]">
                      <Table>
                        <TableBody>
                          {paginatedOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium w-[140px]">{order.order_number}</TableCell>
                              <TableCell className="w-[200px]">
                                <div>
                                  <div className="font-medium">{order.product_name || "N/A"}</div>
                                  <div className="text-sm text-gray-500">Qty: {order.quantity || 0}</div>
                                </div>
                              </TableCell>
                              <TableCell className="w-[120px]">₹{(order["Shipping Amount"] || 0).toFixed(2)}</TableCell>
                              <TableCell className="w-[130px]">
                                <Badge variant="outline">{order.payment_method || "N/A"}</Badge>
                              </TableCell>
                              <TableCell className="w-[140px]">
                                <div className="flex items-center gap-1">
                                  <Truck className="h-3 w-3" />
                                  {order.shipping_partner || "N/A"}
                                </div>
                              </TableCell>
                              <TableCell className="w-[100px]">{order.state || "N/A"}</TableCell>
                              <TableCell className="w-[120px]">{formatDateForDisplay(order.order_date)}</TableCell>
                              <TableCell className="w-[120px]">{formatDateForDisplay(order.shipped_date)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <PaginationControls
                      currentPage={ordersPage}
                      totalItems={filteredOrders.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setOrdersPage}
                      label="orders"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Payment & Shipping Tables Data</CardTitle>
                <CardDescription>View data from all payment and shipping provider tables</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activePaymentTab} onValueChange={setActivePaymentTab}>
                  <TabsList className="grid w-full grid-cols-8">
                    <TabsTrigger value="razorpay">Razorpay ({filteredPaymentTables.razorpay.length})</TabsTrigger>
                    <TabsTrigger value="gokwik">GoKwik ({filteredPaymentTables.gokwik.length})</TabsTrigger>
                    <TabsTrigger value="snapmint">Snapmint ({filteredPaymentTables.snapmint.length})</TabsTrigger>
                    <TabsTrigger value="shiprocket">Shiprocket ({filteredPaymentTables.shiprocket.length})</TabsTrigger>
                    <TabsTrigger value="nimbus">Nimbus ({filteredPaymentTables.nimbus.length})</TabsTrigger>
                    <TabsTrigger value="bluedart">BlueDart ({filteredPaymentTables.bluedart.length})</TabsTrigger>
                    <TabsTrigger value="delhivery">Delhivery ({filteredPaymentTables.delhivery.length})</TabsTrigger>
                    <TabsTrigger value="shipway">Shipway ({filteredPaymentTables.shipway.length})</TabsTrigger>
                  </TabsList>

                  {Object.entries(filteredPaymentTables).map(([tableName, tableData]) => {
                    const paginatedData = paginatedPaymentTables[tableName as keyof PaymentTableData] || []
                    const currentPage = paymentTabPages[tableName as keyof PaymentTableData] || 1
                    const setCurrentPage = (page: number) => {
                      setPaymentTabPages(prev => ({ ...prev, [tableName]: page }))
                    }
                    
                    return (
                      <TabsContent key={tableName} value={tableName}>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                              {["shiprocket", "nimbus", "bluedart", "delhivery"].includes(tableName) ? (
                                <Package className="h-5 w-5" />
                              ) : (
                                <DollarSign className="h-5 w-5" />
                              )}
                              {tableName} Data
                            </h3>
                            <Badge variant="outline">{tableData.length} records</Badge>
                          </div>

                          {tableData.length > 0 ? (
                            <>
                              <div className="overflow-x-auto">
                                <div className="min-w-[1000px]">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-[200px]">Order ID</TableHead>
                                        <TableHead className="w-[150px]">Amount</TableHead>
                                        <TableHead className="w-[200px]">
                                          {tableName === "razorpay"
                                            ? "Payment ID"
                                            : tableName === "gokwik"
                                              ? "Payment ID"
                                              : tableName === "snapmint"
                                                ? "Payment ID"
                                                : tableName === "shipway"
                                                  ? "Order Number"
                                                  : "AWB/Tracking"}
                                        </TableHead>
                                        <TableHead className="w-[200px]">
                                          {tableName === "razorpay"
                                            ? "Method"
                                            : tableName === "gokwik"
                                              ? "Payment Method"
                                              : tableName === "snapmint"
                                                ? "Order Number"
                                                : tableName === "bluedart"
                                                  ? "Order Number"
                                                  : tableName === "shipway"
                                                    ? "Order ID"
                                                    : "Courier/Status"}
                                        </TableHead>
                                        <TableHead className="w-[150px]">Date</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody className="max-h-[350px] overflow-y-auto">
                                      {paginatedData.map((record: any, index: number) => (
                                        <TableRow key={`${tableName}-${record.id || record.payment_id || record['Payment Id'] || record.awb_number || record.awb || record.waybill_num || index}`}>
                                          <TableCell className="font-medium w-[200px]">{record.order_id || "N/A"}</TableCell>
                                          <TableCell className="w-[150px]">
                                            ₹
                                            {(
                                              tableName === "snapmint" || tableName === "shipway"
                                                ? record["Order Value"] || 0
                                                : record.amount ||
                                                  record.Amount ||
                                                  record.cod_amount ||
                                                  record.shipping_charges ||
                                                  0
                                            ).toFixed(2)}
                                          </TableCell>
                                          <TableCell className="w-[200px]">
                                            {tableName === "snapmint"
                                              ? record["Payment ID"] || "N/A"
                                              : tableName === "shipway"
                                                ? record.order_number || "N/A"
                                                : record.payment_id ||
                                                  record["Payment Id"] ||
                                                  record.awb_number ||
                                                  record.awb ||
                                                  record.waybill_num ||
                                                  "N/A"}
                                          </TableCell>
                                          <TableCell className="w-[200px]">
                                            {tableName === "snapmint"
                                              ? record["Order Number"] || "N/A"
                                              : tableName === "bluedart"
                                                ? record.order_number || "N/A"
                                                : tableName === "shipway"
                                                  ? record.order_id || "N/A"
                                                  : record.method ||
                                                    record["Payment Method"] ||
                                                    record.courier ||
                                                    record.status ||
                                                    record.carrier ||
                                                    "N/A"}
                                          </TableCell>
                                          <TableCell className="w-[150px]">
                                            {formatDateForDisplay(
                                              record.createdAt ||
                                                record["Transaction Date"] ||
                                                record.delivered_date ||
                                                record.created_at ||
                                                record.pick_up_date ||
                                                record.pickup_date,
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                              <PaginationControls
                                currentPage={currentPage}
                                totalItems={tableData.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                                label={`${tableName} records`}
                              />
                            </>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>No records found in {tableName} table</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    )
                  })}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    
    {/* Reconciliation Detail Dialog */}
    {selectedReconciliationRecord && (
      <ReconciliationDetailDialog
        isOpen={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
        reconciliationRecord={selectedReconciliationRecord}
        orderDetail={selectedOrderDetail}
        payments={selectedPayments}
        shipping={selectedShipping}
      />
    )}
    </>
  )
}
