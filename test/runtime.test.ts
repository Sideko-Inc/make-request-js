import { Runtime } from '../src/runtime';

// We need to test runtime detection in different environments
// This requires mocking global variables before importing the module
describe('runtime detection', () => {
  let mockWindow: any;
  let mockProcess: any;
  let originalWindow: any;
  let originalProcess: any;

  beforeAll(() => {
    // Save original globals
    originalWindow = (global as any).window;
    originalProcess = (global as any).process;
  });

  afterAll(() => {
    // Restore original globals
    (global as any).window = originalWindow;
    (global as any).process = originalProcess;
  });

  beforeEach(() => {
    // Clear module cache to force re-evaluation
    jest.resetModules();
    
    // Clean up globals
    delete (global as any).window;
    delete (global as any).process;
  });

  it('should detect browser environment', async () => {
    // Mock browser environment
    mockWindow = {
      document: {}
    };
    (global as any).window = mockWindow;
    delete (global as any).process;

    // Import module after setting up mocks
    const { RUNTIME } = await import('../src/runtime');
    
    expect(RUNTIME.type).toBe('browser');
  });

  it('should detect node environment', async () => {
    // Mock Node.js environment
    mockProcess = {
      version: 'v18.0.0',
      versions: {
        node: '18.0.0'
      }
    };
    (global as any).process = mockProcess;
    delete (global as any).window;

    // Import module after setting up mocks
    const { RUNTIME } = await import('../src/runtime');
    
    expect(RUNTIME.type).toBe('node');
  });

  it('should detect unknown environment', async () => {
    // No global objects
    delete (global as any).window;
    delete (global as any).process;

    // Import module after setting up mocks
    const { RUNTIME } = await import('../src/runtime');
    
    expect(RUNTIME.type).toBe('unknown');
  });

  it('should prioritize browser detection over node when both globals exist', async () => {
    // Mock both environments (browser takes precedence)
    mockWindow = {
      document: {}
    };
    mockProcess = {
      version: 'v18.0.0',
      versions: {
        node: '18.0.0'
      }
    };
    (global as any).window = mockWindow;
    (global as any).process = mockProcess;

    // Import module after setting up mocks
    const { RUNTIME } = await import('../src/runtime');
    
    expect(RUNTIME.type).toBe('browser');
  });

  it('should handle incomplete process object', async () => {
    // Mock incomplete process object
    mockProcess = {
      version: 'v18.0.0'
      // Missing versions.node
    };
    (global as any).process = mockProcess;
    delete (global as any).window;

    // Import module after setting up mocks
    const { RUNTIME } = await import('../src/runtime');
    
    expect(RUNTIME.type).toBe('unknown');
  });

  it('should handle process object without version', async () => {
    // Mock process object without version
    mockProcess = {
      versions: {
        node: '18.0.0'
      }
      // Missing version
    };
    (global as any).process = mockProcess;
    delete (global as any).window;

    // Import module after setting up mocks
    const { RUNTIME } = await import('../src/runtime');
    
    expect(RUNTIME.type).toBe('unknown');
  });

  it('should handle window object without document', async () => {
    // Mock window object without document
    mockWindow = {
      // Missing document
      location: { href: 'https://example.com' }
    };
    (global as any).window = mockWindow;
    delete (global as any).process;

    // Import module after setting up mocks
    const { RUNTIME } = await import('../src/runtime');
    
    expect(RUNTIME.type).toBe('unknown');
  });

  it('should handle falsy process values', async () => {
    // Mock process with falsy version values
    mockProcess = {
      version: '',
      versions: {
        node: null
      }
    };
    (global as any).process = mockProcess;
    delete (global as any).window;

    // Import module after setting up mocks
    const { RUNTIME } = await import('../src/runtime');
    
    expect(RUNTIME.type).toBe('unknown');
  });

  describe('Runtime interface', () => {
    it('should export Runtime type', () => {
      // This test ensures the Runtime type is properly exported
      const testRuntime: Runtime = { type: 'browser' };
      expect(testRuntime.type).toBe('browser');
      
      const nodeRuntime: Runtime = { type: 'node' };
      expect(nodeRuntime.type).toBe('node');
      
      const unknownRuntime: Runtime = { type: 'unknown' };
      expect(unknownRuntime.type).toBe('unknown');
    });
  });
});