import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { StartBackgroundCreateInput } from "./hooks/useBackgroundBrowserProfileCreate";

type Props = {
  browserSessionId: string;
  isSessionRunning: boolean;
  onStartBackgroundCreate: (input: StartBackgroundCreateInput) => void;
  defaultName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function SaveSessionAsBrowserProfileDialog({
  browserSessionId,
  isSessionRunning,
  onStartBackgroundCreate,
  defaultName = "",
  open,
  onOpenChange,
}: Props) {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setDescription("");
    }
  }, [open, defaultName]);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    onStartBackgroundCreate({
      browserSessionId,
      name: trimmedName,
      description: description.trim() || undefined,
      isSessionRunning,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>保存为浏览器配置文件</DialogTitle>
          <DialogDescription>
            {isSessionRunning
              ? "将此会话的状态捕获为可重用的配置文件。保存将关闭该会话并在后台运行。"
              : "将此会话的状态捕获为可重用的配置文件。"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 pb-4">
            <div className="rounded-md border border-slate-700 bg-slate-elevation2 px-3 py-2">
              <div className="text-xs text-neutral-600 dark:text-slate-400">
                源会话
              </div>
              <div className="truncate font-mono text-xs text-slate-200">
                {browserSessionId}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="save-browser-profile-name">
                名称 <span className="text-red-400">*</span>
              </Label>
              <Input
                id="save-browser-profile-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="例如：已登录的社交账号"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="save-browser-profile-description">
                描述{" "}
                <span className="text-neutral-600 dark:text-slate-400">
                  （可选）
                </span>
              </Label>
              <Textarea
                id="save-browser-profile-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="此配置文件捕获了什么状态？"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              保存配置文件
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { SaveSessionAsBrowserProfileDialog };
