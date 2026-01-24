import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Users, Target, Clock, TrendingUp, Trophy, RotateCcw, Trash2 } from "lucide-react";
import { useCourseStatistics, useResetProgress, useDeleteProgress } from "@/hooks/use-progress";
import { useCourse } from "@/hooks/use-courses";
import { useProgressList } from "@/hooks/use-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
import { toast } from "sonner";

export function CourseProgressPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [resetProgressEnrollmentId, setResetProgressEnrollmentId] = useState<string | null>(null);
  const [deleteProgressEnrollmentId, setDeleteProgressEnrollmentId] = useState<string | null>(null);
  const [resetUserId, setResetUserId] = useState<string>("");

  const { data: courseData, isLoading: courseLoading } = useCourse(courseId!);
  const { data: statisticsData, isLoading: statsLoading } = useCourseStatistics(courseId!);
  const { data: progressListData } = useProgressList({ courseId, limit: 10 });
  const resetProgressMutation = useResetProgress();
  const deleteProgressMutation = useDeleteProgress();

  const course = courseData?.data;
  const statistics = statisticsData?.data;
  const progressList = (progressListData?.data?.items || []) as any[];

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const getCourseName = (courseName: any): string => {
    if (typeof courseName === "string") return courseName;
    return courseName?.en || courseName?.ar || courseName?.he || "Untitled Course";
  };

  const handleResetProgress = async () => {
    if (!resetProgressEnrollmentId || !resetUserId) {
      toast.error("User ID is required to reset progress");
      return;
    }

    try {
      await resetProgressMutation.mutateAsync({
        enrollmentId: resetProgressEnrollmentId,
        data: { userId: resetUserId },
      });
      toast.success("Progress reset successfully");
      setResetProgressEnrollmentId(null);
      setResetUserId("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reset progress");
    }
  };

  const handleDeleteProgress = async () => {
    if (!deleteProgressEnrollmentId) return;

    // Find the progress record to get userId
    const progress = progressList.find((p: any) => {
      const enrollmentId = typeof p.enrollmentId === 'string' 
        ? p.enrollmentId 
        : p.enrollmentId?._id;
      return enrollmentId === deleteProgressEnrollmentId || p._id === deleteProgressEnrollmentId;
    });
    const userId = progress?.userId 
      ? (typeof progress.userId === 'string' ? progress.userId : progress.userId._id)
      : null;
    
    if (!userId) {
      toast.error("User ID not found");
      return;
    }

    try {
      await deleteProgressMutation.mutateAsync({
        enrollmentId: deleteProgressEnrollmentId,
        userId: userId,
      });
      toast.success("Progress deleted successfully");
      setDeleteProgressEnrollmentId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete progress");
    }
  };

  if (courseLoading || statsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
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
          onClick={() => navigate("/dashboard/courses")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          {course ? getCourseName(course.name) : "Course Progress"}
        </h1>
        <p className="text-gray-500 mt-1">
          Track student progress and course completion statistics
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold mt-1">{statistics.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold mt-1">
                  {statistics.completionRate.toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={statistics.completionRate} className="mt-2" />
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Completion</p>
                <p className="text-2xl font-bold mt-1">
                  {statistics.averageCompletion.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
            <Progress value={statistics.averageCompletion} className="mt-2" />
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Time Spent</p>
                <p className="text-2xl font-bold mt-1">
                  {formatTime(statistics.averageTimeSpent)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Additional Stats */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">User Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed</span>
                <Badge variant="default">{statistics.completedUsers} users</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">In Progress</span>
                <Badge variant="secondary">{statistics.inProgressUsers} users</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Time Statistics</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Time Spent</span>
                <span className="font-medium">{formatTime(statistics.totalTimeSpent)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average per User</span>
                <span className="font-medium">{formatTime(statistics.averageTimeSpent)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Progress Management Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Progress Management</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Manage individual student progress. You can reset or delete progress for specific enrollments.
            </p>
            {progressList.length > 0 && (
              <div className="mt-4 space-y-2">
                {progressList.slice(0, 5).map((progress: any) => (
                  <div
                    key={progress._id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {progress.userId?.fullName || "Unknown User"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Completion: {progress.courseCompletionPercentage?.toFixed(1) || 0}%
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const enrollmentId = typeof progress.enrollmentId === 'object' && progress.enrollmentId?._id 
                            ? progress.enrollmentId._id 
                            : (typeof progress.enrollmentId === 'string' ? progress.enrollmentId : progress._id);
                          const userId = typeof progress.userId === 'object' && progress.userId?._id
                            ? progress.userId._id
                            : (typeof progress.userId === 'string' ? progress.userId : '');
                          setResetProgressEnrollmentId(enrollmentId);
                          setResetUserId(userId);
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const enrollmentId = typeof progress.enrollmentId === 'object' && progress.enrollmentId?._id 
                            ? progress.enrollmentId._id 
                            : (typeof progress.enrollmentId === 'string' ? progress.enrollmentId : progress._id);
                          setDeleteProgressEnrollmentId(enrollmentId);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* View Leaderboard Button */}
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <Trophy className="h-12 w-12 text-yellow-500" />
          <div>
            <h3 className="text-lg font-semibold mb-2">View Individual Rankings</h3>
            <p className="text-gray-500 mb-4">
              See the leaderboard to view top performers and individual student progress details
            </p>
          </div>
          <Button
            onClick={() => navigate(`/dashboard/courses/${courseId}/leaderboard`)}
            size="lg"
          >
            <Trophy className="h-4 w-4 mr-2" />
            View Leaderboard
          </Button>
        </div>
      </Card>

      {/* Reset Progress Dialog */}
      <AlertDialog
        open={!!resetProgressEnrollmentId}
        onOpenChange={() => {
          setResetProgressEnrollmentId(null);
          setResetUserId("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Progress</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset progress for this enrollment? This will reset all progress data including lesson completion, video progress, and time spent. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetProgress}
              disabled={resetProgressMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {resetProgressMutation.isPending ? "Resetting..." : "Reset Progress"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Progress Dialog */}
      <AlertDialog
        open={!!deleteProgressEnrollmentId}
        onOpenChange={() => setDeleteProgressEnrollmentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Progress</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete progress for this enrollment? This will permanently remove all progress data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProgress}
              disabled={deleteProgressMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteProgressMutation.isPending ? "Deleting..." : "Delete Progress"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
