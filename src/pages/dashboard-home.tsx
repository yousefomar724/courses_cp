
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { useUserStats } from "@/hooks/use-users";
import { useCourseStats } from "@/hooks/use-courses";
import { useUniversityStats } from "@/hooks/use-universities";
import { useEnrollmentStats } from "@/hooks/use-enrollments";
import {
  Loader2,
  Users,
  BookOpen,
  GraduationCap,
  ClipboardList,
  DollarSign,
  TrendingUp,
  BarChart3,
  ArrowRight,
  Building2,
  UserCog,
  Shield,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function DashboardHome() {
  const { admin } = useAuthStore();
  const navigate = useNavigate();
  
  // Fetch statistics from APIs
  const { data: userStats, isLoading: userStatsLoading } = useUserStats();
  const { data: courseStats, isLoading: courseStatsLoading } = useCourseStats();
  const { data: universityStats, isLoading: universityStatsLoading } = useUniversityStats();
  const { data: enrollmentStats, isLoading: enrollmentStatsLoading } = useEnrollmentStats();

  const isLoading = userStatsLoading || courseStatsLoading || universityStatsLoading || enrollmentStatsLoading;

  // Calculate percentages for progress bars
  const verificationRate = userStats?.data?.total
    ? (userStats.data.verified / userStats.data.total) * 100
    : 0;
  
  const activeCourseRate = courseStats?.data?.total
    ? (courseStats.data.active / courseStats.data.total) * 100
    : 0;
  
  const activeUniversityRate = universityStats?.data?.totalUniversities
    ? (universityStats.data.activeUniversities / universityStats.data.totalUniversities) * 100
    : 0;
  
  const enrollmentCompletionRate = enrollmentStats?.data?.totalEnrollments
    ? (enrollmentStats.data.completedPayments / enrollmentStats.data.totalEnrollments) * 100
    : 0;

  // Chart data
  const userStatusData = [
    { name: "Verified", value: userStats?.data?.verified || 0, fill: "#22c55e" },
    { name: "Unverified", value: userStats?.data?.unverified || 0, fill: "#ef4444" },
  ];

  const courseStatusData = [
    { name: "Active", value: courseStats?.data?.active || 0, fill: "#22c55e" },
    { name: "Inactive", value: courseStats?.data?.inactive || 0, fill: "#ef4444" },
  ];

  const enrollmentTypeData = [
    { name: "Full Access", value: enrollmentStats?.data?.fullAccessEnrollments || 0, fill: "#3b82f6" },
    { name: "Individual Topics", value: enrollmentStats?.data?.individualTopicEnrollments || 0, fill: "#8b5cf6" },
  ];

  const paymentStatusData = [
    { name: "Completed", value: enrollmentStats?.data?.completedPayments || 0, fill: "#22c55e" },
    { name: "Pending", value: enrollmentStats?.data?.pendingPayments || 0, fill: "#f59e0b" },
  ];

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
                <p className="text-xs text-muted-foreground mt-1">
                  {userStats?.data?.verified || 0} verified
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Verification Rate</span>
                    <span>{verificationRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={verificationRate} className="h-2" />
                </div>
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
                <p className="text-xs text-muted-foreground mt-1">
                  {courseStats?.data?.total || 0} total courses
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Active Rate</span>
                    <span>{activeCourseRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={activeCourseRate} className="h-2" />
                </div>
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
                <p className="text-xs text-muted-foreground mt-1">
                  {universityStats?.data?.activeUniversities || 0} active
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Active Rate</span>
                    <span>{activeUniversityRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={activeUniversityRate} className="h-2" />
                </div>
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
                <p className="text-xs text-muted-foreground mt-1">
                  {enrollmentStats?.data?.completedPayments || 0} completed
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Completion Rate</span>
                    <span>{enrollmentCompletionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={enrollmentCompletionRate} className="h-2" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Status
            </CardTitle>
            <CardDescription>Verified vs Unverified</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={userStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Course Status
            </CardTitle>
            <CardDescription>Active vs Inactive</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={courseStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {courseStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Enrollment Types
            </CardTitle>
            <CardDescription>Full Access vs Topics</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={enrollmentTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {enrollmentTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Payment Status
            </CardTitle>
            <CardDescription>Completed vs Pending</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={paymentStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Revenue Overview
            </CardTitle>
            <CardDescription>Financial metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600">
                    ${courseStats?.data?.totalRevenue?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Course Price</p>
                  <p className="text-xl font-semibold">
                    ${courseStats?.data?.averagePrice?.toFixed(2) || 0}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Enrollment Status
            </CardTitle>
            <CardDescription>Enrollment metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Completion Rate</span>
                    <span>{enrollmentCompletionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={enrollmentCompletionRate} className="h-3" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="text-lg font-semibold text-green-600">
                      {enrollmentStats?.data?.completedPayments || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-lg font-semibold text-yellow-600">
                      {enrollmentStats?.data?.pendingPayments || 0}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Full Access</p>
                  <p className="text-sm font-medium">
                    {enrollmentStats?.data?.fullAccessEnrollments || 0} enrollments
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              Course Metrics
            </CardTitle>
            <CardDescription>Course statistics</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Active Rate</span>
                    <span>{activeCourseRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={activeCourseRate} className="h-3" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Active</p>
                    <p className="text-lg font-semibold text-green-600">
                      {courseStats?.data?.active || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Inactive</p>
                    <p className="text-lg font-semibold text-red-600">
                      {courseStats?.data?.inactive || 0}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Average Hours</p>
                  <p className="text-sm font-medium">
                    {courseStats?.data?.averageHours?.toFixed(1) || 0} hours
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks you might want to perform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => navigate("/dashboard/universities")}
            >
              <Building2 className="h-4 w-4 mr-2" />
              <span className="flex-1 text-left">View Universities</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => navigate("/dashboard/admins")}
            >
              <UserCog className="h-4 w-4 mr-2" />
              <span className="flex-1 text-left">Manage Admins</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => navigate("/dashboard/roles")}
            >
              <Shield className="h-4 w-4 mr-2" />
              <span className="flex-1 text-left">Manage Roles</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => navigate("/dashboard/enrollments")}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              <span className="flex-1 text-left">View Enrollments</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
