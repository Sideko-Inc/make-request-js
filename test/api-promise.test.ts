import { ApiPromise } from '../src/api-promise';
import { z } from 'zod';

describe('ApiPromise', () => {
  const mockResponse = {
    ok: true,
    status: 200,
    json: jest.fn(),
    text: jest.fn(),
    blob: jest.fn(),
    arrayBuffer: jest.fn(),
    headers: {
      get: jest.fn()
    }
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('json parsing', () => {
    it('should parse JSON response', async () => {
      const data = { id: 1, name: 'Test' };
      mockResponse.json.mockResolvedValue(data);
      mockResponse.headers.get.mockReturnValue('application/json');

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockResponse),
        responseRaw: false,
        responseStream: false
      });

      const result = await promise;
      expect(result).toEqual(data);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should validate with schema', async () => {
      const schema = z.object({
        id: z.number(),
        name: z.string()
      });
      const data = { id: 1, name: 'Test' };
      mockResponse.json.mockResolvedValue(data);
      mockResponse.headers.get.mockReturnValue('application/json');

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockResponse),
        responseRaw: false,
        responseStream: false,
        responseSchema: schema
      });

      const result = await promise;
      expect(result).toEqual(data);
    });

    it('should throw on invalid schema', async () => {
      const schema = z.object({
        id: z.number(),
        name: z.string()
      });
      const invalidData = { id: 'invalid', name: 123 };
      mockResponse.json.mockResolvedValue(invalidData);
      mockResponse.headers.get.mockReturnValue('application/json');

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockResponse),
        responseRaw: false,
        responseStream: false,
        responseSchema: schema
      });

      await expect(promise).rejects.toThrow();
    });
  });

  describe('text parsing', () => {
    it('should parse text response', async () => {
      const text = 'Hello, World!';
      mockResponse.text.mockResolvedValue(text);
      mockResponse.headers.get.mockReturnValue('text/plain');

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockResponse),
        responseRaw: false,
        responseStream: false
      });

      const result = await promise;
      expect(result).toBe(text);
      expect(mockResponse.text).toHaveBeenCalled();
    });
  });

  describe('raw response', () => {
    it('should return raw response when responseRaw is true', async () => {
      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockResponse),
        responseRaw: true,
        responseStream: false
      });

      const result = await promise;
      expect(result).toBe(mockResponse);
    });
  });

  describe('blob parsing', () => {
    it('should parse blob response', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      mockResponse.blob.mockResolvedValue(blob);
      mockResponse.headers = {
        get: jest.fn().mockReturnValue('application/octet-stream')
      };

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockResponse),
        responseRaw: false,
        responseStream: false
      });

      const result = await promise;
      expect(result).toBeInstanceOf(Object); // BinaryResponse
      expect(mockResponse.blob).toHaveBeenCalled();
    });
  });

  describe('arrayBuffer parsing', () => {
    it('should parse arrayBuffer response', async () => {
      const buffer = new ArrayBuffer(8);
      mockResponse.blob.mockResolvedValue(new Blob([buffer]));
      mockResponse.headers = {
        get: jest.fn().mockReturnValue('application/octet-stream')
      };

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockResponse),
        responseRaw: false,
        responseStream: false
      });

      const result = await promise;
      expect(result).toBeInstanceOf(Object); // BinaryResponse
      expect(mockResponse.blob).toHaveBeenCalled();
    });
  });

  describe('asResponse', () => {
    it('should return the raw response', async () => {
      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockResponse),
        responseRaw: false,
        responseStream: false
      });

      const result = await promise.asResponse();
      expect(result).toBe(mockResponse);
    });
  });

  describe('response type detection', () => {
    it('should detect JSON content type', async () => {
      mockResponse.headers.get.mockReturnValue('application/json; charset=utf-8');
      mockResponse.json.mockResolvedValue({ data: 'test' });

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockResponse),
        responseRaw: false,
        responseStream: false
      });

      const result = await promise;
      expect(result).toEqual({ data: 'test' });
    });

    it('should detect text content type', async () => {
      mockResponse.headers.get.mockReturnValue('text/html');
      mockResponse.text.mockResolvedValue('<html>test</html>');

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockResponse),
        responseRaw: false,
        responseStream: false
      });

      const result = await promise;
      expect(result).toBe('<html>test</html>');
    });

    it('should handle missing content type header', async () => {
      mockResponse.headers.get.mockReturnValue(null);
      mockResponse.blob.mockResolvedValue(new Blob(['binary data']));

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockResponse),
        responseRaw: false,
        responseStream: false
      });

      const result = await promise;
      expect(result).toBeInstanceOf(Object); // BinaryResponse
    });
  });

  describe('error handling', () => {
    it('should handle JSON parse errors', async () => {
      mockResponse.headers.get.mockReturnValue('application/json');
      mockResponse.json.mockRejectedValue(new Error('Invalid JSON'));

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockResponse),
        responseRaw: false,
        responseStream: false
      });

      await expect(promise).rejects.toThrow('Invalid JSON');
    });

    it('should handle response promise rejection', async () => {
      const promise = new ApiPromise({
        responsePromise: Promise.reject(new Error('Network error')),
        responseRaw: false,
        responseStream: false
      });

      await expect(promise).rejects.toThrow('Network error');
    });
  });

  describe('async iterator methods', () => {
    it('should implement then method', async () => {
      mockResponse.headers.get.mockReturnValue('application/json');
      mockResponse.json.mockResolvedValue({ success: true });

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockResponse),
        responseRaw: false,
        responseStream: false
      });

      const result = await promise.then(data => ({ wrapped: data }));
      expect(result).toEqual({ wrapped: { success: true } });
    });

    it('should implement catch method', async () => {
      const promise = new ApiPromise({
        responsePromise: Promise.reject(new Error('Test error')),
        responseRaw: false,
        responseStream: false
      });

      const result = await promise.catch(err => ({ error: err.message }));
      expect(result).toEqual({ error: 'Test error' });
    });

    it('should implement finally method', async () => {
      mockResponse.headers.get.mockReturnValue('application/json');
      mockResponse.json.mockResolvedValue({ data: 'test' });

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockResponse),
        responseRaw: false,
        responseStream: false
      });

      const finallySpy = jest.fn();
      await promise.finally(finallySpy);
      
      expect(finallySpy).toHaveBeenCalled();
    });

    it('should handle stream responses in then method', async () => {
      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockResponse),
        responseRaw: false,
        responseStream: true
      });

      const result = await promise.then();
      expect(result).toBeDefined();
    });

    it('should provide async iterator interface', () => {
      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockResponse),
        responseRaw: false,
        responseStream: false
      });

      const iterator = promise[Symbol.asyncIterator]();
      expect(iterator).toBeDefined();
      expect(typeof iterator.next).toBe('function');
    });

    it('should handle next method for non-streaming response', async () => {
      mockResponse.headers.get.mockReturnValue('application/json');
      mockResponse.json.mockResolvedValue({ data: 'test' });

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockResponse),
        responseRaw: false,
        responseStream: false
      });

      const result = await promise.next();
      expect(result.done).toBe(true);
      expect(result.value).toEqual({ data: 'test' });
    });
  });

  describe('streaming functionality', () => {
    let mockStreamResponse: any;

    beforeEach(() => {
      const mockStreamResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('text/event-stream')
        },
        body: {
          pipe: jest.fn(),
          getReader: jest.fn()
        }
      };
    });

    it('should handle Node.js stream responses', async () => {
      // Mock Node.js readable stream
      const mockNodeStream = {
        pipe: jest.fn(),
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('data: {"test": "value1"}\n\n');
          yield Buffer.from('data: {"test": "value2"}\n\n');
        }
      };

      const mockStreamResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/x-ndjson')
        },
        body: mockNodeStream
      };

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockStreamResponse as any),
        responseRaw: false,
        responseStream: true
      });

      const results = [];
      for await (const chunk of promise.asEventStream()) {
        results.push(chunk);
      }

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ data: { test: 'value1' } });
      expect(results[1]).toEqual({ data: { test: 'value2' } });
    });

    it('should handle Web ReadableStream responses', async () => {
      const textEncoder = new TextEncoder();
      const chunks = [
        'data: {"test": "value1"}\n\n',
        'data: {"test": "value2"}\n\n'
      ];
      let chunkIndex = 0;

      const mockReader = {
        read: jest.fn().mockImplementation(() => {
          if (chunkIndex < chunks.length) {
            return Promise.resolve({
              done: false,
              value: textEncoder.encode(chunks[chunkIndex++])
            });
          }
          return Promise.resolve({ done: true });
        }),
        releaseLock: jest.fn()
      };

      const mockStreamResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/x-ndjson')
        },
        body: {
          getReader: jest.fn().mockReturnValue(mockReader)
        }
      };

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockStreamResponse as any),
        responseRaw: false,
        responseStream: true
      });

      const results = [];
      for await (const chunk of promise.asEventStream()) {
        results.push(chunk);
      }

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ data: { test: 'value1' } });
      expect(results[1]).toEqual({ data: { test: 'value2' } });
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should handle streaming responses with schema validation', async () => {
      const schema = z.object({
        data: z.object({
          test: z.string()
        })
      });

      const mockNodeStream = {
        pipe: jest.fn(),
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('data: {"test": "valid"}\n\n');
        }
      };

      const mockStreamResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/x-ndjson')
        },
        body: mockNodeStream
      };

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockStreamResponse as any),
        responseRaw: false,
        responseStream: true,
        responseSchema: schema
      });

      const results = [];
      for await (const chunk of promise.asEventStream()) {
        results.push(chunk);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ data: { test: 'valid' } });
    });

    it('should throw error for streaming without body', async () => {
      const mockStreamResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/x-ndjson')
        },
        body: undefined
      };

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockStreamResponse as any),
        responseRaw: false,
        responseStream: true
      });

      await expect(promise.asEventStream().next()).rejects.toThrow('Response body is undefined');
    });

    it('should throw error for non-streaming response', async () => {
      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockResponse),
        responseRaw: false,
        responseStream: false
      });

      await expect(promise.asEventStream().next()).rejects.toThrow('Response is not an event stream');
    });

    it('should handle next method for streaming response', async () => {
      const mockNodeStream = {
        pipe: jest.fn(),
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('data: {"test": "streaming"}\n\n');
        }
      };

      const mockStreamResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/x-ndjson')
        },
        body: mockNodeStream
      };

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockStreamResponse as any),
        responseRaw: false,
        responseStream: true
      });

      const result = await promise.next();
      expect(result.done).toBe(false);
      expect(result.value).toEqual({ data: { test: 'streaming' } });
    });

    it('should handle SSE messages with event types', async () => {
      const mockNodeStream = {
        pipe: jest.fn(),
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('event: custom\ndata: {"type": "custom"}\n\n');
          yield Buffer.from('data: {"type": "default"}\n\n');
        }
      };

      const mockStreamResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/x-ndjson')
        },
        body: mockNodeStream
      };

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockStreamResponse as any),
        responseRaw: false,
        responseStream: true
      });

      const results = [];
      for await (const chunk of promise.asEventStream()) {
        results.push(chunk);
      }

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ data: { type: 'custom' } });
      expect(results[1]).toEqual({ data: { type: 'default' } });
    });

    it('should handle SSE messages with IDs and retry', async () => {
      const mockNodeStream = {
        pipe: jest.fn(),
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('id: 123\ndata: {"id": "123"}\nretry: 1000\n\n');
        }
      };

      const mockStreamResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/x-ndjson')
        },
        body: mockNodeStream
      };

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockStreamResponse as any),
        responseRaw: false,
        responseStream: true
      });

      const results = [];
      for await (const chunk of promise.asEventStream()) {
        results.push(chunk);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ data: { id: '123' } });
    });

    it('should handle multi-line SSE data', async () => {
      const mockNodeStream = {
        pipe: jest.fn(),
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('data: "line1\\nline2\\nline3"\n\n');
        }
      };

      const mockStreamResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/x-ndjson')
        },
        body: mockNodeStream
      };

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockStreamResponse as any),
        responseRaw: false,
        responseStream: true
      });

      const results = [];
      for await (const chunk of promise.asEventStream()) {
        results.push(chunk);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ data: 'line1\nline2\nline3' });
    });

    it('should handle incomplete SSE messages in buffer', async () => {
      const mockNodeStream = {
        pipe: jest.fn(),
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('data: {"incomplete": ');
          yield Buffer.from('"value"}\n\n');
        }
      };

      const mockStreamResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/x-ndjson')
        },
        body: mockNodeStream
      };

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockStreamResponse as any),
        responseRaw: false,
        responseStream: true
      });

      const results = [];
      for await (const chunk of promise.asEventStream()) {
        results.push(chunk);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ data: { incomplete: 'value' } });
    });
  });

  describe('EventSourceParser', () => {
    it('should handle empty messages', async () => {
      const mockNodeStream = {
        pipe: jest.fn(),
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('\n\n');
          yield Buffer.from('data: {"after": "empty"}\n\n');
        }
      };

      const mockStreamResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('text/event-stream')
        },
        body: mockNodeStream
      };

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockStreamResponse as any),
        responseRaw: false,
        responseStream: true
      });

      const results = [];
      for await (const chunk of promise.asEventStream()) {
        results.push(chunk);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ data: { after: 'empty' } });
    });

    it('should handle SSE field values with colons', async () => {
      const mockNodeStream = {
        pipe: jest.fn(),
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('data: {"url": "https://example.com:8080"}\n\n');
        }
      };

      const mockStreamResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('text/event-stream')
        },
        body: mockNodeStream
      };

      const promise = new ApiPromise({
        responsePromise: Promise.resolve(mockStreamResponse as any),
        responseRaw: false,
        responseStream: true
      });

      const results = [];
      for await (const chunk of promise.asEventStream()) {
        results.push(chunk);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ data: { url: 'https://example.com:8080' } });
    });
  });
});