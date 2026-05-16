export const API_BASE = import.meta.env.VITE_API_URL || "";

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown> | null;

  constructor(message: string, status: number, data: Record<string, unknown> | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE}${path}`;
  const controller = options.signal ? undefined : new AbortController();
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), 30000)
    : undefined;

  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      signal: options.signal || controller?.signal,
    });

    if (!response.ok && !options.headers?.toString().includes("text/event-stream")) {
      let errorData: Record<string, unknown> | null = null;
      try {
        errorData = await response.clone().json();
      } catch {
      }

      if (response.status === 401) {
        throw new ApiError(
          "Session expired. Please log in again.",
          401,
          errorData
        );
      }

      throw new ApiError(
        (errorData?.error as string) ||
          (errorData?.message as string) ||
          `Request failed with status ${response.status}`,
        response.status,
        errorData
      );
    }

    return response;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new ApiError(
        "Unable to reach the server. Please check your connection.",
        0
      );
    }

    throw new ApiError(
      error instanceof Error ? error.message : "An unexpected error occurred.",
      0
    );
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
