import React, { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useHardDeleteRole,
  useRoleStats,
} from "@/hooks/use-roles";
import type {
  Role,
  PermissionGroup,
} from "@/types/api";
import { useAllPermissions } from "@/hooks/use-permissions";

// Form schemas
const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name cannot exceed 50 characters"),
  permissions: z.array(z.string()).optional(),
});

const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name cannot exceed 50 characters"),
  permissions: z.array(z.string()).optional(),
});

type CreateRoleFormData = z.infer<typeof createRoleSchema>;
type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;

// Component for displaying grouped permissions
interface GroupedPermissionsProps {
  permissionGroups: PermissionGroup[];
  selectedPermissions: string[];
  onPermissionChange: (permissionId: string, checked: boolean) => void;
  onSelectAllInGroup: (resource: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}

function GroupedPermissions({
  permissionGroups,
  selectedPermissions,
  onPermissionChange,
  onSelectAllInGroup,
  onSelectAll,
}: GroupedPermissionsProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (resource: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(resource)) {
      newExpanded.delete(resource);
    } else {
      newExpanded.add(resource);
    }
    setExpandedGroups(newExpanded);
  };

  const getTotalPermissions = () =>
    permissionGroups.reduce(
      (total, group) => total + group.permissions.length,
      0
    );
  const getSelectedCount = () => selectedPermissions.length;
  const isAllSelected =
    getTotalPermissions() > 0 && getSelectedCount() === getTotalPermissions();

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      {/* Select All */}
      <div
        className="flex items-center space-x-2 p-3 bg-muted rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          id="select-all-permissions"
          checked={isAllSelected}
          onCheckedChange={onSelectAll}
          onClick={(e) => e.stopPropagation()}
        />
        <label
          htmlFor="select-all-permissions"
          className="text-sm font-medium cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          Select All Permissions ({getSelectedCount()}/{getTotalPermissions()})
        </label>
      </div>

