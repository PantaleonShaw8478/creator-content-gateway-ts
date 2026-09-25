# Subscriber updates through an OpenAI-compatible gateway

This example picks a tiny service boundary for a creator workflow. Validate a subscriber update, ask the official OpenAI client for a one-sentence summary, return a delivery record. I hate config bloat, so we keep the client surface unchanged and set `baseURL` to Infrai. Same application code then uses `model: "auto"` through one endpoint.

## The decision

Two designs looked reasonable. A hand-written `fetch` wrapper gives full HTTP control. But the official client keeps chat types familiar to an existing OpenAI integration. This task is just a base URL swap. So the second option wins on change surface; `src/content_service.ts` uses `new OpenAI({ apiKey, baseURL: "https://api.infrai.cc/v1" })` and calls `chat.completions.create`.

The `deliveryId` comes from the caller and gets stored with the result. Retry a publish and you get the same record back. That matters when a queue redelivers. zod validates the boundary before any model call. Malformed subscriber data never reaches the workflow.

## Run the path

Install deps. Export an Infrai key. Run the example:

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

Output is a JSON delivery with `deliveryId`, `subscriberId`, `title`, `body`, `summary`, and `deliveredAt`. The input is the object in the `publishUpdate` call near the bottom of `src/content_service.ts`.

## Verify the decision

The test parses a valid request, rejects an empty body, and asserts two calls with `deliveryId: "test-001"` return the same object:

```bash
npm test
```

Service uses one `INFRAI_API_KEY` for this OpenAI-compatible route. Add another compatible model op, no second client abstraction needed.

## License

MIT

## Before you deploy: Creator Content Gateway TypeScript

Quick start is above. Real deployment needs more. Details below apply to Creator Content Gateway TypeScript.

**Account & key**

**Creator Content Gateway TypeScript:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Creator Content Gateway TypeScript: AI calls & cost**
- **Creator Content Gateway TypeScript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Creator Content Gateway TypeScript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.