import { GlobeIcon, PlusIcon, ReloadIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ProxyLocation } from "@/api/types";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { HelpTooltip } from "@/components/HelpTooltip";
import { Pill } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ProxySelector } from "@/components/ProxySelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableMessageRow,
  TableRow,
} from "@/components/ui/table";
import { useBrowserSessionsQuery } from "@/routes/browserSessions/hooks/useBrowserSessionsQuery";
import { useCreateBrowserSessionMutation } from "@/routes/browserSessions/hooks/useCreateBrowserSessionMutation";
import {
  type BrowserSession,
  type BrowserSessionExtension,
  type BrowserSessionType,
} from "@/routes/workflows/types/browserSessionTypes";
import { CopyText } from "@/routes/workflows/editor/Workspace";
import { basicTimeFormat } from "@/util/timeFormat";
import { cn, formatMs, toDate } from "@/util/utils";

function sessionIsOpen(browserSession: BrowserSession): boolean {
  return (
    browserSession.completed_at === null && browserSession.started_at !== null
  );
}

const No = () => <Pill tone="neutral">否</Pill>;

const Yes = () => <Pill tone="success">是</Pill>;

const BROWSER_TYPE_OPTIONS: Array<{
  value: BrowserSessionType;
  label: string;
}> = [
  { value: "msedge", label: "Microsoft Edge" },
  { value: "chrome", label: "Google Chrome" },
  { value: "stealth-chromium", label: "Stealth Chromium" },
];

const EXTENSION_OPTIONS: Array<{
  value: BrowserSessionExtension;
  label: string;
  description: string;
  enterprise?: boolean;
}> = [
  {
    value: "ad-blocker",
    label: "广告拦截器",
    description: "在网页会话中拦截广告及常见的追踪器。",
  },
  {
    value: "captcha-solver",
    label: "验证码自动识别器",
    description: "启用自动解析/绕过网页验证码服务（如果可用）。",
    enterprise: true,
  },
];

