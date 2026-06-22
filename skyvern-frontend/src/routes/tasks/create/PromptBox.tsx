import { getClient } from "@/api/AxiosClient";
import { Createv2TaskRequest, ProxyLocation } from "@/api/types";
import { stringify as convertToYAML } from "yaml";
import { WorkflowCreateYAMLRequest } from "@/routes/workflows/types/workflowYamlTypes";
import img from "@/assets/promptBoxBg.png";
import { AutoResizingTextarea } from "@/components/AutoResizingTextarea/AutoResizingTextarea";
import { CartIcon } from "@/components/icons/CartIcon";
import { GraphIcon } from "@/components/icons/GraphIcon";
import { InboxIcon } from "@/components/icons/InboxIcon";
import { MessageIcon } from "@/components/icons/MessageIcon";
import { TrophyIcon } from "@/components/icons/TrophyIcon";
import { ProxySelector } from "@/components/ProxySelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyValueInput } from "@/components/KeyValueInput";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { useCredentialGetter } from "@/hooks/useCredentialGetter";
import { WorkflowApiResponse } from "@/routes/workflows/types/workflowTypes";
import { CodeEditor } from "@/routes/workflows/components/CodeEditor";
import {
  FileTextIcon,
  GearIcon,
  PaperPlaneIcon,
  Pencil1Icon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  generatePhoneNumber,
  generateUniqueEmail,
} from "../data/sampleTaskData";
import { ExampleCasePill } from "./ExampleCasePill";
import {
  MAX_SCREENSHOT_SCROLLS_DEFAULT,
  MAX_STEPS_DEFAULT,
} from "@/routes/workflows/editor/nodes/Taskv2Node/types";
import { useAutoplayStore } from "@/store/useAutoplayStore";
import { TestWebhookDialog } from "@/components/TestWebhookDialog";
import { ImprovePrompt } from "@/components/ImprovePrompt";
import { SpeechInputButton } from "@/components/SpeechInputButton";
import { cn } from "@/util/utils";
import { useSpeechToTextField } from "@/hooks/useSpeechToTextField";

