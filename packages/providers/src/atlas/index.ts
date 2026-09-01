import { readFile, stat, writeFile } from "node:fs/promises";
import type {
  ActionContext,
  ActionOptions,
  MediaProvider,
  MediaResult,
  UpscaleOptions,
} from "@agent-media/core";
import {
  createError,
  createSuccess,
  ensureOutputDir,
  ErrorCodes,
  getOutputPath,
  resolveOutputFilename,
} from "@agent-media/core";

const ATLAS_API_BASE = "https://api.atlascloud.ai/api/v1";
const DEFAULT_UPSCALE_MODEL = "atlascloud/image-upscaler";
const SUPPORTED_ACTIONS = ["upscale"];

interface AtlasPrediction {
  id?: string;
  request_id?: string;
  status?: string;
  outputs?: string[];
  error?: string;
  message?: string;
}

interface AtlasResponse<T> {
  data?: T;
}

interface AtlasClientOptions {
  baseUrl?: string;
  sleep?: (milliseconds: number) => Promise<void>;
}

class AtlasHttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "AtlasHttpError";
  }
}

function unwrapAtlasResponse<T>(response: T | AtlasResponse<T>): T {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    (response as AtlasResponse<T>).data
  ) {
    return (response as AtlasResponse<T>).data as T;
  }
  return response as T;
}

async function atlasRequest<T>(
  url: string,
  apiKey: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "agent-media/0.13.0",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new AtlasHttpError(
      response.status,
      `Atlas API request failed (${response.status}): ${
        detail || response.statusText
      }`
    );
  }

  return (await response.json()) as T;
}

async function uploadAtlasImage(
  input: { source: string; isUrl: boolean },
  apiKey: string,
  baseUrl: string
): Promise<string> {
  if (input.isUrl) {
    return input.source;
  }

  const buffer = await readFile(input.source);
  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(buffer)]),
    input.source.split("/").pop()
  );

  const response = unwrapAtlasResponse(
    await atlasRequest<{
      data?: { download_url?: string };
      download_url?: string;
    }>(`${baseUrl}/model/uploadMedia`, apiKey, { method: "POST", body: form })
  );
  const downloadUrl = response.download_url;
  if (!downloadUrl) {
    throw new Error("Atlas upload response did not include a download URL");
  }
  return downloadUrl;
}

function isTransientGetError(error: unknown): boolean {
  if (error instanceof AtlasHttpError) {
    return error.status === 429 || error.status >= 500;
  }
  return error instanceof TypeError;
}

export async function pollAtlasPrediction(
  requestId: string,
  apiKey: string,
  clientOptions: AtlasClientOptions = {}
): Promise<string> {
  const baseUrl = clientOptions.baseUrl ?? ATLAS_API_BASE;
  const sleep =
    clientOptions.sleep ??
    ((milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)));
  let transientFailures = 0;

  for (let attempt = 0; attempt < 120; attempt += 1) {
    await sleep(3000);
    let prediction: AtlasPrediction;
    try {
      prediction = unwrapAtlasResponse(
        await atlasRequest<AtlasPrediction | AtlasResponse<AtlasPrediction>>(
          `${baseUrl}/model/prediction/${requestId}`,
          apiKey
        )
      );
    } catch (error) {
      if (!isTransientGetError(error) || transientFailures >= 3) {
        throw error;
      }
      transientFailures += 1;
      await sleep(1000 * 2 ** transientFailures);
      continue;
    }

    const status = prediction.status?.toLowerCase();
    if (status === "completed" || status === "succeeded") {
      const output = prediction.outputs?.[0];
      if (!output) {
        throw new Error("Atlas completed without an image output");
      }
      return output;
    }
    if (
      status === "failed" ||
      status === "cancelled" ||
      status === "canceled"
    ) {
      throw new Error(
        `Atlas upscale failed: ${
          prediction.error ?? prediction.message ?? status
        }`
      );
    }
  }

  throw new Error("Atlas upscale did not complete within 6 minutes");
}

export async function executeAtlasUpscale(
  options: UpscaleOptions,
  context: ActionContext,
  apiKey: string,
  clientOptions: AtlasClientOptions = {}
): Promise<MediaResult> {
  const { input, scale = 2, model = DEFAULT_UPSCALE_MODEL } = options;
  if (!input?.source) {
    return createError(
      ErrorCodes.INVALID_INPUT,
      "Input source is required for upscaling"
    );
  }
  if (scale < 1 || scale > 4) {
    return createError(
      ErrorCodes.INVALID_INPUT,
      "Atlas scale must be between 1 and 4"
    );
  }
  if (model !== DEFAULT_UPSCALE_MODEL) {
    return createError(
      ErrorCodes.INVALID_INPUT,
      `Atlas upscale currently supports model '${DEFAULT_UPSCALE_MODEL}'`
    );
  }

  const baseUrl = clientOptions.baseUrl ?? ATLAS_API_BASE;
  await ensureOutputDir(context.outputDir);
  const imageUrl = await uploadAtlasImage(input, apiKey, baseUrl);

  // Generation submissions are intentionally never retried.
  const prediction = unwrapAtlasResponse(
    await atlasRequest<AtlasPrediction | AtlasResponse<AtlasPrediction>>(
      `${baseUrl}/model/generateImage`,
      apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          image: imageUrl,
          outscale: scale,
          output_format: "png",
        }),
      }
    )
  );
  const requestId = prediction.id ?? prediction.request_id;
  if (!requestId) {
    throw new Error(
      "Atlas generation response did not include a prediction ID"
    );
  }

  const outputUrl = await pollAtlasPrediction(requestId, apiKey, clientOptions);
  const outputResponse = await fetch(outputUrl);
  if (!outputResponse.ok) {
    throw new Error(
      `Failed to download Atlas output: ${outputResponse.statusText}`
    );
  }

  const outputFilename = resolveOutputFilename(
    "png",
    "upscaled",
    context.outputName,
    context.inputSource
  );
  const outputPath = getOutputPath(context.outputDir, outputFilename);
  await writeFile(outputPath, Buffer.from(await outputResponse.arrayBuffer()));
  const stats = await stat(outputPath);

  return createSuccess({
    mediaType: "image",
    action: "upscale",
    provider: "atlas",
    outputPath,
    mime: "image/png",
    bytes: stats.size,
  });
}

export const atlasProvider: MediaProvider = {
  name: "atlas",

  supports(action: string): boolean {
    return SUPPORTED_ACTIONS.includes(action);
  },

  async execute(
    actionConfig: ActionOptions,
    context: ActionContext
  ): Promise<MediaResult> {
    const apiKey = process.env["ATLASCLOUD_API_KEY"];
    if (!apiKey) {
      return createError(
        ErrorCodes.API_ERROR,
        "ATLASCLOUD_API_KEY environment variable is not set"
      );
    }
    if (actionConfig.action !== "upscale") {
      return createError(
        ErrorCodes.INVALID_INPUT,
        `Action '${actionConfig.action}' not supported by atlas provider`
      );
    }

    try {
      return await executeAtlasUpscale(actionConfig.options, context, apiKey);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return createError(ErrorCodes.PROVIDER_ERROR, message);
    }
  },
};

export default atlasProvider;
