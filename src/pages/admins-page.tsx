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
  DialogTrigger,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  RefreshCw,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import {
  useAdmins,
  useCreateAdmin,
  useUpdateAdmin,
  useDeleteAdmin,
  useAdminStats,
  useAllRoles,
  useUpdateAdminPassword,
} from "@/hooks/use-admins";
import type { Admin } from "@/types/api";
import { PasswordInput } from "@/components/ui/password-input";
import { getErrorMessage } from "@/utils/error-utils";

// Form schemas
const createAdminSchema = z.object({
  userName: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Username can only contain letters, numbers, dots, hyphens, and underscores"
    )
    .regex(/^[a-zA-Z0-9]/, "Username must start with alphanumeric character")
    .regex(/[a-zA-Z0-9]$/, "Username must end with alphanumeric character"),
  email: z.string().email("Please provide a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least 8 characters with uppercase, lowercase, number, and special character"
    ),
  roleId: z.string().min(1, "Role is required"),
  phone: z.string().optional(),
});

const updateAdminSchema = z.object({
  userName: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Username can only contain letters, numbers, dots, hyphens, and underscores"
    )
    .regex(/^[a-zA-Z0-9]/, "Username must start with alphanumeric character")
    .regex(/[a-zA-Z0-9]$/, "Username must end with alphanumeric character"),
  email: z.string().email("Please provide a valid email address"),
  roleId: z.string().min(1, "Role is required"),
  phone: z.string().optional(),
});

const updatePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least 8 characters with uppercase, lowercase, number, and special character"
    ),
});

type CreateAdminFormData = z.infer<typeof createAdminSchema>;
type UpdateAdminFormData = z.infer<typeof updateAdminSchema>;
type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

