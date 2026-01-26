/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Search,
  RefreshCw,
  Users,
  XCircle,
  CheckCircle,
  Clock,
  ArrowLeftRight,
} from "lucide-react";
import { useEnrollments } from "../hooks/use-enrollments";
import type { EnrollmentFilters, RefundRequest } from "../types/api";
import { format } from "date-fns";

export function EnrollmentsPage() {
  const [filters, setFilters] = useState<
    EnrollmentFilters & { page?: number; limit?: number; search?: string }
  >({
    page: 1,
    limit: 10,
    search: "",
    status: undefined,
    isActive: undefined,
    fullAccess: undefined,
  });

  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<string | null>(
    null
  );
  const [refundAmount, setRefundAmount] = useState<string>("");

  const {
    enrollments,
    pagination,
    stats,
    isLoading,
    isStatsLoading,
    isRefunding,
    isCancelling,
    handleRefund,
    handleCancel,
    refreshEnrollments,
  } = useEnrollments(filters);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleSearch = (searchTerm: string) => {
    setFilters((prev) => ({
      ...prev,
      search: searchTerm,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleRefundSubmit = () => {
    if (selectedEnrollment) {
      const refundData: RefundRequest | undefined = refundAmount
        ? { amount: parseFloat(refundAmount) }
        : undefined;
      handleRefund(selectedEnrollment, refundData);
      setRefundDialogOpen(false);
      setSelectedEnrollment(null);
      setRefundAmount("");
    }
  };

  const handleCancelSubmit = () => {
    if (selectedEnrollment) {
      handleCancel(selectedEnrollment);
      setCancelDialogOpen(false);
      setSelectedEnrollment(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, icon: Clock, label: "Pending" },
      completed: {
        variant: "default" as const,
        icon: CheckCircle,
        label: "Completed",
      },
      failed: {
        variant: "destructive" as const,
        icon: XCircle,
        label: "Failed",
      },
      refunded: {
        variant: "outline" as const,
        icon: ArrowLeftRight,
        label: "Refunded",
      },
      cancelled: {
        variant: "secondary" as const,
        icon: XCircle,
        label: "Cancelled",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getActionButtons = (enrollment: any) => {
    const { _id, paymentStatus } = enrollment;

    if (paymentStatus === "pending") {
      return (
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setSelectedEnrollment(_id)}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Cancel"
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Enrollment</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this enrollment? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCancelDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelSubmit}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Yes, Cancel Enrollment"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    if (paymentStatus === "completed") {
      return (
        <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedEnrollment(_id)}
              disabled={isRefunding}
            >
              {isRefunding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Refund"
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Refund Enrollment</DialogTitle>
              <DialogDescription>
                Process a refund for this enrollment. Leave amount empty for
                full refund.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="refund-amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="refund-amount"
                  type="number"
                  step="0.01"
                  placeholder="Leave empty for full refund"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRefundDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleRefundSubmit} disabled={isRefunding}>
                {isRefunding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Process Refund"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    return null;
  };

  const formatCurrency = (amount: number, currency: string = "ils") => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "MMM dd, yyyy HH:mm");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enrollments</h1>
          <p className="text-muted-foreground">
            Manage and monitor course enrollments
          </p>
        </div>
        <Button onClick={refreshEnrollments} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Enrollments
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.totalEnrollments || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Payments
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.completedPayments || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payments
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.pendingPayments || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <span className="text-muted-foreground text-sm font-semibold">₪</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                formatCurrency(stats?.totalRevenue || 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter enrollments by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search enrollments..."
                  value={filters.search || ""}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Payment Status</Label>
              <Select
                value={filters.status || ""}
                onValueChange={(value) =>
                  handleFilterChange("status", value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="access">Access Type</Label>
              <Select
                value={filters.fullAccess?.toString() || ""}
                onValueChange={(value) =>
                  handleFilterChange(
                    "fullAccess",
                    value === "" ? undefined : value === "true"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All access types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All access types</SelectItem>
                  <SelectItem value="true">Full Access</SelectItem>
                  <SelectItem value="false">Individual Topics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="active">Status</Label>
              <Select
                value={filters.isActive?.toString() || ""}
                onValueChange={(value) =>
                  handleFilterChange(
                    "isActive",
                    value === "" ? undefined : value === "true"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollments</CardTitle>
          <CardDescription>
            {pagination?.totalItems || 0} total enrollments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No enrollments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      enrollments.map((enrollment: any) => (
                        <TableRow key={enrollment._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {enrollment.userId?.fullName || "N/A"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {enrollment.userId?.email || "N/A"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {typeof enrollment.courseId?.name === "string"
                                  ? enrollment.courseId.name
                                  : enrollment.courseId?.name?.en || "N/A"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {enrollment.courseId?.instructorId?.userName ||
                                  "N/A"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                enrollment.fullAccess ? "default" : "secondary"
                              }
                            >
                              {enrollment.fullAccess
                                ? "Full Course"
                                : "Individual Topics"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {formatCurrency(
                                  enrollment.finalAmount,
                                  enrollment.currency
                                )}
                              </div>
                              {enrollment.discountAmount > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  Discount:{" "}
                                  {formatCurrency(
                                    enrollment.discountAmount,
                                    enrollment.currency
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(enrollment.paymentStatus)}
                          </TableCell>
                          <TableCell>
                            {formatDate(enrollment.createdAt)}
                          </TableCell>
                          <TableCell>{getActionButtons(enrollment)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}{" "}
                    to{" "}
                    {Math.min(
                      pagination.currentPage * pagination.itemsPerPage,
                      pagination.totalItems
                    )}{" "}
                    of {pagination.totalItems} entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                      disabled={!pagination.hasPrev}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                      disabled={!pagination.hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
