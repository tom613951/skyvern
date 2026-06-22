import { getClient } from "@/api/AxiosClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { useCredentialGetter } from "@/hooks/useCredentialGetter";
import { cn } from "@/util/utils";
import { DotsHorizontalIcon, ReloadIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  workflowId: string;
  title: string;
  description: string;
  url: string;
};

function SavedTaskCard({ workflowId, title, url, description }: Props) {
  const [open, setOpen] = useState(false);
  const credentialGetter = useCredentialGetter();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [hovering, setHovering] = useState(false);

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = await getClient(credentialGetter);
      return client
        .delete(`/workflows/${id}`)
        .then((response) => response.data);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "删除模板时出错",
        description: error.message,
      });
      setOpen(false);
    },
    onSuccess: () => {
      toast({
        title: "模板已删除",
        description: "模板删除成功",
      });
      queryClient.invalidateQueries({
        queryKey: ["savedTasks"],
      });
      setOpen(false);
      navigate("/create");
    },
  });

  return (
    <Card
      className="border-0"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onMouseOver={() => setHovering(true)}
      onMouseOut={() => setHovering(false)}
    >
      <CardHeader
        className={cn("rounded-t-md bg-slate-elevation1", {
          "bg-slate-900": hovering,
        })}
      >
        <CardTitle className="flex items-center justify-between font-normal">
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
            {title}
          </span>
          <Dialog
            open={open}
            onOpenChange={() => {
              setOpen(false);
            }}
          >
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <DotsHorizontalIcon className="cursor-pointer" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>模板操作</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    setOpen(true);
                  }}
                >
                  删除模板
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>您确定吗？</DialogTitle>
                <DialogDescription>
                  您确定要删除此任务模板吗？
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  取消
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteTaskMutation.mutate(workflowId);
                  }}
                  disabled={deleteTaskMutation.isPending}
                >
                  {deleteTaskMutation.isPending && (
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  删除
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription className="overflow-hidden text-ellipsis whitespace-nowrap text-slate-400">
          {url}
        </CardDescription>
      </CardHeader>
      <CardContent
        className={cn(
          "h-36 cursor-pointer overflow-scroll rounded-b-md bg-slate-elevation3 p-4 text-sm text-slate-300",
          {
            "bg-slate-800": hovering,
          },
        )}
        onClick={() => {
          navigate(`/tasks/create/${workflowId}`);
        }}
      >
        {description}
      </CardContent>
    </Card>
  );
}

export { SavedTaskCard };
