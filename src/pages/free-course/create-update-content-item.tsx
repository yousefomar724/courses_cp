/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  useContentItem,
  useContentItems,
  useCreateContentItem,
  useUpdateContentItem,
} from "@/hooks/use-content-items"
import { useSection } from "@/hooks/use-sections"
import { useFreeCourse } from "@/hooks/use-free-courses"
import { useVideosForSelect, useGetPresignedVideoUrl } from "@/hooks/use-videos-library"
import { useQuizzes } from "@/hooks/use-quizzes"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BreadcrumbNavigation } from "@/components/shared/breadcrumb-navigation"
import { ArrowLeft, Loader2, X } from "lucide-react"
import { UploadService, type UploadProgress } from "@/services/upload-service"
import { UploadProgressCard } from "@/components/ui/upload-progress"
import { toast } from "sonner"
import type { ContentItemType } from "@/types/api"

const contentItemSchema = z.object({
  title: z.object({
    en: z
      .string()
      .min(2, "English title must be at least 2 characters")
      .max(200),
    ar: z.string().max(200).optional(),
    he: z.string().max(200).optional(),
  }),
  type: z.enum(["file", "video", "quiz"]),
  resourceId: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
})

type ContentItemFormValues = z.infer<typeof contentItemSchema>

export default function CreateUpdateContentItem() {
  const { freeCourseId, sectionId, contentId } = useParams<{
    freeCourseId: string
    sectionId: string
    contentId?: string
  }>()
  const navigate = useNavigate()
  const isEditMode = !!contentId

  const [selectedContentType, setSelectedContentType] =
    useState<ContentItemType>("file")

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileUploadProgress, setFileUploadProgress] =
    useState<UploadProgress | null>(null)
  const [fileUploadStatus, setFileUploadStatus] = useState<
    "idle" | "uploading" | "completed" | "error"
  >("idle")
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { data: freeCourse } = useFreeCourse(freeCourseId || "")
  const { data: section } = useSection(freeCourseId || "", sectionId || "")
  const { data: contentItem, isLoading: isLoadingContent } = useContentItem(
    freeCourseId || "",
    sectionId || "",
    contentId || ""
  )
  const { data: contentItems } = useContentItems(
    freeCourseId || "",
    sectionId || ""
  )

  // Load video library and quizzes for selection (match lesson flow)
  const { data: videosData } = useVideosForSelect("lesson")
  const getPresignedUrlMutation = useGetPresignedVideoUrl()
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const { data: quizzes } = useQuizzes({
    type: "course",
    isActive: true,
  })

  const createMutation = useCreateContentItem(
    freeCourseId || "",
    sectionId || ""
  )
  const updateMutation = useUpdateContentItem(
    freeCourseId || "",
    sectionId || "",
    contentId || ""
  )

  const form = useForm<ContentItemFormValues>({
    resolver: zodResolver(contentItemSchema),
    defaultValues: {
      title: { en: "", ar: "", he: "" },
      type: "file",
      resourceId: "",
      url: "",
    },
  })

  // Load existing content item data in edit mode
  useEffect(() => {
    if (isEditMode && contentItem) {
      form.reset({
        title: contentItem.title,
        type: contentItem.type,
        resourceId: contentItem.resourceId || "",
        url: contentItem.url || "",
      })
      setSelectedContentType(contentItem.type)
    }
  }, [contentItem, contentItems, isEditMode, form])

  const selectedVideoId = form.watch("resourceId")

  // Fetch presigned URL for video preview when a library video is selected
  useEffect(() => {
    if (selectedContentType !== "video" || !selectedVideoId) {
      setVideoPreviewUrl(null)
      return
    }
    let cancelled = false
    const mutate = getPresignedUrlMutation.mutateAsync
    mutate({ id: selectedVideoId, expiresIn: 3600 })
      .then((res) => {
        if (!cancelled && res.data?.videoUrl) setVideoPreviewUrl(res.data.videoUrl)
      })
      .catch(() => {
        if (!cancelled) setVideoPreviewUrl(null)
      })
    return () => {
      cancelled = true
      setVideoPreviewUrl(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- exclude mutation to avoid loop (mutateAsync ref changes with mutation state)
  }, [selectedContentType, selectedVideoId])

  const onSubmit = async (data: ContentItemFormValues) => {
    try {
      const resourceId = data.resourceId
      let fileUrl = ""

      // Handle file upload for file type
      if (data.type === "file" && selectedFile) {
        try {
          setFileUploadStatus("uploading")
          const fileResult = await UploadService.uploadFileWithProgress(
            selectedFile,
            "general",
            "free-courses-content",
            (progress) => setFileUploadProgress(progress)
          )
          fileUrl = fileResult.downloadUrl
          setFileUploadStatus("completed")
        } catch (error) {
          setFileUploadStatus("error")
          setUploadError(
            error instanceof Error ? error.message : "File upload failed"
          )
          toast.error("Failed to upload file")
          return
        }
      } else if (data.type === "file" && !isEditMode && !resourceId) {
        toast.error("Please select a file to upload")
        return
      }

      // Validate video has either resourceId or url
      if (data.type === "video" && !resourceId && !data.url) {
        toast.error("Please select a video from library or enter a video URL")
        return
      }

      // Validate quiz has resourceId
      if (data.type === "quiz" && !resourceId) {
        toast.error("Please select a quiz")
        return
      }

      const payload: any = {
        title: data.title,
        type: data.type,
      }

      // Add resourceId or url based on type
      if (data.type === "file") {
        if (fileUrl) {
          payload.fileUrl = fileUrl
        } else if (resourceId) {
          payload.resourceId = resourceId
        }
      } else if (data.type === "video") {
        if (resourceId) {
          payload.resourceId = resourceId
        } else if (data.url) {
          payload.url = data.url
        }
      } else if (data.type === "quiz") {
        payload.resourceId = resourceId
      }

      if (isEditMode && contentId) {
        await updateMutation.mutateAsync(payload)
      } else {
        await createMutation.mutateAsync(payload)
      }

      navigate(
        `/dashboard/free-courses/${freeCourseId}/sections/${sectionId}/content`
      )
    } catch (error) {
      console.error("Failed to save content item:", error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFileUploadStatus("idle")
      setFileUploadProgress(null)
      setUploadError(null)
    }
  }

  const getDisplayName = (value: any) => {
    if (typeof value === "string") return value
    return value?.en || value?.name?.en || "N/A"
  }

  if (isEditMode && isLoadingContent) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNavigation
        items={[
          { label: "Free Courses", path: "/dashboard/free-courses" },
          {
            label: getDisplayName(freeCourse?.data?.name),
            path: `/dashboard/free-courses/${freeCourseId}/sections`,
          },
          {
            label: "Sections",
            path: `/dashboard/free-courses/${freeCourseId}/sections`,
          },
          {
            label: getDisplayName(section?.title),
            path: `/dashboard/free-courses/${freeCourseId}/sections/${sectionId}/content`,
          },
          {
            label: "Content",
            path: `/dashboard/free-courses/${freeCourseId}/sections/${sectionId}/content`,
          },
          { label: isEditMode ? "Edit Content" : "Add Content" },
        ]}
      />

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            navigate(
              `/dashboard/free-courses/${freeCourseId}/sections/${sectionId}/content`
            )
          }
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? "Edit Content Item" : "Add Content Item"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode
              ? "Update content item details"
              : "Add a new content item to this section"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Item Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="title.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (English) *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter content title in English"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title.ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Arabic)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter content title in Arabic"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title.he"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Hebrew)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter content title in Hebrew"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Type *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          setSelectedContentType(value as ContentItemType)
                        }}
                        value={field.value}
                        disabled={isEditMode}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select content type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="file">File</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                        </SelectContent>
                      </Select>
                      {isEditMode && (
                        <FormDescription>
                          Content type cannot be changed after creation
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* File Upload (only for file type) */}
              {selectedContentType === "file" && (
                <div className="space-y-3">
                  <FormLabel>Upload File *</FormLabel>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      onChange={handleFileSelect}
                      className="flex-1"
                    />
                    {selectedFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {selectedFile && (
                    <div className="text-sm text-gray-600">
                      Selected: {selectedFile.name} (
                      {UploadService.formatBytes(selectedFile.size)})
                    </div>
                  )}

                  {fileUploadStatus === "uploading" && fileUploadProgress && (
                    <UploadProgressCard
                      progress={fileUploadProgress}
                      fileName={selectedFile?.name || ""}
                      status="uploading"
                    />
                  )}

                  {fileUploadStatus === "completed" && (
                    <UploadProgressCard
                      progress={fileUploadProgress!}
                      fileName={selectedFile?.name || ""}
                      status="completed"
                    />
                  )}

                  {fileUploadStatus === "error" && (
                    <UploadProgressCard
                      progress={fileUploadProgress!}
                      fileName={selectedFile?.name || ""}
                      status="error"
                      error={uploadError}
                    />
                  )}
                </div>
              )}

              {/* Video Selection or URL (only for video type) */}
              {selectedContentType === "video" && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="resourceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select from Video Library</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a video (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {videosData?.data?.map((video) => (
                              <SelectItem key={video.id} value={video.id}>
                                {video.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedVideoId && (
                          <p className="text-xs text-muted-foreground">
                            Selected:{" "}
                            {videosData?.data?.find((v) => v.id === selectedVideoId)?.name}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedVideoId && (
                    <div className="rounded-lg border p-3 bg-muted/30">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Video preview
                      </p>
                      {getPresignedUrlMutation.isPending ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading preview...
                        </div>
                      ) : videoPreviewUrl ? (
                        <video
                          src={videoPreviewUrl}
                          controls
                          className="w-full rounded-md max-h-64"
                          preload="metadata"
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <p className="text-sm text-muted-foreground py-4">
                          Could not load preview. Please try again.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="text-center text-sm text-muted-foreground">
                    OR
                  </div>

                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>External Video URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://www.youtube.com/watch?v=..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter a YouTube or external video URL
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Quiz Selection (only for quiz type) */}
              {selectedContentType === "quiz" && (
                <FormField
                  control={form.control}
                  name="resourceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Quiz *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a quiz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {quizzes?.data?.items?.map((quiz) => (
                            <SelectItem key={quiz._id} value={quiz._id}>
                              {getDisplayName(quiz.title)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(
                  `/dashboard/free-courses/${freeCourseId}/sections/${sectionId}/content`
                )
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                fileUploadStatus === "uploading"
              }
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : fileUploadStatus === "uploading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading file...
                </>
              ) : isEditMode ? (
                "Update Content"
              ) : (
                "Add Content"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
