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
  BookOpen,
  RefreshCw,
  GripVertical,
  ArrowLeft,
  Video,
  File,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import {
  useTopicsByCourse,
  useDeleteTopic,
  useToggleTopicStatus,
  useReorderTopics,
} from "@/hooks/use-topics";
import { useCourse } from "@/hooks/use-courses";
import { TopicDialog } from "@/pages/course/topic/topic-dialog";
import type { Topic } from "@/types/api";

// Sortable Topic Row Component
interface SortableTopicRowProps {
  topic: Topic;
  onEdit: (topic: Topic) => void;
  onDelete: (topicId: string) => void;
  onToggleStatus: (topicId: string, isActive: boolean) => void;
  onViewLessons: (topicId: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

function SortableTopicRow({
  topic,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewLessons,
  canUpdate,
  canDelete,
}: SortableTopicRowProps) {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topic._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Helper function to get topic name
  const getTopicName = (topic: Topic): string => {
    if (typeof topic.name === "string") {
      return topic.name;
    }
    return topic.name.en || "Unknown Topic";
  };

  // Helper function to calculate discounted price
  const getDiscountedPrice = (topic: Topic): number => {
    return topic.topicsPrice - (topic.topicsPrice * topic.discount) / 100;
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
      <TableCell className="font-medium">{getTopicName(topic)}</TableCell>
      <TableCell>
        {topic.discount > 0 ? (
          <div className="flex items-center gap-2">
            <span className="line-through text-muted-foreground">
              ₪{topic.topicsPrice}
            </span>
            <span className="font-semibold text-green-600">
              ₪{getDiscountedPrice(topic)}
            </span>
            <Badge variant="destructive" className="text-xs">
              -{topic.discount}%
            </Badge>
          </div>
        ) : (
          `₪${topic.topicsPrice}`
        )}
      </TableCell>
      <TableCell>
        <Badge variant={topic.isActive ? "default" : "secondary"}>
          {topic.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(
                `/dashboard/courses/${courseId}/topics/${topic._id}/files`
              )
            }
          >
            <File className="h-4 w-4 mr-1" />
            Files
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewLessons(topic._id)}
          >
            <Video className="h-4 w-4 mr-1" />
            Lessons
          </Button>
          {canUpdate && (
            <>
              <Button variant="outline" size="sm" onClick={() => onEdit(topic)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Switch
                checked={topic.isActive}
                onCheckedChange={() =>
                  onToggleStatus(topic._id, topic.isActive)
                }
              />
            </>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(topic._id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function TopicsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | undefined>();
  const [deleteTopicId, setDeleteTopicId] = useState<string>("");
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
    data: topicsData,
    isLoading,
    refetch,
  } = useTopicsByCourse(courseId!, {
    page: currentPage,
    limit: 20,
    search: searchTerm || undefined,
    isActive: isActiveFilter === "all" ? undefined : isActiveFilter === "true",
  });

  const { data: courseData } = useCourse(courseId!);

  // Mutations
  const deleteTopicMutation = useDeleteTopic();
  const toggleTopicStatusMutation = useToggleTopicStatus();
  const reorderTopicsMutation = useReorderTopics();

  // Handlers
  const handleDeleteTopic = async (topicId: string) => {
    setDeleteTopicId(topicId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTopic = async () => {
    try {
      await deleteTopicMutation.mutateAsync(deleteTopicId);
      toast.success("Topic deleted successfully!");
      setIsDeleteDialogOpen(false);
      setDeleteTopicId("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete topic"
      );
    }
  };

  const handleToggleTopicStatus = async (
    topicId: string,
    currentStatus: boolean
  ) => {
    try {
      await toggleTopicStatusMutation.mutateAsync({
        id: topicId,
        isActive: !currentStatus,
      });
      toast.success(
        `Topic ${!currentStatus ? "activated" : "deactivated"} successfully!`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update topic status"
      );
    }
  };

  const handleEditTopic = (topic: Topic) => {
    setEditingTopicId(topic._id);
    setDialogOpen(true);
  };

  const handleViewLessons = (topicId: string) => {
    navigate(`/dashboard/courses/${courseId}/topics/${topicId}/lessons`);
  };

  const handleCreateTopic = () => {
    setEditingTopicId(undefined);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    refetch();
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
      const oldIndex = topicsData?.data?.items?.findIndex(
        (topic) => topic._id === active.id
      );
      const newIndex = topicsData?.data?.items?.findIndex(
        (topic) => topic._id === over?.id
      );

      if (oldIndex !== undefined && newIndex !== undefined) {
        const reorderedTopics = arrayMove(
          topicsData?.data?.items || [],
          oldIndex,
          newIndex
        );

        // Create the reorder data
        const topicOrders = reorderedTopics.map((topic, index) => ({
          topicId: topic._id,
          order: index + 1,
        }));

        try {
          await reorderTopicsMutation.mutateAsync({
            courseId: courseId!,
            data: { topicOrders },
          });
          toast.success("Topics reordered successfully!");
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to reorder topics"
          );
        }
      }
    }
  };

  const canCreate = hasPermission("create_topics");
  const canUpdate = hasPermission("update_topics");
  const canDelete = hasPermission("delete_topics");

  // Helper function to get course name
  const getCourseName = () => {
    if (!courseData?.data) return "Loading...";
    const course = courseData.data;
    if (typeof course.name === "string") {
      return course.name;
    }
    return course.name.en || "Unknown Course";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-4 -mx-6 px-6 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Course Topics</h1>
            <p className="text-gray-600">
              Manage topics for: {getCourseName()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/dashboard/courses`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          {canCreate && (
            <Button className="w-full md:w-auto" onClick={handleCreateTopic}>
              <Plus className="mr-2 h-4 w-4" />
              Create Topic
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Topics</CardTitle>
          <CardDescription>
            Manage and reorder topics for this course. Drag and drop to change
            the order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search topics..."
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

          {/* Topics Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading topics...</p>
            </div>
          ) : topicsData?.data?.items?.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No topics found for this course.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={topicsData?.data?.items?.map((topic) => topic._id) || []}
                strategy={verticalListSortingStrategy}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Topic Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topicsData?.data?.items?.map((topic) => (
                      <SortableTopicRow
                        key={topic._id}
                        topic={topic}
                        onEdit={handleEditTopic}
                        onDelete={handleDeleteTopic}
                        onToggleStatus={handleToggleTopicStatus}
                        onViewLessons={handleViewLessons}
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
          {topicsData?.data?.pagination && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {(topicsData.data.pagination.currentPage - 1) *
                  topicsData.data.pagination.itemsPerPage +
                  1}{" "}
                to{" "}
                {Math.min(
                  topicsData.data.pagination.currentPage *
                    topicsData.data.pagination.itemsPerPage,
                  topicsData.data.pagination.totalItems
                )}{" "}
                of {topicsData.data.pagination.totalItems} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!topicsData.data.pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!topicsData.data.pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Topic Dialog */}
      <TopicDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        courseId={courseId!}
        topicId={editingTopicId}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete Topic Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this topic? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTopic}
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
