import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { useDeleteProgress } from "@/hooks/use-progress";
import { toast } from "sonner";

interface DeleteProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  enrollmentId: string;
  userName?: string;
  courseName?: string;
  userId: string;
}

export function DeleteProgressDialog({
  isOpen,
  onClose,
  enrollmentId,
  userName,
  courseName,
  userId,
}: DeleteProgressDialogProps) {
  const deleteProgressMutation = useDeleteProgress();

  const handleDelete = async () => {
    try {
      await deleteProgressMutation.mutateAsync({
        enrollmentId,
        userId: userId,
      });
      toast.success("Progress deleted successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to delete progress");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Delete Progress
          </DialogTitle>
          <DialogDescription>
            This will permanently delete progress data for this user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action cannot be undone.
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>All progress data will be soft-deleted</li>
                <li>Data will be retained for audit purposes</li>
                <li>User will no longer see this progress</li>
                <li>Enrollment record will remain active</li>
              </ul>
            </AlertDescription>
          </Alert>

          {userName && courseName && (
            <div className="bg-gray-50 p-3 rounded-md text-sm">
              <p><strong>User:</strong> {userName}</p>
              <p><strong>Course:</strong> {courseName}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteProgressMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteProgressMutation.isPending}
          >
            {deleteProgressMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete Progress
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
