import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/store/SettingsStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRuntimeApiKey } from "@/util/env";
import { HiddenCopyableInput } from "@/components/ui/hidden-copyable-input";
import { OnePasswordTokenForm } from "@/components/OnePasswordTokenForm";
import { BitwardenCredentialForm } from "@/components/BitwardenCredentialForm";
import { AzureClientSecretCredentialTokenForm } from "@/components/AzureClientSecretCredentialTokenForm";
import { CustomCredentialServiceConfigForm } from "@/components/CustomCredentialServiceConfigForm";
import { useVersionQuery } from "@/hooks/useVersionQuery";
import { formatVersion, getAppVersion } from "@/util/version";

function Settings() {
  const { environment, organization, setEnvironment, setOrganization } =
    useSettingsStore();
  const apiKey = getRuntimeApiKey();
  const { data: versionData } = useVersionQuery();

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader className="border-b-2">
          <CardTitle className="text-lg">系统设置</CardTitle>
          <CardDescription>
            您可以在此处选择运行环境与关联组织
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Label className="w-36 whitespace-nowrap">运行环境</Label>
              <Select value={environment} onValueChange={setEnvironment}>
                <SelectTrigger>
                  <SelectValue placeholder="运行环境" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">本地 (local)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-36 whitespace-nowrap">关联组织</Label>
              <Select value={organization} onValueChange={setOrganization}>
                <SelectTrigger>
                  <SelectValue placeholder="关联组织" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skyvern">Skyvern</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b-2">
          <CardTitle className="text-lg">API 密钥 (API Key)</CardTitle>
          <CardDescription>当前正在生效的 API 密钥</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <HiddenCopyableInput value={apiKey ?? "未找到 API 密钥"} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b-2">
          <CardTitle className="text-lg">1Password 集成</CardTitle>
          <CardDescription>
            配置与管理您的 1Password 服务账号 Token。{" "}
            <a
              href="https://developer.1password.com/docs/service-accounts/get-started/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              了解如何创建服务账号并获取 Token。
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <OnePasswordTokenForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b-2">
          <CardTitle className="text-lg">Bitwarden 集成</CardTitle>
          <CardDescription>
            配置您的 Bitwarden 账号凭证，以便使用您自己的密码库进行凭证管理。
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <BitwardenCredentialForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b-2">
          <CardTitle className="text-lg">Azure 集成</CardTitle>
          <CardDescription>配置并管理您的 Azure 服务集成</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <AzureClientSecretCredentialTokenForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b-2">
          <CardTitle className="text-lg">自定义凭证服务</CardTitle>
          <CardDescription>
            配置自定义的 HTTP API，用于进行外部凭证数据对接。
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <CustomCredentialServiceConfigForm />
        </CardContent>
      </Card>
      {(getAppVersion() !== "development" || versionData?.version) && (
        <p className="text-center text-xs text-muted-foreground/50">
          {getAppVersion() !== "development" && (
            <>UI 版本: {formatVersion(getAppVersion())}</>
          )}
          {getAppVersion() !== "development" && versionData?.version && " | "}
          {versionData?.version && (
            <>API 版本: {formatVersion(versionData.version)}</>
          )}
        </p>
      )}
    </div>
  );
}

export { Settings };
