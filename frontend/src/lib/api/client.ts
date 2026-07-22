export class ApiError extends Error {
  status: number | null;
  code?: string;
  details?: unknown;

  constructor({
    message,
    status,
    code,
    details
  }: {
    message: string;
    status: number | null;
    code?: string;
    details?: unknown;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const requestTimeoutMs = 10_000;

const getApiBaseUrl = () => {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!rawBaseUrl) {
    throw new ApiError({
      status: null,
      code: "missing_api_base_url",
      message: "Missing NEXT_PUBLIC_API_BASE_URL. Add it to frontend/.env.local."
    });
  }

  try {
    return new URL(rawBaseUrl).origin;
  } catch {
    throw new ApiError({
      status: null,
      code: "invalid_api_base_url",
      message: "NEXT_PUBLIC_API_BASE_URL must be a valid URL."
    });
  }
};

const parseJsonSafely = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError({
      status: response.status,
      code: "invalid_json",
      message: "The backend returned a response LazyTrip could not read."
    });
  }
};

const getErrorMessage = (body: unknown, fallback: string) => {
  if (
    body &&
    typeof body === "object" &&
    "detail" in body &&
    typeof (body as { detail: unknown }).detail === "string"
  ) {
    return (body as { detail: string }).detail;
  }

  return fallback;
};

export const apiRequest = async <ResponseBody>(
  path: string,
  init: Omit<RequestInit, "body"> & { body?: unknown } = {}
): Promise<ResponseBody> => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);
  const headers = new Headers(init.headers);

  if (init.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: controller.signal
    });
    const responseBody = await parseJsonSafely(response);

    if (!response.ok) {
      throw new ApiError({
        status: response.status,
        code: "http_error",
        message: getErrorMessage(responseBody, "LazyTrip could not validate this trip yet."),
        details: responseBody
      });
    }

    return responseBody as ResponseBody;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError({
        status: null,
        code: "request_timeout",
        message: "LazyTrip took too long to validate this trip. Please try again."
      });
    }

    throw new ApiError({
      status: null,
      code: "network_error",
      message: "LazyTrip could not reach the backend. Check that FastAPI is running."
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
};
