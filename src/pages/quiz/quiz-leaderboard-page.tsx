import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Trophy, Medal, Award, Users } from "lucide-react";
import { useQuizLeaderboard, useQuiz } from "@/hooks/use-quizzes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

export function QuizLeaderboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [limit, setLimit] = useState(10);

  const { data: quizData, isLoading: quizLoading } = useQuiz(id!);
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuizLeaderboard(id!, limit);

  const quiz = quizData?.data;
  const leaderboard = leaderboardData?.data || [];

  const getQuizTitle = (title: any): string => {
    if (typeof title === "string") return title;
    return title?.en || title?.ar || title?.he || "Untitled Quiz";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-gray-500 font-bold">{rank}</span>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400">2nd</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600">3rd</Badge>;
    return <Badge variant="outline">{rank}</Badge>;
  };

  if (quizLoading || leaderboardLoading) {
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
      <div className="flex items-center justify-between">
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show top:</span>
          <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          {quiz ? getQuizTitle(quiz.title) : "Quiz Leaderboard"}
        </h1>
        <p className="text-gray-500 mt-1">
          Top performers for this quiz
        </p>
      </div>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No quiz attempts yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                  <TableHead className="text-right">Attempts</TableHead>
                  <TableHead className="text-right">Best Attempt</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry, index) => (
                  <TableRow key={entry.userId?._id || index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRankIcon(index + 1)}
                        {getRankBadge(index + 1)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {entry.userId?.fullName || "Unknown User"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.userId?.email || ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {entry.bestScore || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={entry.isPassed ? "default" : "secondary"}
                      >
                        {entry.bestPercentage?.toFixed(1) || 0}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.totalAttempts || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.bestPercentage?.toFixed(1) || 0}%
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.isPassed ? (
                        <Badge variant="default">Passed</Badge>
                      ) : (
                        <Badge variant="secondary">Not Passed</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Statistics Button */}
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <Users className="h-12 w-12 text-blue-500" />
          <div>
            <h3 className="text-lg font-semibold mb-2">View Detailed Statistics</h3>
            <p className="text-gray-500 mb-4">
              See comprehensive analytics and statistics for this quiz
            </p>
          </div>
          <Button
            onClick={() => navigate(`/dashboard/quizzes/${id}/statistics`)}
            size="lg"
            variant="outline"
          >
            <Trophy className="h-4 w-4 mr-2" />
            View Statistics
          </Button>
        </div>
      </Card>
    </div>
  );
}
