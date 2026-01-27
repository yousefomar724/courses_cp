/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useFreeCourse,
  useCreateFreeCourse,
  useUpdateFreeCourse,
} from "@/hooks/use-free-courses";
import { useUniversities } from "@/hooks/use-universities";
import { useFaculties } from "@/hooks/use-faculties";
import { useAdmins } from "@/hooks/use-admins";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Section builder removed - sections now managed on separate page
import { ArrowLeft, Loader2, X } from "lucide-react";
// Section type import removed - no longer needed
import { UploadService, type UploadProgress } from "@/services/upload-service";
import { UploadProgressCard } from "@/components/ui/upload-progress";
import { toast } from "sonner";

const freeCourseSchema = z.object({
  name: z.object({
    en: z
      .string()
      .min(2, "English name must be at least 2 characters")
      .max(200),
    ar: z
      .string()
      .min(2, "Arabic name must be at least 2 characters")
      .max(200),
    he: z
      .string()
      .min(2, "Hebrew name must be at least 2 characters")
      .max(200),
  }),
  overview: z.object({
    en: z
      .string()
      .min(10, "English overview must be at least 10 characters")
      .max(2000),
    ar: z
      .string()
      .min(10, "Arabic overview must be at least 10 characters")
      .max(2000),
    he: z
      .string()
      .min(10, "Hebrew overview must be at least 10 characters")
      .max(2000),
  }),
  universityId: z.string().min(1, "University is required"),
  facultyId: z.string().min(1, "Faculty is required"),
  instructorId: z.string().min(1, "Instructor is required"),
  imageUrl: z.string().optional(),
});

type FreeCourseFormValues = z.infer<typeof freeCourseSchema>;

