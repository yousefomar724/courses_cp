import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, Copy, BarChart3, Trophy } from "lucide-react";
import { useQuizzes, useDeleteQuiz } from "@/hooks/use-quizzes";
import { DuplicateQuizDialog } from "@/components/quiz/duplicate-quiz-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Quiz, QuizType } from "@/types/api";

export function QuizzesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [quizTypeFilter, setQuizTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null);
  const [duplicateQuiz, setDuplicateQuiz] = useState<Quiz | null>(null);

  const { data, isLoading } = useQuizzes({
    page,
    limit: 10,
    search: search || undefined,
    quizType:
      quizTypeFilter !== "all" ? (quizTypeFilter as QuizType) : undefined,
    isActive: statusFilter !== "all" ? statusFilter === "active" : undefined,
  });

  const deleteQuizMutation = useDeleteQuiz();

  const handleDelete = async () => {
    if (!deleteQuizId) return;

    try {
      await deleteQuizMutation.mutateAsync(deleteQuizId);
      toast.success("Quiz deleted successfully");
      setDeleteQuizId(null);
    } catch (error) {
      toast.error("Failed to delete quiz");
    }
  };

  const getQuizTypeBadge = (quizType: string) => {
    const colors: Record<string, string> = {
      course: "bg-blue-100 text-blue-800",
      topic: "bg-green-100 text-green-800",
      lesson: "bg-purple-100 text-purple-800",
      freeCourse: "bg-orange-100 text-orange-800",
      section: "bg-pink-100 text-pink-800",
    };
    return colors[quizType] || "bg-gray-100 text-gray-800";
  };

  const getTitle = (quiz: Quiz): string => {
    if (typeof quiz.title === "string") return quiz.title;
    return quiz.title.en || quiz.title.ar || quiz.title.he || "Untitled Quiz";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card className="p-6">
          <Skeleton className="h-96 w-full" />
        </Card>
      </div>
    );
  }

  const quizzes = data?.data?.items || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quizzes</h1>
          <p className="text-gray-500 mt-1">
            Manage quizzes for courses, topics, and lessons
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/quizzes/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search quizzes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={quizTypeFilter} onValueChange={setQuizTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Quiz Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="course">Course</SelectItem>
              <SelectItem value="topic">Topic</SelectItem>
              <SelectItem value="lesson">Lesson</SelectItem>
              <SelectItem value="freeCourse">Free Course</SelectItem>
              <SelectItem value="section">Section</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setQuizTypeFilter("all");
              setStatusFilter("all");
              setPage(1);
            }}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Passing Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizzes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-gray-500"
                >
                  No quizzes found
                </TableCell>
              </TableRow>
            ) : (
              quizzes.map((quiz: Quiz) => (
                <TableRow key={quiz._id}>
                  <TableCell className="font-medium">
                    {getTitle(quiz)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getQuizTypeBadge(quiz.quizType)}>
                      {quiz.quizType}
                    </Badge>
                  </TableCell>
                  <TableCell>{quiz.questions.length}</TableCell>
                  <TableCell>{quiz.totalPoints}</TableCell>
                  <TableCell>{quiz.passingScore}%</TableCell>
                  <TableCell>
                    <Badge variant={quiz.isActive ? "default" : "secondary"}>
                      {quiz.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(`/dashboard/quizzes/${quiz._id}/statistics`)
                        }
                        title="View Statistics"
                      >
                        <BarChart3 className="h-4 w-4 text-purple-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(`/dashboard/quizzes/${quiz._id}/leaderboard`)
                        }
                        title="View Leaderboard"
                      >
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(`/dashboard/quizzes/${quiz._id}/edit`)
                        }
                        title="Edit Quiz"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDuplicateQuiz(quiz)}
                        title="Duplicate Quiz"
                      >
                        <Copy className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteQuizId(quiz._id)}
                        title="Delete Quiz"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t p-4">
            <div className="text-sm text-gray-500">
              Showing{" "}
              {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{" "}
              {Math.min(
                pagination.currentPage * pagination.itemsPerPage,
                pagination.totalItems
              )}{" "}
              of {pagination.totalItems} quizzes
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={!pagination.hasPrev}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!pagination.hasNext}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Duplicate Quiz Dialog */}
      <DuplicateQuizDialog
        isOpen={!!duplicateQuiz}
        onClose={() => setDuplicateQuiz(null)}
        quiz={duplicateQuiz}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteQuizId}
        onOpenChange={() => setDeleteQuizId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quiz? This action cannot be
              undone. All progress and statistics will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
