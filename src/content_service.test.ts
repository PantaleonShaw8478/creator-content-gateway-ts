import assert from "node:assert/strict";
import { publishUpdate, updateRequest } from "./content_service.ts";

const request = { deliveryId: "test-001", subscriberId: "sub-1", title: "Release", body: "New audio is available." };
assert.deepEqual(updateRequest.parse(request), request);
assert.throws(() => updateRequest.parse({ ...request, body: "" }));

// The delivery id is the caller-owned write key: retries return the same record.
const localSummary = async () => "Release: New audio is available.";
const first = await publishUpdate(request, localSummary);
const second = await publishUpdate(request, localSummary);
assert.equal(first, second);
console.log("content delivery decision: validated and idempotent");
