import { ReloadIcon, TrashIcon } from "@radix-ui/react-icons";

import { BrowserProfileApiResponse } from "@/api/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useDeleteBrowserProfileMutation } from "./hooks/useBrowserProfileMutations";

type Props = {
  profile: BrowserProfileApiResponse;
  onDeleted?: () => void;
};

function DeleteBrowserProfileButton({ profile, onDeleted }: Props) {
  const deleteMutation = useDeleteBrowserProfileMutation();

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="删除浏览器配置文件"
                className="text-muted-foreground hover:text-destructive"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>删除浏览器配置文件</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>您确定吗？</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-neutral-600 dark:text-slate-400">
          浏览器配置文件{" "}
          <span className="font-bold text-primary">{profile.name}</span> 将被删除。引用此配置文件的智能体将无法再找到它。
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">取消</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={async () => {
              await deleteMutation.mutateAsync(profile.browser_profile_id);
              onDeleted?.();
            }}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && (
              <ReloadIcon className="mr-2 size-4 animate-spin" />
            )}
            删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DeleteBrowserProfileButton };
