import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { videoLibraryService } from '@/services/videos-library-service';
import type {
  CreateVideoLibraryInput,
  UpdateVideoLibraryInput,
  VideoLibraryQueryParams,
} from '@/types/api';

// Query Keys
export const videoLibraryKeys = {
  all: ['videoLibrary'] as const,
  lists: () => [...videoLibraryKeys.all, 'list'] as const,
  list: (params: VideoLibraryQueryParams) => [...videoLibraryKeys.lists(), params] as const,
  details: () => [...videoLibraryKeys.all, 'detail'] as const,
  detail: (id: string, params?: { language?: string; includePresignedUrls?: boolean }) =>
    [...videoLibraryKeys.details(), id, params] as const,
  stats: (entityType: string) => [...videoLibraryKeys.all, 'stats', entityType] as const,
  select: (entityType: string, language?: string) =>
    [...videoLibraryKeys.all, 'select', entityType, language] as const,
  search: (search: string, filters: Record<string, unknown>, options: Record<string, unknown>, language: string) =>
    [...videoLibraryKeys.all, 'search', search, filters, options, language] as const,
};

// Get all video libraries with pagination and filtering
export function useVideoLibraries(params: VideoLibraryQueryParams = {}) {
  return useQuery({
    queryKey: videoLibraryKeys.list(params),
    queryFn: () => videoLibraryService.getVideoLibraries(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get video library by ID
export function useVideoLibrary(
  id: string,
  params: {
    language?: 'en' | 'ar' | 'he' | 'all';
    includePresignedUrls?: boolean;
  } = {}
) {
  return useQuery({
    queryKey: videoLibraryKeys.detail(id, params),
    queryFn: () => videoLibraryService.getVideoLibraryById(id, params),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get video statistics for an entity type
export function useVideoLibraryStats(entityType: 'lesson' | 'course') {
  return useQuery({
    queryKey: videoLibraryKeys.stats(entityType),
    queryFn: () => videoLibraryService.getEntityVideoStats(entityType),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get videos for select input
export function useVideosForSelect(
  entityType: 'lesson' | 'course',
  language: 'en' | 'ar' | 'he' | 'all' = 'en'
) {
  return useQuery({
    queryKey: videoLibraryKeys.select(entityType, language),
    queryFn: () => videoLibraryService.getVideosForSelect(entityType, language),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Search video libraries
export function useSearchVideoLibraries(
  search: string,
  filters: {
    entityType?: 'lesson' | 'course';
    videoType?: string;
    uploadedBy?: string;
  } = {},
  options: { page?: number; limit?: number } = {},
  language: 'en' | 'ar' | 'he' | 'all' = 'en'
) {
  return useQuery({
    queryKey: videoLibraryKeys.search(search, filters, options, language),
    queryFn: () => videoLibraryService.searchVideoLibraries(search, filters, options, language),
    enabled: !!search && search.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Remove generateUploadUrl hook as we're using the standard UploadService

// Create video library
export function useCreateVideoLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVideoLibraryInput) =>
      videoLibraryService.createVideoLibrary(data),
    onSuccess: () => {
      // Invalidate and refetch video library queries
      queryClient.invalidateQueries({ queryKey: videoLibraryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: videoLibraryKeys.all });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create video library: ${error.message}`);
    },
  });
}

// Update video library
export function useUpdateVideoLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, params }: {
      id: string;
      data: UpdateVideoLibraryInput;
      params?: { language?: 'en' | 'ar' | 'he' | 'all' };
    }) => videoLibraryService.updateVideoLibrary(id, data, params),
    onSuccess: (_, variables) => {
      toast.success('Video library updated successfully!');
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: videoLibraryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: videoLibraryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: videoLibraryKeys.all });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update video library: ${error.message}`);
    },
  });
}

// Soft delete video library
export function useSoftDeleteVideoLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: {
      id: string;
      params?: { language?: 'en' | 'ar' | 'he' | 'all' };
    }) => videoLibraryService.softDeleteVideoLibrary(id, params),
    onSuccess: (_, variables) => {
      toast.success('Video library deleted successfully!');
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: videoLibraryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: videoLibraryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: videoLibraryKeys.all });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete video library: ${error.message}`);
    },
  });
}

// Hard delete video library
export function useHardDeleteVideoLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => videoLibraryService.hardDeleteVideoLibrary(id),
    onSuccess: () => {
      toast.success('Video library permanently deleted!');
      // Invalidate and refetch video library queries
      queryClient.invalidateQueries({ queryKey: videoLibraryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: videoLibraryKeys.all });
    },
    onError: (error: Error) => {
      toast.error(`Failed to permanently delete video library: ${error.message}`);
    },
  });
}

// Get presigned video URL
export function useGetPresignedVideoUrl() {
  return useMutation({
    mutationFn: ({ id, expiresIn }: { id: string; expiresIn?: number }) =>
      videoLibraryService.getPresignedVideoUrl(id, expiresIn),
    onError: (error: Error) => {
      toast.error(`Failed to get video URL: ${error.message}`);
    },
  });
}

// Upload video with progress
export function useUploadVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      entityType,
      entityId,
      onProgress,
    }: {
      file: File;
      entityType: 'lesson' | 'course';
      entityId?: string;
      onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void;
    }) => videoLibraryService.uploadVideoWithProgress(file, entityType, entityId, onProgress),
    onSuccess: () => {
      // Invalidate and refetch video library queries
      queryClient.invalidateQueries({ queryKey: videoLibraryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: videoLibraryKeys.all });
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload video: ${error.message}`);
    },
  });
}

// Complete video upload flow (upload + create record)
export function useCompleteVideoUpload() {
  const uploadMutation = useUploadVideo();
  const createMutation = useCreateVideoLibrary();

  const completeUpload = async ({
    file,
    name,
    entityType,
    entityId,
    onProgress,
  }: {
    file: File;
    name: { en: string; ar?: string; he?: string };
    entityType: 'lesson' | 'course';
    entityId?: string;
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void;
  }) => {
    // Upload file to S3
    const uploadResult = await uploadMutation.mutateAsync({
      file,
      entityType,
      entityId,
      onProgress,
    });

    // Create video library record
    const videoLibraryData: CreateVideoLibraryInput = {
      name,
      videoUrl: uploadResult.key, // Use the S3 key
      videoType: file.type,
      fileSize: file.size,
      entityType,
      uploadedBy: '', // This will be set by the backend from the authenticated user
    };

    const videoLibrary = await createMutation.mutateAsync(videoLibraryData);

    return videoLibrary;
  };

  return {
    completeUpload,
    isPending: uploadMutation.isPending || createMutation.isPending,
    error: uploadMutation.error || createMutation.error,
  };
}
