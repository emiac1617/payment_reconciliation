import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Truck, User, ShoppingCart, Info } from "lucide-react"

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
  payment_captured_date?: string
  product_name: string
  quantity: number
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  sku?: string
  hsn_code?: string
  igst?: number
}

interface ReconciliationRecord {
  order_id: string
  order_number: string
  shipping_date: string
  order_amount: number
  payment_amount: number
  status: "matched" | "discrepancy" | "match_pending" | "orphaned_order"
  difference: number
  payment_sources: string[]
}

interface ReconciliationDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  reconciliationRecord: ReconciliationRecord
  orderDetail?: Order
  payments: any[]
  shipping: any[]
}

export function ReconciliationDetailDialog({
  isOpen,
  onClose,
  reconciliationRecord,
  orderDetail,
  payments,
  shipping,
}: ReconciliationDetailDialogProps) {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "matched":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Matched
          </Badge>
        )
      case "discrepancy":
        return <Badge variant="destructive">Discrepancy</Badge>
      case "match_pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Match Pending
          </Badge>
        )
      case "orphaned_order":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            Orphaned Order
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Order Reconciliation Details</DialogTitle>
          <DialogDescription>
            Comprehensive view of order <span className="font-semibold">{reconciliationRecord.order_number}</span> and
            its associated payments and shipping.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Reconciliation Summary */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" /> Reconciliation Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                {getStatusBadge(reconciliationRecord.status)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Order Amount:</span>
                <span className="font-medium">₹{reconciliationRecord.order_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Received:</span>
                <span className="font-medium">₹{reconciliationRecord.payment_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Difference:</span>
                <span
                  className={`font-medium ${reconciliationRecord.difference !== 0 ? "text-red-600" : "text-green-600"}`}
                >
                  ₹{reconciliationRecord.difference.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center col-span-full">
                <span className="text-muted-foreground">Payment Sources:</span>
                <div className="flex flex-wrap gap-1">
                  {reconciliationRecord.payment_sources.length > 0 ? (
                    reconciliationRecord.payment_sources.map((source) => (
                      <Badge key={source} variant="outline" className="text-xs">
                        {source}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="secondary">None</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          {orderDetail && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-orange-500" /> Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-medium">{orderDetail.order_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Order Number:</span>
                  <span className="font-medium">{orderDetail.order_number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-medium">
                    {orderDetail.product_name || "N/A"} (Qty: {orderDetail.quantity || 0})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-medium">{orderDetail.payment_method || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Order Date:</span>
                  <span className="font-medium">{formatDateForDisplay(orderDetail.order_date)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Shipping Partner:</span>
                  <span className="font-medium">{orderDetail.shipping_partner || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Shipping Date:</span>
                  <span className="font-medium">{formatDateForDisplay(orderDetail.shipped_date)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Date:</span>
                  <span className="font-medium">{formatDateForDisplay(orderDetail.payment_captured_date)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Order State:</span>
                  <span className="font-medium">{orderDetail.state || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">SKU:</span>
                  <span className="font-medium">{orderDetail.sku || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">HSN Code:</span>
                  <span className="font-medium">{orderDetail.hsn_code || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">IGST:</span>
                  <span className="font-medium">{orderDetail.igst ? `${orderDetail.igst.toFixed(2)}%` : "N/A"}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Details */}
          {orderDetail?.customer_name && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-500" /> Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{orderDetail.customer_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{orderDetail.customer_email || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{orderDetail.customer_phone || "N/A"}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Records */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" /> Payment Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment, index) => (
                    <div key={index} className="border rounded-md p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Gateway:</span>
                          <Badge variant="secondary">{payment.gateway}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-medium">
                            ₹{(payment.gateway === "snapmint" ? payment["Order Value"] || 0 : payment.amount || payment.Amount || payment.cod_amount || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">ID:</span>
                          <span className="font-medium">
                            {payment.payment_id || payment["Payment Id"] || payment.waybill_num || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Method:</span>
                          <span className="font-medium">
                            {payment.method || payment["Payment Method"] || payment.payment_type || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-medium">
                            {formatDateForDisplay(
                              payment.createdAt ||
                                payment["Transaction Date"] ||
                                payment.pickup_date ||
                                payment.created_at,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No payment records found for this order.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Records */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-500" /> Shipping Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shipping.length > 0 ? (
                <div className="space-y-4">
                  {shipping.map((shipment, index) => (
                    <div key={index} className="border rounded-md p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Partner:</span>
                          <Badge variant="secondary">{shipment.partner}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">AWB/Tracking:</span>
                          <span className="font-medium">
                            {shipment.awb_number || shipment.awb || shipment.waybill_num || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant="outline">{shipment.status || "N/A"}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-medium">
                            ₹{(shipment.amount || shipment.product_value || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-medium">
                            {formatDateForDisplay(
                              shipment.delivered_date ||
                                shipment.pick_up_date ||
                                shipment.pickup_date ||
                                shipment.status_date ||
                                shipment.created_at,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Truck className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No shipping records found for this order.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
