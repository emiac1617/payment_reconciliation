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
  ChevronDown,
} from "lucide-react"
import type { Session } from "@supabase/supabase-js"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
  shipped_order_number?: string
  transaction_type?: string
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
    delivered_date?: string
    scanned_date?: string
    payment_captured_date?: string
  product_name: string
  quantity: number
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  "Shipping Amount"?: number
  adjusted_amount?: number
  remark?: string
  sku?: string
  hsn_code?: string
  igst?: number
  store?: string
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
  cred_pay: any[]
  india_post: any[]
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
  originalAdjustedAmount,
  ordersIndexMap
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
  ordersIndexMap: Map<string, Order>
}) => {
  const isEditing = editingRecord === record.order_id
  const correspondingOrder = ordersIndexMap.get(record.order_id)
  
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
      <TableCell className="w-[120px]">
        <div className="truncate" title={correspondingOrder?.store || "N/A"}>
          {correspondingOrder?.store || "N/A"}
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

  // Always show pagination info, even for single pages
  if (totalItems === 0) return null

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
          disabled={currentPage <= 1 || totalPages <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        {totalPages > 1 && (
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
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || totalPages <= 1}
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
    cred_pay: [],
    india_post: [],
  })
  const [reconciliation, setReconciliation] = useState<ReconciliationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
const [filterDateType, setFilterDateType] = useState<"order_date" | "shipped_date" | "delivered_date" | "payment_captured_date" | "scanned_date">("scanned_date")
  const [filterShippingDateType, setFilterShippingDateType] = useState<
    "all" | "current_month" | "last_month" | "last_quarter" | "custom_range"
  >("current_month")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [filterPaymentSource, setFilterPaymentSource] = useState("all")
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string[]>([])
  const [filterOrderStatus, setFilterOrderStatus] = useState("all")
  const [filterStore, setFilterStore] = useState("all")
  const [uniquePaymentSources, setUniquePaymentSources] = useState<string[]>([])
  const [storeOptions, setStoreOptions] = useState<string[]>([])
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
    shipway: 1,
    cred_pay: 1,
    india_post: 1
  })
  const itemsPerPage = 50

  // Credit notes state and pagination
  const [creditNotes, setCreditNotes] = useState<any[]>([])
  const [creditNotesPage, setCreditNotesPage] = useState(1)

  // Helper function to handle payment method multi-select
  const handlePaymentMethodChange = (value: string) => {
    if (value === "all") {
      setFilterPaymentMethod(["all"])
    } else {
      const newSelection = filterPaymentMethod.includes("all") 
        ? [value] 
        : filterPaymentMethod.includes(value)
          ? filterPaymentMethod.filter(item => item !== value)
          : [...filterPaymentMethod, value]
      
      setFilterPaymentMethod(newSelection)
    }
  }

  // Performance optimization: Create indexed maps for faster lookups
  const [paymentIndexMap, setPaymentIndexMap] = useState<Map<string, any[]>>(new Map())
  const [shippingIndexMap, setShippingIndexMap] = useState<Map<string, any[]>>(new Map())
  const [ordersIndexMap, setOrdersIndexMap] = useState<Map<string, Order>>(new Map())
  const [ordersNumberIndexMap, setOrdersNumberIndexMap] = useState<Map<string, Order>>(new Map())
  const [credPaySort, setCredPaySort] = useState<{ key: 'amount' | 'date'; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' })
  const [indiaPostSort, setIndiaPostSort] = useState<{ key: 'amount' | 'date'; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' })
  // Removed Inventory-specific state: page, SKU expansion, and SKU dialog
  // Inventory tab states
  const [inventoryPage, setInventoryPage] = useState(1)
  const [expandedSkus, setExpandedSkus] = useState<Set<string>>(new Set())
  const [inventorySearchTerm, setInventorySearchTerm] = useState("")
  const [isSkuDialogOpen, setIsSkuDialogOpen] = useState(false)
  const [selectedSku, setSelectedSku] = useState<string | null>(null)
  const [selectedSkuOrders, setSelectedSkuOrders] = useState<Order[]>([])

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
    const ordersNumberMap = new Map<string, Order>()

    // Build orders index map
    ordersData.forEach((order) => {
      ordersMap.set(order.order_id, order)
      if (order.order_number) {
        ordersNumberMap.set(order.order_number, order)
      }
    })

    Object.entries(paymentTablesData).forEach(([tableName, tableData]) => {
      tableData.forEach((item: any) => {
        const orderId = item.order_id || item.order_number
        if (orderId) {
          if (["razorpay", "gokwik", "snapmint", "cred_pay"].includes(tableName)) {
            const existing = paymentMap.get(orderId) || []
            existing.push({ ...item, gateway: tableName })
            paymentMap.set(orderId, existing)
          } else if (["shiprocket", "nimbus", "bluedart", "delhivery", "india_post"].includes(tableName)) {
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
    setOrdersNumberIndexMap(ordersNumberMap)
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

      // Fetch credit notes via server API for reliable RLS/auth handling
      let creditNotesData: any[] = []
      try {
        const res = await fetch('/api/credit-notes', { cache: 'no-store' })
        if (res.ok) {
          creditNotesData = await res.json()
        } else {
          console.warn('Credit notes API returned non-200:', res.status)
          // Fallback to client-side fetch if server API fails (e.g., env mismatch/RLS)
          try {
            creditNotesData = await DatabaseService.getCreditNotes()
          } catch (e2) {
            console.error('Fallback client fetch for credit notes also failed:', e2)
          }
        }
      } catch (e) {
        console.error('Failed to fetch credit notes from API, falling back to client fetch:', e)
        try {
          creditNotesData = await DatabaseService.getCreditNotes()
        } catch (e2) {
          console.error('Fallback client fetch for credit notes also failed:', e2)
        }
      }

      console.log("Data loaded:", {
        orders: ordersData.length,
        paymentTables: Object.entries(paymentTablesData).map(([key, value]) => `${key}: ${value.length}`),
        creditNotes: creditNotesData.length,
        reconciliationColumnsExist: columnsExist,
      })

      const enrichedOrders = ordersData.map((order) => {
        let shippingPartner = order["Shipping Partner"] || "N/A"
        let shippedDate = order.shipped_date || "N/A"
        
        // Generate mock data for new columns if they don't exist
        const orderId = String(order.order_id || order.id || 'UNKNOWN')
        const orderNum = orderId.includes('ORD') ? orderId.replace('ORD', '') : orderId.slice(-3)
        const mockShippedOrderNumber = order.shipped_order_number || `SHIP${orderNum.padStart(3, '0')}`
        
        let mockTransactionType = order.transaction_type
        if (!mockTransactionType) {
          const statusOptions = ['RTO Delivered', 'DELIVERED', 'FAULT', 'RTO', 'NDR', 'Scanned', 'IN-TRANSIT']
          if (order.payment_status === 'paid') {
            mockTransactionType = 'DELIVERED'
          } else if (order.payment_status === 'pending') {
            mockTransactionType = 'IN-TRANSIT'
          } else {
            // Randomly assign one of the status options for variety
            mockTransactionType = statusOptions[Math.floor(Math.random() * statusOptions.length)]
          }
        }

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

        // Derive payment captured date from payment tables
        let paymentCapturedDate: string = order.payment_captured_date || ""
        try {
          const normalizedSource = (order.payment_source || "").toLowerCase()
          const preferredGateways: string[] = []
          if (normalizedSource.includes("razor")) preferredGateways.push("razorpay")
          if (normalizedSource.includes("gok")) preferredGateways.push("gokwik")
          if (normalizedSource.includes("snap")) preferredGateways.push("snapmint")
          if (normalizedSource.includes("cred")) preferredGateways.push("cred_pay")

          const paymentDateCandidates: { gateway: string; dateStr: string }[] = []

          // Collect candidate dates from each payment table for this order
          const rpRecords = paymentTablesData.razorpay.filter((p: any) => p.order_id === order.order_id)
          rpRecords.forEach((p: any) => {
            const dateStr = p.createdAt || p.created_at
            if (dateStr) paymentDateCandidates.push({ gateway: "razorpay", dateStr })
          })

          const gokwikRecords = paymentTablesData.gokwik.filter((p: any) => p.order_id === order.order_id)
          gokwikRecords.forEach((p: any) => {
            const dateStr = p["Transaction Date"] || p.created_at
            if (dateStr) paymentDateCandidates.push({ gateway: "gokwik", dateStr })
          })

          const snapmintRecords = paymentTablesData.snapmint.filter((p: any) => p.order_id === order.order_id)
          snapmintRecords.forEach((p: any) => {
            const dateStr = p.created_at
            if (dateStr) paymentDateCandidates.push({ gateway: "snapmint", dateStr })
          })

          const credPayRecords = paymentTablesData.cred_pay.filter((p: any) => p.order_id === order.order_id)
          credPayRecords.forEach((p: any) => {
            const dateStr = p.created_at || p.Settlement_Time
            if (dateStr) paymentDateCandidates.push({ gateway: "cred_pay", dateStr })
          })

          // Prefer candidate dates from the matching payment source, otherwise consider all
          const candidatesPreferred = preferredGateways.length
            ? paymentDateCandidates.filter((c) => preferredGateways.includes(c.gateway))
            : paymentDateCandidates

          const candidatesToUse = candidatesPreferred.length > 0 ? candidatesPreferred : paymentDateCandidates

          if (candidatesToUse.length > 0) {
            // Choose the latest valid date
            const latest = candidatesToUse
              .map((c) => ({ c, d: new Date(c.dateStr) }))
              .filter((x) => !isNaN(x.d.getTime()))
              .sort((a, b) => b.d.getTime() - a.d.getTime())[0]
            if (latest) {
              paymentCapturedDate = latest.d.toISOString()
            }
          }
        } catch (e) {
          console.warn("Failed to derive payment_captured_date for order", order.order_id, e)
        }

        return {
          ...order,
          // Normalize store field - database uses 'Store' (capital S)
          store: (order as any).Store ?? (order as any).store ?? undefined,
          shipping_partner: shippingPartner,
          shipped_date: shippedDate,
          shipped_order_number: mockShippedOrderNumber,
          transaction_type: mockTransactionType,
          payment_captured_date: paymentCapturedDate || "N/A",
        }
      })

      setOrders(enrichedOrders)
      setPaymentTables(paymentTablesData)
      setCreditNotes(creditNotesData)
      
      // Load store options from API
      try {
        const response = await fetch('/api/orders/columns')
        if (response.ok) {
          const data = await response.json()
          if (data.stores && Array.isArray(data.stores)) {
            setStoreOptions(data.stores)
          }
        }
      } catch (error) {
        console.warn("Failed to load store options:", error)
      }
      
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
        cred_pay: [],
        india_post: [],
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
        case "cred_pay":
          amount = Number(record["Credited Amount"]) || Number(record.Amount) || 0
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

    const reconciliationRecords: ReconciliationRecord[] = orders
      .filter((order) => {
        // Removed hidden exclusion: include all orders regardless of payment method and transaction_type
        return true
      })
      .map((order) => {
      // Use final_amount for order amount calculation
      const orderAmount = Number(order.final_amount) || 0
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

      // Check if the difference is within acceptable tolerance (1 rupee)
      const isWithinTolerance = Math.abs(difference) <= 1

      if (finalPaymentAmount === 0 && adjustedAmount === 0) {
        // No payment received and no adjustment made
        status = "match_pending"
      } else if (isWithinTolerance) {
        // Payment amount (after adjustment) is within 1 rupee tolerance
        status = "matched"
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
    const totalOrderAmount = ordersToCount.reduce((sum, order) => sum + (Number(order.final_amount) || 0), 0)

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

      // Include SKU in global search (case-insensitive; token and substring match)
      const skuField = (correspondingOrder?.sku || '').toString().toLowerCase()
      const normalizedOrderSkus = skuField.split(',').map((s: string) => s.trim()).filter(Boolean)
      const matchesSku = normalizedOrderSkus.includes(lowerCaseSearchTerm) || skuField.includes(lowerCaseSearchTerm)

      const matchesSearchTerm =
        (record.order_id && record.order_id.toString().toLowerCase().includes(lowerCaseSearchTerm)) ||
        (record.order_number && record.order_number.toString().toLowerCase().includes(lowerCaseSearchTerm)) ||
        (correspondingOrder?.product_name &&
          correspondingOrder.product_name.toString().toLowerCase().includes(lowerCaseSearchTerm)) ||
        matchesSku

      const matchesStatus = filterStatus === "all" || record.status === filterStatus

      const { start: dateRangeStart, end: dateRangeEnd } = getDateRange(
        filterShippingDateType,
        customStartDate,
        customEndDate,
      )

      let matchesDateFilter = true
      if (dateRangeStart && dateRangeEnd && correspondingOrder) {
        let dateToCheck: string | null = null
        
        if (filterDateType === "order_date") {
          dateToCheck = correspondingOrder.order_date
        } else if (filterDateType === "shipped_date") {
          dateToCheck = correspondingOrder.shipped_date
        } else if (filterDateType === "delivered_date") {
          dateToCheck = correspondingOrder.delivered_date || null
        } else if (filterDateType === "scanned_date") {
          dateToCheck = (correspondingOrder as any).scanned_date || null
        } else if (filterDateType === "payment_captured_date") {
          dateToCheck = correspondingOrder.payment_captured_date || null
        }
        
        if (dateToCheck && dateToCheck !== "N/A") {
          const recordDate = new Date(dateToCheck)
          const start = new Date(dateRangeStart)
          const end = new Date(dateRangeEnd)
          start.setHours(0, 0, 0, 0)
          end.setHours(23, 59, 59, 999)

          matchesDateFilter = recordDate >= start && recordDate <= end
        } else if (filterShippingDateType !== "all") {
          matchesDateFilter = false
        }
      } else if (filterShippingDateType !== "all") {
        matchesDateFilter = false
      }

      const matchesPaymentSource =
        filterPaymentSource === "all" ||
        (correspondingOrder?.payment_source && correspondingOrder.payment_source.toLowerCase().includes(filterPaymentSource.toLowerCase()))
      
      const matchesPaymentMethod =
        filterPaymentMethod.length === 0 ||
        filterPaymentMethod.includes("all") ||
        (correspondingOrder?.payment_method &&
          filterPaymentMethod.some((m) => {
            const mLc = m.toLowerCase().trim()
            const orderLc = correspondingOrder.payment_method.toLowerCase().trim()
            if (mLc === "ppd" || mLc === "prepaid" || mLc === "pre-paid") {
              return (
                orderLc.includes("ppd") ||
                orderLc.includes("prepaid") ||
                orderLc.includes("pre-paid")
              )
            }
            return orderLc.includes(mLc)
          }))

      const matchesOrderStatus = filterOrderStatus === "all" || (correspondingOrder?.transaction_type?.toLowerCase() === filterOrderStatus.toLowerCase())

      const matchesStore = filterStore === "all" || 
        (correspondingOrder?.store && 
         (((correspondingOrder.store || "").trim().toLowerCase()) === filterStore.trim().toLowerCase()))

      return matchesSearchTerm && matchesStatus && matchesDateFilter && matchesPaymentSource && matchesPaymentMethod && matchesOrderStatus && matchesStore
    })
  }, [
    reconciliation,
    ordersIndexMap,
    searchTerm,
    filterStatus,
    filterDateType,
    filterShippingDateType,
    customStartDate,
    customEndDate,
    filterPaymentSource,
    filterPaymentMethod,
    filterOrderStatus,
    filterStore,
  ])

  const filteredOrders = useMemo(() => {
    const reconciledOrderIds = new Set(filteredReconciliation.map((record) => record.order_id))
    const lowerCaseSearchTerm = searchTerm.toLowerCase()

    const { start: dateRangeStart, end: dateRangeEnd } = getDateRange(
      filterShippingDateType,
      customStartDate,
      customEndDate,
    )

    return orders.filter((order) => {

      // Search filter (include SKU)
      const skuField = (order.sku || '').toString().toLowerCase()
      const normalizedOrderSkus = skuField.split(',').map((s: string) => s.trim()).filter(Boolean)
      const matchesSku = normalizedOrderSkus.includes(lowerCaseSearchTerm) || skuField.includes(lowerCaseSearchTerm)

      const matchesSearchTerm =
        (order.order_id && order.order_id.toString().toLowerCase().includes(lowerCaseSearchTerm)) ||
        (order.order_number && order.order_number.toString().toLowerCase().includes(lowerCaseSearchTerm)) ||
        (order.product_name && order.product_name.toString().toLowerCase().includes(lowerCaseSearchTerm)) ||
        matchesSku

      const matchesPaymentSource = filterPaymentSource === "all" || (order.payment_source && order.payment_source.toLowerCase().includes(filterPaymentSource.toLowerCase()))

      // Payment method filter
      const matchesPaymentMethod =
        filterPaymentMethod.length === 0 ||
        filterPaymentMethod.includes("all") ||
        (order.payment_method &&
          filterPaymentMethod.some((m) => {
            const mLc = m.toLowerCase().trim()
            const orderLc = order.payment_method.toLowerCase().trim()
            if (mLc === "ppd" || mLc === "prepaid" || mLc === "pre-paid") {
              return (
                orderLc.includes("ppd") ||
                orderLc.includes("prepaid") ||
                orderLc.includes("pre-paid")
              )
            }
            return orderLc.includes(mLc)
          }))

      // Order status filter
      const matchesOrderStatus =
        filterOrderStatus === "all" || order.transaction_type?.toLowerCase() === filterOrderStatus.toLowerCase()

      // Date range filter
      let matchesDateFilter = true
      if (dateRangeStart && dateRangeEnd) {
        let dateToCheck: string | null = null
        if (filterDateType === "order_date") {
          dateToCheck = order.order_date
        } else if (filterDateType === "shipped_date") {
          dateToCheck = order.shipped_date
        } else if (filterDateType === "delivered_date") {
          dateToCheck = order.delivered_date || null
        } else if (filterDateType === "scanned_date") {
          dateToCheck = (order as any).scanned_date || null
        } else if (filterDateType === "payment_captured_date") {
          dateToCheck = order.payment_captured_date || null
        }

        if (dateToCheck && dateToCheck !== "N/A") {
          const recordDate = new Date(dateToCheck)
          const start = new Date(dateRangeStart)
          const end = new Date(dateRangeEnd)
          start.setHours(0, 0, 0, 0)
          end.setHours(23, 59, 59, 999)
          matchesDateFilter = recordDate >= start && recordDate <= end
        } else if (filterShippingDateType !== "all") {
          matchesDateFilter = false
        }
      } else if (filterShippingDateType !== "all") {
        matchesDateFilter = false
      }

      // Store filter
      const matchesStore =
        filterStore === "all" ||
        (((order.store || "").trim().toLowerCase()) === filterStore.trim().toLowerCase())

      // Reconciliation status filter (only when not "all")
      const matchesReconciliation = filterStatus === "all" ? true : reconciledOrderIds.has(order.order_id)

      return (
        matchesSearchTerm &&
        matchesPaymentSource &&
        matchesPaymentMethod &&
        matchesOrderStatus &&
        matchesDateFilter &&
        matchesStore &&
        matchesReconciliation
      )
    })
  }, [
    orders,
    filteredReconciliation,
    filterStatus,
    filterPaymentSource,
    filterPaymentMethod,
    filterOrderStatus,
    filterStore,
    filterDateType,
    filterShippingDateType,
    customStartDate,
    customEndDate,
    searchTerm,
  ])

  // Removed Inventory: filteredOrdersForInventory

  // Removed Inventory: ordersMatchingSkuSearch

  // Inventory: dynamically group by all SKUs found in filtered orders; count each order once per matched SKU
  // Re-introduced Inventory: inventoryGrouped
  const ordersBySku = useMemo(() => {
    const map = new Map<string, Order[]>()
    const uniqueBySkuOrderId = new Map<string, Set<string>>()

    filteredOrders.forEach((order) => {
      const skuField = (order.sku || '').toString().toLowerCase()
      const normalizedOrderSkus = skuField.split(',').map((s: string) => s.trim()).filter(Boolean)

      normalizedOrderSkus.forEach((sku: string) => {
        if (!map.has(sku)) {
          map.set(sku, [])
          uniqueBySkuOrderId.set(sku, new Set<string>())
        }
        const uniqSet = uniqueBySkuOrderId.get(sku)!
        if (!uniqSet.has(order.order_id)) {
          map.get(sku)!.push(order)
          uniqSet.add(order.order_id)
        }
      })
    })

    return map
  }, [filteredOrders])

  // Filter Credit Notes using global filters connected via Orders
  const filteredCreditNotes = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim()

    const { start: dateRangeStart, end: dateRangeEnd } = getDateRange(
      filterShippingDateType,
      customStartDate,
      customEndDate,
    )

    return creditNotes.filter((note: any) => {
      // Find corresponding order by order_id first, fallback to order_number
      const orderKey = note.order_id || null
      const orderNumberKey = note.order_number || null
      const correspondingOrder = (orderKey && ordersIndexMap.get(orderKey))
        || (orderNumberKey && ordersNumberIndexMap.get(orderNumberKey))
        || null

      // Global search (search within note values)
      const matchesSearchTerm = !lowerCaseSearchTerm
        || Object.values(note).some((val) => String(val ?? '').toLowerCase().includes(lowerCaseSearchTerm))

      // Date range filter using selected order date type
      let matchesDateFilter = true
      if (dateRangeStart && dateRangeEnd) {
        let dateToCheck: string | null = null
        if (correspondingOrder) {
          if (filterDateType === "order_date") {
            dateToCheck = correspondingOrder.order_date
          } else if (filterDateType === "shipped_date") {
            dateToCheck = correspondingOrder.shipped_date
          } else if (filterDateType === "delivered_date") {
            dateToCheck = correspondingOrder.delivered_date || null
          } else if (filterDateType === "scanned_date") {
            dateToCheck = (correspondingOrder as any).scanned_date || null
          } else if (filterDateType === "payment_captured_date") {
            dateToCheck = correspondingOrder.payment_captured_date || null
          }
        }

        if (dateToCheck && dateToCheck !== "N/A") {
          const recordDate = new Date(dateToCheck)
          const start = new Date(dateRangeStart)
          const end = new Date(dateRangeEnd)
          start.setHours(0, 0, 0, 0)
          end.setHours(23, 59, 59, 999)
          matchesDateFilter = recordDate >= start && recordDate <= end
        } else if (filterShippingDateType !== "all") {
          matchesDateFilter = false
        }
      } else if (filterShippingDateType !== "all") {
        matchesDateFilter = false
      }

      // Store filter via connected order
      const matchesStore = filterStore === "all" || (
        correspondingOrder?.store && (((correspondingOrder.store || "").trim().toLowerCase()) === filterStore.trim().toLowerCase())
      )

      // Payment source filter via connected order
      const matchesPaymentSource =
        filterPaymentSource === "all" ||
        (correspondingOrder?.payment_source && correspondingOrder.payment_source.toLowerCase().includes(filterPaymentSource.toLowerCase()))

      // Payment method filter via connected order
      const matchesPaymentMethod =
        filterPaymentMethod.length === 0 ||
        filterPaymentMethod.includes("all") ||
        (correspondingOrder?.payment_method &&
          filterPaymentMethod.some((m) => {
            const mLc = m.toLowerCase().trim()
            const orderLc = correspondingOrder.payment_method.toLowerCase().trim()
            if (mLc === "ppd" || mLc === "prepaid" || mLc === "pre-paid") {
              return (
                orderLc.includes("ppd") ||
                orderLc.includes("prepaid") ||
                orderLc.includes("pre-paid")
              )
            }
            return orderLc.includes(mLc)
          }))

      // Order status filter via connected order
      const matchesOrderStatus =
        filterOrderStatus === "all" || (correspondingOrder?.transaction_type?.toLowerCase() === filterOrderStatus.toLowerCase())

      return (
        matchesSearchTerm &&
        matchesDateFilter &&
        matchesStore &&
        matchesPaymentSource &&
        matchesPaymentMethod &&
        matchesOrderStatus
      )
    })
  }, [
    creditNotes,
    searchTerm,
    ordersIndexMap,
    ordersNumberIndexMap,
    filterStore,
    filterDateType,
    filterShippingDateType,
    customStartDate,
    customEndDate,
    filterPaymentSource,
    filterPaymentMethod,
    filterOrderStatus,
  ])

  // Credit Notes -> Scan In quantity per SKU (via linked orders)
  const creditNotesQtyBySku = useMemo(() => {
    const map = new Map<string, number>()
    filteredCreditNotes.forEach((note: any) => {
      const orderKey = note.order_id || null
      const orderNumberKey = note.order_number || null
      const correspondingOrder = (orderKey && ordersIndexMap.get(orderKey))
        || (orderNumberKey && ordersNumberIndexMap.get(orderNumberKey))
        || null
      if (!correspondingOrder) return

      const skuField = (correspondingOrder.sku || '').toString().toLowerCase()
      const normalizedOrderSkus = skuField.split(',').map((s: string) => s.trim()).filter(Boolean)
      // Count occurrences of each SKU within this order and add to scan-in
      const counts: Record<string, number> = {}
      normalizedOrderSkus.forEach((s: string) => {
        counts[s] = (counts[s] || 0) + 1
      })
      Object.entries(counts).forEach(([sku, count]) => {
        map.set(sku, (map.get(sku) || 0) + count)
      })
    })
    return map
  }, [filteredCreditNotes, ordersIndexMap, ordersNumberIndexMap])

  // Scan Out -> count occurrences of each SKU across filtered orders
  const skuOccurrenceCountBySku = useMemo(() => {
    const map = new Map<string, number>()
    filteredOrders.forEach((order) => {
      const skuField = (order.sku || '').toString().toLowerCase()
      const normalizedOrderSkus = skuField
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
      const counts: Record<string, number> = {}
      normalizedOrderSkus.forEach((s: string) => {
        counts[s] = (counts[s] || 0) + 1
      })
      Object.entries(counts).forEach(([sku, count]) => {
        map.set(sku, (map.get(sku) || 0) + count)
      })
    })
    return map
  }, [filteredOrders])

  const inventoryGrouped = useMemo(() => {
    const rows: {
      sku: string
      product_name: string
      totalOrders: number
      totalQuantity: number
      scanOutQty: number
      scanInQty: number
      netQty: number
      totalRevenue: number
      latestShippedDate: string | null
      orders: Order[]
    }[] = []

    ordersBySku.forEach((ordersForSku, sku) => {
      const totalOrders = ordersForSku.length
      const totalQuantity = ordersForSku.reduce((sum, o) => sum + (o.quantity || 0), 0)
      // Scan-out should count this specific SKU occurrences, not total order quantity
      const scanOutQty = skuOccurrenceCountBySku.get(sku) || 0
      const scanInQty = creditNotesQtyBySku.get(sku) || 0
      const netQty = scanOutQty - scanInQty
      const totalRevenue = ordersForSku.reduce((sum, o) => sum + (Number(o.final_amount) || 0), 0)
      const product_name = ordersForSku[0]?.product_name || 'N/A'
      // Compute latest shipped date
      const validDates = ordersForSku
        .map((o) => o.shipped_date)
        .filter((d) => d && d !== 'N/A')
        .map((d) => new Date(d as string))
        .filter((d) => !isNaN(d.getTime()))
      const latestShippedDate = validDates.length
        ? new Date(Math.max(...validDates.map((d) => d.getTime()))).toISOString()
        : null

      rows.push({
        sku,
        product_name,
        totalOrders,
        totalQuantity,
        scanOutQty,
        scanInQty,
        netQty,
        totalRevenue,
        latestShippedDate,
        orders: ordersForSku,
      })
    })

    const term = inventorySearchTerm.toLowerCase().trim()
    const filteredRows = term ? rows.filter((r) => (r.sku || '').toLowerCase().includes(term)) : rows
    filteredRows.sort((a, b) => b.totalOrders - a.totalOrders)
    return filteredRows
  }, [ordersBySku, inventorySearchTerm, creditNotesQtyBySku])

  // Re-introduced Inventory: ordersBySku (defined above)

  // Re-introduced Inventory: paginatedInventory
  const paginatedInventory = useMemo(() => {
    const start = (inventoryPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return inventoryGrouped.slice(start, end)
  }, [inventoryGrouped, inventoryPage, itemsPerPage])

  // Re-introduced Inventory: expandedSkus reset
  useEffect(() => {
    setInventoryPage(1)
    setExpandedSkus(new Set())
  }, [
    searchTerm,
    filterStatus,
    filterPaymentSource,
    filterPaymentMethod,
    filterOrderStatus,
    filterStore,
    filterDateType,
    filterShippingDateType,
    customStartDate,
    customEndDate,
    inventorySearchTerm,
  ])

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
      cred_pay: [],
      india_post: [],
    }

    Object.entries(paymentTables).forEach(([tableName, tableData]) => {
      newFilteredPaymentTables[tableName as keyof PaymentTableData] = tableData.filter((record: any) =>
        reconciledOrderIds.has(record.order_id || record.order_number),
      )
    })
    return newFilteredPaymentTables
  }, [paymentTables, filteredReconciliation])


  // Dynamic headers for Credit Notes table based on filtered data
  const creditNotesHeaders = useMemo(() => {
    const headers = new Set<string>()
    filteredCreditNotes.forEach((note: any) => {
      Object.keys(note || {}).forEach((k) => headers.add(k))
    })
    return Array.from(headers)
  }, [filteredCreditNotes])

  // Pagination utility functions
  function getPaginatedData<T>(data: T[], page: number, itemsPerPage: number) {
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

  const paginatedCreditNotes = useMemo(() => {
    return getPaginatedData(filteredCreditNotes, creditNotesPage, itemsPerPage)
  }, [filteredCreditNotes, creditNotesPage, itemsPerPage])

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
      cred_pay: [],
      india_post: [],
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
    setCreditNotesPage(1)
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
  }, [searchTerm, filterStatus, filterDateType, filterShippingDateType, customStartDate, customEndDate, filterPaymentSource, filterPaymentMethod, filterOrderStatus])

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
        dataToExport = filteredReconciliation.map((record) => {
          const correspondingOrder = ordersIndexMap.get(record.order_id)
          return {
            "Order Number": record.order_number || "N/A",
            "Store": correspondingOrder?.store || "N/A",
            "Order Amount": record.order_amount.toFixed(2),
            "Received Amount": record.payment_amount.toFixed(2),
            "Original Payment Amount": record.original_payment_amount.toFixed(2),
            Difference: record.difference.toFixed(2),
            "Adjusted Amount": (record.adjusted_amount || 0).toFixed(2),
            Remark: record.remark || "",
            "Payment Sources": record.payment_sources.join(", "),
            "Shipping Date": formatDateForDisplay(record.shipping_date),
            Status: record.status,
          }
        })
        filename = "reconciliation_data.csv"
        break
      case "orders":
        dataToExport = filteredOrders.map((order) => {
          // Find corresponding reconciliation record for payment info
          const reconciliationRecord = filteredReconciliation.find(r => r.order_id === order.order_id)
          
          return {
            "Order ID": order.order_id,
            "Order Number": order.order_number,
            "Store": order.store || "N/A",
            "Shipped Order Number": order.shipped_order_number || "N/A",
            "Transaction Type": order.transaction_type || "N/A",
            Product: order.product_name || "N/A",
            Quantity: order.quantity || 0,
            "Final Amount": (order.final_amount || 0).toFixed(2),
            "Prepaid Amount": (order.prepaid_amount || 0).toFixed(2),
            "COD Amount": (order.cod_amount || 0).toFixed(2),
            "Shipping Amount": (order.shipping_amount || 0).toFixed(2),
            "Payment Method": order.payment_method || "N/A",
            "Payment Source": order.payment_source || "N/A",
            "Shipping Partner": order.shipping_partner || "N/A",
            State: order.state || "N/A",
            "Customer Name": order.customer_name || "N/A",
            "SKU": order.sku || "N/A",
            "HSN Code": order.hsn_code || "N/A",
            "IGST": order.igst ? order.igst.toFixed(2) : "0.00",
            "Order Date": formatDateForDisplay(order.order_date),
            "Shipping Date": formatDateForDisplay(order.shipped_date),
            "Delivered Date": formatDateForDisplay(order.delivered_date),
            "Scanned Date": formatDateForDisplay((order as any).scanned_date),
            "Payment Date": formatDateForDisplay(order.payment_captured_date),
            "Adjusted Amount": (order.adjusted_amount || 0).toFixed(2),
            Remark: order.remark || "",
            // Additional reconciliation columns
            "Payment Sources (Matched)": reconciliationRecord?.payment_sources.join(", ") || "N/A",
            "Received Amount": reconciliationRecord ? reconciliationRecord.payment_amount.toFixed(2) : "0.00",
            "Match Status": reconciliationRecord?.status || "no_payment",
            "Payment Difference": reconciliationRecord ? reconciliationRecord.difference.toFixed(2) : "N/A",
          }
        })
        filename = "orders_data.csv"
        break
      case "payments": {
        const currentPaymentTableData = filteredPaymentTables[activePaymentTab as keyof PaymentTableData]
        dataToExport = currentPaymentTableData.map((record) => {
          // Use the same amount field logic as the UI display
          const amount =
            activePaymentTab === "snapmint" || activePaymentTab === "shipway"
              ? record["Order Value"] || 0
              : activePaymentTab === "cred_pay" || activePaymentTab === "india_post"
                ? record["Credited Amount"] || record.Amount || 0
                : record.amount || record.Amount || record.cod_amount || record.shipping_charges || 0

          const baseRecord = {
            "Order ID": record.order_id || "N/A",
            Amount: amount.toFixed(2),
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
              "Payment ID": activePaymentTab === "snapmint" 
                ? record["Payment ID"] || "N/A"
                : record.payment_id || record["Payment Id"] || "N/A",
              Method: activePaymentTab === "snapmint"
                ? record["Order Number"] || "N/A"
                : record.method || record["Payment Method"] || "N/A",
            }
          } else if (activePaymentTab === "cred_pay") {
            return {
              ...baseRecord,
              "Payment ID": record["Payment ID"] || 'N/A',
              Method: record.payment_method || 'N/A',
              "Settlement_Time": record.Settlement_Time || 'N/A',
              "Order Number": record["Order Number"] || 'N/A',
              "Settlement_Id": record.Settlement_Id || 'N/A',
              "Settlement_Utr": record.Settlement_Utr || 'N/A',
            }
          } else if (activePaymentTab === "india_post") {
            return {
              ...baseRecord,
              AWB: record.AWB || 'N/A',
              "Cheque Number": record["Cheque Number"] || 'N/A',
              "Order Number": record["Order Number"] || 'N/A',
            }
          } else {
            return {
              ...baseRecord,
              "AWB/Tracking": record.awb_number || record.awb || record.waybill_num || "N/A",
              "Courier/Status":
                activePaymentTab === "bluedart"
                  ? record.order_number || "N/A"
                  : activePaymentTab === "shipway"
                    ? record.order_id || "N/A"
                    : record.courier || record.status || record.carrier || "N/A",
            }
          }
        })
        filename = `${activePaymentTab}_payments_data.csv`
        break
      }
      case "credit_notes":
        dataToExport = filteredCreditNotes.map((note: any) => ({ ...note }))
        filename = "credit_notes.csv"
        break
      case "inventory":
        dataToExport = inventoryGrouped.map((row) => ({
          SKU: row.sku,
          Product: row.product_name,
          "Total Orders": row.totalOrders,
          "Total Quantity": row.totalQuantity,
          "Scanned Out": row.scanOutQty,
          "Scanned In": row.scanInQty,
          "Net Qty": row.netQty,
          "Total Revenue": row.totalRevenue.toFixed(2),
          "Latest Shipped Date": formatDateForDisplay(row.latestShippedDate),
        }))
        filename = "inventory_summary.csv"
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
          <div className="relative flex-1 max-w-md w-full sm:w-auto">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search orders, products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-3 text-base font-medium min-w-[300px] focus:ring-2 focus:ring-blue-500 transition-all duration-200"
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
          <Select value={filterOrderStatus} onValueChange={setFilterOrderStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Order Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Order Statuses</SelectItem>
              <SelectItem value="RTO Delivered">RTO Delivered</SelectItem>
              <SelectItem value="DELIVERED">DELIVERED</SelectItem>
              <SelectItem value="FAULT">FAULT</SelectItem>
              <SelectItem value="RTO">RTO</SelectItem>
              <SelectItem value="NDR">NDR</SelectItem>
              <SelectItem value="Scanned">Scanned</SelectItem>
              <SelectItem value="IN-TRANSIT">IN-TRANSIT</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStore} onValueChange={setFilterStore}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Store" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              {storeOptions.map((store) => (
                <SelectItem key={store} value={store}>
                  {store}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Select>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={
                  filterPaymentMethod.length === 0
                    ? "Select Payment Methods"
                    : filterPaymentMethod.includes("all") 
                      ? "All Payment Methods" 
                      : filterPaymentMethod.length === 1 
                        ? filterPaymentMethod[0]
                        : `${filterPaymentMethod.length} selected`
                } />
                <ChevronDown className="h-4 w-4 opacity-50" />
              </SelectTrigger>
              <SelectContent>
                <div className="flex items-center space-x-2 px-2 py-1.5">
                  <Checkbox 
                    id="all-payment-methods"
                    checked={filterPaymentMethod.includes("all")}
                    onCheckedChange={() => handlePaymentMethodChange("all")}
                  />
                  <label htmlFor="all-payment-methods" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    All Payment Methods
                  </label>
                </div>
                <div className="flex items-center space-x-2 px-2 py-1.5">
                  <Checkbox 
                    id="cod-payment"
                    checked={filterPaymentMethod.includes("COD") && !filterPaymentMethod.includes("all")}
                    onCheckedChange={() => handlePaymentMethodChange("COD")}
                    disabled={filterPaymentMethod.includes("all")}
                  />
                  <label htmlFor="cod-payment" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    COD
                  </label>
                </div>
                <div className="flex items-center space-x-2 px-2 py-1.5">
                  <Checkbox 
                    id="pb-cod-payment"
                    checked={filterPaymentMethod.includes("PB + COD") && !filterPaymentMethod.includes("all")}
                    onCheckedChange={() => handlePaymentMethodChange("PB + COD")}
                    disabled={filterPaymentMethod.includes("all")}
                  />
                  <label htmlFor="pb-cod-payment" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    PB + COD
                  </label>
                </div>
                <div className="flex items-center space-x-2 px-2 py-1.5">
                  <Checkbox 
                    id="ppd-payment"
                    checked={filterPaymentMethod.includes("PPD") && !filterPaymentMethod.includes("all")}
                    onCheckedChange={() => handlePaymentMethodChange("PPD")}
                    disabled={filterPaymentMethod.includes("all")}
                  />
                  <label htmlFor="ppd-payment" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    PPD
                  </label>
                </div>
              </SelectContent>
            </Select>
          </div>
          <Select value={filterDateType} onValueChange={(value: string) => setFilterDateType(value as "order_date" | "shipped_date" | "delivered_date" | "payment_captured_date" | "scanned_date")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Date Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="order_date">Order Date</SelectItem>
              <SelectItem value="shipped_date">Shipped Date</SelectItem>
              <SelectItem value="delivered_date">Delivered Date</SelectItem>
              <SelectItem value="scanned_date">Scanned Date</SelectItem>
              <SelectItem value="payment_captured_date">Payment Date</SelectItem>
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

        <Tabs defaultValue="reconciliation" className="space-y-4" onValueChange={(val) => { setActiveMainTab(val); }}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="payments">Payment Tables</TabsTrigger>
            <TabsTrigger value="credit_notes">Credit Notes ({filteredCreditNotes.length})</TabsTrigger>
            <TabsTrigger value="inventory">Inventory ({inventoryGrouped.length})</TabsTrigger>
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
                          <TableHead className="w-[120px]">Store</TableHead>
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
                          {paginatedReconciliation.map((record, index) => (
                            <ReconciliationTableRow
                              key={`${record.order_id || record.order_number}-${record.shipping_date}-${index}`}
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
                              ordersIndexMap={ordersIndexMap}
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

{/* moved SKU Dialog to Inventory tab */}

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credit_notes">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Credit Notes</CardTitle>
                <CardDescription>List of credit notes with global search and pagination</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[2000px]">
                    <div className="overflow-y-auto max-h-[450px]">
                      <Table className="w-max min-w-[2000px] table-auto">
                        <TableHeader>
                          <TableRow>
                            {creditNotesHeaders.map((h) => (
                              <TableHead key={h} className="whitespace-nowrap px-3 py-2 text-sm">{h}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedCreditNotes.map((note: any, idx: number) => (
                            <TableRow key={note.id ?? idx}>
                              {creditNotesHeaders.map((h) => (
                                <TableCell key={h} className="whitespace-nowrap px-3 py-2 text-sm">
                                  {String((note as any)[h] ?? 'N/A')}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                <PaginationControls
                  currentPage={creditNotesPage}
                  totalItems={filteredCreditNotes.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCreditNotesPage}
                  label="credit notes"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
                <CardDescription>SKU-wise summary from filtered orders with drilldown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search SKU..."
                      value={inventorySearchTerm}
                      onChange={(e) => setInventorySearchTerm(e.target.value)}
                      className="pl-10 py-3 text-base font-medium min-w-[280px]"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-[1000px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">SKU</TableHead>
                          <TableHead className="w-[240px]">Product</TableHead>
                          <TableHead className="w-[140px] text-right">Total Orders</TableHead>
                          <TableHead className="w-[140px] text-right">Scanned Out</TableHead>
                          <TableHead className="w-[140px] text-right">Scanned In</TableHead>
                          <TableHead className="w-[140px] text-right">Net Qty</TableHead>
                          
                        </TableRow>
                      </TableHeader>
                    </Table>
                    <div className="overflow-y-auto max-h-[450px]">
                      <Table>
                        <TableBody>
                          {paginatedInventory.map((row) => {
                            const isExpanded = expandedSkus.has(row.sku)
                            return (
                              <React.Fragment key={row.sku}>
                                <TableRow
                                  onClick={() => {
                                    setSelectedSku(row.sku)
                                    setSelectedSkuOrders(row.orders)
                                    setIsSkuDialogOpen(true)
                                  }}
                                  className="cursor-pointer"
                                >
                                  <TableCell className="w-[200px] font-mono">{row.sku || 'N/A'}</TableCell>
                                  <TableCell className="w-[240px]">{row.product_name}</TableCell>
                                  <TableCell className="w-[140px] text-right">{row.totalOrders}</TableCell>
                                  <TableCell className="w-[140px] text-right">{row.scanOutQty}</TableCell>
                                  <TableCell className="w-[140px] text-right">{row.scanInQty}</TableCell>
                                  <TableCell className="w-[140px] text-right">{row.netQty}</TableCell>
                                  
                                </TableRow>
                                {isExpanded && (
                                  <TableRow>
                                    <TableCell colSpan={6}>
                                      <div className="bg-muted/20 rounded-md p-3">
                                        <div className="overflow-x-auto">
                                          <div className="min-w-[900px]">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead className="w-[140px]">Order Number</TableHead>
                                                  <TableHead className="w-[120px]">Store</TableHead>
                                                  <TableHead className="w-[200px]">Product</TableHead>
                                                  <TableHead className="w-[100px] text-right">Qty</TableHead>
                                                  <TableHead className="w-[140px] text-right">Amount</TableHead>
                                                  <TableHead className="w-[160px]">Shipping Partner</TableHead>
                                                  <TableHead className="w-[140px]">Shipped Date</TableHead>
                                                  <TableHead className="w-[140px]">Order Status</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {row.orders.map((order) => (
                                                  <TableRow key={`${order.order_id}-${order.order_number}`}>
                                                    <TableCell className="w-[140px] font-medium">{order.shipped_order_number || order.order_number}</TableCell>
                                                    <TableCell className="w-[120px]"><Badge variant="secondary">{order.store || 'N/A'}</Badge></TableCell>
                                                    <TableCell className="w-[200px]">
                                                      <div>
                                                        <div className="font-medium">{order.product_name || 'N/A'}</div>
                                                        <div className="text-sm text-gray-500">SKU: {order.sku || 'N/A'}</div>
                                                      </div>
                                                    </TableCell>
                                                    <TableCell className="w-[100px] text-right">{order.quantity || 0}</TableCell>
                                                    <TableCell className="w-[140px] text-right">₹{(order.final_amount || 0).toFixed(2)}</TableCell>
                                                    <TableCell className="w-[160px]">{order.shipping_partner || 'N/A'}</TableCell>
                                                    <TableCell className="w-[140px]">{formatDateForDisplay(order.shipped_date)}</TableCell>
                                                    <TableCell className="w-[140px]">
                                                      <Badge
                                                        variant={
                                                          order.transaction_type === 'DELIVERED' || order.transaction_type === 'RTO Delivered' ? 'default' : 
                                                          order.transaction_type === 'IN-TRANSIT' || order.transaction_type === 'Scanned' ? 'secondary' : 
                                                          order.transaction_type === 'FAULT' || order.transaction_type === 'RTO' ? 'destructive' : 
                                                          'outline'
                                                        }
                                                      >
                                                        {order.transaction_type || 'N/A'}
                                                      </Badge>
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <PaginationControls
                      currentPage={inventoryPage}
                      totalItems={inventoryGrouped.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setInventoryPage}
                      label="inventory items"
                    />
                  </div>
                </div>
                {/* SKU Orders Modal */}
                <Dialog open={isSkuDialogOpen} onOpenChange={setIsSkuDialogOpen}>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Orders for {selectedSku || ''}</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-x-auto">
                      <div className="min-w-[900px] max-h-[450px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[160px]">Order Number</TableHead>
                              <TableHead className="w-[220px]">SKU</TableHead>
                              <TableHead className="w-[80px] text-right">Qty</TableHead>
                              <TableHead className="w-[280px]">Product</TableHead>
                              <TableHead className="w-[140px] text-right">Amount</TableHead>
                          <TableHead className="w-[140px]">Order Date</TableHead>
                          <TableHead className="w-[140px]">Shipped Date</TableHead>
                          <TableHead className="w-[140px]">Delivered Date</TableHead>
                          <TableHead className="w-[140px]">Scanned Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedSkuOrders.map((order) => (
                              <TableRow key={`${order.order_id}-${order.order_number}`}>
                                <TableCell className="w-[160px] font-medium">{order.shipped_order_number || order.order_number}</TableCell>
                                <TableCell className="w-[220px] font-mono">{order.sku || 'N/A'}</TableCell>
                                <TableCell className="w-[80px] text-right">{order.quantity || 0}</TableCell>
                                <TableCell className="w-[280px]">{order.product_name || 'N/A'}</TableCell>
                                <TableCell className="w-[140px] text-right">₹{(order.final_amount || 0).toFixed(2)}</TableCell>
                                <TableCell className="w-[140px]">{formatDateForDisplay(order.order_date)}</TableCell>
                                <TableCell className="w-[140px]">{formatDateForDisplay(order.shipped_date)}</TableCell>
                                <TableCell className="w-[140px]">{formatDateForDisplay(order.delivered_date)}</TableCell>
                                <TableCell className="w-[140px]">{formatDateForDisplay((order as any).scanned_date)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => {
                          const data = selectedSkuOrders.map((order) => ({
                            "Order Number": order.shipped_order_number || order.order_number,
                            SKU: order.sku || "N/A",
                            Qty: order.quantity || 0,
                            Product: order.product_name || "N/A",
                            Amount: (order.final_amount || 0).toFixed(2),
                            "Order Date": formatDateForDisplay(order.order_date),
                            "Shipped Date": formatDateForDisplay(order.shipped_date),
                            "Delivered Date": formatDateForDisplay(order.delivered_date),
                            "Scanned Date": formatDateForDisplay((order as any).scanned_date),
                          }))
                          const filename = `orders_${(selectedSku || 'sku').replace(/[^a-zA-Z0-9_-]/g, '')}.csv`
                          exportToCsv(data, filename)
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" /> Download CSV
                      </Button>
                      <Button variant="outline" onClick={() => setIsSkuDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                  <div className="min-w-[1400px]">
                    <div className="overflow-y-auto max-h-[450px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[140px]">Order Number</TableHead>
                            <TableHead className="w-[120px]">Store</TableHead>
                            <TableHead className="w-[200px]">Product</TableHead>
                            <TableHead className="w-[120px]">Order Amount</TableHead>
                            <TableHead className="w-[130px]">Payment Method</TableHead>
                            <TableHead className="w-[140px]">Shipping Partner</TableHead>
                            <TableHead className="w-[120px]">Delivered Date</TableHead>
                            <TableHead className="w-[120px]">Order Status</TableHead>
                            <TableHead className="w-[120px]">Order Date</TableHead>
                            <TableHead className="w-[120px]">Shipping Date</TableHead>
                            <TableHead className="w-[120px]">Scanned Date</TableHead>
                            <TableHead className="w-[120px]">Payment Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium w-[140px]">{order.shipped_order_number || order.order_number}</TableCell>
                              <TableCell className="w-[120px]">
                                <Badge variant="secondary">{order.store || "N/A"}</Badge>
                              </TableCell>
                              <TableCell className="w-[200px]">
                                <div>
                                  <div className="font-medium">{order.product_name || "N/A"}</div>
                                  <div className="text-sm text-gray-500">Qty: {order.quantity || 0}</div>
                                </div>
                              </TableCell>
                              <TableCell className="w-[120px]">₹{(order.final_amount || 0).toFixed(2)}</TableCell>
                              <TableCell className="w-[130px]">
                                <Badge variant="outline">{order.payment_method || "N/A"}</Badge>
                              </TableCell>
                              <TableCell className="w-[140px]">
                                <div className="flex items-center gap-1">
                                  <Truck className="h-3 w-3" />
                                  {order.shipping_partner || "N/A"}
                                </div>
                              </TableCell>
                              <TableCell className="w-[120px]">
                                {formatDateForDisplay(order.delivered_date)}
                              </TableCell>
                              <TableCell className="w-[120px]">
                                <Badge variant={
                                  order.transaction_type === 'DELIVERED' || order.transaction_type === 'RTO Delivered' ? 'default' : 
                                  order.transaction_type === 'IN-TRANSIT' || order.transaction_type === 'Scanned' ? 'secondary' : 
                                  order.transaction_type === 'FAULT' || order.transaction_type === 'RTO' ? 'destructive' : 
                                  'outline'
                                }>
                                  {order.transaction_type || "N/A"}
                                </Badge>
                              </TableCell>
                              <TableCell className="w-[120px]">{formatDateForDisplay(order.order_date)}</TableCell>
                              <TableCell className="w-[120px]">{formatDateForDisplay(order.shipped_date)}</TableCell>
                              <TableCell className="w-[120px]">{formatDateForDisplay((order as any).scanned_date)}</TableCell>
                              <TableCell className="w-[120px]">{formatDateForDisplay(order.payment_captured_date)}</TableCell>
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
                  <TabsList className="grid w-full grid-cols-10">
                    <TabsTrigger value="razorpay">Razorpay ({filteredPaymentTables.razorpay.length})</TabsTrigger>
                    <TabsTrigger value="gokwik">GoKwik ({filteredPaymentTables.gokwik.length})</TabsTrigger>
                    <TabsTrigger value="snapmint">Snapmint ({filteredPaymentTables.snapmint.length})</TabsTrigger>
                    <TabsTrigger value="shiprocket">Shiprocket ({filteredPaymentTables.shiprocket.length})</TabsTrigger>
                    <TabsTrigger value="nimbus">Nimbus ({filteredPaymentTables.nimbus.length})</TabsTrigger>
                    <TabsTrigger value="bluedart">BlueDart ({filteredPaymentTables.bluedart.length})</TabsTrigger>
                    <TabsTrigger value="delhivery">Delhivery ({filteredPaymentTables.delhivery.length})</TabsTrigger>
                    <TabsTrigger value="shipway">Shipway ({filteredPaymentTables.shipway.length})</TabsTrigger>
                    <TabsTrigger value="cred_pay">Cred Pay ({filteredPaymentTables.cred_pay.length})</TabsTrigger>
                    <TabsTrigger value="india_post">India Post ({filteredPaymentTables.india_post.length})</TabsTrigger>
                  </TabsList>

                  {Object.entries(filteredPaymentTables).map(([tableName, tableData]) => {
                    let paginatedData = paginatedPaymentTables[tableName as keyof PaymentTableData] || []
                    const currentPage = paymentTabPages[tableName as keyof PaymentTableData] || 1
                    const setCurrentPage = (page: number) => {
                      setPaymentTabPages(prev => ({ ...prev, [tableName]: page }))
                    }
                    // Custom sort for cred_pay and india_post
                    if (tableName === 'cred_pay' || tableName === 'india_post') {
                      const sortCfg = tableName === 'cred_pay' ? credPaySort : indiaPostSort
                      const fullData = filteredPaymentTables[tableName as keyof PaymentTableData] || []
                      const sorted = [...fullData].sort((a: any, b: any) => {
                        if (sortCfg.key === 'amount') {
                          const aAmt = Number(a["Credited Amount"]) || Number(a.Amount) || 0
                          const bAmt = Number(b["Credited Amount"]) || Number(b.Amount) || 0
                          return sortCfg.dir === 'asc' ? aAmt - bAmt : bAmt - aAmt
                        } else {
                          const aDate = new Date(a["Transaction Date"] || a.created_at).getTime() || 0
                          const bDate = new Date(b["Transaction Date"] || b.created_at).getTime() || 0
                          return sortCfg.dir === 'asc' ? aDate - bDate : bDate - aDate
                        }
                      })
                      const startIndex = (currentPage - 1) * itemsPerPage
                      const endIndex = startIndex + itemsPerPage
                      paginatedData = sorted.slice(startIndex, endIndex)
                    }
                    
                    return (
                      <TabsContent key={tableName} value={tableName}>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                              {["shiprocket", "nimbus", "bluedart", "delhivery", "india_post"].includes(tableName) ? (
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
                              <div className="border rounded-lg">
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
                                    </Table>
                                  </div>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                  <div className="overflow-x-auto">
                                    <div className="min-w-[1000px]">
                                      <Table>
                                        <TableBody>
                                      {paginatedData.map((record: any, index: number) => (
                                        tableName === 'cred_pay' ? (
                                          <TableRow key={`cred_pay-${record.id || index}`}>
                                            <TableCell className="w-[200px]">{record.order_id || "N/A"}</TableCell>
                                            <TableCell className="w-[150px]">₹{(Number(record["Credited Amount"]) || 0).toFixed(2)}</TableCell>
                                            <TableCell className="w-[200px]">{record["Payment ID"] || 'N/A'}</TableCell>
                                            <TableCell className="w-[200px]">{record.payment_method || 'N/A'}</TableCell>
                                            <TableCell className="w-[150px]">{formatDateForDisplay(record["Transaction Date"] || record.created_at)}</TableCell>
                                          </TableRow>
                                        ) : tableName === 'india_post' ? (
                                          <TableRow key={`india_post-${record.id || index}`}>
                                            <TableCell className="w-[200px]">{record.order_id || "N/A"}</TableCell>
                                            <TableCell className="w-[150px]">₹{(Number(record["Credited Amount"]) || Number(record.Amount) || 0).toFixed(2)}</TableCell>
                                            <TableCell className="w-[200px]">{record.AWB || 'N/A'}</TableCell>
                                            <TableCell className="w-[200px]">{record["Order Number"] || 'N/A'}</TableCell>
                                            <TableCell className="w-[150px]">{formatDateForDisplay(record["Transaction Date"] || record.created_at)}</TableCell>
                                          </TableRow>
                                        ) : (
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
                                        )
                                      ))}
                                        </TableBody>
                                      </Table>
                                     </div>
                                   </div>
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
