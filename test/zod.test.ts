import { z } from "zod";
import { zodTransform, zodUploadFile, zodRequiredAny } from "../src/zod";
import type { FileLike } from "../src/form-data";

describe("zod utilities", () => {
  describe("zodTransform", () => {
    it("should transform object keys according to transformer map", () => {
      const input = {
        firstName: "John",
        lastName: "Doe",
        age: 30,
      };

      const transformer = {
        firstName: "first_name",
        lastName: "last_name",
        age: "user_age",
      };

      const result = zodTransform(input, transformer);

      expect(result).toEqual({
        first_name: "John",
        last_name: "Doe",
        user_age: 30,
      });
    });

    it("should retain original keys when no transform is specified", () => {
      const input = {
        id: 123,
        name: "Test",
        status: "active",
      };

      const transformer = {
        name: "display_name",
      };

      const result = zodTransform(input, transformer);

      expect(result).toEqual({
        id: 123,
        display_name: "Test",
        status: "active",
      });
    });

    it("should skip keys when transform value is null", () => {
      const input = {
        publicField: "visible",
        privateField: "hidden",
        normalField: "normal",
      };

      const transformer = {
        publicField: "public",
        privateField: null,
        normalField: "standard",
      };

      const result = zodTransform(input, transformer);

      expect(result).toEqual({
        public: "visible",
        standard: "normal",
      });
      expect(result["privateField"]).toBeUndefined();
    });

    it("should handle empty objects", () => {
      const input = {};
      const transformer = {};

      const result = zodTransform(input, transformer);

      expect(result).toEqual({});
    });

    it("should handle objects with various value types", () => {
      const input = {
        stringVal: "text",
        numberVal: 42,
        boolVal: true,
        arrayVal: [1, 2, 3],
        objectVal: { nested: "value" },
        nullVal: null,
        undefinedVal: undefined,
      };

      const transformer = {
        stringVal: "str",
        numberVal: "num",
        boolVal: "bool",
        arrayVal: "arr",
        objectVal: "obj",
        nullVal: "null_field",
        undefinedVal: "undef_field",
      };

      const result = zodTransform(input, transformer);

      expect(result).toEqual({
        str: "text",
        num: 42,
        bool: true,
        arr: [1, 2, 3],
        obj: { nested: "value" },
        null_field: null,
        undef_field: undefined,
      });
    });

    it("should preserve key order for transformed keys", () => {
      const input = {
        third: 3,
        first: 1,
        second: 2,
      };

      const transformer = {
        third: "c",
        first: "a",
        second: "b",
      };

      const result = zodTransform(input, transformer);
      const keys = Object.keys(result);

      expect(keys).toEqual(["c", "a", "b"]);
    });
  });

  describe("zodUploadFile", () => {
    it("should validate file-like objects", () => {
      const mockFile: FileLike = {
        name: "test.txt",
        lastModified: Date.now(),
        size: 1024,
        type: "text/plain",
        slice: jest.fn(),
        text: jest.fn(),
        arrayBuffer: jest.fn(),
      };

      const result = zodUploadFile.safeParse(mockFile);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(mockFile);
      }
    });

    it("should reject non-upload-file objects", () => {
      const invalidFile = {
        name: "test.txt",
        // Missing required file properties
      };

      const result = zodUploadFile.safeParse(invalidFile);
      expect(result.success).toBe(false);
    });

    it("should reject primitive values", () => {
      expect(zodUploadFile.safeParse("string")).toEqual({
        success: false,
        error: expect.any(z.ZodError),
      });

      expect(zodUploadFile.safeParse(123)).toEqual({
        success: false,
        error: expect.any(z.ZodError),
      });

      expect(zodUploadFile.safeParse(true)).toEqual({
        success: false,
        error: expect.any(z.ZodError),
      });
    });

    it("should reject null and undefined", () => {
      expect(zodUploadFile.safeParse(null)).toEqual({
        success: false,
        error: expect.any(z.ZodError),
      });

      expect(zodUploadFile.safeParse(undefined)).toEqual({
        success: false,
        error: expect.any(z.ZodError),
      });
    });
  });

  describe("zodRequiredAny", () => {
    it("should accept any defined value", () => {
      const testValues = [
        "string",
        123,
        true,
        false,
        [],
        {},
        null,
        0,
        "",
        { key: "value" },
        [1, 2, 3],
      ];

      testValues.forEach((value) => {
        const result = zodRequiredAny.safeParse(value);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(value);
        }
      });
    });

    it("should reject undefined values", () => {
      const result = zodRequiredAny.safeParse(undefined);
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(z.ZodError);
    });

    it("should accept null as a defined value", () => {
      const result = zodRequiredAny.safeParse(null);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(null);
      }
    });

    it("should accept zero and empty string as defined values", () => {
      expect(zodRequiredAny.safeParse(0)).toEqual({
        success: true,
        data: 0,
      });

      expect(zodRequiredAny.safeParse("")).toEqual({
        success: true,
        data: "",
      });

      expect(zodRequiredAny.safeParse(false)).toEqual({
        success: true,
        data: false,
      });
    });

    it("should work in schema composition", () => {
      const schema = z.object({
        requiredField: zodRequiredAny,
        optionalField: z.string().optional(),
      });

      expect(
        schema.safeParse({
          requiredField: "anything",
          optionalField: "test",
        }).success
      ).toBe(true);

      expect(
        schema.safeParse({
          requiredField: null,
          optionalField: undefined,
        }).success
      ).toBe(true);

      expect(
        schema.safeParse({
          requiredField: undefined,
          optionalField: "test",
        }).success
      ).toBe(false);

      expect(
        schema.safeParse({
          optionalField: "test",
        }).success
      ).toBe(false);
    });
  });
});
