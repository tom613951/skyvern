import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { getClient } from "@/api/AxiosClient";
import { useCredentialGetter } from "@/hooks/useCredentialGetter";
import { type Recording } from "@/routes/workflows/types/browserSessionTypes";
import { artifactApiBaseUrl } from "@/util/env";

function getRecordingUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }
  if (url.startsWith("file://")) {
    return `${artifactApiBaseUrl}/artifact/recording?path=${url.slice(7)}`;
  }
  return url;
}

function BrowserSessionVideo() {
  const { browserSessionId } = useParams();
  const credentialGetter = useCredentialGetter();

  const {
    data: browserSession,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["browserSession", browserSessionId],
    queryFn: async () => {
      const client = await getClient(credentialGetter, "sans-api-v1");
      const response = await client.get(
        `/browser_sessions/${browserSessionId}`,
      );
      return response.data;
    },
    enabled: !!browserSessionId,
  });

  const isSessionRunning = browserSession?.status === "running";
  // Don't show recordings while session is running - they're incomplete
  const recordings = isSessionRunning ? [] : browserSession?.recordings || [];

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-lg">正在加载视频...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-lg text-red-500">
          加载视频出错: {error.message}
        </div>
      </div>
    );
  }

  if (!recordings || recordings.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-lg text-gray-500">
            暂无录制视频
          </div>
          <div className="text-sm text-gray-400">
            {isSessionRunning
              ? "会话结束后将提供录制视频"
              : "未为此会话创建录制视频"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">浏览器会话录像</h2>
        <p className="text-sm text-gray-500">
          来自该浏览器会话的录像视频
        </p>
      </div>

      <div className="grid gap-4">
        {recordings.map((recording: Recording, index: number) => (
          <div
            key={recording.checksum || index}
            className="rounded-lg border p-4"
          >
            <div className="mb-2">
              <h3 className="font-medium">
                {recording.filename || `录像 ${index + 1}`}
                {recording.modified_at && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({new Date(recording.modified_at).toLocaleString()})
                  </span>
                )}
              </h3>
            </div>

            {getRecordingUrl(recording.url) ? (
              <div className="w-full">
                <video
                  controls
                  className="w-full max-w-4xl rounded-lg"
                  src={getRecordingUrl(recording.url)!}
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
                <div className="mt-2 text-xs text-gray-500">
                  <a
                    href={getRecordingUrl(recording.url)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    下载视频
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">
                视频 URL 不可用 - 视频可能仍在处理中
              </div>
            )}

            {recording.checksum && (
              <div className="mt-2 text-sm text-gray-600">
                校验和: {recording.checksum}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export { BrowserSessionVideo };
