import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, FileVideo, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { useCompleteVideoUpload } from "@/hooks/use-videos-library";
import { videoLibraryService } from "@/services/videos-library-service";
import { UploadProgressCard } from "@/components/ui/upload-progress";
import type { UploadProgress } from "@/services/upload-service";

// Form schema
const uploadVideoSchema = z.object({
  name: z.object({
    en: z
      .string()
      .min(1, "English name is required")
      .max(255, "English name cannot exceed 255 characters"),
    ar: z
      .string()
      .max(255, "Arabic name cannot exceed 255 characters")
      .optional()
      .or(z.literal("")),
    he: z
      .string()
      .max(255, "Hebrew name cannot exceed 255 characters")
      .optional()
      .or(z.literal("")),
  }),
  entityType: z.enum(["lesson", "course"], {
    required_error: "Entity type is required",
  }),
});

type UploadVideoFormData = z.infer<typeof uploadVideoSchema>;

interface UploadVideoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entityType?: "lesson" | "course";
  entityId?: string;
  onVideoUploaded?: () => void;
}

export function UploadVideoDialog({
  isOpen,
  onClose,
  entityType,
  entityId,
  onVideoUploaded,
}: UploadVideoDialogProps) {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "completed" | "error"
  >("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { completeUpload, isPending } = useCompleteVideoUpload();

  // Form
  const form = useForm<UploadVideoFormData>({
    resolver: zodResolver(uploadVideoSchema),
    defaultValues: {
      name: { en: "", ar: "", he: "" },
      entityType: entityType || "course",
    },
  });

  const handleClose = () => {
    // Reset form and state
    form.reset();
    setSelectedVideo(null);
    setUploadProgress(null);
    setUploadStatus("idle");
    setUploadError(null);
    onClose();
  };

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!videoLibraryService.isValidVideoFile(file)) {
        toast.error(
          "Please select a valid video file (MP4, MPEG, MOV, AVI, WebM, OGG)"
        );
        return;
      }


      setSelectedVideo(file);
      setUploadStatus("idle");
      setUploadProgress(null);
      setUploadError(null);

      // Auto-fill English name if empty
      if (!form.getValues("name.en")) {
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        form.setValue("name.en", fileName);
      }
    }
  };

  const handleSubmit = async (data: UploadVideoFormData) => {
    if (!selectedVideo) {
      toast.error("Please select a video file");
      return;
    }

    try {
      setUploadStatus("uploading");
      setUploadError(null);

      await completeUpload({
        file: selectedVideo,
        name: {
          en: data.name.en,
          ...(data.name.ar && data.name.ar.trim() && { ar: data.name.ar }),
          ...(data.name.he && data.name.he.trim() && { he: data.name.he }),
        },
        entityType: data.entityType,
        entityId,
        onProgress: (progress) => {
          // Convert the simple progress to UploadProgress format
          const uploadProgressData: UploadProgress = {
            percentage: progress.percentage,
            uploadedBytes: progress.loaded,
            totalBytes: progress.total,
            startTime: Date.now(),
            estimatedTimeRemaining: 0,
            speed: 0,
          };
          setUploadProgress(uploadProgressData);
        },
      });

      setUploadStatus("completed");
      toast.success("Video uploaded successfully!");

      if (onVideoUploaded) {
        onVideoUploaded();
      }

      handleClose();
    } catch (error) {
      setUploadStatus("error");
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload video"
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to upload video"
      );
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("video/")) {
      return <FileVideo className="h-8 w-8 text-blue-500" />;
    }
    return <FileVideo className="h-8 w-8 text-gray-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Video to Library
          </DialogTitle>
          <DialogDescription>
            Upload a video file to the video library. The video will be
            available for use in lessons and courses.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Video Name */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video Name (English) *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter video name in English"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name.ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video Name (Arabic)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter video name in Arabic"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name.he"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video Name (Hebrew)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter video name in Hebrew"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Entity Type */}
            <FormField
              control={form.control}
              name="entityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entity Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="course">Course</SelectItem>
                      <SelectItem value="lesson">Lesson</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Video Upload */}
            <div className="space-y-4">
              <div>
                <FormLabel className="text-base font-medium">
                  Video File *
                </FormLabel>
                <p className="text-sm text-gray-600 mb-3">
                  Upload a video file (MP4, MPEG, MOV, AVI, WebM, OGG) - Max
                  500MB
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoSelect}
                    className="flex-1"
                  />
                  {selectedVideo && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedVideo(null);
                        setUploadStatus("idle");
                        setUploadProgress(null);
                        setUploadError(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {selectedVideo && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                    {getFileIcon(selectedVideo.type)}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {selectedVideo.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {videoLibraryService.formatBytes(selectedVideo.size)}
                      </div>
                    </div>
                  </div>
                )}

                {uploadStatus === "uploading" && uploadProgress && (
                  <UploadProgressCard
                    progress={uploadProgress}
                    fileName={selectedVideo?.name || ""}
                    status="uploading"
                  />
                )}

                {uploadStatus === "completed" && (
                  <UploadProgressCard
                    progress={uploadProgress!}
                    fileName={selectedVideo?.name || ""}
                    status="completed"
                  />
                )}

                {uploadStatus === "error" && uploadError && (
                  <div className="flex items-center gap-2 p-3 border border-red-200 rounded-lg bg-red-50">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <div className="text-sm text-red-700">{uploadError}</div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isPending || !selectedVideo || uploadStatus === "uploading"
                }
              >
                {isPending || uploadStatus === "uploading" ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Video
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
