import { SquirrelDashboard } from "../SquirrelDashboard";
import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireChatGPTUser("/dashboard");
  return <SquirrelDashboard initialUser={user} signOutPath={chatGPTSignOutPath("/")} />;
}
