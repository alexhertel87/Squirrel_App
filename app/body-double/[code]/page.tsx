import { BodyDoubleRoom } from "../../BodyDoubleRoom";

export const dynamic = "force-dynamic";

export default async function BodyDoublePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <BodyDoubleRoom code={code} />;
}
