import { PromptBox } from "./PromptBox";
import { SavedTasks } from "./SavedTasks";

function TaskTemplates() {
  return (
    <div className="space-y-8">
      <PromptBox />
      <h2 className="text-3xl">我的任务</h2>
      <SavedTasks />
    </div>
  );
}

export { TaskTemplates };
