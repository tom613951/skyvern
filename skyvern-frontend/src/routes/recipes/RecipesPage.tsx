import { Link } from "react-router-dom";

const recipes = [
  {
    title: "医疗保健",
    description: "自动化在医疗保健网站上的工作。",
    to: "/recipes/healthcare",
  },
  {
    title: "政务办理",
    description: "在政府官方网站上导航并完成政务任务。",
    to: "/recipes/government",
  },
  {
    title: "发票提取",
    description: "使用智能体收集并下载电子发票。",
    to: "/recipes/invoices",
  },
  {
    title: "保险业务",
    description: "自动处理保险网站上的各项业务。",
    to: "/recipes/insurance",
  },
  {
    title: "在线采购",
    description: "在网页上进行付款并完成采购流程。",
    to: "/recipes/purchasing",
  },
  {
    title: "CRM 维护",
    description: "在 CRM 客户关系管理系统中导航并更新数据记录。",
    to: "/recipes/crm",
  },
  {
    title: "物流跟踪",
    description: "自动在物流货运网站上执行查询或操作。",
    to: "/recipes/logistics",
  },
  {
    title: "联系表单",
    description: "在各类网站上自动提交联系表单信息。",
    to: "/recipes/contact-forms",
  },
  {
    title: "求职申请",
    description: "使用智能体自动提交工作求职申请。",
    to: "/recipes/job-apps",
  },
];

function RecipesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal text-neutral-950 dark:text-neutral-50">
          快捷指令 (Recipes)
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          浏览针对常见 Web 自动化工作流的现成智能体模板。
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {recipes.map((recipe) => (
          <Link
            key={recipe.to}
            to={recipe.to}
            className="group rounded-lg border border-neutral-200 bg-white p-4 transition-colors duration-100 hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/[0.08] dark:bg-neutral-950 dark:hover:border-white/[0.16] dark:hover:bg-white/[0.03]"
          >
            <div className="text-sm font-semibold text-neutral-950 group-hover:text-neutral-900 dark:text-neutral-100 dark:group-hover:text-white">
              {recipe.title}
            </div>
            <div className="mt-2 text-sm leading-5 text-neutral-600 dark:text-neutral-400">
              {recipe.description}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export { RecipesPage };
