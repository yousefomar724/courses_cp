import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, Users, BookOpen, Target } from "lucide-react";
import { useProgressList } from "@/hooks/use-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import type { ProgressQueryParams } from "@/types/api";

export function ProgressListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [courseIdFilter, setCourseIdFilter] = useState<string>("");
  const [userIdFilter, setUserIdFilter] = useState<string>("");

  const queryParams: ProgressQueryParams = {
    page,
    limit: 10,
    ...(search && { search }),
    ...(courseIdFilter && { courseId: courseIdFilter }),
    ...(userIdFilter && { userId: userIdFilter }),
  };

  const { data, isLoading } = useProgressList(queryParams);

  const progressList = data?.data?.items || [];
  const pagination = data?.data?.pagination;

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const getCourseName = (course: any): string => {
    if (!course) return "N/A";
    if (typeof course.name === "string") return course.name;
    return course.name?.en || course.name?.ar || course.name?.he || "Unknown Course";
  };

  const getUserName = (user: any): string => {
    if (!user) return "N/A";
    return user.fullName || user.email || "Unknown User";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Progress Management</h1>
        <p className="text-gray-500 mt-1">
          View and manage all student progress records across courses
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by user name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Input
              placeholder="Filter by Course ID (optional)"
              value={courseIdFilter}
              onChange={(e) => {
                setCourseIdFilter(e.target.value);
                setPage(1);
              }}
            />
            <Input
              placeholder="Filter by User ID (optional)"
              value={userIdFilter}
              onChange={(e) => {
                setUserIdFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Progress List Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Progress Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : progressList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No progress records found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Lessons Completed</TableHead>
                    <TableHead>Time Spent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {progressList.map((progress: any) => (
                    <TableRow key={progress._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {getUserName(progress.userId)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {progress.userId?.email || ""}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {getCourseName(progress.courseId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>
                              {progress.courseCompletionPercentage?.toFixed(1) || 0}%
                            </span>
                          </div>
                          <Progress
                            value={progress.courseCompletionPercentage || 0}
                            className="h-2"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {progress.completedLessons || 0} / {progress.totalLessons || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatTime(progress.totalTimeSpent || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/dashboard/courses/${progress.courseId?._id || progress.courseId}/progress`
                              )
                            }
                          >
                            <Target className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Showing {(page - 1) * 10 + 1} to{" "}
                    {Math.min(page * 10, pagination.totalItems)} of{" "}
                    {pagination.totalItems} records
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!pagination.hasPrev}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
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
