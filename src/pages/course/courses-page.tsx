import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  Clock,
  Users,
  Image,
  GraduationCap,
  RefreshCw,
  File,
} from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"
import {
  useCourses,
  useDeleteCourse,
  useToggleCourseStatus,
  useCourseStats,
} from "@/hooks/use-courses"
import type { Course } from "@/types/api"

export function CoursesPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteCourseId, setDeleteCourseId] = useState<string>("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Queries
  const {
    data: coursesData,
    isLoading,
    refetch,
  } = useCourses({
    page: currentPage,
    limit: 12, // Show more items per page for card layout
    search: searchTerm || undefined,
    isActive: isActiveFilter === "all" ? undefined : isActiveFilter === "true",
  })

  const { data: statsData } = useCourseStats()

  // Mutations
  const deleteCourseMutation = useDeleteCourse()
  const toggleCourseStatusMutation = useToggleCourseStatus()

  // Handlers
  const handleDeleteCourse = async (courseId: string) => {
    setDeleteCourseId(courseId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteCourse = async () => {
    try {
      await deleteCourseMutation.mutateAsync(deleteCourseId)
      toast.success("Course deleted successfully!")
      setIsDeleteDialogOpen(false)
      setDeleteCourseId("")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete course"
      )
    }
  }

  const handleToggleCourseStatus = async (
    courseId: string,
    currentStatus: boolean
  ) => {
    try {
      await toggleCourseStatusMutation.mutateAsync({
        id: courseId,
        isActive: !currentStatus,
      })
      toast.success(
        `Course ${!currentStatus ? "activated" : "deactivated"} successfully!`
      )
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update course status"
      )
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    refetch()
  }

  const handleFilterChange = (value: string) => {
    setIsActiveFilter(value)
    setCurrentPage(1)
  }

  // Helper function to get course name
  const getCourseName = (course: Course): string => {
    if (typeof course.name === "string") {
      return course.name
    }
    return course.name.en || "Unknown Course"
  }

  // Helper function to get course description
  const getCourseDescription = (course: Course): string => {
    if (typeof course.aboutCourse === "string") {
      return course.aboutCourse
    }
    return course.aboutCourse.en || "No description available"
  }

  // Helper function to get faculty names
  const getFacultyNames = (course: Course): string[] => {
    if (!Array.isArray(course.facultyIds)) return []

    return course.facultyIds.map((faculty) => {
      if (typeof faculty === "string") return "Unknown Faculty"
      if (typeof faculty.name === "string") return faculty.name
      return faculty.name.en || "Unknown Faculty"
    })
  }

  // Helper function to get instructor name
  const getInstructorName = (course: Course): string => {
    if (typeof course.instructorId === "string") return "Unknown Instructor"
    return course.instructorId?.userName || "Unknown Instructor"
  }

  // Helper function to calculate discounted price
  const getDiscountedPrice = (course: Course): number => {
    return course.coursePrice - (course.coursePrice * course.discount) / 100
  }

  const canCreate = hasPermission("create_courses")
  const canUpdate = hasPermission("update_courses")
  const canDelete = hasPermission("delete_courses")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-4 -mx-6 px-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Course Management</h1>
          <p className="text-gray-600">
            Manage courses and their content across multiple faculties.
          </p>
        </div>
        {canCreate && (
          <Button
            className="w-full md:w-auto"
            onClick={() => navigate("/dashboard/courses/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
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
              Active Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.active || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <span className="text-muted-foreground text-sm font-semibold">₪</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₪{statsData?.data?.averagePrice || 0}
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
              ₪{statsData?.data?.totalRevenue || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
          <CardDescription>
            Browse and manage all available courses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={isActiveFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[180px]">
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

          {/* Courses Grid */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading courses...</p>
            </div>
          ) : coursesData?.data?.items?.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No courses found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coursesData?.data?.items?.map((course) => (
                <Card key={course._id} className="overflow-hidden pt-0">
                  {/* Course Image */}
                  <div className="relative h-48 bg-gray-100">
                    {course.imageUrl ? (
                      <img
                        src={course.imageUrl}
                        alt={getCourseName(course)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant={course.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {course.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {course.discount > 0 && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="destructive" className="text-xs">
                          -{course.discount}%
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2">
                      {getCourseName(course)}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      <div
                        className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed [&_span]:!bg-background [&_span]:!text-muted-foreground"
                        dangerouslySetInnerHTML={{
                          __html: getCourseDescription(course),
                        }}
                      />
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Course Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{course.numberOfCourseHours} hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm font-semibold">₪</span>
                        <span>
                          {course.discount > 0 ? (
                            <>
                              <span className="line-through text-muted-foreground">
                                ₪{course.coursePrice}
                              </span>{" "}
                              <span className="font-semibold text-green-600">
                                ₪{getDiscountedPrice(course)}
                              </span>
                            </>
                          ) : (
                            `₪${course.coursePrice}`
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {getFacultyNames(course).slice(0, 2).join(", ")}
                          {getFacultyNames(course).length > 2 && "..."}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span>{getInstructorName(course)}</span>
                      </div>
                    </div>

                    {/* Learning Outcomes */}
                    {Array.isArray(course.whatWillYouLearn) &&
                      course.whatWillYouLearn.length > 0 && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              Learning Outcomes
                            </span>
                          </div>
                          <div className="space-y-1">
                            {course.whatWillYouLearn
                              .slice(0, 2)
                              .map((outcome, index) => (
                                <div
                                  key={index}
                                  className="text-xs text-muted-foreground line-clamp-1"
                                >
                                  •{" "}
                                  {typeof outcome === "string"
                                    ? outcome
                                    : outcome.en}
                                </div>
                              ))}
                            {course.whatWillYouLearn.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{course.whatWillYouLearn.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
                      <div className="flex items-center gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 w-full"
                          onClick={() =>
                            navigate(`/dashboard/courses/${course._id}/topics`)
                          }
                        >
                          <BookOpen className="h-4 w-4 mr-1" />
                          Topics
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 w-full"
                          onClick={() =>
                            navigate(`/dashboard/courses/${course._id}/files`)
                          }
                        >
                          <File className="h-4 w-4 mr-1" />
                          Files
                        </Button>
                      </div>
                      {/* <div className="flex items-center gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 w-full"
                          onClick={() =>
                            navigate(
                              `/dashboard/courses/${course._id}/progress`
                            )
                          }
                        >
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Progress
                        </Button>
                      </div> */}
                      <div className="flex items-center gap-2 w-full">
                        {canUpdate && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 w-full"
                              onClick={() =>
                                navigate(
                                  `/dashboard/courses/${course._id}/edit`
                                )
                              }
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Switch
                              disabled={toggleCourseStatusMutation.isPending}
                              checked={course.isActive}
                              onCheckedChange={() =>
                                handleToggleCourseStatus(
                                  course._id,
                                  course.isActive
                                )
                              }
                            />
                          </>
                        )}
                        {canDelete && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteCourse(course._id)}
                            disabled={deleteCourseMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {coursesData?.data?.pagination && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {(coursesData.data.pagination.currentPage - 1) *
                  coursesData.data.pagination.itemsPerPage +
                  1}{" "}
                to{" "}
                {Math.min(
                  coursesData.data.pagination.currentPage *
                    coursesData.data.pagination.itemsPerPage,
                  coursesData.data.pagination.totalItems
                )}{" "}
                of {coursesData.data.pagination.totalItems} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!coursesData.data.pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!coursesData.data.pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Course Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this course? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCourse}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
