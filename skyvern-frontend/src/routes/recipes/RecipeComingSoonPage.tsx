import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  description: string;
};

function RecipeComingSoonPage({ title, description }: Props) {
  return (
    <div>
      <h1 className="mb-5 text-3xl font-bold">{title}</h1>
      <h2 className="mb-5 text-neutral-600 dark:text-slate-400">
        {description}
      </h2>
      <div className="mt-24 flex w-full justify-center">
        <div className="flex w-[409px] flex-col items-center gap-4">
          <h1 className="text-3xl font-bold">申请内测</h1>
          <h2 className="text-center text-neutral-600 dark:text-slate-400">
            该智能体目前处于内测阶段，请预约演示以了解更多信息。
          </h2>
          <Button size="lg" asChild>
            <Link
              to="https://www.skyvern.com/contact"
              target="_blank"
              rel="noopener noreferrer"
            >
              预约演示
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export { RecipeComingSoonPage };
