import { getClient } from "@/api/AxiosClient";
import { AutoResizingTextarea } from "@/components/AutoResizingTextarea/AutoResizingTextarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useApiCredential } from "@/hooks/useApiCredential";
import { useCredentialGetter } from "@/hooks/useCredentialGetter";
import { CodeEditor } from "@/routes/workflows/components/CodeEditor";
import { SubmitEvent } from "@/types";
import { runsApiBaseUrl } from "@/util/env";
import { CopyApiCommandDropdown } from "@/components/CopyApiCommandDropdown";
import { type ApiCommandOptions } from "@/util/apiCommands";
import { buildTaskRunPayload } from "@/util/taskRunPayload";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlayIcon, ReloadIcon } from "@radix-ui/react-icons";
import { ToastAction } from "@/components/ui/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useState } from "react";
import { useForm, useFormState } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { stringify as convertToYAML } from "yaml";
import { MAX_STEPS_DEFAULT } from "../constants";
import { TaskFormSection } from "./TaskFormSection";
import { savedTaskFormSchema, SavedTaskFormValues } from "./taskFormTypes";
import {
  CreateTaskRequest,
  OrganizationApiResponse,
  ProxyLocation,
  RunEngine,
} from "@/api/types";
import { ProxySelector } from "@/components/ProxySelector";
import { TestWebhookDialog } from "@/components/TestWebhookDialog";

type Props = {
  initialValues: SavedTaskFormValues;
};

function transform<T>(value: T): T | null {
  return value === "" ? null : value;
}

function createTaskRequestObject(
  formValues: SavedTaskFormValues,
): CreateTaskRequest {
  return {
    title: formValues.title,
    url: formValues.url,
    webhook_callback_url: transform(formValues.webhookCallbackUrl),
    navigation_goal: transform(formValues.navigationGoal),
    data_extraction_goal: transform(formValues.dataExtractionGoal),
    proxy_location: transform(formValues.proxyLocation),
    navigation_payload: transform(formValues.navigationPayload),
    extracted_information_schema: safeParseMaybeJSONString(
      formValues.extractedInformationSchema,
    ),
    totp_identifier: transform(formValues.totpIdentifier),
    error_code_mapping: safeParseMaybeJSONString(formValues.errorCodeMapping),
  };
}

function safeParseMaybeJSONString(payload: unknown) {
  if (typeof payload === "string") {
    try {
      return JSON.parse(payload);
    } catch {
      return payload;
    }
  }
  return payload;
}

function createTaskTemplateRequestObject(values: SavedTaskFormValues) {
  return {
    title: values.title,
    description: values.description,
    is_saved_task: true,
    webhook_callback_url: values.webhookCallbackUrl,
    proxy_location: values.proxyLocation,
    workflow_definition: {
      version: 2,
      parameters: [
        {
          parameter_type: "workflow",
          workflow_parameter_type: "json",
          key: "navigation_payload",
          default_value: safeParseMaybeJSONString(values.navigationPayload),
        },
      ],
      blocks: [
        {
          block_type: "task",
          label: "Task 1",
          url: values.url,
          navigation_goal: values.navigationGoal,
          data_extraction_goal: values.dataExtractionGoal,
          data_schema: safeParseMaybeJSONString(
            values.extractedInformationSchema,
          ),
          max_steps_per_run: values.maxStepsOverride,
          totp_identifier: values.totpIdentifier,
          error_code_mapping: safeParseMaybeJSONString(values.errorCodeMapping),
          include_action_history_in_verification:
            values.includeActionHistoryInVerification,
        },
      ],
    },
  };
}

type Section = "base" | "extraction" | "advanced";

