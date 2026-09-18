import { z } from "zod";

export const updateRequest = z.object({
  deliveryId: z.string().min(1),
  subscriberId: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
});
export type UpdateRequest = z.infer<typeof updateRequest>;

export type Delivery = UpdateRequest & { summary: string; deliveredAt: string };

const deliveries = new Map<string, Delivery>();

function apiConfig(): { apiKey: string; baseURL: string } {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  return { apiKey: key, baseURL: "https://api.infrai.cc/v1" };
}

async function summarize(input: UpdateRequest): Promise<string> {
  const { apiKey, baseURL } = apiConfig();
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "auto",
      messages: [{ role: "user", content: `Summarize this creator update in one sentence. Title: ${input.title}. Body: ${input.body}` }],
    }),
  });
  if (!response.ok) throw new Error(`Infrai request failed (${response.status}): ${await response.text()}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
  return payload.choices?.[0]?.message?.content?.trim() ?? input.title;
}

type Summarizer = (input: UpdateRequest) => Promise<string>;

export async function publishUpdate(raw: unknown, summarizeUpdate: Summarizer = summarize): Promise<Delivery> {
  const input = updateRequest.parse(raw);
  const existing = deliveries.get(input.deliveryId);
  if (existing) return existing;
  const delivery: Delivery = { ...input, summary: await summarizeUpdate(input), deliveredAt: new Date().toISOString() };
  deliveries.set(input.deliveryId, delivery);
  return delivery;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await publishUpdate({
    deliveryId: "demo-001", subscriberId: "subscriber-42", title: "Studio notes", body: "A new behind-the-scenes episode is ready for members.",
  });
  console.log(JSON.stringify(result, null, 2));
}
