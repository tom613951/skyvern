import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateFolderMutation } from "../hooks/useFolderMutations";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateFolderDialog({ open, onOpenChange }: CreateFolderDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const createFolderMutation = useCreateFolderMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createFolderMutation.mutateAsync({
      title: title.trim(),
      description: description.trim() || null,
    });

    setTitle("");
    setDescription("");
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setTitle("");
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建新文件夹</DialogTitle>
          <DialogDescription>
            创建一个文件夹来整理您的智能体。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-title">标题</Label>
              <Input
                id="folder-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：生产智能体"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="folder-description">描述（可选）</Label>
              <Textarea
                id="folder-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="添加描述..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || createFolderMutation.isPending}
            >
              创建文件夹
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { CreateFolderDialog };
