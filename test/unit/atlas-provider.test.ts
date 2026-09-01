import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ProviderRegistry,
  resolveProvider,
  type MediaProvider,
} from "../../packages/core/src/index.js";
import {
  atlasProvider,
  executeAtlasUpscale,
  pollAtlasPrediction,
} from "../../packages/providers/src/atlas/index.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Atlas provider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.ATLASCLOUD_API_KEY;
  });

  it("supports only upscale and requires an API key", async () => {
    expect(atlasProvider.supports("upscale")).toBe(true);
    expect(atlasProvider.supports("generate")).toBe(false);

    const result = await atlasProvider.execute(
      {
        action: "upscale",
        options: {
          input: { source: "https://example.com/input.png", isUrl: true },
        },
      },
      { outputDir: "." }
    );
    expect(result).toEqual({
      ok: false,
      error: {
        code: "API_ERROR",
        message: "ATLASCLOUD_API_KEY environment variable is not set",
      },
    });
  });

  it("does not replace the default local provider when only the Atlas key is set", () => {
    process.env.ATLASCLOUD_API_KEY = "test-key";
    const registry = new ProviderRegistry();
    const localProvider: MediaProvider = {
      name: "local",
      supports: (action) => action === "upscale",
      execute: async () => ({
        ok: false,
        error: { code: "NOT_RUN", message: "not run" },
      }),
    };
    registry.register(localProvider);
    registry.register(atlasProvider);

    expect(resolveProvider(registry, "upscale")).toBe(localProvider);
  });

  it("submits generation exactly once and saves the completed output", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ data: { id: "prediction-1" } }))
      .mockResolvedValueOnce(jsonResponse({ data: { status: "processing" } }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            status: "completed",
            outputs: ["https://cdn.example.com/upscaled.png"],
          },
        })
      )
      .mockResolvedValueOnce(
        new Response(new Uint8Array([1, 2, 3]), { status: 200 })
      );
    vi.stubGlobal("fetch", fetchMock);

    const outputDir = await import("node:fs/promises").then(({ mkdtemp }) =>
      mkdtemp("/tmp/agent-media-atlas-")
    );
    const result = await executeAtlasUpscale(
      {
        input: { source: "https://example.com/input.png", isUrl: true },
        scale: 4,
      },
      { outputDir, outputName: "atlas-result.png", inputSource: "input.png" },
      "test-key",
      { baseUrl: "https://atlas.example/api/v1", sleep: async () => undefined }
    );

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    const generationCalls = fetchMock.mock.calls.filter(
      ([url, init]) =>
        String(url).endsWith("/model/generateImage") && init?.method === "POST"
    );
    expect(generationCalls).toHaveLength(1);
    expect(JSON.parse(String(generationCalls[0]?.[1]?.body))).toEqual({
      model: "atlascloud/image-upscaler",
      image: "https://example.com/input.png",
      outscale: 4,
      output_format: "png",
    });
  });

  it("does not retry a failed generation submission", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError("offline"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      executeAtlasUpscale(
        { input: { source: "https://example.com/input.png", isUrl: true } },
        { outputDir: "/tmp" },
        "test-key",
        {
          baseUrl: "https://atlas.example/api/v1",
          sleep: async () => undefined,
        }
      )
    ).rejects.toThrow("offline");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries transient prediction GET failures with a bound", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError("temporary"))
      .mockResolvedValueOnce(
        jsonResponse({
          status: "completed",
          outputs: ["https://example.com/result.png"],
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      pollAtlasPrediction("prediction-2", "test-key", {
        baseUrl: "https://atlas.example/api/v1",
        sleep: async () => undefined,
      })
    ).resolves.toBe("https://example.com/result.png");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a non-transient prediction response", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ error: "bad" }, 400));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      pollAtlasPrediction("prediction-3", "test-key", {
        baseUrl: "https://atlas.example/api/v1",
        sleep: async () => undefined,
      })
    ).rejects.toThrow("Atlas API request failed (400)");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
