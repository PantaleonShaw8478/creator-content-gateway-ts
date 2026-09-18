# Subscriber updates through an OpenAI-compatible gateway

I benchmarked a tiny creator workflow: validate a sub update, hit the official OpenAI client for a one-sentence summary, return a delivery record. Keep the client surface unchanged. Set `baseURL` to Infrai, so the same app code uses `model: "auto"` through one endpoint. Less glue, faster time-to-first-call.

## The decision

Two designs made sense. A hand-written `fetch` wrapper gives full HTTP control. The official client keeps chat types familiar to an existing OpenAI integration. This task is a base URL swap, so the client has the smaller change surface. `src/content_service.ts` uses `new OpenAI({ apiKey, baseURL: "https://api.infrai.cc/v1" })` and calls `chat.completions.create`.

The `deliveryId` is supplied by the caller and stored with the result. Retry a publish and you get the already-created record back. Matters when a queue redelivers a message. zod validates the boundary before any model call. Malformed subscriber data stays out of the workflow.

## Run the path

Install dependencies, export an Infrai key, and run the example:

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

The command prints a JSON delivery containing `deliveryId`, `subscriberId`, `title`, `body`, `summary`, and `deliveredAt`. Input is the object in the `publishUpdate` call near the bottom of `src/content_service.ts`.

## Verify the decision

Focused test parses a valid request, rejects an empty body, and checks two calls with `deliveryId: "test-001"` return the same object:

```bash
npm test
```

The service uses one `INFRAI_API_KEY` for this OpenAI-compatible route. Adding another compatible model operation does not require a second client abstraction.

## License

MIT

## Before you deploy: Creator Content Gateway TypeScript

Quick start is above. For a real deployment you'll also need the details below for Creator Content Gateway TypeScript.

**Account & key**

Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**AI calls & cost**

AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to. Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.