const exampleCases = [
  {
    key: "finditparts",
    label: "添加商品至购物车",
    prompt:
      '首先访问 https://www.finditparts.com。搜索商品 "W01-377-8537"，将其加入购物车，然后导航到购物车页面。当你在购物车页面并且指定商品已成功加入时，任务即为完成。提取购物车页面中的所有商品数量信息。不需要尝试结账。',
    icon: <CartIcon className="size-6" />,
  },
  {
    key: "job_application",
    label: "自动职位申请",
    prompt: `访问 https://jobs.lever.co/leverdemo-8/45d39614-464a-4b62-a5cd-8683ce4fb80a/apply，填写工作申请表单并提交申请。如果表单中出现任何关于负担调查等公共问题，请一并填写。当页面提示你已成功申请该职位时，任务即为完成。如果无法成功申请，则终止任务。以下是用户信息：{"name":"张三","email":"${generateUniqueEmail()}","phone":"${generatePhoneNumber()}","resume_url":"https://writing.colostate.edu/guides/documents/resume/functionalSample.pdf","cover_letter":"为我生成一份引人注目的求职信"}`,
    icon: <InboxIcon className="size-6" />,
  },
  {
    key: "geico",
    label: "获取汽车保险报价",
    prompt: `首先访问 https://www.geico.com。在该网站上进行操作，直到你成功生成一份汽车保险报价。不要生成房屋保险报价。如果当前页面显示了汽车保险报价（包含保费金额），则任务即为完成。以 JSON 格式提取所有报价信息，包括保费金额和报价有效期。以下是用户信息：{"licensed_at_age":19,"education_level":"HIGH_SCHOOL","phone_number":"8042221111","full_name":"Chris P. Bacon","past_claim":[],"has_claims":false,"spouse_occupation":"Florist","auto_current_carrier":"None","home_commercial_uses":null,"spouse_full_name":"Amy Stake","auto_commercial_uses":null,"requires_sr22":false,"previous_address_move_date":null,"line_of_work":null,"spouse_age":"1987-12-12","auto_insurance_deadline":null,"email":"chris.p.bacon@abc.com","net_worth_numeric":1000000,"spouse_gender":"F","marital_status":"married","spouse_licensed_at_age":20,"license_number":"AAAAAAA090AA","spouse_license_number":"AAAAAAA080AA","how_much_can_you_lose":25000,"vehicles":[{"annual_mileage":10000,"commute_mileage":4000,"existing_coverages":null,"ideal_coverages":{"bodily_injury_per_incident_limit":50000,"bodily_injury_per_person_limit":25000,"collision_deductible":1000,"comprehensive_deductible":1000,"personal_injury_protection":null,"property_damage_per_incident_limit":null,"property_damage_per_person_limit":25000,"rental_reimbursement_per_incident_limit":null,"rental_reimbursement_per_person_limit":null,"roadside_assistance_limit":null,"underinsured_motorist_bodily_injury_per_incident_limit":50000,"underinsured_motorist_bodily_injury_per_person_limit":25000,"underinsured_motorist_property_limit":null},"ownership":"Owned","parked":"Garage","purpose":"commute","vehicle":{"style":"AWD 3.0 quattro TDI 4dr Sedan","model":"A8 L","price_estimate":29084,"year":2015,"make":"Audi"},"vehicle_id":null,"vin":null}],"additional_drivers":[],"home":[{"home_ownership":"owned"}],"spouse_line_of_work":"Agriculture, Forestry and Fishing","occupation":"Customer Service Representative","id":null,"gender":"M","credit_check_authorized":false,"age":"1987-11-11","license_state":"Washington","cash_on_hand":"$10000–14999","address":{"city":"HOUSTON","country":"US","state":"TX","street":"9625 GARFIELD AVE.","zip":"77082"},"spouse_education_level":"MASTERS","spouse_email":"amy.stake@abc.com","spouse_added_to_auto_policy":true}`,
    icon: <FileTextIcon className="size-6" />,
  },
  {
    key: "california_edd",
    label: "自动填写加州EDD表单",
    prompt: `访问 eddservices.edd.ca.gov 雇主在线服务注册表单。填写完成并终止。需要的信息如下：{"username":"isthisreal1","password":"Password123!","first_name":"John","last_name":"Doe","pin":"1234","email":"${generateUniqueEmail()}","phone_number":"${generatePhoneNumber()}"}`,
    icon: <Pencil1Icon className="size-6" />,
  },
  {
    key: "contact_us_forms",
    label: "自动提交联系表单",
    prompt: `访问 https://canadahvac.com/contact-hvac-canada。填写联系表单并提交。当页面提示你的留言已发送成功时，任务即为完成。以下是用户信息：{"name":"张三","email":"john.doe@gmail.com","phone":"123-456-7890","message":"您好，我想咨询一下你们的服务。"}`,
    icon: <FileTextIcon className="size-6" />,
  },
  {
    key: "hackernews",
    label: "获取HackerNews热门帖子",
    prompt: "导航到 Hacker News 主页并获取前 3 条热门帖子。",
    icon: <MessageIcon className="size-6" />,
  },
  {
    key: "AAPLStockPrice",
    label: "搜索苹果股票价格",
    prompt:
      '访问谷歌财经（Google Finance）并查找 "AAPL" 股票价格。当 "AAPL" 的搜索结果显示且成功提取出股票价格时，任务即为完成。',
    icon: <GraphIcon className="size-6" />,
  },
  {
    key: "topRankedFootballTeam",
    label: "查询世界第一足球队",
    prompt:
      "导航到 FIFA 世界排名页面并找到当前排名第一的足球队。从排名页面中提取该球队的名称。",
    icon: <TrophyIcon className="size-6" />,
  },
  {
    key: "extractIntegrationsFromGong",
    label: "提取Gong.io官方集成列表",
    prompt:
      "首先访问 https://www.gong.io。然后导航到 Gong 网站的 'Integrations'（集成）页面。提取页面上列出的所有集成工具的名称和描述。确保不要点击任何外部广告链接。",
    icon: <GearIcon className="size-6" />,
  },
];

