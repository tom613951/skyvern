import { getClient } from "@/api/AxiosClient";
import { Status, StepApiResponse, TaskApiResponse } from "@/api/types";
import { BrowserStream } from "@/components/BrowserStream";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { ZoomableImage } from "@/components/ZoomableImage";
import { useCostCalculator } from "@/hooks/useCostCalculator";
import { useCredentialGetter } from "@/hooks/useCredentialGetter";
import { useBrowserStreamingMode } from "@/hooks/useRuntimeConfig";
import { getCredentialParam } from "@/util/env";
import {
  StreamStatusPanel,
  type StreamDiagnostic,
} from "@/routes/streaming/StreamDiagnostics";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  statusIsFinalized,
  statusIsNotFinalized,
  statusIsRunningOrQueued,
} from "../types";
import { ActionScreenshot } from "./ActionScreenshot";
import { useActions } from "./hooks/useActions";
import { ScrollableActionList } from "./ScrollableActionList";
import { useFirstParam } from "@/hooks/useFirstParam";

const formatter = Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type StreamMessage = {
  task_id: string;
  status: string;
  screenshot?: string;
  format?: string;
};

const STARTING_DIAGNOSTIC: StreamDiagnostic = {
  title: "正在唤醒浏览器流",
  detail: "正在打开流并等待第一帧...",
  pending: true,
};

function diagnosticForStatus(status: string): StreamDiagnostic {
  switch (status) {
    case "not_found":
      return {
        title: "找不到此任务",
        detail: "后端无法为您所在的组织找到该任务。",
      };
    case "timeout":
      return {
        title: "浏览器无响应",
        detail: "任务已启动，但没有活动页面显示以进行流传输。",
        hint: "请检查后端日志以获取浏览器启动错误或流模式不匹配的信息。",
      };
    case "completed":
    case "failed":
    case "terminated":
      return {
        title: "此任务已结束",
        detail: `流已结束 — 状态: ${status}。`,
      };
    default:
      return {
        title: "正在等待浏览器画面",
        detail: `流已连接，任务状态为 ${status}。`,
        pending: true,
      };
  }
}

function diagnosticForClose(event: CloseEvent): StreamDiagnostic {
  if (event.code === 1006) {
    return {
      title: "连接已断开",
      detail: "浏览器流 WebSocket 在发送首帧前已关闭。",
      hint: "请检查 API 服务是否正在运行且可从 UI 访问。",
    };
  }
  return {
    title: "流传输已结束",
    detail: `WebSocket 已关闭，代码: ${event.code}${event.reason ? ` (${event.reason})` : ""}。`,
  };
}

const wssBaseUrl = import.meta.env.VITE_WSS_BASE_URL;

