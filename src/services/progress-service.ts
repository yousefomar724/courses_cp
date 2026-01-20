import { apiGet, apiPost, apiGetPaginated } from './api';
import axios from 'axios';
import type {
  Progress,
  ProgressSummary,
  ProgressWithCourse,
  TopicProgressDetail,
  LessonProgressDetail,
  CourseStatistics,
  LeaderboardEntry,
  InitializeProgressRequest,
  MarkLessonViewedRequest,
  MarkLessonCompletedRequest,
  UpdateVideoProgressRequest,
  AddTimeSpentRequest,
  ResetProgressRequest,
  ProgressQueryParams,
  PaginatedResponse,
  ApiResponse,
} from '@/types/api';

export const progressService = {
  // User Endpoints

  // Initialize progress for a new enrollment
  async initializeProgress(data: InitializeProgressRequest): Promise<ApiResponse<Progress>> {
    return await apiPost<Progress>('/progress/initialize', data);
  },

  // Mark lesson as viewed (first access)
  async markLessonAsViewed(data: MarkLessonViewedRequest): Promise<ApiResponse<ProgressSummary>> {
    return await apiPost<ProgressSummary>('/progress/lesson/viewed', data);
  },

  // Mark lesson as completed
  async markLessonAsCompleted(data: MarkLessonCompletedRequest): Promise<ApiResponse<ProgressSummary>> {
    return await apiPost<ProgressSummary>('/progress/lesson/completed', data);
  },

  // Update video progress (called during playback)
  async updateVideoProgress(data: UpdateVideoProgressRequest): Promise<ApiResponse<{
    courseCompletionPercentage: number;
    completedLessons: number;
    totalLessons: number;
  }>> {
    return await apiPost('/progress/video', data);
  },

  // Add time spent on lesson
  async addTimeSpent(data: AddTimeSpentRequest): Promise<ApiResponse<{
    totalTimeSpent: number;
  }>> {
    return await apiPost('/progress/time', data);
  },

  // Get all user progress (all enrolled courses)
  async getUserProgress(): Promise<ApiResponse<ProgressSummary[]>> {
    return await apiGet<ProgressSummary[]>('/progress');
  },

  // Get progress for specific enrollment
  async getProgress(enrollmentId: string): Promise<ApiResponse<ProgressWithCourse>> {
    return await apiGet<ProgressWithCourse>(`/progress/${enrollmentId}`);
  },

  // Get progress summary (lightweight)
  async getProgressSummary(enrollmentId: string): Promise<ApiResponse<ProgressSummary>> {
    return await apiGet<ProgressSummary>(`/progress/${enrollmentId}/summary`);
  },

  // Get topic progress detail
  async getTopicProgress(enrollmentId: string, topicId: string): Promise<ApiResponse<TopicProgressDetail>> {
    return await apiGet<TopicProgressDetail>(`/progress/${enrollmentId}/topic/${topicId}`);
  },

  // Get lesson progress detail
  async getLessonProgress(enrollmentId: string, lessonId: string): Promise<ApiResponse<LessonProgressDetail>> {
    return await apiGet<LessonProgressDetail>(`/progress/${enrollmentId}/lesson/${lessonId}`);
  },

  // Admin Endpoints

  // Get course statistics
  async getCourseStatistics(courseId: string): Promise<ApiResponse<CourseStatistics>> {
    return await apiGet<CourseStatistics>(`/dashboard/progress/stats/course/${courseId}`);
  },

  // Get course leaderboard
  async getCourseLeaderboard(courseId: string, limit: number = 10): Promise<ApiResponse<LeaderboardEntry[]>> {
    return await apiGet<LeaderboardEntry[]>(`/dashboard/progress/leaderboard/course/${courseId}?limit=${limit}`);
  },

  // Reset user progress (admin)
  async resetProgress(enrollmentId: string, data: ResetProgressRequest): Promise<ApiResponse<ProgressSummary>> {
    return await apiPost<ProgressSummary>(`/dashboard/progress/${enrollmentId}/reset`, data);
  },

  // Delete user progress (admin)
  async deleteProgress(enrollmentId: string, userId: string): Promise<ApiResponse<void>> {
    // Use apiPost as DELETE with body workaround since apiDelete doesn't support body
    // Backend expects DELETE with body containing userId
    const API_BASE_URL = import.meta.env.VITE_API_URL || "https://courses-api.alef-team.com/api/v1/";
    const token = localStorage.getItem('admin_token');
    
    const response = await axios.delete(`${API_BASE_URL}dashboard/progress/${enrollmentId}`, {
      data: { userId },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  },

  // Get paginated progress list for admin (optional, for admin dashboard)
  async getProgressList(params?: ProgressQueryParams): Promise<PaginatedResponse<Progress>> {
    return await apiGetPaginated<Progress>('/dashboard/progress', params);
  },
};
