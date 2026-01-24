/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Link } from "react-router";
import { useFreeCourses, useDeleteFreeCourse } from "@/hooks/use-free-courses";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, FolderOpen, Users } from "lucide-react";
import type { FreeCourse, University, Faculty, Admin } from "@/types/api";

export default function FreeCoursesPage() {
  const { hasPermission, hasAnyPermission } = useAuthStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<FreeCourse | null>(null);

  const canCreate = hasPermission("create_courses");
  const canUpdate = hasPermission("update_courses");
  const canDelete = hasPermission("delete_courses");
  const canView = hasAnyPermission([
    "read_courses",
    "create_courses",
    "update_courses",
  ]);

  const { data, isLoading, error } = useFreeCourses({
    page,
    limit: 10,
    search,
    isActive:
      isActiveFilter === "all" ? undefined : isActiveFilter === "active",
  });

  console.log("data", data);

  const deleteMutation = useDeleteFreeCourse();

  const handleDelete = async () => {
    if (!selectedCourse) return;

    try {
      await deleteMutation.mutateAsync(selectedCourse._id);
      setDeleteDialogOpen(false);
      setSelectedCourse(null);
    } catch (error) {
      console.error("Failed to delete free course:", error);
    }
  };

  const getDisplayName = (value: any) => {
    if (typeof value === "string") return value;
    return value?.en || value?.name?.en || "N/A";
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">
          You don't have permission to view free courses.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Free Courses</h1>
          <p className="text-muted-foreground">
            Manage university-specific free courses (Moodle-like)
          </p>
        </div>
        {canCreate && (
          <Link to="/dashboard/free-courses/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Free Course
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-muted-foreground">Loading free courses...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-destructive">Error loading free courses</p>
            </div>
          ) : !data?.data?.items?.length ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-muted-foreground">No free courses found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Sections</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.items.map((course) => (
                    <TableRow key={course._id}>
                      <TableCell className="font-medium">
                        {getDisplayName(course.name)}
                      </TableCell>
                      <TableCell>
                        {getDisplayName(course.universityId as University)}
                      </TableCell>
                      <TableCell>
                        {getDisplayName(course.facultyId as Faculty)}
                      </TableCell>
                      <TableCell>
                        {typeof course.instructorId === "object"
                          ? (course.instructorId as Admin).userName
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/dashboard/free-courses/${course._id}/sections`}
                        >
                          <Button variant="ghost" size="sm">
                            <FolderOpen className="mr-2 h-4 w-4" />
                            Sections ({course.sections?.length || 0})
                          </Button>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={course.isActive ? "default" : "secondary"}
                        >
                          {course.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/dashboard/free-courses/${course._id}/enrollments`}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View Enrollments"
                            >
                              <Users className="mr-2 h-4 w-4" />
                              Enrollments
                            </Button>
                          </Link>
                          {canUpdate && (
                            <Link
                              to={`/dashboard/free-courses/${course._id}/edit`}
                            >
                              <Button variant="ghost" size="sm">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                            </Link>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelectedCourse(course);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data.data.pagination && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * 10 + 1} to{" "}
                    {Math.min(page * 10, data.data.pagination.totalItems)} of{" "}
                    {data.data.pagination.totalItems} courses
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!data.data.pagination.hasPrev}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!data.data.pagination.hasNext}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the free course "
              {selectedCourse && getDisplayName(selectedCourse.name)}". This
              action can be reversed by reactivating the course.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