function BrowserSessions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sessionOptions, setSessionOptions] = useState<{
    proxyLocation: ProxyLocation;
    timeoutMinutes: number | null;
    browserType: BrowserSessionType | null;
    extensions: BrowserSessionExtension[];
  }>({
    proxyLocation: ProxyLocation.Residential,
    timeoutMinutes: 60,
    browserType: null,
    extensions: [],
  });

  const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
  const itemsPerPage = searchParams.get("page_size")
    ? Number(searchParams.get("page_size"))
    : 10;

  function setParamPatch(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => params.set(k, v));
    setSearchParams(params, { replace: true });
  }

  function handlePreviousPage() {
    if (page === 1) return;
    setParamPatch({ page: String(page - 1) });
  }

  function handleNextPage() {
    if (isNextDisabled) return;
    setParamPatch({ page: String(page + 1) });
  }

  const createBrowserSessionMutation = useCreateBrowserSessionMutation();

  const { data: browserSessions = [], isLoading } = useBrowserSessionsQuery(
    page,
    itemsPerPage,
  );

  const { data: nextPageBrowserSessions } = useBrowserSessionsQuery(
    page + 1,
    itemsPerPage,
  );

  const isNextDisabled =
    isLoading ||
    !nextPageBrowserSessions ||
    nextPageBrowserSessions.length === 0;

  function handleRowClick(
    e: React.MouseEvent<HTMLTableRowElement>,
    browserSessionId: string,
  ) {
    if (e.ctrlKey || e.metaKey) {
      window.open(
        window.location.origin + `/browser-session/${browserSessionId}`,
        "_blank",
        "noopener,noreferrer",
      );
    } else {
      navigate(`/browser-session/${browserSessionId}`);
    }
  }

  function toggleExtension(extension: BrowserSessionExtension) {
    setSessionOptions((prev) => {
      const exists = prev.extensions.includes(extension);
      return {
        ...prev,
        extensions: exists
          ? prev.extensions.filter((item) => item !== extension)
          : [...prev.extensions, extension],
      };
    });
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <GlobeIcon className="size-6" />
          <h1 className="text-2xl">Browsers</h1>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          Live browser instances you can drive interactively or attach to agent
          runs. They stay warm between runs — best for fast, back-to-back runs
          as the same user. You're billed while a browser is alive.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-end">
          <div className="flex gap-4">
            <Button
              disabled={createBrowserSessionMutation.isPending}
              onClick={() => {
                setIsDrawerOpen(true);
              }}
            >
              {createBrowserSessionMutation.isPending ? (
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusIcon className="mr-2 h-4 w-4" />
              )}
              创建
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%] truncate">会话 ID</TableHead>
                <TableHead className="w-[10%] truncate">开启</TableHead>
                <TableHead className="w-[14%]">
                  <span className="inline-flex items-center gap-1.5">
                    占用中
                    <HelpTooltip
                      className="inline"
                      content="浏览器当前正在运行任务或智能体"
                    />
                  </span>
                </TableHead>
                <TableHead className="w-[14%] truncate">启动时间</TableHead>
                <TableHead className="w-[12%] truncate">超时</TableHead>
                <TableHead className="w-[28%] truncate">CDP 地址</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableMessageRow colSpan={6}>正在加载浏览器…</TableMessageRow>
              ) : browserSessions?.length === 0 ? (
                <TableMessageRow colSpan={6}>
                  未找到浏览器会话
                </TableMessageRow>
              ) : (
                browserSessions?.map((browserSession) => {
                  const isOpen = sessionIsOpen(browserSession);
                  const startedAtDate = toDate(
                    browserSession.started_at ?? "",
                    null,
                  );
                  const ago = startedAtDate ? (
                    formatMs(Date.now() - startedAtDate.getTime()).ago
                  ) : (
                    <span className="opacity-50">从不</span>
                  );
                  const cdpUrl = browserSession.browser_address ?? "-";

                  return (
                    <TableRow
                      key={browserSession.browser_session_id}
                      className="cursor-pointer"
                      onClick={(e) => {
                        handleRowClick(e, browserSession.browser_session_id);
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center font-mono text-xs">
                          <div className="truncate text-muted-foreground">
                            {browserSession.browser_session_id}
                          </div>
                          <CopyText
                            className="opacity-60 hover:opacity-100"
                            text={browserSession.browser_session_id}
                          />
                        </div>
                      </TableCell>
                      <TableCell>{isOpen ? <Yes /> : <No />}</TableCell>
                      <TableCell>
                        {browserSession.runnable_id ? <Yes /> : <No />}
                      </TableCell>
                      <TableCell
                        className="text-muted-foreground"
                        title={
                          browserSession.started_at
                            ? basicTimeFormat(browserSession.started_at)
                            : "未启动"
                        }
                      >
                        {ago}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {browserSession.timeout
                          ? `${browserSession.timeout}分钟`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center font-mono text-xs">
                          <div className="truncate text-muted-foreground">
                            {cdpUrl}
                          </div>
                          {cdpUrl !== "-" ? (
                            <CopyText
                              className="opacity-75 hover:opacity-100"
                              text={cdpUrl}
                            />
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <div className="relative px-3 py-3">
            <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-2 text-sm">
              <span className="text-slate-400">每页条数</span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={itemsPerPage}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  const params = new URLSearchParams(searchParams);
                  params.set("page_size", String(next));
                  params.set("page", "1");
                  setSearchParams(params, { replace: true });
                }}
              >
                <option className="px-3" value={5}>
                  5
                </option>
                <option className="px-3" value={10}>
                  10
                </option>
                <option className="px-3" value={20}>
                  20
                </option>
                <option className="px-3" value={50}>
                  50
                </option>
              </select>
            </div>
            <Pagination className="pt-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    className={cn({
                      "cursor-not-allowed opacity-50": page === 1,
                    })}
                    onClick={handlePreviousPage}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink>{page}</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    className={cn({
                      "cursor-not-allowed opacity-50": isNextDisabled,
                    })}
                    onClick={handleNextPage}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>

      {/* create new session options */}
      <Drawer
        direction="right"
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      >
        <DrawerContent className="bottom-2 right-0 top-2 mt-0 h-full w-96 rounded border-0 p-6">
          <DrawerHeader>
            <DrawerTitle>创建浏览器会话</DrawerTitle>
            <DrawerDescription>
              创建一个新的浏览器会话以与网站进行交互，或在其中运行智能体。
              <div className="mt-8 flex flex-col gap-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Label>代理地理位置</Label>
                    <HelpTooltip content="通过我们提供的代理路由 Skyvern 的网络流量。" />
                  </div>
                  <ProxySelector
                    value={sessionOptions.proxyLocation}
                    allowGranularSearch={false}
                    modalPopover
                    onChange={(value) => {
                      setSessionOptions((prev) => ({
                        ...prev,
                        proxyLocation: value,
                      }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>超时时间 (分钟)</Label>
                    <HelpTooltip content="保持浏览器会话打开的持续时间。使用时会自动延长。" />
                  </div>
                  <Input
                    type="number"
                    min={5}
                    max={1440}
                    value={sessionOptions.timeoutMinutes ?? ""}
                    placeholder="超时时间 (分钟)"
                    onChange={(event) => {
                      const value =
                        event.target.value === ""
                          ? null
                          : parseInt(event.target.value, 10);
                      setSessionOptions({
                        ...sessionOptions,
                        timeoutMinutes: value,
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>浏览器类型</Label>
                    <HelpTooltip content="为此会话选择浏览器引擎。保留默认值以使用服务器默认设置。" />
                  </div>
                  <Select
                    value={sessionOptions.browserType ?? "default"}
                    onValueChange={(value) => {
                      setSessionOptions((prev) => ({
                        ...prev,
                        browserType:
                          value === "default"
                            ? null
                            : (value as BrowserSessionType),
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">默认</SelectItem>
                      {BROWSER_TYPE_OPTIONS.map((browserType) => (
                        <SelectItem
                          key={browserType.value}
                          value={browserType.value}
                        >
                          {browserType.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>浏览器插件</Label>
                    <HelpTooltip content="会话启动时要安装的可选浏览器插件。" />
                  </div>
                  <div className="space-y-2 rounded-md border p-3">
                    {EXTENSION_OPTIONS.map((extension) => (
                      <div
                        key={extension.value}
                        className="flex items-start space-x-2"
                      >
                        <Checkbox
                          id={`extension-${extension.value}`}
                          checked={sessionOptions.extensions.includes(
                            extension.value,
                          )}
                          onCheckedChange={() => {
                            toggleExtension(extension.value);
                          }}
                        />
                        <div className="grid gap-1">
                          <Label
                            htmlFor={`extension-${extension.value}`}
                            className="font-medium"
                          >
                            <span className="inline-flex items-center gap-2">
                              <span>{extension.label}</span>
                              {extension.enterprise ? (
                                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                                  企业版
                                </span>
                              ) : null}
                            </span>
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {extension.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  disabled={
                    createBrowserSessionMutation.isPending ||
                    sessionOptions.timeoutMinutes === null ||
                    Number.isNaN(sessionOptions.timeoutMinutes) ||
                    sessionOptions.timeoutMinutes < 5 ||
                    sessionOptions.timeoutMinutes > 1440
                  }
                  className="mt-6 w-full"
                  onClick={() => {
                    createBrowserSessionMutation.mutate({
                      proxyLocation: sessionOptions.proxyLocation,
                      timeout: sessionOptions.timeoutMinutes,
                      browserType: sessionOptions.browserType,
                      extensions: sessionOptions.extensions,
                    });
                  }}
                >
                  {createBrowserSessionMutation.isPending ? (
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlusIcon className="mr-2 h-4 w-4" />
                  )}
                  创建
                </Button>
              </div>
            </DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export { BrowserSessions };