export default function CreateUpdateFreeCourse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Sections state removed - managed on separate page
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUploadProgress, setImageUploadProgress] =
    useState<UploadProgress | null>(null);
  const [imageUploadStatus, setImageUploadStatus] = useState<
    "idle" | "uploading" | "completed" | "error"
  >("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: freeCourseData, isLoading: isLoadingFreeCourse } =
    useFreeCourse(id || "");
  const { data: universitiesData } = useUniversities({ isActive: true });
  const { data: facultiesData } = useFaculties({
    universityId: selectedUniversity,
    isActive: true,
  });
  const { data: adminsData } = useAdmins({ isActive: true });

  const createMutation = useCreateFreeCourse();
  const updateMutation = useUpdateFreeCourse();

  const form = useForm<FreeCourseFormValues>({
    resolver: zodResolver(freeCourseSchema),
    defaultValues: {
      name: { en: "", ar: "", he: "" },
      overview: { en: "", ar: "", he: "" },
      universityId: "",
      facultyId: "",
      instructorId: "",
      imageUrl: "",
    },
  });

  // Load existing free course data in edit mode
  useEffect(() => {
    if (isEditMode && freeCourseData?.data) {
      const course = freeCourseData.data;
      const nameObj =
        typeof course.name === "string"
          ? { en: course.name, ar: "", he: "" }
          : {
              en: course.name.en || "",
              ar: course.name.ar || "",
              he: course.name.he || "",
            };
      const overviewObj =
        typeof course.overview === "string"
          ? { en: course.overview, ar: "", he: "" }
          : {
              en: course.overview.en || "",
              ar: course.overview.ar || "",
              he: course.overview.he || "",
            };

      form.reset({
        name: nameObj,
        overview: overviewObj,
        universityId:
          typeof course.universityId === "string"
            ? course.universityId
            : course.universityId._id,
        facultyId:
          typeof course.facultyId === "string"
            ? course.facultyId
            : course.facultyId._id,
        instructorId:
          typeof course.instructorId === "string"
            ? course.instructorId
            : course.instructorId._id,
        imageUrl: course.imageUrl,
      });

      setSelectedUniversity(
        typeof course.universityId === "string"
          ? course.universityId
          : course.universityId._id
      ); // Sections loaded separately on sections page
    }
  }, [freeCourseData, isEditMode, form]);

  const onSubmit = async (data: FreeCourseFormValues) => {
    try {
      // Upload image if selected
      let imageUrl = data.imageUrl || "";
      if (selectedImage) {
        try {
          setImageUploadStatus("uploading");
          const imageResult = await UploadService.uploadFileWithProgress(
            selectedImage,
            "image",
            "free-courses",
            (progress) => setImageUploadProgress(progress)
          );
          imageUrl = imageResult.downloadUrl;
          setImageUploadStatus("completed");
        } catch (error) {
          setImageUploadStatus("error");
          setUploadError(
            error instanceof Error ? error.message : "Image upload failed"
          );
          toast.error("Failed to upload image");
          return;
        }
      } else if (!isEditMode && !data.imageUrl) {
        toast.error("Course image is required");
        return;
      }

      const payload = {
        ...data,
        imageUrl,
      };

      if (isEditMode && id) {
        await updateMutation.mutateAsync({ id, data: payload });
        toast.success("Free course updated successfully!");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Free course created successfully!");
      }

      navigate("/dashboard/free-courses");
    } catch (error) {
      console.error("Failed to save free course:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save free course"
      );
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }
      setSelectedImage(file);
      setImageUploadStatus("idle");
      setImageUploadProgress(null);
      setUploadError(null);
    }
  };

  const getDisplayName = (value: any) => {
    if (typeof value === "string") return value;
    return value?.en || value?.name?.en || "N/A";
  };

  if (isEditMode && isLoadingFreeCourse) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/free-courses")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? "Edit Free Course" : "Create Free Course"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode
              ? "Update the free course details and sections"
              : "Create a new university-specific free course"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="universityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>University *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedUniversity(value);
                          form.setValue("facultyId", ""); // Reset faculty when university changes
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select university" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {universitiesData?.data?.items?.map((university) => (
                            <SelectItem
                              key={university._id}
                              value={university._id}
                            >
                              {getDisplayName(university.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facultyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faculty *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedUniversity}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select faculty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {facultiesData?.data?.items?.map((faculty) => (
                            <SelectItem key={faculty._id} value={faculty._id}>
                              {getDisplayName(faculty.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!selectedUniversity && (
                        <FormDescription>
                          Select a university first
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructor *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select instructor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {adminsData?.data?.items?.map((admin) => (
                            <SelectItem key={admin._id} value={admin._id}>
                              {admin.userName} ({admin.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormLabel>Course Image *</FormLabel>
                  <p className="text-sm text-gray-600 mb-3">
                    Upload a high-quality image for your course (JPG, PNG, GIF,
                    WebP, SVG)
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="flex-1"
                      />
                      {selectedImage && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedImage(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {selectedImage && (
                      <div className="text-sm text-gray-600">
                        Selected: {selectedImage.name} (
                        {UploadService.formatBytes(selectedImage.size)})
                      </div>
                    )}

                    {imageUploadStatus === "uploading" &&
                      imageUploadProgress && (
                        <UploadProgressCard
                          progress={imageUploadProgress}
                          fileName={selectedImage?.name || ""}
                          status="uploading"
                        />
                      )}

                    {imageUploadStatus === "completed" && (
                      <UploadProgressCard
                        progress={imageUploadProgress!}
                        fileName={selectedImage?.name || ""}
                        status="completed"
                      />
                    )}

                    {imageUploadStatus === "error" && (
                      <UploadProgressCard
                        progress={imageUploadProgress!}
                        fileName={selectedImage?.name || ""}
                        status="error"
                        error={uploadError}
                      />
                    )}

                    {/* Show existing image when editing */}
                    {isEditMode &&
                      freeCourseData?.data?.imageUrl &&
                      !selectedImage && (
                        <div className="mt-3 p-3 border rounded-lg bg-gray-50">
                          <p className="text-sm text-gray-600 mb-2">
                            Current image:
                          </p>
                          <img
                            src={freeCourseData.data.imageUrl}
                            alt="Current course image"
                            className="max-w-xs h-auto rounded border"
                          />
                        </div>
                      )}
                  </div>

                  {/* Hidden form field for validation */}
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem className="hidden">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="name.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Name (English) *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter course name in English"
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
                        <FormLabel>Course Name (Arabic) *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter course name in Arabic"
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
                        <FormLabel>Course Name (Hebrew) *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter course name in Hebrew"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="overview.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overview (English) *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter course overview in English"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="overview.ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overview (Arabic) *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter course overview in Arabic"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="overview.he"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overview (Hebrew) *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter course overview in Hebrew"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section builder removed - manage sections on the sections page */}
          {isEditMode && id && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Sections are now managed separately for better organization.
                  </p>
                  <Link to={`/dashboard/free-courses/${id}/sections`}>
                    <Button variant="outline">Manage Sections</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/free-courses")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                imageUploadStatus === "uploading"
              }
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : imageUploadStatus === "uploading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading image...
                </>
              ) : isEditMode ? (
                "Update Free Course"
              ) : (
                "Create Free Course"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
