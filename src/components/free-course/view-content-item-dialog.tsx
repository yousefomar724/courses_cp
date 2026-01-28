/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContentItem } from '@/hooks/use-content-items';
import { useVideoLibrary } from '@/hooks/use-videos-library';
import { useQuiz } from '@/hooks/use-quizzes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Video, ClipboardList, ExternalLink } from 'lucide-react';

interface ViewContentItemDialogProps {
  freeCourseId: string;
  sectionId: string;
  contentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewContentItemDialog({
  freeCourseId,
  sectionId,
  contentId,
  open,
  onOpenChange,
}: ViewContentItemDialogProps) {
  const { data: contentItem, isLoading } = useContentItem(
    freeCourseId,
    sectionId,
    contentId
  );

  // Fetch related resource data based on type
  const { data: videoData } = useVideoLibrary(
    contentItem?.type === 'video' && contentItem?.resourceId
      ? contentItem.resourceId
      : '',
    { includePresignedUrls: true }
  );

  const { data: quizData } = useQuiz(
    contentItem?.type === 'quiz' && contentItem?.resourceId
      ? contentItem.resourceId
      : ''
  );

  const getDisplayName = (value: any) => {
    if (typeof value === 'string') return value;
    return value?.en || value?.name?.en || 'N/A';
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <FileText className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'quiz':
        return <ClipboardList className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getContentTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      file: 'default',
      video: 'secondary',
      quiz: 'outline',
    };
    return (
      <Badge variant={variants[type] || 'default'} className="capitalize">
        {type}
      </Badge>
    );
  };

  // Helper function to check if URL is a video
  const isVideoUrl = (url: string): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m3u8'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext)) || 
           lowerUrl.includes('video/') ||
           lowerUrl.includes('.mp4') ||
           lowerUrl.includes('videos/');
  };

  // Helper function to check if URL is an image
  const isImageUrl = (url: string): boolean => {
    if (!url) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext)) || 
           lowerUrl.includes('image/');
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!contentItem) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getContentTypeIcon(contentItem.type)}
            View Content Item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Type and Order */}
          <div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Content Type
              </label>
              <div className="mt-1">
                {getContentTypeBadge(contentItem.type)}
              </div>
            </div>
            
          </div>

          {/* Titles */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Title (English)
              </label>
              <p className="mt-1 text-base">{contentItem.title.en}</p>
            </div>

            {contentItem.title.ar && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Title (Arabic)
                </label>
                <p className="mt-1 text-base" dir="rtl">
                  {contentItem.title.ar}
                </p>
              </div>
            )}

            {contentItem.title.he && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Title (Hebrew)
                </label>
                <p className="mt-1 text-base" dir="rtl">
                  {contentItem.title.he}
                </p>
              </div>
            )}
          </div>

          {/* Type-specific Information */}
          <div className="border-t pt-4">
            <label className="text-sm font-medium text-muted-foreground mb-3 block">
              Content Details
            </label>

            {/* File Type */}
            {contentItem.type === 'file' && (
              <div className="space-y-2">
                {contentItem.url && (
                  <div>
                    {isVideoUrl(contentItem.url) ? (
                      <div className="w-full">
                        <span className="text-sm font-medium block mb-2">Video File:</span>
                        <video
                          src={contentItem.url}
                          controls
                          className="w-full rounded-md max-h-96"
                          preload="metadata"
                        >
                          Your browser does not support the video tag.
                        </video>
                        <a
                          href={contentItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                        >
                          Open in new tab <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ) : isImageUrl(contentItem.url) ? (
                      <div className="w-full">
                        <span className="text-sm font-medium block mb-2">Image File:</span>
                        <img
                          src={contentItem.url}
                          alt="File preview"
                          className="w-full rounded-md max-h-96 object-contain"
                        />
                        <a
                          href={contentItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                        >
                          Open in new tab <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">File URL:</span>
                        <a
                          href={contentItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          View File <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
                {contentItem.resourceId && !contentItem.url && (
                  <div className="text-sm text-muted-foreground">
                    File ID: {contentItem.resourceId}
                  </div>
                )}
              </div>
            )}

            {/* Video Type */}
            {contentItem.type === 'video' && (
              <div className="space-y-2">
                {contentItem.resourceId && videoData?.data ? (
                  <div>
                    <span className="text-sm font-medium">Video Library:</span>
                    <p className="text-sm mt-1">
                      {getDisplayName(videoData.data.name)}
                    </p>
                    {videoData.data.videoUrl && (
                      <div className="mt-3">
                        {isVideoUrl(videoData.data.videoUrl) ? (
                          <div className="w-full">
                            <video
                              src={videoData.data.videoUrl}
                              controls
                              className="w-full rounded-md max-h-96"
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                            <a
                              href={videoData.data.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                            >
                              Open in new tab <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        ) : isImageUrl(videoData.data.videoUrl) ? (
                          <div className="w-full">
                            <img
                              src={videoData.data.videoUrl}
                              alt={getDisplayName(videoData.data.name)}
                              className="w-full rounded-md max-h-96 object-contain"
                            />
                            <a
                              href={videoData.data.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                            >
                              Open in new tab <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        ) : (
                          <a
                            href={videoData.data.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                          >
                            Watch Video <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ) : contentItem.url ? (
                  <div>
                    <span className="text-sm font-medium">External Video:</span>
                    <div className="mt-2">
                      {isVideoUrl(contentItem.url) ? (
                        <div className="w-full">
                          <video
                            src={contentItem.url}
                            controls
                            className="w-full rounded-md max-h-96"
                            preload="metadata"
                          >
                            Your browser does not support the video tag.
                          </video>
                          <a
                            href={contentItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                          >
                            Open in new tab <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ) : isImageUrl(contentItem.url) ? (
                        <div className="w-full">
                          <img
                            src={contentItem.url}
                            alt="Content preview"
                            className="w-full rounded-md max-h-96 object-contain"
                          />
                          <a
                            href={contentItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                          >
                            Open in new tab <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ) : (
                        <a
                          href={contentItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {contentItem.url} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No video source available
                  </div>
                )}
              </div>
            )}

            {/* Quiz Type */}
            {contentItem.type === 'quiz' && (
              <div className="space-y-2">
                {contentItem.resourceId && quizData?.data ? (
                  <div>
                    <span className="text-sm font-medium">Quiz:</span>
                    <p className="text-sm mt-1">
                      {getDisplayName(quizData.data.title)}
                    </p>
                    {quizData.data.questions && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {quizData.data.questions.length} questions
                      </p>
                    )}
                    {quizData.data.passingScore && (
                      <p className="text-sm text-muted-foreground">
                        Passing Score: {quizData.data.passingScore}%
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Quiz ID: {contentItem.resourceId || 'Not specified'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
