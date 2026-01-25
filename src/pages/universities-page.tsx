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
  Edit,
  Trash2,
  Building,
  RefreshCw,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import {
  useUniversities,
  useCreateUniversity,
  useUpdateUniversity,
  useDeleteUniversity,
  useHardDeleteUniversity,
  useUniversityStats,
} from "@/hooks/use-universities";
import type {
  University,
  CreateUniversityInput,
  UpdateUniversityInput,
} from "@/types/api";

// Form schemas
const createUniversitySchema = z.object({
  name: z.object({
    en: z
      .string()
      .min(2, "English name must be at least 2 characters")
      .max(100, "English name cannot exceed 100 characters")
      .regex(
        /^[a-zA-Z0-9\s._-]+$/,
        "English name can only contain letters, numbers, spaces, dots, hyphens, and underscores"
      ),
    ar: z
      .string()
      .min(2, "Arabic name must be at least 2 characters")
      .max(100, "Arabic name cannot exceed 100 characters")
      .optional()
      .or(z.literal("")),
    he: z
      .string()
      .min(2, "Hebrew name must be at least 2 characters")
      .max(100, "Hebrew name cannot exceed 100 characters")
      .optional()
      .or(z.literal("")),
  }),
});

const updateUniversitySchema = z.object({
  name: z.object({
    en: z
      .string()
      .min(2, "English name must be at least 2 characters")
      .max(100, "English name cannot exceed 100 characters")
      .regex(
        /^[a-zA-Z0-9\s._-]+$/,
        "English name can only contain letters, numbers, spaces, dots, hyphens, and underscores"
      ),
    ar: z
      .string()
      .min(2, "Arabic name must be at least 2 characters")
      .max(100, "Arabic name cannot exceed 100 characters")
      .optional()
      .or(z.literal("")),
    he: z
      .string()
      .min(2, "Hebrew name must be at least 2 characters")
      .max(100, "Hebrew name cannot exceed 100 characters")
      .optional()
      .or(z.literal("")),
  }),
  isActive: z.boolean().optional(),
});

type CreateUniversityFormData = z.infer<typeof createUniversitySchema>;
type UpdateUniversityFormData = z.infer<typeof updateUniversitySchema>;

