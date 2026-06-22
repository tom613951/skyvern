import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "use-debounce";

import { BrowserIcon } from "@/components/icons/BrowserIcon";
import { TableSearchInput } from "@/components/TableSearchInput";

import { BrowserProfilesList } from "./BrowserProfilesList";
import { CreateBrowserProfileButton } from "./CreateBrowserProfileButton";
import { useBackgroundBrowserProfileCreate } from "./hooks/useBackgroundBrowserProfileCreate";

const subHeaderText =
  "已保存的浏览器状态（Cookie、登录信息和设置），智能体可在此基础上启动新的浏览器。存储成本低且支持并行重用，因此一次保存的登录状态可以分发到多个并发运行中。";

function BrowserProfilesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 250);

  // Mounted for its side effects: rehydrates an in-progress create from
  // sessionStorage so the toast still fires if the user navigates here from
  // the session page mid-create or reloads the tab.
  useBackgroundBrowserProfileCreate();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BrowserIcon className="size-6" />
          <h1 className="text-2xl">浏览器配置文件</h1>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {subHeaderText}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4">
        <TableSearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            const params = new URLSearchParams(searchParams);
            params.set("page", "1");
            setSearchParams(params, { replace: true });
          }}
          placeholder="搜索浏览器配置文件..."
          className="w-48 lg:w-72"
        />
        <CreateBrowserProfileButton />
      </div>
      <BrowserProfilesList searchKey={debouncedSearch} />
    </div>
  );
}

export { BrowserProfilesPage };