function SavedTaskForm({ initialValues }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const credentialGetter = useCredentialGetter();
  const apiCredential = useApiCredential();
  const { template } = useParams();
  const [activeSections, setActiveSections] = useState<Array<Section>>([
    "base",
  ]);
  const [showAdvancedBaseContent, setShowAdvancedBaseContent] = useState(false);

  const { data: organizations } = useQuery<Array<OrganizationApiResponse>>({
    queryKey: ["organizations"],
    queryFn: async () => {
      const client = await getClient(credentialGetter);
      return await client
        .get("/organizations")
        .then((response) => response.data.organizations);
    },
  });

  const organization = organizations?.[0];

  const form = useForm<SavedTaskFormValues>({
    resolver: zodResolver(savedTaskFormSchema),
    defaultValues: {
      ...initialValues,
      maxStepsOverride: initialValues.maxStepsOverride ?? null,
      proxyLocation: initialValues.proxyLocation ?? ProxyLocation.Residential,
    },
  });

  const { isDirty, errors } = useFormState({ control: form.control });

  const createAndSaveTaskMutation = useMutation({
    mutationFn: async (formValues: SavedTaskFormValues) => {
      const saveTaskRequest = createTaskTemplateRequestObject(formValues);
      const yaml = convertToYAML(saveTaskRequest);
      const client = await getClient(credentialGetter);

      return client
        .put(`/workflows/${template}`, yaml, {
          headers: {
            "Content-Type": "text/plain",
          },
        })
        .then(() => {
          const taskRequest = createTaskRequestObject(formValues);
          const includeOverrideHeader =
            formValues.maxStepsOverride !== null &&
            formValues.maxStepsOverride !== MAX_STEPS_DEFAULT;
          return client.post<
            ReturnType<typeof createTaskRequestObject>,
            { data: { task_id: string } }
          >("/tasks", taskRequest, {
            ...(includeOverrideHeader && {
              headers: {
                "x-max-steps-override":
                  formValues.maxStepsOverride ?? MAX_STEPS_DEFAULT,
              },
            }),
          });
        });
    },
    onError: (error: AxiosError) => {
      if (error.response?.status === 402) {
        toast({
          variant: "destructive",
          title: "创建任务失败",
          description:
            "您的额度不足以运行此任务。请前往账单页面查看额度余额。",
          action: (
            <ToastAction altText="前往账单" asChild>
              <Link to="billing">前往账单</Link>
            </ToastAction>
          ),
        });
        return;
      }
      toast({
        variant: "destructive",
        title: "错误",
        description: error.message,
      });
    },
    onSuccess: (response) => {
      toast({
        variant: "success",
        title: "任务已创建",
        description: `任务 ${response.data.task_id} 创建成功。`,
        action: (
          <ToastAction altText="查看" asChild>
            <Link to={`/tasks/${response.data.task_id}`}>查看</Link>
          </ToastAction>
        ),
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["savedTasks"],
      });
    },
  });

  const saveTaskMutation = useMutation({
    mutationFn: async (formValues: SavedTaskFormValues) => {
      const saveTaskRequest = createTaskTemplateRequestObject(formValues);
      const client = await getClient(credentialGetter);
      const yaml = convertToYAML(saveTaskRequest);
      return client
        .put(`/workflows/${template}`, yaml, {
          headers: {
            "Content-Type": "text/plain",
          },
        })
        .then((response) => response.data);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "保存更改时出错",
        description: error.message,
      });
    },
    onSuccess: () => {
      toast({
        variant: "success",
        title: "修改已保存",
        description: "修改保存成功",
      });
      queryClient.invalidateQueries({
        queryKey: ["savedTasks"],
      });
    },
  });

  function handleCreate(values: SavedTaskFormValues) {
    createAndSaveTaskMutation.mutate(values);
  }

  function handleSave(values: SavedTaskFormValues) {
    saveTaskMutation.mutate(values);
  }

  function isActive(section: Section) {
    return activeSections.includes(section);
  }

  function toggleSection(section: Section) {
    if (isActive(section)) {
      setActiveSections(activeSections.filter((s) => s !== section));
    } else {
      setActiveSections([...activeSections, section]);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          const submitter = (
            (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement
          ).value;
          if (submitter === "create") {
            form.handleSubmit(handleCreate)(event);
          }
          if (submitter === "save") {
            form.handleSubmit(handleSave)(event);
          }
        }}
        className="space-y-4"
      >
        <TaskFormSection
          index={1}
          title="基础内容"
          active={isActive("base")}
          onClick={() => {
            toggleSection("base");
          }}
          hasError={
            typeof errors.navigationGoal !== "undefined" ||
            typeof errors.title !== "undefined" ||
            typeof errors.url !== "undefined" ||
            typeof errors.description !== "undefined"
          }
        >
          {isActive("base") && (
            <div className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-16">
                        <FormLabel>
                          <div className="w-72">
                            <h1 className="text-lg">标题</h1>
                            <h2 className="text-base text-slate-400">
                              您的任务名称
                            </h2>
                          </div>
                        </FormLabel>
                        <div className="w-full">
                          <FormControl>
                            <Input placeholder="任务名称" {...field} />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-16">
                        <FormLabel>
                          <div className="w-72">
                            <h1 className="text-lg">描述</h1>
                            <h2 className="text-base text-slate-400">
                              此任务的目的是什么？
                            </h2>
                          </div>
                        </FormLabel>
                        <div className="w-full">
                          <FormControl>
                            <AutoResizingTextarea
                              placeholder="此模板用于..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
                <Separator />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-16">
                        <FormLabel>
                          <div className="w-72">
                            <h1 className="text-lg">URL 地址</h1>
                            <h2 className="text-base text-slate-400">
                              任务的起始 URL
                            </h2>
                          </div>
                        </FormLabel>
                        <div className="w-full">
                          <FormControl>
                            <Input placeholder="https://" {...field} />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="navigationGoal"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-16">
                        <FormLabel>
                          <div className="w-72">
                            <h1 className="text-lg">导航目标</h1>
                            <h2 className="text-base text-slate-400">
                              Skyvern 应该去哪里，应该做什么？
                            </h2>
                          </div>
                        </FormLabel>
                        <div className="w-full">
                          <FormControl>
                            <AutoResizingTextarea
                              {...field}
                              placeholder="告诉 Skyvern 该做什么。"
                              value={field.value === null ? "" : field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
                {showAdvancedBaseContent ? (
                  <div className="border-t border-dashed pt-4">
                    <FormField
                      control={form.control}
                      name="navigationPayload"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex gap-16">
                            <FormLabel>
                              <div className="w-72">
                                <h1 className="text-lg">导航载荷 (Payload)</h1>
                                <h2 className="text-base text-slate-400">
                                  指定重要的参数、路由或状态
                                </h2>
                              </div>
                              <Button
                                className="mt-4"
                                type="button"
                                variant="tertiary"
                                onClick={() => {
                                  setShowAdvancedBaseContent(false);
                                }}
                                size="sm"
                              >
                                隐藏高级设置
                              </Button>
                            </FormLabel>
                            <div className="w-full">
                              <FormControl>
                                <CodeEditor
                                  {...field}
                                  language="json"
                                  minHeight="96px"
                                  maxHeight="500px"
                                  value={
                                    field.value === null ? "" : field.value
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div>
                    <Button
                      type="button"
                      variant="tertiary"
                      onClick={() => {
                        setShowAdvancedBaseContent(true);
                      }}
                      size="sm"
                    >
                      显示高级设置
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </TaskFormSection>
        <TaskFormSection
          index={2}
          title="数据提取"
          active={isActive("extraction")}
          onClick={() => {
            toggleSection("extraction");
          }}
          hasError={
            typeof errors.extractedInformationSchema !== "undefined" ||
            typeof errors.dataExtractionGoal !== "undefined"
          }
        >
          {isActive("extraction") && (
            <div className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="dataExtractionGoal"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-16">
                        <FormLabel>
                          <div className="w-72">
                            <h1 className="text-lg">数据提取目标</h1>
                            <h2 className="text-base text-slate-400">
                              您希望获取什么输出？
                            </h2>
                          </div>
                        </FormLabel>
                        <div className="w-full">
                          <FormControl>
                            <AutoResizingTextarea
                              {...field}
                              placeholder="您需要提取什么数据？"
                              value={field.value === null ? "" : field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="extractedInformationSchema"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-16">
                        <FormLabel>
                          <div className="w-72">
                            <h1 className="text-lg">数据 Schema (结构)</h1>
                            <h2 className="text-base text-slate-400">
                              以 JSON 格式指定输出结构
                            </h2>
                          </div>
                        </FormLabel>
                        <div className="w-full">
                          <FormControl>
                            <CodeEditor
                              {...field}
                              language="json"
                              minHeight="96px"
                              maxHeight="500px"
                              value={
                                field.value === null ||
                                typeof field.value === "undefined"
                                  ? ""
                                  : field.value
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
        </TaskFormSection>
        <TaskFormSection
          index={3}
          title="高级设置"
          active={isActive("advanced")}
          onClick={() => {
            toggleSection("advanced");
          }}
          hasError={
            typeof errors.navigationPayload !== "undefined" ||
            typeof errors.maxStepsOverride !== "undefined" ||
            typeof errors.webhookCallbackUrl !== "undefined" ||
            typeof errors.errorCodeMapping !== "undefined"
          }
        >
          {isActive("advanced") && (
            <div className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="maxStepsOverride"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-16">
                        <FormLabel>
                          <div className="w-72">
                            <h1 className="text-lg">最大步数覆盖</h1>
                            <h2 className="text-base text-slate-400">
                              是否允许此任务执行比默认更多或更少的步数？
                            </h2>
                          </div>
                        </FormLabel>
                        <div className="w-full">
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min={1}
                              value={field.value ?? ""}
                              placeholder={`默认值: ${organization?.max_steps_per_run ?? MAX_STEPS_DEFAULT}`}
                              onChange={(event) => {
                                const value =
                                  event.target.value === ""
                                    ? null
                                    : Number(event.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="webhookCallbackUrl"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-16">
                        <FormLabel>
                          <div className="w-72">
                            <h1 className="text-lg">Webhook 回调 URL</h1>
                            <h2 className="text-base text-slate-400">
                              用于接收提取出的信息的 Webhook 接口 URL
                            </h2>
                          </div>
                        </FormLabel>
                        <div className="w-full">
                          <FormControl>
                            <div className="flex flex-col gap-2">
                              <Input
                                className="w-full"
                                {...field}
                                placeholder="https://"
                                value={field.value === null ? "" : field.value}
                              />
                              <TestWebhookDialog
                                runType="task"
                                runId={null}
                                initialWebhookUrl={
                                  field.value === null ? undefined : field.value
                                }
                                trigger={
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    className="self-start"
                                    disabled={!field.value}
                                  >
                                    测试 Webhook
                                  </Button>
                                }
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="proxyLocation"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <div className="flex gap-16">
                          <FormLabel>
                            <div className="w-72">
                              <div className="flex items-center gap-2 text-lg">
                                代理地理位置
                              </div>
                              <h2 className="text-sm text-slate-400">
                                通过我们可用的代理路由 Skyvern 的网络流量。
                              </h2>
                            </div>
                          </FormLabel>
                          <div className="w-full space-y-2">
                            <FormControl>
                              <ProxySelector
                                value={field.value}
                                onChange={field.onChange}
                                className="w-48"
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </div>
                      </FormItem>
                    );
                  }}
                />
                <Separator />
                <FormField
                  control={form.control}
                  name="errorCodeMapping"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-16">
                        <FormLabel>
                          <div className="w-72">
                            <h1 className="text-lg">错误消息映射</h1>
                            <h2 className="text-base text-slate-400">
                              指定您希望获得通知的任何错误输出
                            </h2>
                          </div>
                        </FormLabel>
                        <div className="w-full">
                          <FormControl>
                            <CodeEditor
                              {...field}
                              language="json"
                              minHeight="96px"
                              maxHeight="500px"
                              value={field.value === null ? "" : field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
                <Separator />
                <FormField
                  control={form.control}
                  name="totpIdentifier"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-16">
                        <FormLabel>
                          <div className="w-72">
                            <h1 className="text-lg">双重认证 (2FA) 标识符</h1>
                            <h2 className="text-base text-slate-400"></h2>
                          </div>
                        </FormLabel>
                        <div className="w-full">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="添加一个关联您的 TOTP 到任务的 ID"
                              value={field.value === null ? "" : field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
        </TaskFormSection>

        <div className="flex justify-end gap-3">
          <CopyApiCommandDropdown
            getOptions={() => {
              const formValues = form.getValues();
              const includeOverrideHeader =
                formValues.maxStepsOverride !== null &&
                formValues.maxStepsOverride !== MAX_STEPS_DEFAULT;

              const headers: Record<string, string> = {
                "Content-Type": "application/json",
                "x-api-key": apiCredential ?? "<your-api-key>",
              };

              if (includeOverrideHeader) {
                headers["x-max-steps-override"] = String(
                  formValues.maxStepsOverride,
                );
              }

              return {
                method: "POST",
                url: `${runsApiBaseUrl}/run/tasks`,
                body: buildTaskRunPayload(
                  createTaskRequestObject(formValues),
                  RunEngine.SkyvernV1,
                ),
                headers,
              } satisfies ApiCommandOptions;
            }}
          />
          <Button
            type="submit"
            name="save"
            value="save"
            variant="secondary"
            disabled={saveTaskMutation.isPending || !isDirty}
          >
            {saveTaskMutation.isPending && (
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
            )}
            保存更改
          </Button>
          <Button
            type="submit"
            name="create"
            value="create"
            disabled={createAndSaveTaskMutation.isPending}
          >
            {createAndSaveTaskMutation.isPending ? (
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlayIcon className="mr-2 h-4 w-4" />
            )}
            运行
          </Button>
        </div>
      </form>
    </Form>
  );
}

export { SavedTaskForm };
