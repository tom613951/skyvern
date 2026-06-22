import { PlusIcon, ReloadIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import { useCreateBrowserSessionMutation } from "@/routes/browserSessions/hooks/useCreateBrowserSessionMutation";
import { useBrowserProfileCreateStore } from "@/store/useBrowserProfileCreateStore";

type Props = {
  size?: "default" | "lg";
  label?: string;
};

function CreateBrowserProfileButton({
  size = "default",
  label = "创建浏览器配置文件",
}: Props) {
  const createBrowserSessionMutation = useCreateBrowserSessionMutation();
  const isBackgroundCreateInProgress = useBrowserProfileCreateStore(
    (state) => state.active !== null,
  );

  const disabled =
    createBrowserSessionMutation.isPending || isBackgroundCreateInProgress;

  return (
    <Button
      size={size}
      disabled={disabled}
      title={
        isBackgroundCreateInProgress
          ? "已有一个浏览器配置文件正在被创建"
          : undefined
      }
      onClick={() => {
        createBrowserSessionMutation.mutate({
          proxyLocation: null,
          timeout: null,
          generateBrowserProfile: true,
        });
      }}
    >
      {createBrowserSessionMutation.isPending ? (
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <PlusIcon className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}

export { CreateBrowserProfileButton };
