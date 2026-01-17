
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { useUserStats } from "@/hooks/use-users";
import { useCourseStats } from "@/hooks/use-courses";
import { useUniversityStats } from "@/hooks/use-universities";
import { useEnrollmentStats } from "@/hooks/use-enrollments";
import { Loader2, Users, BookOpen, GraduationCap, ClipboardList } from "lucide-react";

export function DashboardHome() {
  const { admin } = useAuthStore();
  
  // Fetch statistics from APIs
  const { data: userStats, isLoading: userStatsLoading } = useUserStats();
  const { data: courseStats, isLoading: courseStatsLoading } = useCourseStats();
  const { data: universityStats, isLoading: universityStatsLoading } = useUniversityStats();
  const { data: enrollmentStats, isLoading: enrollmentStatsLoading } = useEnrollmentStats();

  const isLoading = userStatsLoading || courseStatsLoading || universityStatsLoading || enrollmentStatsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {admin?.userName}!</h1>
        <p className="text-gray-600">
          Here's what's happening with your educational platform today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {userStats?.data?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {userStats?.data?.verified || 0} verified
                </p>
              </>
            )}
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
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {courseStats?.data?.active || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {courseStats?.data?.total || 0} total courses
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Universities</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {universityStats?.data?.totalUniversities || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {universityStats?.data?.activeUniversities || 0} active
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {enrollmentStats?.data?.totalEnrollments || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {enrollmentStats?.data?.completedPayments || 0} completed
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Platform Statistics</CardTitle>
            <CardDescription>Overview of your educational platform</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    ${courseStats?.data?.totalRevenue?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Course Price</p>
                  <p className="text-2xl font-bold">
                    ${courseStats?.data?.averagePrice?.toFixed(2) || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Enrollments</p>
                  <p className="text-2xl font-bold">
                    {enrollmentStats?.data?.pendingPayments || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inactive Courses</p>
                  <p className="text-2xl font-bold">
                    {courseStats?.data?.inactive || 0}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you might want to perform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a
                href="/dashboard/universities"
                className="block w-full p-2 text-left hover:bg-gray-50 rounded transition-colors"
              >
                View Universities
              </a>
              <a
                href="/dashboard/admins"
                className="block w-full p-2 text-left hover:bg-gray-50 rounded transition-colors"
              >
                Manage Admins
              </a>
              <a
                href="/dashboard/roles"
                className="block w-full p-2 text-left hover:bg-gray-50 rounded transition-colors"
              >
                Manage Roles
              </a>
              <a
                href="/dashboard/enrollments"
                className="block w-full p-2 text-left hover:bg-gray-50 rounded transition-colors"
              >
                View Enrollments
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