function TaskActions() {
  const taskId = useFirstParam("taskId", "runId");
  const credentialGetter = useCredentialGetter();
  const [streamImgSrc, setStreamImgSrc] = useState<string>("");
  const [streamFormat, setStreamFormat] = useState<string>("png");
  const [streamDiagnostic, setStreamDiagnostic] =
    useState<StreamDiagnostic>(STARTING_DIAGNOSTIC);
  const socketRef = useRef<WebSocket | null>(null);
  const hasFrameRef = useRef(false);
  const [selectedAction, setSelectedAction] = useState<
    number | "stream" | null
  >(null);
  const costCalculator = useCostCalculator();
  const queryClient = useQueryClient();

  const { data: task, isLoading: taskIsLoading } = useQuery<TaskApiResponse>({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const client = await getClient(credentialGetter);
      return client.get(`/tasks/${taskId}`).then((response) => response.data);
    },
    refetchInterval: (query) => {
      if (!query.state.data) {
        return false;
      }
      if (statusIsNotFinalized(query.state.data)) {
        return 5000;
      }
      return false;
    },
    placeholderData: keepPreviousData,
  });
  const taskIsNotFinalized = task && statusIsNotFinalized(task);
  const taskIsRunningOrQueued = task && statusIsRunningOrQueued(task);
  const browserSessionId = task?.browser_session_id;
  const { browserStreamingMode } = useBrowserStreamingMode();
  const shouldUseCdpStream = browserStreamingMode === "cdp";

  useEffect(() => {
    // In VNC mode, BrowserStream handles live sessions. In CDP mode, this
    // screenshot WebSocket is the live stream.
    if (browserSessionId && !shouldUseCdpStream) {
      return;
    }

    if (!taskIsRunningOrQueued) {
      return;
    }
    setStreamDiagnostic(STARTING_DIAGNOSTIC);
    hasFrameRef.current = false;
    let cancelled = false;

    async function run() {
      const credentialParam = await getCredentialParam(credentialGetter);
      if (cancelled) {
        return;
      }

      if (socketRef.current) {
        socketRef.current.close();
      }
      socketRef.current = new WebSocket(
        `${wssBaseUrl}/stream/tasks/${taskId}?${credentialParam}`,
      );

      socketRef.current.addEventListener("open", () => {
        setStreamDiagnostic({
          title: "已连接到流",
          detail: "正在等待后端分配浏览器实例。",
          pending: true,
        });
      });

      socketRef.current.addEventListener("message", (event) => {
        try {
          const message: StreamMessage = JSON.parse(event.data);
          if (message.screenshot) {
            hasFrameRef.current = true;
            setStreamImgSrc(message.screenshot);
          }
          if (message.format) {
            setStreamFormat(message.format);
          }
          if (!message.screenshot && message.status) {
            setStreamDiagnostic(diagnosticForStatus(message.status));
          }
          if (
            message.status === "completed" ||
            message.status === "failed" ||
            message.status === "terminated"
          ) {
            socketRef.current?.close();
            queryClient.invalidateQueries({
              queryKey: ["tasks"],
            });
            if (
              message.status === "failed" ||
              message.status === "terminated"
            ) {
              toast({
                title: "任务失败",
                description: "该任务已运行失败。",
                variant: "destructive",
              });
            } else if (message.status === "completed") {
              toast({
                title: "任务已完成",
                description: "该任务已成功运行完成。",
                variant: "success",
              });
            }
          }
        } catch (e) {
          console.error("Failed to parse message", e);
          setStreamDiagnostic({
            title: "数据解析异常",
            detail: "浏览器发送了 UI 无法解析的报文消息。",
          });
        }
      });

      socketRef.current.addEventListener("error", () => {
        setStreamDiagnostic({
          title: "流传输遇到阻碍",
          detail: "连接遇到了网络或服务器错误。",
        });
      });

      socketRef.current.addEventListener("close", (event) => {
        if (!cancelled && !hasFrameRef.current) {
          setStreamDiagnostic(diagnosticForClose(event));
        }
        socketRef.current = null;
      });
    }
    run();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [
    browserSessionId,
    credentialGetter,
    taskId,
    taskIsRunningOrQueued,
    queryClient,
    shouldUseCdpStream,
  ]);

  const { data: steps, isLoading: stepsIsLoading } = useQuery<
    Array<StepApiResponse>
  >({
    queryKey: ["task", taskId, "steps"],
    queryFn: async () => {
      const client = await getClient(credentialGetter);
      return client
        .get(`/tasks/${taskId}/steps`)
        .then((response) => response.data);
    },
    enabled: !!task,
    refetchOnWindowFocus: taskIsNotFinalized,
    refetchInterval: taskIsNotFinalized ? 5000 : false,
    placeholderData: keepPreviousData,
  });

  const { data: actions, isLoading: actionsIsLoading } = useActions({
    id: taskId ?? undefined,
  });

  if (taskIsLoading || actionsIsLoading || stepsIsLoading) {
    return (
      <div className="flex gap-2">
        <div className="h-[40rem] w-3/4">
          <Skeleton className="h-full" />
        </div>
        <div className="h-[40rem] w-1/4">
          <Skeleton className="h-full" />
        </div>
      </div>
    );
  }

  function getActiveSelection() {
    if (selectedAction === null) {
      if (taskIsNotFinalized) {
        return "stream";
      }
      return actions.length - 1;
    }
    if (selectedAction === "stream" && task && statusIsFinalized(task)) {
      return actions.length - 1;
    }
    return selectedAction;
  }

  const activeSelection = getActiveSelection();

  const activeAction =
    activeSelection !== "stream" ? actions[activeSelection] : null;

  function getStream() {
    // Use VNC streaming via BrowserStream when browser_session_id is available
    // and local browser streaming is not enabled.
    if (browserSessionId && !shouldUseCdpStream) {
      return (
        <AspectRatio ratio={16 / 9}>
          <BrowserStream
            key={browserSessionId}
            browserSessionId={browserSessionId}
            interactive={false}
            showControlButtons={false}
            onClose={() => {
              queryClient.invalidateQueries({
                queryKey: ["task", taskId],
              });
              queryClient.invalidateQueries({
                queryKey: ["tasks"],
              });
            }}
          />
        </AspectRatio>
      );
    }

    // Fall back to screenshot-based streaming
    if (task?.status === Status.Created) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-slate-elevation1 text-lg">
          <span>任务已创建。</span>
          <span>当任务开始运行时，流媒体传输将启动。</span>
        </div>
      );
    }
    if (task?.status === Status.Queued) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-slate-elevation1 text-lg">
          <span>您的任务正在排队中。通常排队时间为 1-2 分钟。</span>
          <span>当任务开始运行时，流媒体传输将启动。</span>
        </div>
      );
    }

    if (task?.status === Status.Running && streamImgSrc.length === 0) {
      return <StreamStatusPanel diagnostic={streamDiagnostic} />;
    }

    if (task?.status === Status.Running && streamImgSrc.length > 0) {
      return (
        <div className="h-full w-full">
          <ZoomableImage
            src={`data:image/${streamFormat};base64,${streamImgSrc}`}
          />
        </div>
      );
    }
    return null;
  }

  const showCost = typeof costCalculator === "function";
  const notRunningSteps = steps?.filter((step) => step.status !== "running");

  return (
    <div className="flex gap-2">
      <div className="w-2/3 rounded border">
        <div className="h-full w-full p-4">
          {activeSelection === "stream" ? getStream() : null}
          {typeof activeSelection === "number" && activeAction ? (
            <ActionScreenshot
              artifactId={activeAction.screenshotArtifactId ?? undefined}
              stepId={activeAction.stepId}
              index={activeAction.index}
              taskStatus={task?.status}
            />
          ) : null}
        </div>
      </div>
      <ScrollableActionList
        activeIndex={activeSelection}
        data={actions ?? []}
        onActiveIndexChange={setSelectedAction}
        showStreamOption={Boolean(taskIsNotFinalized)}
        taskDetails={{
          steps: steps?.length ?? 0,
          actions: actions?.length ?? 0,
          cost: showCost
            ? formatter.format(costCalculator(notRunningSteps ?? []))
            : undefined,
        }}
      />
    </div>
  );
}

export { TaskActions };
