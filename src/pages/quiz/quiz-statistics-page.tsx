import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Target, Clock, TrendingUp, BarChart3 } from "lucide-react";
import { useQuizStatistics } from "@/hooks/use-quizzes";
import { useQuiz } from "@/hooks/use-quizzes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export function QuizStatisticsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: quizData, isLoading: quizLoading } = useQuiz(id!);
  const { data: statisticsData, isLoading: statsLoading } = useQuizStatistics(id!);

  const quiz = quizData?.data;
  const statisticsResponse = statisticsData?.data as any;
  // Backend returns { quiz: {...}, progress: QuizStatistics }
  const statistics = statisticsResponse?.progress || statisticsResponse;
  const quizDetails = statisticsResponse?.quiz;

  const getQuizTitle = (title: any): string => {
    if (typeof title === "string") return title;
    return title?.en || title?.ar || title?.he || "Untitled Quiz";
  };

  if (quizLoading || statsLoading) {
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
          onClick={() => navigate("/dashboard/quizzes")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quizzes
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          {quiz ? getQuizTitle(quiz.title) : "Quiz Statistics"}
        </h1>
        <p className="text-gray-500 mt-1">
          Detailed statistics and analytics for this quiz
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalAttempts || 0}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.totalUsers || 0} unique users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.averageBestPercentage?.toFixed(1) || 0}%
              </div>
              <Progress 
                value={statistics.averageBestPercentage || 0} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.passRate?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics.passedUsers || 0} passed users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Attempts</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.averageAttempts?.toFixed(1) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Average attempts per user
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Attempt Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Users</span>
                <Badge variant="default">{statistics.totalUsers || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Passed Users</span>
                <Badge variant="default">{statistics.passedUsers || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Failed Users</span>
                <Badge variant="destructive">{statistics.failedUsers || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Attempts</span>
                <Badge variant="secondary">{statistics.totalAttempts || 0}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quiz Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quizDetails && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Questions</span>
                    <span className="font-medium">{quizDetails.totalQuestions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Points</span>
                    <span className="font-medium">{quizDetails.totalPoints || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Passing Score</span>
                    <span className="font-medium">{quizDetails.passingScore || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Time Limit</span>
                    <span className="font-medium">
                      {quizDetails.timeLimit ? `${quizDetails.timeLimit} min` : "No limit"}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Leaderboard Button */}
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <Target className="h-12 w-12 text-blue-500" />
          <div>
            <h3 className="text-lg font-semibold mb-2">View Top Performers</h3>
            <p className="text-gray-500 mb-4">
              See the leaderboard to view top performers and individual quiz results
            </p>
          </div>
          <Button
            onClick={() => navigate(`/dashboard/quizzes/${id}/leaderboard`)}
            size="lg"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Leaderboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
