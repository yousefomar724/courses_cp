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
  Building2,
  RefreshCw,
  Globe,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import {
  useFaculties,
  useCreateFaculty,
  useUpdateFaculty,
  useDeleteFaculty,
  useHardDeleteFaculty,
  useFacultyStats,
} from "@/hooks/use-faculties";
import { useAllUniversities } from "@/hooks/use-universities";
import type {
  Faculty,
  CreateFacultyInput,
  UpdateFacultyInput,
  University,
} from "@/types/api";

// Form schemas
const createFacultySchema = z.object({
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
  universityId: z.string().min(1, "University is required"),
  no_academic_year: z
    .number()
    .min(1, "Number of academic years must be at least 1")
    .max(10, "Number of academic years cannot exceed 10"),
});

const updateFacultySchema = z.object({
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
  universityId: z.string().min(1, "University is required"),
  no_academic_year: z
    .number()
    .min(1, "Number of academic years must be at least 1")
    .max(10, "Number of academic years cannot exceed 10"),
  isActive: z.boolean().optional(),
});

type CreateFacultyFormData = z.infer<typeof createFacultySchema>;
type UpdateFacultyFormData = z.infer<typeof updateFacultySchema>;

export function FacultiesPage() {
  const { hasPermission } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [universityFilter, setUniversityFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteFacultyId, setDeleteFacultyId] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [hardDeleteFacultyId, setHardDeleteFacultyId] = useState<string>("");
  const [isHardDeleteDialogOpen, setIsHardDeleteDialogOpen] = useState(false);

  // Queries
  const {
    data: facultiesData,
    isLoading,
    refetch,
  } = useFaculties({
    page: currentPage,
    limit: 10,
    search: searchTerm || undefined,
    isActive: isActiveFilter === "all" ? undefined : isActiveFilter === "true",
    universityId: universityFilter === "all" ? undefined : universityFilter,
  });

  const { data: statsData } = useFacultyStats();
  const { data: universitiesData } = useAllUniversities();

  // Mutations
  const createFacultyMutation = useCreateFaculty();
  const updateFacultyMutation = useUpdateFaculty();
  const deleteFacultyMutation = useDeleteFaculty();
  const hardDeleteFacultyMutation = useHardDeleteFaculty();

  // Forms
  const createForm = useForm<CreateFacultyFormData>({
    resolver: zodResolver(createFacultySchema),
    defaultValues: {
      name: {
        en: "",
        ar: "",
        he: "",
      },
      universityId: "",
      no_academic_year: 4,
    },
  });

  const updateForm = useForm<UpdateFacultyFormData>({
    resolver: zodResolver(updateFacultySchema),
    defaultValues: {
      name: {
        en: "",
        ar: "",
        he: "",
      },
      universityId: "",
      no_academic_year: 4,
      isActive: true,
    },
  });

  // Helper function to get faculty name
  const getFacultyName = (faculty: Faculty): string => {
    if (typeof faculty.name === "string") {
      return faculty.name;
    }
    return faculty.name.en || "Unknown Faculty";
  };

  // Helper function to get university name
  const getUniversityName = (university: University): string => {
    if (typeof university.name === "string") {
      return university.name;
    }
    return university.name.en || "Unknown University";
  };

  // Handlers
  const handleCreateFaculty = async (data: CreateFacultyFormData) => {
    try {
      // Clean up empty strings
      const processedData: CreateFacultyInput = {
        name: {
          en: data.name.en,
          ...(data.name.ar && data.name.ar.trim() && { ar: data.name.ar }),
          ...(data.name.he && data.name.he.trim() && { he: data.name.he }),
        },
        universityId: data.universityId,
        no_academic_year: data.no_academic_year,
      };

      await createFacultyMutation.mutateAsync(processedData);
      toast.success("Faculty created successfully!");
      setIsCreateDialogOpen(false);
      createForm.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create faculty"
      );
    }
  };

  const handleUpdateFaculty = async (data: UpdateFacultyFormData) => {
    if (!editingFaculty) return;

    try {
      // Clean up empty strings
      const processedData: UpdateFacultyInput = {
        name: {
          en: data.name.en,
          ...(data.name.ar && data.name.ar.trim() && { ar: data.name.ar }),
          ...(data.name.he && data.name.he.trim() && { he: data.name.he }),
        },
        universityId: data.universityId,
        no_academic_year: data.no_academic_year,
        isActive: data.isActive,
      };

      await updateFacultyMutation.mutateAsync({
        id: editingFaculty._id,
        data: processedData,
      });
      toast.success("Faculty updated successfully!");
      setIsEditDialogOpen(false);
      setEditingFaculty(null);
      updateForm.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update faculty"
      );
    }
  };

  const handleDeleteFaculty = async (facultyId: string) => {
    setDeleteFacultyId(facultyId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteFaculty = async () => {
    try {
      await deleteFacultyMutation.mutateAsync(deleteFacultyId);
      toast.success("Faculty deleted successfully!");
      setIsDeleteDialogOpen(false);
      setDeleteFacultyId("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete faculty"
      );
    }
  };

  const handleHardDeleteFaculty = async (facultyId: string) => {
    setHardDeleteFacultyId(facultyId);
    setIsHardDeleteDialogOpen(true);
  };

  const confirmHardDeleteFaculty = async () => {
    try {
      await hardDeleteFacultyMutation.mutateAsync(hardDeleteFacultyId);
      toast.success("Faculty permanently deleted!");
      setIsHardDeleteDialogOpen(false);
      setHardDeleteFacultyId("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to permanently delete faculty"
      );
    }
  };

  const handleToggleFacultyStatus = async (
    facultyId: string,
    currentStatus: boolean
  ) => {
    try {
      await updateFacultyMutation.mutateAsync({
        id: facultyId,
        data: { isActive: !currentStatus },
      });
      toast.success(
        `Faculty ${!currentStatus ? "activated" : "deactivated"} successfully!`
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update faculty status"
      );
    }
  };

  const handleEditFaculty = (faculty: Faculty) => {
    setEditingFaculty(faculty);
    const facultyName =
      typeof faculty.name === "string"
        ? { en: faculty.name, ar: "", he: "" }
        : faculty.name;

    const universityId =
      typeof faculty.universityId === "string"
        ? faculty.universityId
        : faculty.universityId._id;

    updateForm.reset({
      name: {
        en: facultyName.en || "",
        ar: facultyName.ar || "",
        he: facultyName.he || "",
      },
      universityId: universityId,
      no_academic_year: faculty.no_academic_year,
      isActive: faculty.isActive,
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

  const handleUniversityFilterChange = (value: string) => {
    setUniversityFilter(value);
    setCurrentPage(1);
  };

  const canRead = hasPermission("read_faculties");
  const canCreate = hasPermission("create_faculties");
  const canUpdate = hasPermission("update_faculties");
  const canDelete = hasPermission("delete_faculties");

  if (!canRead) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-500">
            You don't have permission to view faculties.
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
          <h1 className="text-3xl font-bold">Faculty Management</h1>
          <p className="text-gray-600">
            Manage faculties and their academic programs.
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
                Create Faculty
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Faculty</DialogTitle>
                <DialogDescription>
                  Create a new faculty with multilingual support.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(handleCreateFaculty)}
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
                            placeholder="Enter faculty name in English"
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
                            placeholder="Enter faculty name in Arabic"
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
                            placeholder="Enter faculty name in Hebrew"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="universityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>University *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a university" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {universitiesData?.data?.map((university) => (
                              <SelectItem
                                key={university._id}
                                value={university._id}
                              >
                                {getUniversityName(university)}
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
                    name="no_academic_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Academic Years *</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select number of years" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year} {year === 1 ? "Year" : "Years"}
                              </SelectItem>
                            ))}
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
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createFacultyMutation.isPending}
                    >
                      {createFacultyMutation.isPending
                        ? "Creating..."
                        : "Create Faculty"}
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
              Total Faculties
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.totalFaculties || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Faculties
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.activeFaculties || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Faculties
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.inactiveFaculties || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Faculties</CardTitle>
          <CardDescription>
            Manage faculties and their academic information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search faculties..."
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
            <Select
              value={universityFilter}
              onValueChange={handleUniversityFilterChange}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by university" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                {universitiesData?.data?.map((university) => (
                  <SelectItem key={university._id} value={university._id}>
                    {getUniversityName(university)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Faculties Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Languages</TableHead>
                  <TableHead>Academic Years</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading faculties...
                    </TableCell>
                  </TableRow>
                ) : facultiesData?.data?.items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No faculties found.
                    </TableCell>
                  </TableRow>
                ) : (
                  facultiesData?.data?.items?.map((faculty) => (
                    <TableRow key={faculty._id}>
                      <TableCell className="font-medium">
                        {getFacultyName(faculty)}
                      </TableCell>
                      <TableCell>
                        {typeof faculty.universityId === "object"
                          ? getUniversityName(faculty.universityId)
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {typeof faculty.name === "object" && (
                            <>
                              {faculty.name.en && (
                                <Badge variant="outline" className="text-xs">
                                  EN
                                </Badge>
                              )}
                              {faculty.name.ar && (
                                <Badge variant="outline" className="text-xs">
                                  AR
                                </Badge>
                              )}
                              {faculty.name.he && (
                                <Badge variant="outline" className="text-xs">
                                  HE
                                </Badge>
                              )}
                            </>
                          )}
                          {typeof faculty.name === "string" && (
                            <Badge variant="outline" className="text-xs">
                              <Globe className="h-3 w-3 mr-1" />
                              Single
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          {faculty.no_academic_year}{" "}
                          {faculty.no_academic_year === 1 ? "Year" : "Years"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={faculty.isActive ? "default" : "secondary"}
                        >
                          {faculty.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canUpdate && (
                          <Switch
                            checked={faculty.isActive}
                            onCheckedChange={() =>
                              handleToggleFacultyStatus(
                                faculty._id,
                                faculty.isActive
                              )
                            }
                            disabled={updateFacultyMutation.isPending}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(faculty.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                          {canUpdate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditFaculty(faculty)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteFaculty(faculty._id)}
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
          {facultiesData?.data?.pagination && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {(facultiesData.data.pagination.currentPage - 1) *
                  facultiesData.data.pagination.itemsPerPage +
                  1}{" "}
                to{" "}
                {Math.min(
                  facultiesData.data.pagination.currentPage *
                    facultiesData.data.pagination.itemsPerPage,
                  facultiesData.data.pagination.totalItems
                )}{" "}
                of {facultiesData.data.pagination.totalItems} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!facultiesData.data.pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!facultiesData.data.pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Faculty Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Faculty</DialogTitle>
            <DialogDescription>
              Update faculty information and multilingual names.
            </DialogDescription>
          </DialogHeader>
          <Form {...updateForm}>
            <form
              onSubmit={updateForm.handleSubmit(handleUpdateFaculty)}
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
                        placeholder="Enter faculty name in English"
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
                        placeholder="Enter faculty name in Arabic"
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
                        placeholder="Enter faculty name in Hebrew"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="universityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>University *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a university" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {universitiesData?.data?.map((university) => (
                          <SelectItem
                            key={university._id}
                            value={university._id}
                          >
                            {getUniversityName(university)}
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
                name="no_academic_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Academic Years *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of years" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year} {year === 1 ? "Year" : "Years"}
                          </SelectItem>
                        ))}
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
                <Button
                  type="submit"
                  disabled={updateFacultyMutation.isPending}
                >
                  {updateFacultyMutation.isPending
                    ? "Updating..."
                    : "Update Faculty"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Faculty Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Faculty</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this faculty? This action will
              mark the faculty as inactive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFaculty}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hard Delete Faculty Alert Dialog */}
      <AlertDialog
        open={isHardDeleteDialogOpen}
        onOpenChange={setIsHardDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Faculty</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this faculty? This
              action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmHardDeleteFaculty}
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
