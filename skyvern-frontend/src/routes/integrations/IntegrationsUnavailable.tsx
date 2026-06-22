import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function IntegrationsUnavailable() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>第三方集成</CardTitle>
          <CardDescription>
            第三方集成服务目前在 Skyvern Cloud 中可用。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-400">
          <p>
            请前往{" "}
            <a
              href="https://app.skyvern.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-200 underline hover:text-slate-100"
            >
              app.skyvern.com
            </a>{" "}
            注册并连接您的 Google 账号及其他服务商。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export { IntegrationsUnavailable };
