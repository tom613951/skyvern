import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { StatusBadge } from "@/components/StatusBadge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as env from "@/util/env";
import { basicLocalTimeFormat, basicTimeFormat } from "@/util/timeFormat";
import { cn } from "@/util/utils";

import { useBrowserSessionWorkflowRunsQuery } from "./hooks/useBrowserSessionWorkflowRunsQuery";

const PAGE_SIZE = 10;

function BrowserSessionWorkflowRuns() {
  const { browserSessionId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const parsedPage = parseInt(searchParams.get("runs_page") ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const {
    data: workflowRuns,
    isLoading,
    isError,
    error,
  } = useBrowserSessionWorkflowRunsQuery({
    browserSessionId,
    page,
    pageSize: PAGE_SIZE,
  });

  useEffect(() => {
    if (!isLoading && workflowRuns && workflowRuns.length === 0 && page > 1) {
      const params = new URLSearchParams(searchParams);
      params.set("runs_page", String(page - 1));
      setSearchParams(params, { replace: true });
    }
  }, [workflowRuns, isLoading, page, searchParams, setSearchParams]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-lg">正在加载运行记录...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-lg text-red-500">
          加载运行记录出错: {error?.message ?? "未知错误"}
        </div>
      </div>
    );
  }

  const runs = workflowRuns ?? [];

  if (runs.length === 0 && page === 1) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-lg text-gray-500">暂无运行记录</div>
          <div className="text-sm text-gray-400">
            在此浏览器会话上没有智能体运行记录
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">智能体</TableHead>
              <TableHead className="w-1/4">运行 ID</TableHead>
              <TableHead className="w-1/4">状态</TableHead>
              <TableHead className="w-1/4">创建时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((workflowRun) => {
              const url = env.useNewRunsUrl
                ? `/runs/${workflowRun.workflow_run_id}`
                : `/workflows/${workflowRun.workflow_permanent_id}/${workflowRun.workflow_run_id}/overview`;
              return (
                <TableRow
                  key={workflowRun.workflow_run_id}
                  tabIndex={0}
                  role="button"
                  onClick={(event) => {
                    if (event.ctrlKey || event.metaKey) {
                      window.open(
                        window.location.origin + url,
                        "_blank",
                        "noopener,noreferrer",
                      );
                      return;
                    }
                    navigate(url);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(url);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <TableCell>
                    {workflowRun.workflow_title ?? "未命名智能体"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {workflowRun.workflow_run_id}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={workflowRun.status} />
                  </TableCell>
                  <TableCell title={basicTimeFormat(workflowRun.created_at)}>
                    {basicLocalTimeFormat(workflowRun.created_at)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className={cn({ "cursor-not-allowed": page === 1 })}
              onClick={() => {
                if (page === 1) {
                  return;
                }
                const params = new URLSearchParams(searchParams);
                params.set("runs_page", String(Math.max(1, page - 1)));
                setSearchParams(params, { replace: true });
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>{page}</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              className={cn({
                "cursor-not-allowed": runs.length < PAGE_SIZE,
              })}
              onClick={() => {
                if (runs.length < PAGE_SIZE) {
                  return;
                }
                const params = new URLSearchParams(searchParams);
                params.set("runs_page", String(page + 1));
                setSearchParams(params, { replace: true });
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export { BrowserSessionWorkflowRuns };
