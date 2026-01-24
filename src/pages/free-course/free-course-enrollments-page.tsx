import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import { useFreeCourseEnrollments, useFreeCourse } from "@/hooks/use-free-courses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export function FreeCourseEnrollmentsPage() {
  const { freeCourseId } = useParams<{ freeCourseId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: courseData, isLoading: courseLoading } = useFreeCourse(freeCourseId!);
  const { data, isLoading } = useFreeCourseEnrollments(freeCourseId || "", {
    page,
    limit: 10,
  });
  console.log("data", data);

  const course = courseData?.data;
  const enrollments = data?.data?.items || [];
  const pagination = data?.data?.pagination;

  const getDisplayName = (value: any): string => {
    if (typeof value === "string") return value;
    return value?.en || value?.name?.en || "N/A";
  };

  const formatDate = (date: string | Date): string => {
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch {
      return "N/A";
    }
  };

  if (courseLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard/free-courses")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Free Courses
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          Enrollments - {course ? getDisplayName(course.name) : "Free Course"}
        </h1>
        <p className="text-gray-500 mt-1">
          View all students enrolled in this free course
        </p>
      </div>

      {/* Enrollments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enrollments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : enrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No enrollments found for this course</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment: any) => (
                    <TableRow key={enrollment._id}>
                      <TableCell className="font-medium">
                        {enrollment.userId?.fullName || "N/A"}
                      </TableCell>
                      <TableCell>{enrollment.userId?.email || "N/A"}</TableCell>
                      <TableCell>
                        {getDisplayName(enrollment.userId?.universityId)}
                      </TableCell>
                      <TableCell>
                        {getDisplayName(enrollment.userId?.facultyId)}
                      </TableCell>
                      <TableCell>
                        {formatDate(enrollment.createdAt || enrollment.enrolledAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            enrollment.paymentStatus === "completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {enrollment.paymentStatus === "completed"
                            ? "Enrolled"
                            : "Pending"}
                        </Badge>
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
                    {pagination.totalItems} enrollments
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!pagination.hasPrev || isLoading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!pagination.hasNext || isLoading}
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
