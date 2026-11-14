import { requireChatGPTUser } from "../chatgpt-auth";
import { SharedCapture } from "../SharedCapture";

export const dynamic = "force-dynamic";

export default async function CapturePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireChatGPTUser("/capture");
  const query = await searchParams;
  const value = [query.title, query.text, query.url]
    .flatMap((item) => Array.isArray(item) ? item : item ? [item] : [])
    .join("\n")
    .slice(0, 500);
  return <SharedCapture initialValue={value} />;
}
