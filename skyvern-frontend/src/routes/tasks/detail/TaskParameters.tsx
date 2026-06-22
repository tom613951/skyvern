import { getClient } from "@/api/AxiosClient";
import { TaskApiResponse } from "@/api/types";
import { AutoResizingTextarea } from "@/components/AutoResizingTextarea/AutoResizingTextarea";
import { KeyValueInput } from "@/components/KeyValueInput";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useCredentialGetter } from "@/hooks/useCredentialGetter";
import { CodeEditor } from "@/routes/workflows/components/CodeEditor";
import { MAX_SCREENSHOT_SCROLLS_DEFAULT } from "@/routes/workflows/editor/nodes/Taskv2Node/types";
import { useQuery } from "@tanstack/react-query";
import { useFirstParam } from "@/hooks/useFirstParam";

function TaskParameters() {
  const taskId = useFirstParam("taskId", "runId");
  const credentialGetter = useCredentialGetter();
  const {
    data: task,
    isLoading: taskIsLoading,
    isError: taskIsError,
  } = useQuery<TaskApiResponse>({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const client = await getClient(credentialGetter);
      return client.get(`/tasks/${taskId}`).then((response) => response.data);
    },
  });

  if (taskIsLoading) {
    return (
      <div className="h-[40rem]">
        <Skeleton className="h-full" />
      </div>
    );
  }

  if (taskIsError || !task) {
    return <div>加载输入参数出错</div>;
  }

  return (
    <section className="space-y-8 rounded-lg bg-slate-elevation3 px-6 py-5">
      <div className="flex gap-16">
        <div className="w-72">
          <h1 className="text-lg">URL 地址</h1>
          <h2 className="text-base text-slate-400">
            任务的起始 URL
          </h2>
        </div>
        <Input value={task.request.url} readOnly />
      </div>
      <div className="flex gap-16">
        <div className="w-72">
          <h1 className="text-lg">导航目标</h1>
          <h2 className="text-base text-slate-400">
            Skyvern 应该去哪里，应该做什么？
          </h2>
        </div>
        <AutoResizingTextarea
          value={task.request.navigation_goal ?? ""}
          readOnly
        />
      </div>
      <div className="flex gap-16">
        <div className="w-72">
          <h1 className="text-lg">导航载荷 (Payload)</h1>
          <h2 className="text-base text-slate-400">
            指定重要的参数、路由或状态
          </h2>
        </div>
        <CodeEditor
          className="w-full"
          language="json"
          value={
            typeof task.request.navigation_payload === "object"
              ? JSON.stringify(task.request.navigation_payload, null, 2)
              : (task.request.navigation_payload ?? "")
          }
          readOnly
          minHeight="96px"
          maxHeight="500px"
        />
      </div>
      <div className="flex gap-16">
        <div className="w-72">
          <h1 className="text-lg">数据提取目标</h1>
          <h2 className="text-base text-slate-400">
            您希望获取什么输出？
          </h2>
        </div>
        <AutoResizingTextarea
          value={task.request.data_extraction_goal ?? ""}
          readOnly
        />
      </div>
      <div className="flex gap-16">
        <div className="w-72">
          <h1 className="text-lg">数据 Schema (结构)</h1>
          <h2 className="text-base text-slate-400">
            以 JSON 格式指定输出结构
          </h2>
        </div>
        <CodeEditor
          className="w-full"
          language="json"
          value={
            typeof task.request.extracted_information_schema === "object"
              ? JSON.stringify(
                  task.request.extracted_information_schema,
                  null,
                  2,
                )
              : (task.request.extracted_information_schema ?? "")
          }
          readOnly
          minHeight="96px"
          maxHeight="500px"
        />
      </div>
      <div className="flex gap-16">
        <div className="w-72">
          <h1 className="text-lg">额外 HTTP 请求头</h1>
          <h2 className="text-base text-slate-400">
            指定一些自定义的 HTTP 请求头
          </h2>
        </div>
        <div className="w-full">
          <KeyValueInput
            value={
              task.request.extra_http_headers
                ? JSON.stringify(task.request.extra_http_headers)
                : null
            }
            readOnly={true}
            onChange={() => {}}
          />
        </div>
      </div>
      <div className="flex gap-16">
        <div className="w-72">
          <h1 className="text-lg">Webhook 回调 URL</h1>
          <h2 className="text-base text-slate-400">
            用于接收提取出的信息的 Webhook 接口 URL
          </h2>
        </div>
        <Input value={task.request.webhook_callback_url ?? ""} readOnly />
      </div>
      <div className="flex gap-16">
        <div className="w-72">
          <h1 className="text-lg">最大截图滚动次数</h1>
          <h2 className="text-base text-slate-400">
            对页面进行滚动以获取长截图的最大次数
          </h2>
        </div>
        <Input
          placeholder={`默认值: ${MAX_SCREENSHOT_SCROLLS_DEFAULT}`}
          value={task.request.max_screenshot_scrolls ?? ""}
          readOnly
        />
      </div>
      <div className="flex gap-16">
        <div className="w-72">
          <h1 className="text-lg">包含操作历史</h1>
          <h2 className="text-base text-slate-400">
            在完成验证中包含操作历史记录
          </h2>
        </div>
        <div className="w-full">
          <Switch
            checked={
              task.request.include_action_history_in_verification ?? false
            }
            disabled
          />
        </div>
      </div>
    </section>
  );
}

export { TaskParameters };
