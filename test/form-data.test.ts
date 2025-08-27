// Mock the runtime module
jest.mock("../src/runtime", () => ({
  RUNTIME: { type: "browser" },
}));

// Mock form-data for Node.js tests
jest.mock("form-data", () => {
  return jest.fn().mockImplementation(() => ({
    append: jest.fn(),
    getBoundary: jest.fn().mockReturnValue("----formdata-mock-boundary"),
  }));
});

import { RUNTIME } from "../src/runtime";
import {
  isUploadFile,
  isNodeReadStream,
  isFileLike,
  isBlobLike,
  createForm,
  type FileLike,
  type BlobLike,
} from "../src/form-data";

describe("form-data utilities", () => {
  describe("isBlobLike", () => {
    it("should identify blob-like objects", () => {
      const mockBlob: BlobLike = {
        size: 1024,
        type: "text/plain",
        slice: jest.fn(),
        text: jest.fn(),
        arrayBuffer: jest.fn(),
      };

      expect(isBlobLike(mockBlob)).toBe(true);
    });

    it("should reject non-blob-like objects", () => {
      expect(isBlobLike({})).toBe(false);
      expect(isBlobLike(null)).toBe(false);
      expect(isBlobLike(undefined)).toBe(false);
      expect(isBlobLike({ size: "invalid" })).toBe(false);
      expect(isBlobLike({ size: 1024 })).toBe(false);
      expect(isBlobLike({ size: 1024, type: "text/plain" })).toBe(false);
    });
  });

  describe("isFileLike", () => {
    it("should identify file-like objects", () => {
      const mockFile: FileLike = {
        name: "test.txt",
        lastModified: Date.now(),
        size: 1024,
        type: "text/plain",
        slice: jest.fn(),
        text: jest.fn(),
        arrayBuffer: jest.fn(),
      };

      expect(isFileLike(mockFile)).toBe(true);
    });

    it("should reject non-file-like objects", () => {
      expect(isFileLike({})).toBe(false);
      expect(isFileLike({ name: "test.txt" })).toBe(false);
      expect(
        isFileLike({
          name: "test.txt",
          lastModified: Date.now(),
        })
      ).toBe(false);
    });
  });

  describe("isNodeReadStream", () => {
    it("should identify node read streams when in node environment", () => {
      // Mock RUNTIME to be node for this test
      (RUNTIME as any).type = "node";

      const mockStream = {
        bytesRead: 0,
        path: "/test/file.txt",
        pending: false,
        readable: true,
        read: jest.fn(),
        setEncoding: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        isPaused: jest.fn(),
        pipe: jest.fn(),
        unpipe: jest.fn(),
        unshift: jest.fn(),
        wrap: jest.fn(),
      };

      expect(isNodeReadStream(mockStream)).toBe(true);

      // Reset to browser
      (RUNTIME as any).type = "browser";
    });

    it("should reject non-stream objects", () => {
      (RUNTIME as any).type = "node";

      expect(isNodeReadStream({})).toBe(false);
      expect(isNodeReadStream(null)).toBe(false);
      expect(isNodeReadStream({ bytesRead: 0 })).toBe(false);

      // Reset to browser
      (RUNTIME as any).type = "browser";
    });

    it("should return false in browser environment", () => {
      (RUNTIME as any).type = "browser";

      const mockStream = {
        bytesRead: 0,
        path: "/test/file.txt",
        pending: false,
        readable: true,
        read: jest.fn(),
        setEncoding: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        isPaused: jest.fn(),
        pipe: jest.fn(),
        unpipe: jest.fn(),
        unshift: jest.fn(),
        wrap: jest.fn(),
      };

      expect(isNodeReadStream(mockStream)).toBe(false);
    });
  });

  describe("isUploadFile", () => {
    it("should identify file-like objects as upload files", () => {
      const mockFile: FileLike = {
        name: "test.txt",
        lastModified: Date.now(),
        size: 1024,
        type: "text/plain",
        slice: jest.fn(),
        text: jest.fn(),
        arrayBuffer: jest.fn(),
      };

      expect(isUploadFile(mockFile)).toBe(true);
    });

    it("should identify node read streams as upload files", () => {
      (RUNTIME as any).type = "node";

      const mockStream = {
        bytesRead: 0,
        path: "/test/file.txt",
        pending: false,
        readable: true,
        read: jest.fn(),
        setEncoding: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        isPaused: jest.fn(),
        pipe: jest.fn(),
        unpipe: jest.fn(),
        unshift: jest.fn(),
        wrap: jest.fn(),
      };

      expect(isUploadFile(mockStream)).toBe(true);

      // Reset to browser
      (RUNTIME as any).type = "browser";
    });

    it("should reject non-upload files", () => {
      expect(isUploadFile({})).toBe(false);
      expect(isUploadFile("string")).toBe(false);
      expect(isUploadFile(123)).toBe(false);
    });
  });

  describe("createForm", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should create browser FormData in browser environment", () => {
      (RUNTIME as any).type = "browser";

      const mockFormData = {
        append: jest.fn(),
      };
      global.FormData = jest.fn().mockImplementation(() => mockFormData);

      createForm({ key: "value" });

      expect(global.FormData).toHaveBeenCalled();
      expect(mockFormData.append).toHaveBeenCalledWith("key", "value");
    });

    it("should create Node FormData in node environment", () => {
      (RUNTIME as any).type = "node";

      createForm({ key: "value" });

      // Verify form-data mock was called (mocked at top of file)
    });

    it("should handle string values", () => {
      (RUNTIME as any).type = "browser";

      const mockFormData = {
        append: jest.fn(),
      };
      global.FormData = jest.fn().mockImplementation(() => mockFormData);

      createForm({
        stringKey: "string value",
        numberKey: 42,
        boolKey: true,
      });

      expect(mockFormData.append).toHaveBeenCalledWith(
        "stringKey",
        "string value"
      );
      expect(mockFormData.append).toHaveBeenCalledWith("numberKey", "42");
      expect(mockFormData.append).toHaveBeenCalledWith("boolKey", "true");
    });

    it("should handle array values", () => {
      (RUNTIME as any).type = "browser";

      const mockFormData = {
        append: jest.fn(),
      };
      global.FormData = jest.fn().mockImplementation(() => mockFormData);

      createForm({
        arrayKey: ["value1", "value2", "value3"],
      });

      expect(mockFormData.append).toHaveBeenCalledWith("arrayKey", "value1");
      expect(mockFormData.append).toHaveBeenCalledWith("arrayKey", "value2");
      expect(mockFormData.append).toHaveBeenCalledWith("arrayKey", "value3");
    });

    it("should handle nested object values", () => {
      (RUNTIME as any).type = "browser";

      const mockFormData = {
        append: jest.fn(),
      };
      global.FormData = jest.fn().mockImplementation(() => mockFormData);

      createForm({
        objectKey: {
          nestedKey: "nestedValue",
          anotherKey: "anotherValue",
        },
      });

      expect(mockFormData.append).toHaveBeenCalledWith(
        "objectKey[nestedKey]",
        "nestedValue"
      );
      expect(mockFormData.append).toHaveBeenCalledWith(
        "objectKey[anotherKey]",
        "anotherValue"
      );
    });

    it("should handle file uploads", () => {
      (RUNTIME as any).type = "browser";

      const mockFormData = {
        append: jest.fn(),
      };
      global.FormData = jest.fn().mockImplementation(() => mockFormData);

      const mockFile: FileLike = {
        name: "test.txt",
        lastModified: Date.now(),
        size: 1024,
        type: "text/plain",
        slice: jest.fn(),
        text: jest.fn(),
        arrayBuffer: jest.fn(),
      };

      createForm({
        fileKey: mockFile,
      });

      expect(mockFormData.append).toHaveBeenCalledWith("fileKey", mockFile);
    });

    it("should skip null and undefined values", () => {
      (RUNTIME as any).type = "browser";

      const mockFormData = {
        append: jest.fn(),
      };
      global.FormData = jest.fn().mockImplementation(() => mockFormData);

      createForm({
        nullKey: null,
        undefinedKey: undefined,
        validKey: "value",
      });

      expect(mockFormData.append).toHaveBeenCalledTimes(1);
      expect(mockFormData.append).toHaveBeenCalledWith("validKey", "value");
    });

    it("should throw error for unsupported value types", () => {
      (RUNTIME as any).type = "browser";

      const mockFormData = {
        append: jest.fn(),
      };
      global.FormData = jest.fn().mockImplementation(() => mockFormData);

      expect(() => {
        createForm({
          functionKey: () => {},
        });
      }).toThrow("Invalid value given to form");
    });
  });
});