export function UniversitiesPage() {
  const { hasPermission } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<University | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteUniversityId, setDeleteUniversityId] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [hardDeleteUniversityId, setHardDeleteUniversityId] =
    useState<string>("");
  const [isHardDeleteDialogOpen, setIsHardDeleteDialogOpen] = useState(false);

  // Queries
  const {
    data: universitiesData,
    isLoading,
    refetch,
  } = useUniversities({
    page: currentPage,
    limit: 10,
    search: searchTerm || undefined,
    isActive: isActiveFilter === "all" ? undefined : isActiveFilter === "true",
  });

  const { data: statsData } = useUniversityStats();

  // Mutations
  const createUniversityMutation = useCreateUniversity();
  const updateUniversityMutation = useUpdateUniversity();
  const deleteUniversityMutation = useDeleteUniversity();
  const hardDeleteUniversityMutation = useHardDeleteUniversity();

  // Forms
  const createForm = useForm<CreateUniversityFormData>({
    resolver: zodResolver(createUniversitySchema),
    defaultValues: {
      name: {
        en: "",
        ar: "",
        he: "",
      },
    },
  });

  const updateForm = useForm<UpdateUniversityFormData>({
    resolver: zodResolver(updateUniversitySchema),
    defaultValues: {
      name: {
        en: "",
        ar: "",
        he: "",
      },
      isActive: true,
    },
  });

  // Helper function to get university name
  const getUniversityName = (university: University): string => {
    if (typeof university.name === "string") {
      return university.name;
    }
    return university.name.en || "Unknown University";
  };

  // Handlers
  const handleCreateUniversity = async (data: CreateUniversityFormData) => {
    try {
      // Clean up empty strings
      const processedData: CreateUniversityInput = {
        name: {
          en: data.name.en,
          ...(data.name.ar && data.name.ar.trim() && { ar: data.name.ar }),
          ...(data.name.he && data.name.he.trim() && { he: data.name.he }),
        },
      };

      await createUniversityMutation.mutateAsync(processedData);
      toast.success("University created successfully!");
      setIsCreateDialogOpen(false);
      createForm.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create university"
      );
    }
  };

  const handleUpdateUniversity = async (data: UpdateUniversityFormData) => {
    if (!editingUniversity) return;

    try {
      // Clean up empty strings
      const processedData: UpdateUniversityInput = {
        name: {
          en: data.name.en,
          ...(data.name.ar && data.name.ar.trim() && { ar: data.name.ar }),
          ...(data.name.he && data.name.he.trim() && { he: data.name.he }),
        },
        isActive: data.isActive,
      };

      await updateUniversityMutation.mutateAsync({
        id: editingUniversity._id,
        data: processedData,
      });
      toast.success("University updated successfully!");
      setIsEditDialogOpen(false);
      setEditingUniversity(null);
      updateForm.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update university"
      );
    }
  };

  const handleDeleteUniversity = async (universityId: string) => {
    setDeleteUniversityId(universityId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUniversity = async () => {
    try {
      await deleteUniversityMutation.mutateAsync(deleteUniversityId);
      toast.success("University deleted successfully!");
      setIsDeleteDialogOpen(false);
      setDeleteUniversityId("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete university"
      );
    }
  };


  const confirmHardDeleteUniversity = async () => {
    try {
      await hardDeleteUniversityMutation.mutateAsync(hardDeleteUniversityId);
      toast.success("University permanently deleted!");
      setIsHardDeleteDialogOpen(false);
      setHardDeleteUniversityId("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to permanently delete university"
      );
    }
  };

  const handleToggleUniversityStatus = async (
    universityId: string,
    currentStatus: boolean
  ) => {
    try {
      await updateUniversityMutation.mutateAsync({
        id: universityId,
        data: { isActive: !currentStatus },
      });
      toast.success(
        `University ${
          !currentStatus ? "activated" : "deactivated"
        } successfully!`
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update university status"
      );
    }
  };

  const handleEditUniversity = (university: University) => {
    setEditingUniversity(university);
    const universityName =
      typeof university.name === "string"
        ? { en: university.name, ar: "", he: "" }
        : university.name;

    updateForm.reset({
      name: {
        en: universityName.en || "",
        ar: universityName.ar || "",
        he: universityName.he || "",
      },
      isActive: university.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    refetch();
  };

  const handleFilterChange = (value: string) => {
    setIsActiveFilter(value);
    setCurrentPage(1);
  };

  const canRead = hasPermission("read_universities");
  const canCreate = hasPermission("create_universities");
  const canUpdate = hasPermission("update_universities");
  const canDelete = hasPermission("delete_universities");

  if (!canRead) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-500">
            You don't have permission to view universities.
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
          <h1 className="text-3xl font-bold">University Management</h1>
          <p className="text-gray-600">
            Manage universities and their information.
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
                Create University
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New University</DialogTitle>
                <DialogDescription>
                  Create a new university with multilingual support.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(handleCreateUniversity)}
                  className="space-y-4"
                >
                  <FormField
                    control={createForm.control}
                    name="name.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>English Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter university name in English"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="name.ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arabic Name (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter university name in Arabic"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="name.he"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hebrew Name (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter university name in Hebrew"
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
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createUniversityMutation.isPending}
                    >
                      {createUniversityMutation.isPending
                        ? "Creating..."
                        : "Create University"}
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
            <CardTitle className="text-sm font-medium">
              Total Universities
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.totalUniversities || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Universities
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.activeUniversities || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Universities
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.inactiveUniversities || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Universities</CardTitle>
          <CardDescription>
            Manage universities and their multilingual information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search universities..."
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

          {/* Universities Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Languages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading universities...
                    </TableCell>
                  </TableRow>
                ) : universitiesData?.data?.items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No universities found.
                    </TableCell>
                  </TableRow>
                ) : (
                  universitiesData?.data?.items?.map((university) => (
                    <TableRow key={university._id}>
                      <TableCell className="font-medium">
                        {getUniversityName(university)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {typeof university.name === "object" && (
                            <>
                              {university.name.en && (
                                <Badge variant="outline" className="text-xs">
                                  EN
                                </Badge>
                              )}
                              {university.name.ar && (
                                <Badge variant="outline" className="text-xs">
                                  AR
                                </Badge>
                              )}
                              {university.name.he && (
                                <Badge variant="outline" className="text-xs">
                                  HE
                                </Badge>
                              )}
                            </>
                          )}
                          {typeof university.name === "string" && (
                            <Badge variant="outline" className="text-xs">
                              <Globe className="h-3 w-3 mr-1" />
                              Single
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            university.isActive ? "default" : "secondary"
                          }
                        >
                          {university.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canUpdate && (
                          <Switch
                            checked={university.isActive}
                            onCheckedChange={() =>
                              handleToggleUniversityStatus(
                                university._id,
                                university.isActive
                              )
                            }
                            disabled={updateUniversityMutation.isPending}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(university.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                          {canUpdate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUniversity(university)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleDeleteUniversity(university._id)
                              }
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
          {universitiesData?.data?.pagination && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {(universitiesData.data.pagination.currentPage - 1) *
                  universitiesData.data.pagination.itemsPerPage +
                  1}{" "}
                to{" "}
                {Math.min(
                  universitiesData.data.pagination.currentPage *
                    universitiesData.data.pagination.itemsPerPage,
                  universitiesData.data.pagination.totalItems
                )}{" "}
                of {universitiesData.data.pagination.totalItems} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!universitiesData.data.pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!universitiesData.data.pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit University Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit University</DialogTitle>
            <DialogDescription>
              Update university information and multilingual names.
            </DialogDescription>
          </DialogHeader>
          <Form {...updateForm}>
            <form
              onSubmit={updateForm.handleSubmit(handleUpdateUniversity)}
              className="space-y-4"
            >
              <FormField
                control={updateForm.control}
                name="name.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>English Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter university name in English"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="name.ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Arabic Name (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter university name in Arabic"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="name.he"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hebrew Name (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter university name in Hebrew"
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
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateUniversityMutation.isPending}
                >
                  {updateUniversityMutation.isPending
                    ? "Updating..."
                    : "Update University"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete University Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete University</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this university? This action will
              mark the university as inactive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUniversity}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hard Delete University Alert Dialog */}
      <AlertDialog
        open={isHardDeleteDialogOpen}
        onOpenChange={setIsHardDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete University</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this university? This
              action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmHardDeleteUniversity}
              className="bg-red-600 hover:bg-red-700"
            >
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