type PromptBoxProps = {
  enableCopilotHandoff?: boolean;
};

const HANDOFF_TITLE_MAX_LEN = 80;

function deriveHandoffTitle(prompt: string): string {
  const collapsed = prompt.replace(/\s+/g, " ").trim();
  if (!collapsed) return "New Agent";
  if (collapsed.length <= HANDOFF_TITLE_MAX_LEN) return collapsed;
  return `${collapsed.slice(0, HANDOFF_TITLE_MAX_LEN - 1).trimEnd()}…`;
}

function buildBlankWorkflowRequest(
  title: string,
  runWith: "agent" | "code" = "agent",
): WorkflowCreateYAMLRequest {
  return {
    title,
    description: "",
    ai_fallback: true,
    code_version: 2,
    run_with: runWith,
    workflow_definition: {
      version: 2,
      blocks: [],
      parameters: [],
    },
  };
}

function PromptBox({ enableCopilotHandoff = false }: PromptBoxProps) {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState<string>("");
  const credentialGetter = useCredentialGetter();
  const queryClient = useQueryClient();
  const [webhookCallbackUrl, setWebhookCallbackUrl] = useState<string | null>(
    null,
  );
  const [proxyLocation, setProxyLocation] = useState<ProxyLocation>(
    ProxyLocation.Residential,
  );
  const [browserSessionId, setBrowserSessionId] = useState<string | null>(null);
  const [cdpAddress, setCdpAddress] = useState<string | null>(null);
  const [generateScript, setGenerateScript] = useState(false);
  const [publishWorkflow, setPublishWorkflow] = useState(false);
  const [totpIdentifier, setTotpIdentifier] = useState("");
  const [maxStepsOverride, setMaxStepsOverride] = useState<string | null>(null);
  const [maxScreenshotScrolls, setMaxScreenshotScrolls] = useState<
    string | null
  >(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [dataSchema, setDataSchema] = useState<string | null>(null);
  const [extraHttpHeaders, setExtraHttpHeaders] = useState<string | null>(null);
  const { setAutoplay } = useAutoplayStore();
  const [promptImprovalIsPending, setPromptImprovalIsPending] = useState(false);
  // react-query isPending only flips on the next render, so a same-frame
  // double-click can slip past it; the ref is the synchronous guard.
  const submitInFlightRef = useRef(false);

  const generateWorkflowMutation = useMutation({
    mutationFn: async ({ prompt }: { prompt: string }) => {
      const client = await getClient(credentialGetter, "sans-api-v1");
      const request: Record<string, unknown> = {
        user_prompt: prompt,
        webhook_callback_url: webhookCallbackUrl,
        proxy_location: proxyLocation,
        totp_identifier: totpIdentifier,
        max_screenshot_scrolls: maxScreenshotScrolls,
        publish_workflow: publishWorkflow,
        run_with: "agent",
        ai_fallback: true,
        extracted_information_schema: dataSchema
          ? (() => {
              try {
                return JSON.parse(dataSchema);
              } catch (e) {
                return dataSchema;
              }
            })()
          : null,
        extra_http_headers: extraHttpHeaders
          ? (() => {
              try {
                return JSON.parse(extraHttpHeaders);
              } catch (e) {
                return extraHttpHeaders;
              }
            })()
          : null,
      };

      request.url = "https://google.com"; // a stand-in value; real url is generated via prompt

      const result = await client.post<
        Createv2TaskRequest,
        { data: WorkflowApiResponse }
      >(
        "/workflows/create-from-prompt",
        {
          task_version: "v1",
          request,
        },
        {
          headers: {
            "x-max-steps-override": maxStepsOverride,
          },
        },
      );

      return result;
    },
    onSuccess: ({ data: workflow }) => {
      toast({
        variant: "success",
        title: "Agent Created",
        description: `Agent created successfully.`,
      });

      queryClient.invalidateQueries({
        queryKey: ["workflows"],
      });

      const firstBlock = workflow.workflow_definition.blocks[0];

      if (firstBlock) {
        setAutoplay(workflow.workflow_permanent_id, firstBlock.label);
      }

      navigate(`/workflows/${workflow.workflow_permanent_id}/build`);
    },
    onError: (error: AxiosError) => {
      toast({
        variant: "destructive",
        title: "Error creating agent from prompt",
        description: error.message,
      });
    },
    onSettled: () => {
      submitInFlightRef.current = false;
    },
  });

  const handoffWorkflowMutation = useMutation({
    mutationFn: async ({
      prompt,
      runWith,
    }: {
      prompt: string;
      runWith: "agent" | "code";
    }) => {
      const client = await getClient(credentialGetter);
      const yaml = convertToYAML(
        buildBlankWorkflowRequest(deriveHandoffTitle(prompt), runWith),
      );
      const result = await client.post<string, { data: WorkflowApiResponse }>(
        "/workflows",
        yaml,
        {
          headers: {
            "Content-Type": "text/plain",
          },
        },
      );
      return { data: result.data, prompt };
    },
    onSuccess: ({ data: workflow, prompt }) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      navigate(`/workflows/${workflow.workflow_permanent_id}/build`, {
        state: { copilotMessage: prompt },
      });
    },
    onError: (error: AxiosError) => {
      toast({
        variant: "destructive",
        title: "创建智能体时出错",
        description: error.message,
      });
    },
    onSettled: () => {
      submitInFlightRef.current = false;
    },
  });

  const isSubmitting =
    generateWorkflowMutation.isPending || handoffWorkflowMutation.isPending;

  const {
    isSupported: isSpeechSupported,
    isListening: isSpeechListening,
    isHearingSpeech: isSpeechHearing,
    toggle: toggleSpeech,
  } = useSpeechToTextField({
    value: prompt,
    onChange: setPrompt,
    enabled: !promptImprovalIsPending && !isSubmitting,
  });

  const submitPrompt = ({ prompt }: { prompt: string }) => {
    if (submitInFlightRef.current || isSubmitting) {
      return;
    }
    submitInFlightRef.current = true;
    if (enableCopilotHandoff) {
      handoffWorkflowMutation.mutate({ prompt, runWith: "agent" });
      return;
    }
    generateWorkflowMutation.mutate({ prompt });
  };

  return (
    <div>
      <div
        className="rounded-sm py-[4.25rem]"
        style={{
          background: `url(${img}) 50% / cover no-repeat`,
        }}
      >
        <div className="mx-auto flex min-w-44 flex-col items-center gap-7 px-8">
          <span className="text-2xl">
            你想完成什么任务？
          </span>
          <div className="flex w-full max-w-xl flex-col">
            <div
              className={cn(
                "flex w-full items-center gap-2 rounded-xl border border-input bg-background py-2 pr-3 text-muted-foreground shadow-sm transition-colors focus-within:border-foreground/20 focus-within:ring-2 focus-within:ring-ring/10",
                {
                  "pointer-events-none opacity-50": promptImprovalIsPending,
                },
              )}
            >
              <SpeechInputButton
                isSupported={isSpeechSupported}
                isListening={isSpeechListening}
                isHearingSpeech={isSpeechHearing}
                disabled={promptImprovalIsPending || isSubmitting}
                onToggle={toggleSpeech}
                className="ml-2 h-9 w-9 border-0 bg-transparent shadow-none hover:bg-muted"
                iconClassName="h-5 w-5"
              />
              <AutoResizingTextarea
                className="min-h-0 resize-none border-0 bg-transparent px-4 py-0 leading-5 text-foreground shadow-none placeholder:text-muted-foreground hover:border-0 focus-visible:ring-0"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="请输入任务指令..."
              />
              <ImprovePrompt
                isVisible={Boolean(prompt.trim())}
                onBegin={() => {
                  setPromptImprovalIsPending(true);
                }}
                onEnd={() => {
                  setPromptImprovalIsPending(false);
                }}
                onImprove={(prompt) => setPrompt(prompt)}
                prompt={prompt}
                size="large"
                useCase="new_workflow"
              />
              {!enableCopilotHandoff ? (
                <button
                  type="button"
                  aria-label="Advanced settings"
                  className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => {
                    setShowAdvancedSettings((value) => !value);
                  }}
                >
                  <GearIcon aria-hidden="true" className="size-5 shrink-0" />
                </button>
              ) : null}
              <button
                type="button"
                aria-label="submit-prompt"
                disabled={!prompt.trim() || isSubmitting}
                className="flex items-center justify-center rounded-lg bg-cta p-2 text-cta-foreground shadow-sm transition-colors hover:bg-cta-hover disabled:pointer-events-none disabled:bg-cta/45 disabled:text-cta-foreground/65 disabled:shadow-none"
                onClick={() => {
                  submitPrompt({ prompt });
                }}
              >
                {isSubmitting ? (
                  <ReloadIcon className="size-4 animate-spin" />
                ) : (
                  <PaperPlaneIcon
                    aria-hidden="true"
                    className="size-4 shrink-0"
                  />
                )}
              </button>
            </div>
            {showAdvancedSettings ? (
              <div className="rounded-b-lg px-2">
                <div className="space-y-4 rounded-b-xl border border-t-0 border-input bg-background p-4 text-foreground shadow-sm">
                  <header>高级设置</header>
                  <div className="flex gap-16">
                    <div className="w-48 shrink-0">
                      <div className="text-sm">Webhook 回调地址</div>
                      <div className="text-xs text-muted-foreground">
                        任务提取到结构化数据后，将其发送到的 Webhook 接口 URL 地址
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Input
                        className="w-full"
                        value={webhookCallbackUrl ?? ""}
                        onChange={(event) => {
                           setWebhookCallbackUrl(event.target.value);
                        }}
                      />
                      <TestWebhookDialog
                        runType="task"
                        runId={null}
                        initialWebhookUrl={webhookCallbackUrl ?? undefined}
                        trigger={
                          <Button
                            type="button"
                            variant="secondary"
                            className="self-start"
                            disabled={!webhookCallbackUrl}
                          >
                            测试 Webhook
                          </Button>
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-16">
                    <div className="w-48 shrink-0">
                      <div className="text-sm">代理地理位置</div>
                      <div className="text-xs text-muted-foreground">
                        通过我们提供的代理路由 Skyvern 的网络流量。
                      </div>
                    </div>
                    <ProxySelector
                      value={proxyLocation}
                      onChange={setProxyLocation}
                    />
                  </div>
                  <div className="flex gap-16">
                    <div className="w-48 shrink-0">
                      <div className="text-sm">浏览器会话 ID</div>
                      <div className="text-xs text-muted-foreground">
                        持久化浏览器会话的唯一 ID
                      </div>
                    </div>
                    <Input
                      value={browserSessionId ?? ""}
                      placeholder="pbs_xxx"
                      onChange={(event) => {
                        setBrowserSessionId(event.target.value);
                      }}
                    />
                  </div>
                  <div className="flex gap-16">
                    <div className="w-48 shrink-0">
                      <div className="text-sm">浏览器服务地址</div>
                      <div className="text-xs text-muted-foreground">
                        本次任务运行所使用的 Chrome/Chromium 调试地址。
                      </div>
                    </div>
                    <Input
                      value={cdpAddress ?? ""}
                      placeholder="http://127.0.0.1:9222"
                      onChange={(event) => {
                        setCdpAddress(event.target.value);
                      }}
                    />
                  </div>
                  <div className="flex gap-16">
                    <div className="w-48 shrink-0">
                      <div className="text-sm">双重认证 (2FA) 标识符</div>
                      <div className="text-xs text-muted-foreground">
                        用于获取双重认证动态验证码的标识符。
                      </div>
                    </div>
                    <Input
                      value={totpIdentifier}
                      onChange={(event) => {
                        setTotpIdentifier(event.target.value);
                      }}
                    />
                  </div>
                  <div className="flex gap-16">
                    <div className="w-48 shrink-0">
                      <div className="text-sm">额外 HTTP 请求头</div>
                      <div className="text-xs text-muted-foreground">
                        以字典（Dict）格式指定自定义的 HTTP 请求头参数
                      </div>
                    </div>
                    <div className="flex-1">
                      <KeyValueInput
                        value={extraHttpHeaders ?? ""}
                        onChange={(val) =>
                          setExtraHttpHeaders(
                            val === null
                              ? null
                              : typeof val === "string"
                                ? val || null
                                : JSON.stringify(val),
                          )
                        }
                        addButtonText="添加请求头"
                      />
                    </div>
                  </div>

                  <div className="flex gap-16">
                    <div className="w-48 shrink-0">
                      <div className="text-sm">生成自动化脚本</div>
                      <div className="text-xs text-muted-foreground">
                        是否在任务运行成功后，自动为其生成 Playwright 自动化脚本。
                      </div>
                    </div>
                    <Switch
                      checked={generateScript}
                      onCheckedChange={(checked) => {
                        setGenerateScript(Boolean(checked));
                      }}
                    />
                  </div>
                  <div className="flex gap-16">
                    <div className="w-48 shrink-0">
                      <div className="text-sm">发布为智能体</div>
                      <div className="text-xs text-muted-foreground">
                        是否在本次任务运行的同时创建一个智能体。如果“生成自动化脚本”为是，也会自动创建。
                      </div>
                    </div>
                    <Switch
                      checked={publishWorkflow}
                      onCheckedChange={(checked) => {
                        setPublishWorkflow(Boolean(checked));
                      }}
                    />
                  </div>
                  <div className="flex gap-16">
                    <div className="w-48 shrink-0">
                      <div className="text-sm">最大执行步数限制</div>
                      <div className="text-xs text-muted-foreground">
                        本次任务允许运行的最大步骤数量。
                      </div>
                    </div>
                    <Input
                      value={maxStepsOverride ?? ""}
                      placeholder={`默认: ${MAX_STEPS_DEFAULT}`}
                      onChange={(event) => {
                        setMaxStepsOverride(event.target.value);
                      }}
                    />
                  </div>
                  <div className="flex gap-16">
                    <div className="w-48 shrink-0">
                      <div className="text-sm">输出数据结构 (Schema)</div>
                      <div className="text-xs text-muted-foreground">
                        使用 JSON 格式指定需要从网页中提取的输出数据结构
                      </div>
                    </div>
                    <div className="flex-1">
                      <CodeEditor
                        value={dataSchema ?? ""}
                        onChange={(value) => setDataSchema(value || null)}
                        language="json"
                        minHeight="100px"
                        maxHeight="500px"
                        fontSize={8}
                      />
                    </div>
                  </div>
                  <div className="flex gap-16">
                    <div className="w-48 shrink-0">
                      <div className="text-sm">最大滚动截屏次数</div>
                      <div className="text-xs text-muted-foreground">
                        {`执行动作后网页向下滚动的最大截屏次数。默认是 ${MAX_SCREENSHOT_SCROLLS_DEFAULT}。如果设为 0，将仅截取当前可视区域。`}
                      </div>
                    </div>
                    <Input
                      value={maxScreenshotScrolls ?? ""}
                      placeholder={`默认: ${MAX_SCREENSHOT_SCROLLS_DEFAULT}`}
                      onChange={(event) => {
                        setMaxScreenshotScrolls(event.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-4 rounded-sm bg-slate-elevation1 p-4">
        {exampleCases.map((example) => {
          return (
            <ExampleCasePill
              key={example.key}
              icon={example.icon}
              label={example.label}
              onClick={() => {
                submitPrompt({ prompt: example.prompt });
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export { PromptBox };
