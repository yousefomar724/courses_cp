import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Video,
  RefreshCw,
  GripVertical,
  ArrowLeft,
  File,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import {
  useLessonsByTopic,
  useDeleteLesson,
  useToggleLessonStatus,
  useReorderLessons,
} from "@/hooks/use-lessons";
import { useTopic } from "@/hooks/use-topics";
import type { Lesson } from "@/types/api";

// Sortable Lesson Row Component
interface SortableLessonRowProps {
  lesson: Lesson;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
  onToggleStatus: (lessonId: string, isActive: boolean) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

function SortableLessonRow({
  lesson,
  onEdit,
  onDelete,
  onToggleStatus,
  canUpdate,
  canDelete,
}: SortableLessonRowProps) {
  const { courseId, topicId } = useParams<{
    courseId: string;
    topicId: string;
  }>();
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Helper function to get lesson name
  const getLessonName = (lesson: Lesson): string => {
    if (typeof lesson.name === "string") {
      return lesson.name;
    }
    return lesson.name.en || "Unknown Lesson";
  };

  // Helper function to get lesson description
  const getLessonDescription = (lesson: Lesson): string => {
    if (typeof lesson.description === "string") {
      return lesson.description;
    }
    return lesson.description?.en || "No description";
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50" : ""}
    >
      <TableCell className="w-12">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing flex items-center justify-center"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="font-medium">{getLessonName(lesson)}</TableCell>
      <TableCell className="max-w-xs truncate">
        {getLessonDescription(lesson)}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          Main: {lesson.main_recording_url ? "✓" : "✗"}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={lesson.isActive ? "default" : "secondary"}>
          {lesson.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center gap-2 justify-end">
          {canUpdate && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    `/dashboard/courses/${courseId}/topics/${topicId}/lessons/${lesson._id}/files`
                  )
                }
              >
                <File className="h-4 w-4 mr-1" />
                Files
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(lesson)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Switch
                checked={lesson.isActive}
                onCheckedChange={() =>
                  onToggleStatus(lesson._id, lesson.isActive)
                }
              />
            </>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(lesson._id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function LessonsPage() {
  const { courseId, topicId } = useParams<{
    courseId: string;
    topicId: string;
  }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteLessonId, setDeleteLessonId] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Queries
  const {
    data: lessonsData,
    isLoading,
    refetch,
  } = useLessonsByTopic(topicId!, {
    page: currentPage,
    limit: 20,
    search: searchTerm || undefined,
    isActive: isActiveFilter === "all" ? undefined : isActiveFilter === "true",
  });

  const { data: topicData } = useTopic(topicId!);

  // Mutations
  const deleteLessonMutation = useDeleteLesson();
  const toggleLessonStatusMutation = useToggleLessonStatus();
  const reorderLessonsMutation = useReorderLessons();

  // Handlers
  const handleDeleteLesson = async (lessonId: string) => {
    setDeleteLessonId(lessonId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteLesson = async () => {
    try {
      await deleteLessonMutation.mutateAsync(deleteLessonId);
      toast.success("Lesson deleted successfully!");
      setIsDeleteDialogOpen(false);
      setDeleteLessonId("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete lesson"
      );
    }
  };

  const handleToggleLessonStatus = async (
    lessonId: string,
    currentStatus: boolean
  ) => {
    try {
      await toggleLessonStatusMutation.mutateAsync({
        id: lessonId,
        isActive: !currentStatus,
      });
      toast.success(
        `Lesson ${!currentStatus ? "activated" : "deactivated"} successfully!`
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update lesson status"
      );
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    navigate(
      `/dashboard/courses/${courseId}/topics/${topicId}/lessons/${lesson._id}/edit`
    );
  };

  const handleCreateLesson = () => {
    navigate(`/dashboard/courses/${courseId}/topics/${topicId}/lessons/create`);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    refetch();
  };

  const handleFilterChange = (value: string) => {
    setIsActiveFilter(value);
    setCurrentPage(1);
  };

  const handleDragStart = () => {
    // Optional: Add visual feedback for drag start
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = lessonsData?.data?.items?.findIndex(
        (lesson) => lesson._id === active.id
      );
      const newIndex = lessonsData?.data?.items?.findIndex(
        (lesson) => lesson._id === over?.id
      );

      if (oldIndex !== undefined && newIndex !== undefined) {
        const reorderedLessons = arrayMove(
          lessonsData?.data?.items || [],
          oldIndex,
          newIndex
        );

        // Create the reorder data
        const reorderData = reorderedLessons.map((lesson, index) => ({
          lessonId: lesson._id,
          newOrder: index + 1,
        }));

        try {
          await reorderLessonsMutation.mutateAsync({
            topicId: topicId!,
            data: { reorderData },
          });
          toast.success("Lessons reordered successfully!");
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to reorder lessons"
          );
        }
      }
    }
  };

  const canCreate = hasPermission("create_lessons");
  const canUpdate = hasPermission("update_lessons");
  const canDelete = hasPermission("delete_lessons");

  // Helper function to get topic name
  const getTopicName = () => {
    if (!topicData?.data) return "Loading...";
    const topic = topicData.data;
    if (typeof topic.name === "string") {
      return topic.name;
    }
    return topic.name.en || "Unknown Topic";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-4 -mx-6 px-6 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Topic Lessons</h1>
            <p className="text-gray-600">
              Manage lessons for: {getTopicName()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/dashboard/courses/${courseId}/topics`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Topics
          </Button>
          {canCreate && (
            <Button className="w-full md:w-auto" onClick={handleCreateLesson}>
              <Plus className="mr-2 h-4 w-4" />
              Create Lesson
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Lessons</CardTitle>
          <CardDescription>
            Manage and reorder lessons for this topic. Drag and drop to change
            the order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search lessons..."
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

          {/* Lessons Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading lessons...</p>
            </div>
          ) : lessonsData?.data?.items?.length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No lessons found for this topic.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={
                  lessonsData?.data?.items?.map((lesson) => lesson._id) || []
                }
                strategy={verticalListSortingStrategy}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Lesson Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Recordings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessonsData?.data?.items?.map((lesson) => (
                      <SortableLessonRow
                        key={lesson._id}
                        lesson={lesson}
                        onEdit={handleEditLesson}
                        onDelete={handleDeleteLesson}
                        onToggleStatus={handleToggleLessonStatus}
                        canUpdate={canUpdate}
                        canDelete={canDelete}
                      />
                    ))}
                  </TableBody>
                </Table>
              </SortableContext>
            </DndContext>
          )}

          {/* Pagination */}
          {lessonsData?.data?.pagination && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {(lessonsData.data.pagination.currentPage - 1) *
                  lessonsData.data.pagination.itemsPerPage +
                  1}{" "}
                to{" "}
                {Math.min(
                  lessonsData.data.pagination.currentPage *
                    lessonsData.data.pagination.itemsPerPage,
                  lessonsData.data.pagination.totalItems
                )}{" "}
                of {lessonsData.data.pagination.totalItems} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!lessonsData.data.pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!lessonsData.data.pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Lesson Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lesson? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteLesson}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