export function AdminsPage() {
  const { hasPermission } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordAdminId, setPasswordAdminId] = useState<string>("");
  const [deleteAdminId, setDeleteAdminId] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Queries
  const {
    data: adminsData,
    isLoading,
    refetch,
  } = useAdmins({
    page: currentPage,
    limit: 10,
    search: searchTerm || undefined,
    isActive: isActiveFilter === "all" ? undefined : isActiveFilter === "true",
  });

  const { data: statsData } = useAdminStats();
  const { data: rolesData } = useAllRoles();

  // Mutations
  const createAdminMutation = useCreateAdmin();
  const updateAdminMutation = useUpdateAdmin();
  const deleteAdminMutation = useDeleteAdmin();
  const updateAdminPasswordMutation = useUpdateAdminPassword();

  // Forms
  const createForm = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      userName: "",
      email: "",
      password: "",
      roleId: "",
      phone: "",
    },
  });

  const updateForm = useForm<UpdateAdminFormData>({
    resolver: zodResolver(updateAdminSchema),
    defaultValues: {
      userName: "",
      email: "",
      roleId: "",
      phone: "",
    },
  });

  const passwordForm = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      newPassword: "",
    },
  });

  // Handlers
  const handleCreateAdmin = async (data: CreateAdminFormData) => {
    try {
      await createAdminMutation.mutateAsync(data);
      toast.success("Admin created successfully!");
      setIsCreateDialogOpen(false);
      createForm.reset();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create admin"));
    }
  };

  const handleUpdateAdmin = async (data: UpdateAdminFormData) => {
    if (!editingAdmin) return;

    try {
      await updateAdminMutation.mutateAsync({ id: editingAdmin._id, data });
      toast.success("Admin updated successfully!");
      setIsEditDialogOpen(false);
      setEditingAdmin(null);
      updateForm.reset();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update admin"));
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    setDeleteAdminId(adminId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAdmin = async () => {
    try {
      await deleteAdminMutation.mutateAsync(deleteAdminId);
      toast.success("Admin deleted successfully!");
      setIsDeleteDialogOpen(false);
      setDeleteAdminId("");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete admin"));
    }
  };

  const handleToggleAdminStatus = async (
    adminId: string,
    currentStatus: boolean
  ) => {
    try {
      await updateAdminMutation.mutateAsync({
        id: adminId,
        data: { isActive: !currentStatus },
      });
      toast.success(
        `Admin ${!currentStatus ? "activated" : "deactivated"} successfully!`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update admin status"
      );
    }
  };

  const handleEditAdmin = (admin: Admin) => {
    setEditingAdmin(admin);
    updateForm.reset({
      userName: admin.userName,
      email: admin.email,
      roleId: admin.roleId._id,
      phone: admin.phone || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePassword = async (data: UpdatePasswordFormData) => {
    try {
      await updateAdminPasswordMutation.mutateAsync({
        id: passwordAdminId,
        password: data.newPassword,
      });
      toast.success("Password updated successfully!");
      setIsPasswordDialogOpen(false);
      setPasswordAdminId("");
      passwordForm.reset();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update password"));
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    refetch();
  };

  const handleFilterChange = (value: string) => {
    setIsActiveFilter(value);
    setCurrentPage(1);
  };

  const canCreate = hasPermission("create_admins");
  const canUpdate = hasPermission("update_admins");
  const canDelete = hasPermission("delete_admins");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Management</h1>
          <p className="text-gray-600">
            Manage administrator accounts and their permissions.
          </p>
        </div>
        {canCreate && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Admin</DialogTitle>
                <DialogDescription>
                  Create a new administrator account.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(handleCreateAdmin)}
                  className="space-y-4"
                >
                  <FormField
                    control={createForm.control}
                    name="userName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
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
                    control={createForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="Enter password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="roleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {rolesData?.data?.map((role) => (
                              <SelectItem key={role._id} value={role._id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
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
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createAdminMutation.isPending}
                    >
                      {createAdminMutation.isPending
                        ? "Creating..."
                        : "Create Admin"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.totalAdmins || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.activeAdmins || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Admins
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.inactiveAdmins || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Administrators</CardTitle>
          <CardDescription>
            Manage administrator accounts and their roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search admins..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-8"
                />
              </div>
            <Select value={isActiveFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Admins Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading admins...
                    </TableCell>
                  </TableRow>
                ) : adminsData?.data?.items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No admins found.
                    </TableCell>
                  </TableRow>
                ) : (
                  adminsData?.data?.items?.map((admin) => (
                    <TableRow key={admin._id}>
                      <TableCell className="font-medium">
                        {admin.userName}
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{admin.roleId.name}</Badge>
                      </TableCell>
                      <TableCell>{admin.phone || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={admin.isActive ? "default" : "secondary"}
                        >
                          {admin.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={admin.isActive}
                          onCheckedChange={() =>
                            handleToggleAdminStatus(admin._id, admin.isActive)
                          }
                          disabled={updateAdminMutation.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        {admin.lastLogin
                          ? new Date(admin.lastLogin).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                          {canUpdate && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditAdmin(admin)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPasswordAdminId(admin._id);
                                  setIsPasswordDialogOpen(true);
                                }}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {canDelete && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteAdmin(admin._id)}
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
          {adminsData?.data?.pagination && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {(adminsData.data.pagination.currentPage - 1) *
                  adminsData.data.pagination.itemsPerPage +
                  1}{" "}
                to{" "}
                {Math.min(
                  adminsData.data.pagination.currentPage *
                    adminsData.data.pagination.itemsPerPage,
                  adminsData.data.pagination.totalItems
                )}{" "}
                of {adminsData.data.pagination.totalItems} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!adminsData.data.pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!adminsData.data.pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>
              Update administrator information.
            </DialogDescription>
          </DialogHeader>
          <Form {...updateForm}>
            <form
              onSubmit={updateForm.handleSubmit(handleUpdateAdmin)}
              className="space-y-4"
            >
              <FormField
                control={updateForm.control}
                name="userName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
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
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rolesData?.data?.map((role) => (
                          <SelectItem key={role._id} value={role._id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateAdminMutation.isPending}>
                  {updateAdminMutation.isPending
                    ? "Updating..."
                    : "Update Admin"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Update the administrator's password.
            </DialogDescription>
          </DialogHeader>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(handleUpdatePassword)}
              className="space-y-4"
            >
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Enter new password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPasswordDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateAdminPasswordMutation.isPending}
                >
                  {updateAdminPasswordMutation.isPending
                    ? "Updating..."
                    : "Update Password"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Admin Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this admin? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAdmin}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
