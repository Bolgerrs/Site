import { getPayload } from "payload";

type BridgeCommand = "create" | "update" | "load";

async function readStdin() {
  return await new Promise<string>((resolve, reject) => {
    let input = "";

    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      input += chunk;
    });
    process.stdin.on("end", () => resolve(input));
    process.stdin.on("error", reject);
  });
}

async function main() {
  const command = process.argv[2] as BridgeCommand | undefined;

  if (!command || !["create", "update", "load"].includes(command)) {
    throw new Error("Lead bridge requires one of: create, update, load.");
  }

  const input = await readStdin();
  const payloadBody = input.trim()
    ? (JSON.parse(input) as Record<string, unknown>)
    : ({} as Record<string, unknown>);
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });

  if (command === "create") {
    const created = await payload.create({
      collection: "leads",
      data: (payloadBody.data ?? {}) as Record<string, unknown>,
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    } as never);

    process.stdout.write(`${JSON.stringify(created)}\n`);
    return;
  }

  if (command === "update") {
    const updated = await payload.update({
      id: payloadBody.id as string | number,
      collection: "leads",
      data: (payloadBody.data ?? {}) as Record<string, unknown>,
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    } as never);

    process.stdout.write(`${JSON.stringify(updated)}\n`);
    return;
  }

  const result = await payload.find({
    collection: "leads",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    showHiddenFields: true,
    where: {
      referenceCode: {
        equals: payloadBody.referenceCode,
      },
    },
  });

  process.stdout.write(`${JSON.stringify({ doc: result.docs[0] ?? null })}\n`);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
