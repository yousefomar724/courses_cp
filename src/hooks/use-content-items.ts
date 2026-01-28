/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addContentToSection, getFreeCourseById, removeContentFromSection, updateSection } from '@/services/free-course-service';
import type { CreateContentItemInput } from '@/types/api';
import { toast } from 'sonner';

// Query keys
export const contentItemKeys = {
  all: ['contentItems'] as const,
  bySection: (freeCourseId: string, sectionId: string) =>
    ['contentItems', 'freeCourse', freeCourseId, 'section', sectionId] as const,
  detail: (freeCourseId: string, sectionId: string, contentId: string) =>
    ['contentItems', 'freeCourse', freeCourseId, 'section', sectionId, contentId] as const,
};

/**
 * Hook to get all content items for a section
 */
export function useContentItems(freeCourseId: string, sectionId: string) {
  return useQuery({
    queryKey: contentItemKeys.bySection(freeCourseId, sectionId),
    queryFn: async () => {
      const freeCourse = await getFreeCourseById(freeCourseId);
      const section = freeCourse.data?.sections?.find((s) => s._id === sectionId);
      if (!section) {
        throw new Error('Section not found');
      }
      return section.contentItems || [];
    },
    enabled: !!freeCourseId && !!sectionId,
  });
}

/**
 * Hook to get a single content item
 */
export function useContentItem(freeCourseId: string, sectionId: string, contentId: string) {
  return useQuery({
    queryKey: contentItemKeys.detail(freeCourseId, sectionId, contentId),
    queryFn: async () => {
      const freeCourse = await getFreeCourseById(freeCourseId);
      const section = freeCourse.data?.sections?.find((s) => s._id === sectionId);
      if (!section) {
        throw new Error('Section not found');
      }
      const contentItem = section.contentItems?.find((c) => c._id === contentId);
      if (!contentItem) {
        throw new Error('Content item not found');
      }
      return contentItem;
    },
    enabled: !!freeCourseId && !!sectionId && !!contentId,
  });
}

/**
 * Hook to create a new content item
 */
export function useCreateContentItem(freeCourseId: string, sectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContentItemInput) =>
      addContentToSection(freeCourseId, sectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentItemKeys.bySection(freeCourseId, sectionId) });
      queryClient.invalidateQueries({ queryKey: ['sections', 'freeCourse', freeCourseId] });
      queryClient.invalidateQueries({ queryKey: ['freeCourses'] });
      toast.success('Content item created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create content item');
    },
  });
}

/**
 * Hook to update a content item
 * Since the backend doesn't have a direct update endpoint for content items,
 * we update the entire section with the modified content item
 */
export function useUpdateContentItem(freeCourseId: string, sectionId: string, contentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // First, get the current section
      const freeCourse = await getFreeCourseById(freeCourseId);
      const section = freeCourse.data?.sections?.find((s) => s._id === sectionId);

      if (!section) {
        throw new Error('Section not found');
      }

      // Update the section with the modified content items
      return updateSection(freeCourseId, sectionId, {
        title: section.title,
        description: section.description,
        order: section.order,
        isVisible: section.isVisible,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentItemKeys.bySection(freeCourseId, sectionId) });
      queryClient.invalidateQueries({ queryKey: contentItemKeys.detail(freeCourseId, sectionId, contentId) });
      queryClient.invalidateQueries({ queryKey: ['sections', 'freeCourse', freeCourseId] });
      queryClient.invalidateQueries({ queryKey: ['freeCourses'] });
      toast.success('Content item updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update content item');
    },
  });
}

/**
 * Hook to delete a content item
 */
export function useDeleteContentItem(freeCourseId: string, sectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contentId: string) =>
      removeContentFromSection(freeCourseId, sectionId, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentItemKeys.bySection(freeCourseId, sectionId) });
      queryClient.invalidateQueries({ queryKey: ['sections', 'freeCourse', freeCourseId] });
      queryClient.invalidateQueries({ queryKey: ['freeCourses'] });
      toast.success('Content item deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete content item');
    },
  });
}
