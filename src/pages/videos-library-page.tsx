import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  Play,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  FileVideo,
  Calendar,
  User,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";

import {
  useVideoLibraries,
  useSoftDeleteVideoLibrary,
  useGetPresignedVideoUrl,
} from "@/hooks/use-videos-library";
import { UploadVideoDialog } from "@/components/shared/upload-video-dialog";
import { videoLibraryService } from "@/services/videos-library-service";
import type { VideoLibrary } from "@/types/api";

export function VideosLibraryPage() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoLibrary | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteVideoId, setDeleteVideoId] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<
    "all" | "lesson" | "course"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Mutations
  const softDeleteMutation = useSoftDeleteVideoLibrary();
  const getPresignedUrlMutation = useGetPresignedVideoUrl();

  // Query params
  const queryParams = {
    page: currentPage,
    limit: pageSize,
    search: searchTerm || undefined,
    entityType: entityTypeFilter !== "all" ? entityTypeFilter : undefined,
    isActive: statusFilter !== "all" ? statusFilter === "active" : undefined,
    includePresignedUrls: false,
  };

  const {
    data: videosData,
    isLoading,
    refetch,
  } = useVideoLibraries(queryParams);
  console.log("videosData", videosData);

  const handleVideoUploaded = () => {
    refetch();
    setIsUploadDialogOpen(false);
  };

  const handlePreview = async (video: VideoLibrary) => {
    try {
      const result = await getPresignedUrlMutation.mutateAsync({
        id: video._id,
        expiresIn: 3600, // 1 hour
      });
      setPreviewUrl(result.data!.videoUrl);
      setSelectedVideo(video);
      setIsPreviewDialogOpen(true);
    } catch (error) {
      toast.error("Failed to load video preview");
    }
  };

  const handleSoftDelete = async (video: VideoLibrary) => {
    setDeleteVideoId(video._id);
    setSelectedVideo(video);
    setIsDeleteDialogOpen(true);
  };

  const confirmSoftDelete = async () => {
    try {
      await softDeleteMutation.mutateAsync({ id: deleteVideoId });
      setSelectedVideo(null);
      setIsDeleteDialogOpen(false);
      setDeleteVideoId("");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleDownload = async (video: VideoLibrary) => {
    try {
      const result = await getPresignedUrlMutation.mutateAsync({
        id: video._id,
        expiresIn: 3600, // 1 hour
      });

      // Create a temporary link to download the file
      const link = document.createElement("a");
      link.href = result.data!.videoUrl;
      link.download = `${video.name}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Failed to download video");
    }
  };

  const getFileIcon = () => {
    return <FileVideo className="h-5 w-5 text-blue-500" />;
  };

  const formatDate = (dateString: string | Date) => {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEntityTypeBadge = (entityType: string) => {
    const variants = {
      course: "default",
      lesson: "secondary",
    } as const;

    return (
      <Badge
        variant={variants[entityType as keyof typeof variants] || "outline"}
      >
        {entityType}
      </Badge>
    );
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === "entityType") {
      setEntityTypeFilter(value as "all" | "lesson" | "course");
    } else if (filterType === "status") {
      setStatusFilter(value as "all" | "active" | "inactive");
    }
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: string) => {
    setPageSize(parseInt(size));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Video Library</h1>
          <p className="text-gray-600">
            Manage and organize your video files for courses and lessons.
          </p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Video
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <FileVideo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {videosData?.data?.totalDocs || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Videos</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {videosData?.data?.docs?.filter((video) => video.isActive)
                .length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {videoLibraryService.formatBytes(
                videosData?.data?.docs?.reduce(
                  (total, video) => total + (video.fileSize || 0),
                  0
                ) || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Page</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {videosData?.data?.docs?.length || 0}
            </div>
          </CardContent>
        </Card>
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
          <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search videos by name..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

            <Select
              value={entityTypeFilter}
              onValueChange={(value) => handleFilterChange("entityType", value)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="lesson">Lesson</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Videos Table */}
      <Card>
        <CardHeader>
          <CardTitle>Videos</CardTitle>
          <CardDescription>Manage your video library files</CardDescription>
        </CardHeader>
        <CardContent>
          {videosData?.data?.docs?.length === 0 ? (
            <div className="text-center py-8">
              <FileVideo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No videos found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ||
                entityTypeFilter !== "all" ||
                statusFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Get started by uploading your first video."}
              </p>
              {!searchTerm &&
                entityTypeFilter === "all" &&
                statusFilter === "all" && (
                  <Button onClick={() => setIsUploadDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Video
                  </Button>
                )}
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videosData?.data?.docs?.map((video) => (
                    <TableRow key={video._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileIcon()}
                          <div>
                            <div className="font-medium">{video.name}</div>
                            <div className="text-sm text-gray-500">
                              {video.videoType}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {videoLibraryService.getVideoExtension(
                            video.videoUrl
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getEntityTypeBadge(video.entityType)}
                      </TableCell>
                      <TableCell>
                        {video.fileSize
                          ? videoLibraryService.formatBytes(video.fileSize)
                          : "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={video.isActive ? "default" : "secondary"}
                        >
                          {video.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {video.uploadedBy.userName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {formatDate(video.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(video)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(video)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleSoftDelete(video)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {videosData?.data && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">
                      Showing {(currentPage - 1) * pageSize + 1} to{" "}
                      {Math.min(
                        currentPage * pageSize,
                        videosData.data.totalDocs
                      )}{" "}
                      of {videosData.data.totalDocs} videos
                    </span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={handlePageSizeChange}
                    >
                      <SelectTrigger className="w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!videosData.data.hasPrevPage}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {videosData.data.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!videosData.data.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <UploadVideoDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onVideoUploaded={handleVideoUploaded}
      />

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.name}</DialogTitle>
            <DialogDescription>
              Video Preview - {selectedVideo?.videoType}
            </DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <div className="space-y-4">
              <video
                src={previewUrl}
                controls
                className="w-full rounded-lg"
                style={{ maxHeight: "60vh" }}
              />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>File Size:</strong>{" "}
                  {selectedVideo?.fileSize
                    ? videoLibraryService.formatBytes(selectedVideo.fileSize)
                    : "Unknown"}
                </div>
                <div>
                  <strong>Entity Type:</strong> {selectedVideo?.entityType}
                </div>
                <div>
                  <strong>Created:</strong>{" "}
                  {selectedVideo && formatDate(selectedVideo.createdAt)}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <Badge
                    variant={selectedVideo?.isActive ? "default" : "secondary"}
                  >
                    {selectedVideo?.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Video Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedVideo?.name}"? This
              action will mark the video as inactive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSoftDelete}
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
