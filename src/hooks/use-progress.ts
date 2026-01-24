import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { progressService } from "@/services/progress-service";
import type {
  InitializeProgressRequest,
  MarkLessonViewedRequest,
  MarkLessonCompletedRequest,
  UpdateVideoProgressRequest,
  AddTimeSpentRequest,
  ResetProgressRequest,
  ProgressQueryParams,
} from "@/types/api";

// Query keys
export const progressKeys = {
  all: ["progress"] as const,
  lists: () => [...progressKeys.all, "list"] as const,
  list: (params: ProgressQueryParams) => [...progressKeys.lists(), params] as const,
  userProgress: () => [...progressKeys.all, "user"] as const,
  details: () => [...progressKeys.all, "detail"] as const,
  detail: (enrollmentId: string) => [...progressKeys.details(), enrollmentId] as const,
  summary: (enrollmentId: string) => [...progressKeys.all, "summary", enrollmentId] as const,
  topic: (enrollmentId: string, topicId: string) => [...progressKeys.all, "topic", enrollmentId, topicId] as const,
  lesson: (enrollmentId: string, lessonId: string) => [...progressKeys.all, "lesson", enrollmentId, lessonId] as const,
  statistics: (courseId: string) => [...progressKeys.all, "statistics", courseId] as const,
  leaderboard: (courseId: string, limit: number) => [...progressKeys.all, "leaderboard", courseId, limit] as const,
};

// Query Hooks

// Get all user progress (all enrolled courses)
export const useUserProgress = () => {
  return useQuery({
    queryKey: progressKeys.userProgress(),
    queryFn: () => progressService.getUserProgress(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get progress for specific enrollment
export const useProgress = (enrollmentId: string) => {
  return useQuery({
    queryKey: progressKeys.detail(enrollmentId),
    queryFn: () => progressService.getProgress(enrollmentId),
    enabled: !!enrollmentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get progress summary (lightweight)
export const useProgressSummary = (enrollmentId: string) => {
  return useQuery({
    queryKey: progressKeys.summary(enrollmentId),
    queryFn: () => progressService.getProgressSummary(enrollmentId),
    enabled: !!enrollmentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get topic progress
export const useTopicProgress = (enrollmentId: string, topicId: string) => {
  return useQuery({
    queryKey: progressKeys.topic(enrollmentId, topicId),
    queryFn: () => progressService.getTopicProgress(enrollmentId, topicId),
    enabled: !!enrollmentId && !!topicId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get lesson progress
export const useLessonProgress = (enrollmentId: string, lessonId: string) => {
  return useQuery({
    queryKey: progressKeys.lesson(enrollmentId, lessonId),
    queryFn: () => progressService.getLessonProgress(enrollmentId, lessonId),
    enabled: !!enrollmentId && !!lessonId,
    staleTime: 1 * 60 * 1000, // 1 minute (more frequent for active lesson)
  });
};

// Get course statistics (admin)
export const useCourseStatistics = (courseId: string) => {
  return useQuery({
    queryKey: progressKeys.statistics(courseId),
    queryFn: () => progressService.getCourseStatistics(courseId),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get course leaderboard (admin)
export const useCourseLeaderboard = (courseId: string, limit: number = 10) => {
  return useQuery({
    queryKey: progressKeys.leaderboard(courseId, limit),
    queryFn: () => progressService.getCourseLeaderboard(courseId, limit),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get paginated progress list (admin)
export const useProgressList = (params?: ProgressQueryParams) => {
  return useQuery({
    queryKey: progressKeys.list(params || {}),
    queryFn: () => progressService.getProgressList(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation Hooks

// Initialize progress
export const useInitializeProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InitializeProgressRequest) =>
      progressService.initializeProgress(data),
    onSuccess: (_, variables) => {
      // Invalidate user progress list
      queryClient.invalidateQueries({ queryKey: progressKeys.userProgress() });
      // Invalidate specific enrollment progress
      queryClient.invalidateQueries({
        queryKey: progressKeys.detail(variables.enrollmentId),
      });
    },
  });
};

// Mark lesson as viewed
export const useMarkLessonViewed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MarkLessonViewedRequest) =>
      progressService.markLessonAsViewed(data),
    onSuccess: (_, variables) => {
      // Invalidate progress queries
      queryClient.invalidateQueries({
        queryKey: progressKeys.detail(variables.enrollmentId),
      });
      queryClient.invalidateQueries({
        queryKey: progressKeys.summary(variables.enrollmentId),
      });
      queryClient.invalidateQueries({
        queryKey: progressKeys.topic(variables.enrollmentId, variables.topicId),
      });
      queryClient.invalidateQueries({
        queryKey: progressKeys.lesson(variables.enrollmentId, variables.lessonId),
      });
    },
  });
};

// Mark lesson as completed
export const useMarkLessonCompleted = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MarkLessonCompletedRequest) =>
      progressService.markLessonAsCompleted(data),
    onSuccess: (_, variables) => {
      // Invalidate all related progress queries
      queryClient.invalidateQueries({
        queryKey: progressKeys.detail(variables.enrollmentId),
      });
      queryClient.invalidateQueries({
        queryKey: progressKeys.summary(variables.enrollmentId),
      });
      queryClient.invalidateQueries({
        queryKey: progressKeys.topic(variables.enrollmentId, variables.topicId),
      });
      queryClient.invalidateQueries({
        queryKey: progressKeys.lesson(variables.enrollmentId, variables.lessonId),
      });
      queryClient.invalidateQueries({ queryKey: progressKeys.userProgress() });
    },
  });
};

// Update video progress
export const useUpdateVideoProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateVideoProgressRequest) =>
      progressService.updateVideoProgress(data),
    onSuccess: (_, variables) => {
      // Invalidate progress queries
      queryClient.invalidateQueries({
        queryKey: progressKeys.detail(variables.enrollmentId),
      });
      queryClient.invalidateQueries({
        queryKey: progressKeys.summary(variables.enrollmentId),
      });
      queryClient.invalidateQueries({
        queryKey: progressKeys.lesson(variables.enrollmentId, variables.lessonId),
      });
    },
  });
};

// Add time spent
export const useAddTimeSpent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddTimeSpentRequest) =>
      progressService.addTimeSpent(data),
    onSuccess: (_, variables) => {
      // Invalidate progress queries to refresh time spent
      queryClient.invalidateQueries({
        queryKey: progressKeys.detail(variables.enrollmentId),
      });
      queryClient.invalidateQueries({
        queryKey: progressKeys.summary(variables.enrollmentId),
      });
      queryClient.invalidateQueries({
        queryKey: progressKeys.lesson(variables.enrollmentId, variables.lessonId),
      });
    },
  });
};

// Reset progress (admin)
export const useResetProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ enrollmentId, data }: { enrollmentId: string; data: ResetProgressRequest }) =>
      progressService.resetProgress(enrollmentId, data),
    onSuccess: (_, { enrollmentId }) => {
      // Invalidate all progress queries
      queryClient.invalidateQueries({ queryKey: progressKeys.all });
      queryClient.invalidateQueries({ queryKey: progressKeys.detail(enrollmentId) });
      queryClient.invalidateQueries({ queryKey: progressKeys.lists() });
    },
  });
};

// Delete progress (admin)
export const useDeleteProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ enrollmentId, userId }: { enrollmentId: string; userId: string }) =>
      progressService.deleteProgress(enrollmentId, userId),
    onSuccess: () => {
      // Invalidate all progress queries
      queryClient.invalidateQueries({ queryKey: progressKeys.all });
      queryClient.invalidateQueries({ queryKey: progressKeys.lists() });
    },
  });
};
