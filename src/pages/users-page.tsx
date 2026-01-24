/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Edit,
  Trash2,
  Users,
  RefreshCw,
  Shield,
  ShieldOff,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import {
  useUsers,
  useUpdateUser,
  useDeleteUser,
  useToggleUserBlock,
  useUserStats,
  useUserDevices,
  useRemoveUserDevice,
} from "@/hooks/use-users";
import type { User } from "@/types/api";

// Form schemas
const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),
  email: z.string().email("Please provide a valid email address"),
  phone: z.string().optional(),
  academicYear: z.string().min(1, "Academic year is required"),
  semester: z.string().min(1, "Semester is required"),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export function UsersPage() {
  const { hasPermission } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [blockedFilter, setBlockedFilter] = useState<string>("all");
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewingDevicesUser, setViewingDevicesUser] = useState<User | null>(
    null
  );
  const [isDevicesDialogOpen, setIsDevicesDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [removeDeviceId, setRemoveDeviceId] = useState<string>("");
  const [isRemoveDeviceDialogOpen, setIsRemoveDeviceDialogOpen] =
    useState(false);

  // Queries
  const {
    data: usersData,
    isLoading,
    refetch,
  } = useUsers({
    page: currentPage,
    limit: 10,
    search: searchTerm || undefined,
    blocked: blockedFilter === "all" ? undefined : blockedFilter === "true",
    emailVerified:
      emailVerifiedFilter === "all"
        ? undefined
        : emailVerifiedFilter === "true",
  });

  const { data: statsData } = useUserStats();
  const { data: devicesData } = useUserDevices(viewingDevicesUser?._id || "");

  // Mutations
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const toggleUserBlockMutation = useToggleUserBlock();
  const removeDeviceMutation = useRemoveUserDevice();

  // Forms
  const updateForm = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      academicYear: "",
      semester: "",
    },
  });

  // Handlers
  const handleUpdateUser = async (data: UpdateUserFormData) => {
    if (!editingUser) return;

    try {
      await updateUserMutation.mutateAsync({ id: editingUser._id, data });
      toast.success("User updated successfully!");
      setIsEditDialogOpen(false);
      setEditingUser(null);
      updateForm.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update user"
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeleteUserId(userId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    try {
      await deleteUserMutation.mutateAsync(deleteUserId);
      toast.success("User deleted successfully!");
      setIsDeleteDialogOpen(false);
      setDeleteUserId("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete user"
      );
    }
  };

  const handleToggleUserBlock = async (
    userId: string,
    currentStatus: boolean
  ) => {
    try {
      await toggleUserBlockMutation.mutateAsync({
        id: userId,
        blocked: !currentStatus,
      });
      toast.success(
        `User ${!currentStatus ? "blocked" : "unblocked"} successfully!`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update user status"
      );
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    updateForm.reset({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || "",
      academicYear: user.academicYear,
      semester: user.semester,
    });
    setIsEditDialogOpen(true);
  };

  const handleViewDevices = (user: User) => {
    setViewingDevicesUser(user);
    setIsDevicesDialogOpen(true);
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!viewingDevicesUser) return;
    setRemoveDeviceId(deviceId);
    setIsRemoveDeviceDialogOpen(true);
  };

  const confirmRemoveDevice = async () => {
    if (!viewingDevicesUser) return;
    try {
      await removeDeviceMutation.mutateAsync({
        id: viewingDevicesUser._id,
        deviceId: removeDeviceId,
      });
      toast.success("Device removed successfully!");
      setIsRemoveDeviceDialogOpen(false);
      setRemoveDeviceId("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove device"
      );
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    refetch();
  };

  const handleBlockedFilterChange = (value: string) => {
    setBlockedFilter(value);
    setCurrentPage(1);
  };

  const handleEmailVerifiedFilterChange = (value: string) => {
    setEmailVerifiedFilter(value);
    setCurrentPage(1);
  };

  const canRead = hasPermission("read_users");
  const canUpdate = hasPermission("update_users");
  const canDelete = hasPermission("delete_users");

  if (!canRead) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-500">
            You don't have permission to view users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">
            Manage student accounts and their enrollments.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.total || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Verified Users
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.verified || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unverified Users
            </CardTitle>
            <ShieldOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.unverified || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Users</CardTitle>
            <ShieldOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.blocked || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage student accounts and their information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={blockedFilter}
              onValueChange={handleBlockedFilterChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="false">Active</SelectItem>
                <SelectItem value="true">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={emailVerifiedFilter}
              onValueChange={handleEmailVerifiedFilterChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verification</SelectItem>
                <SelectItem value="true">Verified</SelectItem>
                <SelectItem value="false">Unverified</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : usersData?.data?.items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  usersData?.data?.items?.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">
                        {user.fullName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {typeof user.universityId === "object"
                          ? typeof user.universityId.name === "string"
                            ? user.universityId.name
                            : (user.universityId.name as any)?.en || "N/A"
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {typeof user.facultyId === "object"
                          ? (user.facultyId.name as any)?.en || "N/A"
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {user.academicYear} - {user.semester}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={user.blocked ? "destructive" : "default"}
                          >
                            {user.blocked ? "Blocked" : "Active"}
                          </Badge>
                          {canUpdate && (
                            <Switch
                              checked={!user.blocked}
                              onCheckedChange={() =>
                                handleToggleUserBlock(user._id, user.blocked)
                              }
                              disabled={toggleUserBlockMutation.isPending}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.emailVerified ? "default" : "secondary"}
                        >
                          {user.emailVerified ? "Verified" : "Unverified"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDevices(user)}
                        >
                          <Smartphone className="h-4 w-4 mr-1" />
                          {user.devices?.length || 0}
                        </Button>
                        {canUpdate && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {usersData?.data?.pagination && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {(usersData.data.pagination.currentPage - 1) *
                  usersData.data.pagination.itemsPerPage +
                  1}{" "}
                to{" "}
                {Math.min(
                  usersData.data.pagination.currentPage *
                    usersData.data.pagination.itemsPerPage,
                  usersData.data.pagination.totalItems
                )}{" "}
                of {usersData.data.pagination.totalItems} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!usersData.data.pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!usersData.data.pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information.</DialogDescription>
          </DialogHeader>
          <Form {...updateForm}>
            <form
              onSubmit={updateForm.handleSubmit(handleUpdateUser)}
              className="space-y-4"
            >
              <FormField
                control={updateForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="academicYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1st Year">1st Year</SelectItem>
                        <SelectItem value="2nd Year">2nd Year</SelectItem>
                        <SelectItem value="3rd Year">3rd Year</SelectItem>
                        <SelectItem value="4th Year">4th Year</SelectItem>
                        <SelectItem value="5th Year">5th Year</SelectItem>
                        <SelectItem value="6th Year">6th Year</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Fall">Fall</SelectItem>
                        <SelectItem value="Spring">Spring</SelectItem>
                        <SelectItem value="Summer">Summer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? "Updating..." : "Update User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* User Devices Dialog */}
      <Dialog open={isDevicesDialogOpen} onOpenChange={setIsDevicesDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>User Devices</DialogTitle>
            <DialogDescription>
              Manage {viewingDevicesUser?.fullName}'s devices
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {devicesData?.data?.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No devices found for this user.
              </p>
            ) : (
              devicesData?.data?.map((device) => (
                <div
                  key={device.deviceId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span className="font-medium">{device.deviceName}</span>
                      <Badge
                        variant={device.isVerified ? "default" : "secondary"}
                      >
                        {device.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <p>Type: {device.deviceType}</p>
                      <p>
                        Last used: {new Date(device.lastUsed).toLocaleString()}
                      </p>
                      <p>IP: {device.ipAddress}</p>
                    </div>
                  </div>
                  {canUpdate && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveDevice(device.deviceId)}
                      disabled={removeDeviceMutation.isPending}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setIsDevicesDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Device Alert Dialog */}
      <AlertDialog
        open={isRemoveDeviceDialogOpen}
        onOpenChange={setIsRemoveDeviceDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Device</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this device? The user will need to
              re-authenticate on this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveDevice}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
