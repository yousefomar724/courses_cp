/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Video,
  AlertCircle,
  BookOpen,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import {
  useCreateLesson,
  useUpdateLesson,
  useLesson,
} from "@/hooks/use-lessons";
import { useTopic } from "@/hooks/use-topics";
import { useVideosForSelect } from "@/hooks/use-videos-library";
import type { CreateLessonInput, UpdateLessonInput } from "@/types/api";

// Form validation schema
const lessonSchema = z.object({
  name: z.object({
    en: z.string().min(2, "English name must be at least 2 characters"),
    ar: z.string().optional(),
    he: z.string().optional(),
  }),
  description: z
    .object({
      en: z
        .string()
        .min(2, "English description must be at least 2 characters"),
      ar: z.string().optional(),
      he: z.string().optional(),
    })
    .optional(),
  topicId: z.string().min(1, "Topic is required"),
  main_recording_id: z.string().optional(),
  recording_gvo_id: z.string().optional(),
  recording_vvt_id: z.string().optional(),
  isActive: z.boolean(),
});

type LessonFormData = z.infer<typeof lessonSchema>;

export function CreateUpdateLesson() {
  const { topicId, lessonId, courseId } = useParams<{
    topicId: string;
    lessonId?: string;
    courseId: string;
  }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if we're editing or creating
  const isEditing = !!lessonId;

  // Queries
  const { data: lessonData, isLoading: isLoadingLesson } = useLesson(lessonId!);
  const { data: topicData } = useTopic(topicId!);
  const { data: videosData } = useVideosForSelect("lesson");

  // Mutations
  const createLessonMutation = useCreateLesson();
  const updateLessonMutation = useUpdateLesson();

  // Form setup
  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: {
        en: "",
        ar: "",
        he: "",
      },
      description: {
        en: "",
        ar: "",
        he: "",
      },
      topicId: topicId || "",
      main_recording_id: "",
      recording_gvo_id: "",
      recording_vvt_id: "",
      isActive: true,
    },
  });

  // Set form data when lesson data is loaded (for editing)
  useEffect(() => {
    if (isEditing && lessonData?.data) {
      const lesson = lessonData.data;

      // Handle multilingual fields
      const name =
        typeof lesson.name === "string"
          ? { en: lesson.name, ar: "", he: "" }
          : lesson.name;

      const description =
        typeof lesson.description === "string"
          ? { en: lesson.description, ar: "", he: "" }
          : lesson.description || { en: "", ar: "", he: "" };

      form.reset({
        name,
        description,
        topicId:
          typeof lesson.topicId === "string"
            ? lesson.topicId
            : lesson.topicId._id,
        main_recording_id: "", // Will be set after videos are loaded
        recording_gvo_id: "", // Will be set after videos are loaded
        recording_vvt_id: "", // Will be set after videos are loaded
        isActive: lesson.isActive,
      });
    }
  }, [lessonData, form, isEditing]);

  // Set topic ID when available
  useEffect(() => {
    if (topicId) {
      form.setValue("topicId", topicId);
    }
  }, [topicId, form]);

  // Set video IDs when videos are loaded and we have existing video URLs
  useEffect(() => {
    if (isEditing && lessonData?.data && videosData?.data) {
      const lesson = lessonData.data;

      // Handle main_recording_url - can be string or object
      if (lesson.main_recording_url) {
        if (typeof lesson.main_recording_url === "object" && lesson.main_recording_url.id) {
          // Backend returned video object with id, name, videoUrl
          form.setValue("main_recording_id", lesson.main_recording_url.id);
        } else if (typeof lesson.main_recording_url === "string") {
          // Backend returned string URL - find matching video
          const mainVideo = videosData.data.find(
            (video) => video.videoUrl === lesson.main_recording_url
          );
          if (mainVideo) {
            form.setValue("main_recording_id", mainVideo.id);
          }
        }
      }

      // Handle recording_gvo_url - can be string or object
      if (lesson.recording_gvo_url) {
        if (typeof lesson.recording_gvo_url === "object" && lesson.recording_gvo_url.id) {
          form.setValue("recording_gvo_id", lesson.recording_gvo_url.id);
        } else if (typeof lesson.recording_gvo_url === "string") {
          const gvoVideo = videosData.data.find(
            (video) => video.videoUrl === lesson.recording_gvo_url
          );
          if (gvoVideo) {
            form.setValue("recording_gvo_id", gvoVideo.id);
          }
        }
      }

      // Handle recording_vvt_url - can be string or object
      if (lesson.recording_vvt_url) {
        if (typeof lesson.recording_vvt_url === "object" && lesson.recording_vvt_url.id) {
          form.setValue("recording_vvt_id", lesson.recording_vvt_url.id);
        } else if (typeof lesson.recording_vvt_url === "string") {
          const vvtVideo = videosData.data.find(
            (video) => video.videoUrl === lesson.recording_vvt_url
          );
          if (vvtVideo) {
            form.setValue("recording_vvt_id", vvtVideo.id);
          }
        }
      }
    }
  }, [isEditing, lessonData, videosData, form]);

  // Check permissions
  const canCreate = hasPermission("create_lessons");
  const canUpdate = hasPermission("update_lessons");

  if (isEditing && !canUpdate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to update lessons.
          </p>
        </div>
      </div>
    );
  }

  if (!isEditing && !canCreate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to create lessons.
          </p>
        </div>
      </div>
    );
  }

  if (isEditing && isLoadingLesson) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (isEditing && !lessonData?.data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Lesson Not Found</h2>
          <p className="text-gray-600">
            The lesson you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  // Form submission
  const handleSubmit = async (data: LessonFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Get video URLs from selected video IDs
      let mainRecordingUrl = "";
      let gvoRecordingUrl = "";
      let vvtRecordingUrl = "";

      if (data.main_recording_id) {
        const mainVideo = videosData?.data?.find(
          (video) => video.id === data.main_recording_id
        );
        if (mainVideo) {
          mainRecordingUrl = mainVideo.videoUrl;
        }
      }

      if (data.recording_gvo_id) {
        const gvoVideo = videosData?.data?.find(
          (video) => video.id === data.recording_gvo_id
        );
        if (gvoVideo) {
          gvoRecordingUrl = gvoVideo.videoUrl;
        }
      }

      if (data.recording_vvt_id) {
        const vvtVideo = videosData?.data?.find(
          (video) => video.id === data.recording_vvt_id
        );
        if (vvtVideo) {
          vvtRecordingUrl = vvtVideo.videoUrl;
        }
      }

      if (isEditing) {
        // Update lesson
        const lessonData: UpdateLessonInput = {
          name: {
            en: data.name.en,
            ...(data.name.ar && data.name.ar.trim() && { ar: data.name.ar }),
            ...(data.name.he && data.name.he.trim() && { he: data.name.he }),
          },
          description: {
            en: data.description?.en || "",
            ...(data.description?.ar &&
              data.description?.ar.trim() && { ar: data.description?.ar }),
            ...(data.description?.he &&
              data.description?.he.trim() && { he: data.description?.he }),
          },
          topicId: data.topicId!,
          main_recording_url: mainRecordingUrl || undefined,
          recording_gvo_url: gvoRecordingUrl || undefined,
          recording_vvt_url: vvtRecordingUrl || undefined,
          isActive: data.isActive,
        };

        await updateLessonMutation.mutateAsync({
          id: lessonId!,
          data: lessonData,
        });

        toast.success("Lesson updated successfully!");
      } else {
        // Create lesson
        const lessonData: CreateLessonInput = {
          name: {
            en: data.name.en,
            ...(data.name.ar && data.name.ar.trim() && { ar: data.name.ar }),
            ...(data.name.he && data.name.he.trim() && { he: data.name.he }),
          },
          description: data.description
            ? {
                en: data.description.en,
                ...(data.description.ar &&
                  data.description.ar.trim() && { ar: data.description.ar }),
                ...(data.description.he &&
                  data.description.he.trim() && { he: data.description.he }),
              }
            : undefined,
          topicId: data.topicId!,
          main_recording_url: mainRecordingUrl || "",
          recording_gvo_url: gvoRecordingUrl || undefined,
          recording_vvt_url: vvtRecordingUrl || undefined,
        };

        await createLessonMutation.mutateAsync(lessonData);

        toast.success("Lesson created successfully!");
      }

      navigate(`/dashboard/courses/${courseId}/topics/${topicId}/lessons`);
    } catch (error) {
      console.error("Error saving lesson:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save lesson"
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  console.log(form.formState.errors);

  // Helper function to get video URL for preview
  const getVideoPreviewUrl = (videoId: string | undefined) => {
    if (!videoId) return null;

    // Check if the lesson data has video objects with presigned URLs
    if (isEditing && lessonData?.data) {
      const lesson = lessonData.data;

      // Check main_recording_url
      if (typeof lesson.main_recording_url === "object" &&
          lesson.main_recording_url.id === videoId) {
        return lesson.main_recording_url.videoUrl;
      }

      // Check recording_gvo_url
      if (typeof lesson.recording_gvo_url === "object" &&
          lesson.recording_gvo_url.id === videoId) {
        return lesson.recording_gvo_url.videoUrl;
      }

      // Check recording_vvt_url
      if (typeof lesson.recording_vvt_url === "object" &&
          lesson.recording_vvt_url.id === videoId) {
        return lesson.recording_vvt_url.videoUrl;
      }
    }

    return null;
  };

  // Helper function to get topic name
  const getTopicName = () => {
    if (!topicData?.data) return "Loading...";
    const topic = topicData.data;
    if (typeof topic.name === "string") {
      return topic.name;
    }
    return topic.name.en || "Unknown Topic";
  };

  // Helper function to get lesson name
  const getLessonName = () => {
    if (!isEditing || !lessonData?.data) return "";
    const lesson = lessonData.data;
    if (typeof lesson.name === "string") {
      return lesson.name;
    }
    return lesson.name.en || "Unknown Lesson";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-4 -mx-6 px-6 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {isEditing ? "Edit Lesson" : "Create Lesson"}
            </h1>
            <p className="text-gray-600">
              {isEditing
                ? `Update lesson: ${getLessonName()}`
                : `Add a new lesson to: ${getTopicName()}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(
                `/dashboard/courses/${courseId}/topics/${topicId}/lessons`
              )
            }
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lessons
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Provide the basic details for your lesson.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Lesson Name */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lesson Name (English) *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter lesson name in English"
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
                      <FormLabel>Lesson Name (Arabic)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter lesson name in Arabic"
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
                      <FormLabel>Lesson Name (Hebrew)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter lesson name in Hebrew"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Lesson Description */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="description.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (English) *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter lesson description in English"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description.ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Arabic)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter lesson description in Arabic"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description.he"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Hebrew)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter lesson description in Hebrew"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recording Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Recording Selection
              </CardTitle>
              <CardDescription>
                Select video recordings from your video library for this lesson.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Recording */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="main_recording_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Recording</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select main recording" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={null as any}>
                            No main recording
                          </SelectItem>
                          {videosData?.data?.map((video) => (
                            <SelectItem key={video.id} value={video.id}>
                              {video.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Show selected main recording */}
                {form.watch("main_recording_id") && (
                  <div className="mt-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Selected main recording:
                    </p>
                    <div className="text-sm font-medium mb-3">
                      {
                        videosData?.data?.find(
                          (video) =>
                            video.id === form.watch("main_recording_id")
                        )?.name
                      }
                    </div>
                    {/* Video Preview */}
                    {getVideoPreviewUrl(form.watch("main_recording_id")) && (
                      <div className="mt-3">
                        <video
                          src={getVideoPreviewUrl(form.watch("main_recording_id"))!}
                          controls
                          className="w-full rounded-lg"
                          style={{ maxHeight: "400px" }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* GVO Recording */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="recording_gvo_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GVO Recording</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select GVO recording" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={null as any}>
                            No GVO recording
                          </SelectItem>
                          {videosData?.data?.map((video) => (
                            <SelectItem key={video.id} value={video.id}>
                              {video.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Show selected GVO recording */}
                {form.watch("recording_gvo_id") && (
                  <div className="mt-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Selected GVO recording:
                    </p>
                    <div className="text-sm font-medium mb-3">
                      {
                        videosData?.data?.find(
                          (video) => video.id === form.watch("recording_gvo_id")
                        )?.name
                      }
                    </div>
                    {/* Video Preview */}
                    {getVideoPreviewUrl(form.watch("recording_gvo_id")) && (
                      <div className="mt-3">
                        <video
                          src={getVideoPreviewUrl(form.watch("recording_gvo_id"))!}
                          controls
                          className="w-full rounded-lg"
                          style={{ maxHeight: "400px" }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* VVT Recording */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="recording_vvt_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VVT Recording</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select VVT recording" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={null as any}>
                            No VVT recording
                          </SelectItem>
                          {videosData?.data?.map((video) => (
                            <SelectItem key={video.id} value={video.id}>
                              {video.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Show selected VVT recording */}
                {form.watch("recording_vvt_id") && (
                  <div className="mt-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Selected VVT recording:
                    </p>
                    <div className="text-sm font-medium mb-3">
                      {
                        videosData?.data?.find(
                          (video) => video.id === form.watch("recording_vvt_id")
                        )?.name
                      }
                    </div>
                    {/* Video Preview */}
                    {getVideoPreviewUrl(form.watch("recording_vvt_id")) && (
                      <div className="mt-3">
                        <video
                          src={getVideoPreviewUrl(form.watch("recording_vvt_id"))!}
                          controls
                          className="w-full rounded-lg"
                          style={{ maxHeight: "400px" }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lesson Status */}
          <Card>
            <CardHeader>
              <CardTitle>Lesson Status</CardTitle>
              <CardDescription>
                Control whether the lesson is active or inactive.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable or disable this lesson
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(
                  `/dashboard/courses/${courseId}/topics/${topicId}/lessons`
                )
              }
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                ? "Update Lesson"
                : "Create Lesson"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
