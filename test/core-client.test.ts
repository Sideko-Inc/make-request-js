import { CoreClient, ApiError, CoreResourceClient } from "../src/index";
import { RUNTIME } from "../src/runtime";

// Mock node-fetch
import nodeFetch from "node-fetch";
jest.mock("node-fetch");
const mockFetch = nodeFetch as jest.MockedFunction<typeof nodeFetch>;

describe("CoreClient", () => {
  let client: CoreClient;
  const baseUrl = "https://api.example.com";

  beforeEach(() => {
    client = new CoreClient({ baseUrl });
    mockFetch.mockClear();
  });

  describe("constructor", () => {
    it("should create client with string baseUrl", () => {
      const testClient = new CoreClient({ baseUrl: "https://test.com" });
      expect(testClient.buildUrl("/path")).toBe("https://test.com/path");
    });

    it("should create client with object baseUrl", () => {
      const testClient = new CoreClient({
        baseUrl: { api: "https://api.test.com", auth: "https://auth.test.com" },
      });
      expect(testClient.buildUrl("/path", "api")).toBe(
        "https://api.test.com/path"
      );
      expect(testClient.buildUrl("/path", "auth")).toBe(
        "https://auth.test.com/path"
      );
    });
  });

  describe("buildUrl", () => {
    it("should build URL correctly", () => {
      expect(client.buildUrl("/users")).toBe("https://api.example.com/users");
      expect(client.buildUrl("users")).toBe("https://api.example.com/users");
    });

    it("should handle trailing slash in baseUrl", () => {
      const testClient = new CoreClient({
        baseUrl: "https://api.example.com/",
      });
      expect(testClient.buildUrl("/users")).toBe(
        "https://api.example.com/users"
      );
    });
  });

  describe("makeRequest", () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
      text: jest.fn().mockResolvedValue("success"),
      status: 200,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue(mockResponse as any);
    });

    it("should make GET request successfully", async () => {
      const promise = client.makeRequest({
        method: "get",
        path: "/users",
      });

      const result = await promise;
      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/users",
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("should handle POST request with JSON body", async () => {
      const body = { name: "John Doe" };
      const promise = client.makeRequest({
        method: "post",
        path: "/users",
        body,
        contentType: "application/json",
      });

      await promise;
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/users",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(body),
          headers: expect.objectContaining({
            "content-type": "application/json",
          }),
        })
      );
    });

    it("should add default headers", async () => {
      const promise = client.makeRequest({
        method: "get",
        path: "/users",
      });

      await promise;
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/users",
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-sideko-sdk-language": "Javascript",
            "x-sideko-runtime": RUNTIME.type,
          }),
        })
      );
    });

    it("should throw ApiError on failed response", async () => {
      const errorResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
      };
      mockFetch.mockResolvedValue(errorResponse as any);

      const promise = client.makeRequest({
        method: "get",
        path: "/nonexistent",
      });

      await expect(promise).rejects.toThrow(ApiError);
    });

    it("should handle query parameters", async () => {
      const promise = client.makeRequest({
        method: "get",
        path: "/users",
        query: ["limit=10", "offset=20"],
      });

      await promise;
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/users?limit=10&offset=20",
        expect.any(Object)
      );
    });

    it("should handle timeout", async () => {
      const timeoutClient = new CoreClient({ baseUrl, timeout: 5000 });

      const promise = timeoutClient.makeRequest({
        method: "get",
        path: "/users",
      });

      await promise;
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/users",
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    it("should handle request with custom headers", async () => {
      const promise = client.makeRequest({
        method: "get",
        path: "/users",
        headers: {
          "Custom-Header": "custom-value",
        },
      });

      await promise;
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/users",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Custom-Header": "custom-value",
          }),
        })
      );
    });

    it("should handle multipart/form-data content type", async () => {
      const promise = client.makeRequest({
        method: "post",
        path: "/upload",
        body: { file: "data" },
        contentType: "multipart/form-data",
      });

      await promise;
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/upload",
        expect.objectContaining({
          method: "POST",
          body: expect.any(Object),
        })
      );
    });

    it("should handle application/x-www-form-urlencoded content type", async () => {
      const promise = client.makeRequest({
        method: "post",
        path: "/form",
        body: { key1: "value1", key2: "value2" },
        contentType: "application/x-www-form-urlencoded",
      });

      await promise;
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/form",
        expect.objectContaining({
          method: "POST",
          body: expect.stringMatching(/key1=value1/),
        })
      );
    });

    it("should handle raw body data", async () => {
      const rawData = new Uint8Array([1, 2, 3, 4]);
      const promise = client.makeRequest({
        method: "post",
        path: "/binary",
        body: rawData,
      });

      await promise;
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/binary",
        expect.objectContaining({
          method: "POST",
          body: rawData,
        })
      );
    });

    it("should handle withCredentials flag", async () => {
      const promise = client.makeRequest({
        method: "get",
        path: "/secure",
        withCredentials: true,
      });

      await promise;
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/secure",
        expect.objectContaining({
          credentials: "include",
        })
      );
    });

    it("should handle request options", async () => {
      const promise = client.makeRequest({
        method: "get",
        path: "/users",
        opts: {
          timeout: 10000,
          additionalHeaders: {
            "X-Custom": "test",
          },
          additionalQuery: {
            extra: "param",
          },
        },
      });

      await promise;
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/users?extra=param",
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Custom": "test",
          }),
        })
      );
    });

    it("should handle text/plain content type", async () => {
      const promise = client.makeRequest({
        method: "post",
        path: "/text",
        body: "plain text content",
        contentType: "text/plain",
      });

      await promise;
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/text",
        expect.objectContaining({
          method: "POST",
          body: "plain text content",
        })
      );
    });

    it("should throw error for invalid form-urlencoded body", async () => {
      const promise = client.makeRequest({
        method: "post",
        path: "/form",
        body: "not an object",
        contentType: "application/x-www-form-urlencoded",
      });

      await expect(promise).rejects.toThrow(
        "x-www-form-urlencoded data must be an object at the top level"
      );
    });

    it("should handle bodyEncoding options", async () => {
      const promise = client.makeRequest({
        method: "post",
        path: "/form",
        body: { ids: [1, 2, 3] },
        contentType: "application/x-www-form-urlencoded",
        bodyEncoding: {
          style: { ids: "spaceDelimited" },
          explode: { ids: false },
        },
      });

      await promise;
      expect(mockFetch).toHaveBeenCalled();
    });

    it("should handle content-type override in additional headers", async () => {
      const promise = client.makeRequest({
        method: "post",
        path: "/override",
        body: { data: "test" },
        contentType: "application/json",
        opts: {
          additionalHeaders: {
            "content-type": "application/custom",
          },
        },
      });

      await promise;
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/override",
        expect.objectContaining({
          headers: expect.objectContaining({
            "content-type": "application/custom",
          }),
        })
      );
    });

    it("should handle undefined body", async () => {
      const promise = client.makeRequest({
        method: "get",
        path: "/no-body",
        body: undefined,
        contentType: "application/json",
      });

      await promise;
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/no-body",
        expect.objectContaining({
          method: "GET",
        })
      );
    });
  });

  describe("CoreResourceClient", () => {
    it("should create resource client with options", () => {
      const resourceClient = new CoreResourceClient(client, { lazyLoad: true });
      expect(resourceClient).toBeInstanceOf(CoreResourceClient);
    });
  });
});
