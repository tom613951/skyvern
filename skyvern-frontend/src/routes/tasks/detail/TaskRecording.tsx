import { getClient } from "@/api/AxiosClient";
import { useCredentialGetter } from "@/hooks/useCredentialGetter";
import { useQuery } from "@tanstack/react-query";
import { getRecordingURL } from "./artifactUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskApiResponse } from "@/api/types";
import { useFirstParam } from "@/hooks/useFirstParam";

function TaskRecording() {
  const taskId = useFirstParam("taskId", "runId");
  const credentialGetter = useCredentialGetter();

  const {
    data: recordingData,
    isLoading: taskIsLoading,
    isError: taskIsError,
  } = useQuery<{ url: string | null; archived: boolean }>({
    queryKey: ["task", taskId, "recordingURL"],
    queryFn: async () => {
      const client = await getClient(credentialGetter);
      const task: TaskApiResponse = await client
        .get(`/tasks/${taskId}`)
        .then((response) => response.data);
      return {
        url: getRecordingURL(task),
        archived: task.recording_archived ?? false,
      };
    },
    refetchOnMount: true,
  });

  if (taskIsLoading) {
    return (
      <div className="h-[450px] w-[800px]">
        <Skeleton className="h-full" />
      </div>
    );
  }

  if (taskIsError) {
    return <div>加载视频录像出错</div>;
  }

  if (recordingData?.url) {
    return <video width={800} height={450} src={recordingData.url} controls />;
  }

  if (recordingData?.archived) {
    return (
      <div className="text-muted-foreground">
        此视频录像已归档。如果需要申请恢复，请联系 support@skyvern.com
        {/* TODO: add a "Request Restore" button */}
      </div>
    );
  }

  return <div>此任务暂无视频录像</div>;
}

export { TaskRecording };