      {/* Permission Groups */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {permissionGroups.map((group) => {
          const groupSelectedCount = group.permissions.filter((p) =>
            selectedPermissions.includes(p._id)
          ).length;
          const isGroupAllSelected =
            group.permissions.length > 0 &&
            groupSelectedCount === group.permissions.length;
          const isExpanded = expandedGroups.has(group.resource);

          return (
            <div
              key={group.resource}
              className="border rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 bg-muted/50">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => toggleGroup(group.resource, e)}
                    className="h-6 w-6 p-0"
                    type="button"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <Checkbox
                    id={`select-all-${group.resource}`}
                    checked={isGroupAllSelected}
                    onCheckedChange={(checked) => {
                      onSelectAllInGroup(group.resource, checked === true);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label
                    htmlFor={`select-all-${group.resource}`}
                    className="text-sm font-medium cursor-pointer capitalize"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {group.resource} ({groupSelectedCount}/
                    {group.permissions.length})
                  </label>
                </div>
              </div>

              {isExpanded && (
                <div
                  className="p-3 space-y-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {group.permissions.map((permission) => (
                    <div
                      key={permission._id}
                      className="flex items-center space-x-3 ml-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        id={permission._id}
                        checked={selectedPermissions.includes(permission._id)}
                        onCheckedChange={(checked) => {
                          onPermissionChange(permission._id, checked === true);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <label
                        htmlFor={permission._id}
                        className="text-sm cursor-pointer flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {permission.name.replace(/_/g, " ")}
                      </label>
                      <Badge variant="outline" className="text-xs">
                        {permission.action}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RolesPage() {
  const { hasPermission } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Queries
  const {
    data: rolesData,
    isLoading,
    refetch,
  } = useRoles({
    page: currentPage,
    limit: 10,
    search: searchTerm || undefined,
    isActive: isActiveFilter === "all" ? undefined : isActiveFilter === "true",
  });

  const { data: statsData } = useRoleStats();
  const { data: permissionsData } = useAllPermissions();

  // Mutations
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();

  const hardDeleteRoleMutation = useHardDeleteRole(); // Hard delete (for delete button)

  // Forms
  const createForm = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: "",
      permissions: [],
    },
  });

  const updateForm = useForm<UpdateRoleFormData>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      name: "",
      permissions: [],
    },
  });

  // Handlers
  const handleCreateRole = async (data: CreateRoleFormData) => {
    try {
      await createRoleMutation.mutateAsync({
        name: data.name,
        permissions: data.permissions || [],
      });
      toast.success("Role created successfully!");
      setIsCreateDialogOpen(false);
      createForm.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create role"
      );
    }
  };

  const handleUpdateRole = async (data: UpdateRoleFormData) => {
    if (!editingRole) return;

    try {
      await updateRoleMutation.mutateAsync({ id: editingRole._id, data });
      toast.success("Role updated successfully!");
      setIsEditDialogOpen(false);
      setEditingRole(null);
      updateForm.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update role"
      );
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await hardDeleteRoleMutation.mutateAsync(roleId);
      toast.success("Role deleted permanently!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete role"
      );
    }
  };

  const handleToggleRoleStatus = async (
    roleId: string,
    currentStatus: boolean
  ) => {
    try {
      await updateRoleMutation.mutateAsync({
        id: roleId,
        data: { isActive: !currentStatus },
      });
      toast.success(
        `Role ${!currentStatus ? "activated" : "deactivated"} successfully!`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update role status"
      );
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    updateForm.reset({
      name: role.name,
      permissions: role.permissions.map((p) => p._id),
    });
    setIsEditDialogOpen(true);
  };

  // Helper functions for permission handling
  const getAllPermissionIds = () => {
    if (!permissionsData?.data) return [];
    return permissionsData.data.flatMap((group) =>
      group.permissions.map((p) => p._id)
    );
  };

  const handleSelectAllPermissions = (checked: boolean) => {
    if (checked) {
      createForm.setValue("permissions", getAllPermissionIds());
    } else {
      createForm.setValue("permissions", []);
    }
  };

  const handleSelectAllPermissionsInGroup = (
    resource: string,
    checked: boolean
  ) => {
    const group = permissionsData?.data?.find((g) => g.resource === resource);
    if (!group) return;

    const currentPermissions = createForm.watch("permissions") || [];
    const groupPermissionIds = group.permissions.map((p) => p._id);

    if (checked) {
      // Add all permissions from this group
      const newPermissions = [
        ...new Set([...currentPermissions, ...groupPermissionIds]),
      ];
      createForm.setValue("permissions", newPermissions);
    } else {
      // Remove all permissions from this group
      const newPermissions = currentPermissions.filter(
        (id) => !groupPermissionIds.includes(id)
      );
      createForm.setValue("permissions", newPermissions);
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    const currentPermissions = createForm.watch("permissions") || [];

    if (checked) {
      createForm.setValue("permissions", [...currentPermissions, permissionId]);
    } else {
      createForm.setValue(
        "permissions",
        currentPermissions.filter((id) => id !== permissionId)
      );
    }
  };

  // Similar functions for update form
  const handleUpdateSelectAllPermissions = (checked: boolean) => {
    if (checked) {
      updateForm.setValue("permissions", getAllPermissionIds());
    } else {
      updateForm.setValue("permissions", []);
    }
  };

  const handleUpdateSelectAllPermissionsInGroup = (
    resource: string,
    checked: boolean
  ) => {
    const group = permissionsData?.data?.find((g) => g.resource === resource);
    if (!group) return;

    const currentPermissions = updateForm.watch("permissions") || [];
    const groupPermissionIds = group.permissions.map((p) => p._id);

    if (checked) {
      const newPermissions = [
        ...new Set([...currentPermissions, ...groupPermissionIds]),
      ];
      updateForm.setValue("permissions", newPermissions);
    } else {
      const newPermissions = currentPermissions.filter(
        (id) => !groupPermissionIds.includes(id)
      );
      updateForm.setValue("permissions", newPermissions);
    }
  };

  const handleUpdatePermissionChange = (
    permissionId: string,
    checked: boolean
  ) => {
    const currentPermissions = updateForm.watch("permissions") || [];

    if (checked) {
      updateForm.setValue("permissions", [...currentPermissions, permissionId]);
    } else {
      updateForm.setValue(
        "permissions",
        currentPermissions.filter((id) => id !== permissionId)
      );
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

  const canCreate = hasPermission("create_roles");
  const canUpdate = hasPermission("update_roles");
  const canDelete = hasPermission("delete_roles");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-gray-600">Manage roles and their permissions.</p>
        </div>
        {canCreate && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>
                  Create a new role and assign permissions to it.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(handleCreateRole)}
                  className="space-y-4"
                >
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter role name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="permissions"
                    render={() => (
                      <FormItem>
                        <FormLabel>Permissions</FormLabel>
                        {permissionsData?.data ? (
                          <GroupedPermissions
                            permissionGroups={permissionsData.data}
                            selectedPermissions={
                              createForm.watch("permissions") || []
                            }
                            onPermissionChange={handlePermissionChange}
                            onSelectAllInGroup={
                              handleSelectAllPermissionsInGroup
                            }
                            onSelectAll={handleSelectAllPermissions}
                          />
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Loading permissions...
                          </div>
                        )}
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
                      disabled={createRoleMutation.isPending}
                    >
                      {createRoleMutation.isPending
                        ? "Creating..."
                        : "Create Role"}
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
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.totalRoles || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.activeRoles || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Roles
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.inactiveRoles || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>
            Manage roles and their associated permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1"> 
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search roles..."
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

          {/* Roles Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading roles...
                    </TableCell>
                  </TableRow>
                ) : rolesData?.data?.items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No roles found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rolesData?.data?.items?.map((role) => (
                    <TableRow key={role._id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 3).map((permission) => (
                            <Badge
                              key={permission._id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {permission.name}
                            </Badge>
                          ))}
                          {role.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={role.isActive ? "default" : "secondary"}
                        >
                          {role.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={role.isActive}
                          onCheckedChange={() =>
                            handleToggleRoleStatus(role._id, role.isActive)
                          }
                          disabled={updateRoleMutation.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(role.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                          {canUpdate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRole(role)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteRole(role._id)}
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
          {rolesData?.data?.pagination && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {(rolesData.data.pagination.currentPage - 1) *
                  rolesData.data.pagination.itemsPerPage +
                  1}{" "}
                to{" "}
                {Math.min(
                  rolesData.data.pagination.currentPage *
                  rolesData.data.pagination.itemsPerPage,
                  rolesData.data.pagination.totalItems
                )}{" "}
                of {rolesData.data.pagination.totalItems} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!rolesData.data.pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!rolesData.data.pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role information and permissions.
            </DialogDescription>
          </DialogHeader>
          <Form {...updateForm}>
            <form
              onSubmit={updateForm.handleSubmit(handleUpdateRole)}
              className="space-y-4"
            >
              <FormField
                control={updateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter role name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
                name="permissions"
                render={() => (
                  <FormItem>
                    <FormLabel>Permissions</FormLabel>
                    {permissionsData?.data ? (
                      <GroupedPermissions
                        permissionGroups={permissionsData.data}
                        selectedPermissions={
                          updateForm.watch("permissions") || []
                        }
                        onPermissionChange={handleUpdatePermissionChange}
                        onSelectAllInGroup={
                          handleUpdateSelectAllPermissionsInGroup
                        }
                        onSelectAll={handleUpdateSelectAllPermissions}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Loading permissions...
                      </div>
                    )}
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
                <Button type="submit" disabled={updateRoleMutation.isPending}>
                  {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
