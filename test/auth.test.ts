import { AuthBasic, AuthBearer, AuthKey, OAuth2 } from '../src/auth';
import type { RequestConfig } from '../src/core-client';

// Mock node-fetch
import nodeFetch from 'node-fetch';
jest.mock('node-fetch');
const mockNodeFetch = nodeFetch as jest.MockedFunction<typeof nodeFetch>;

describe('Auth providers', () => {
  describe('AuthBasic', () => {
    it('should apply basic auth', async () => {
      const auth = new AuthBasic('username', 'password');
      const config: RequestConfig = {
        method: 'get',
        path: '/test'
      };

      const result = await auth.applyAuth(config);
      expect(result.headers).toEqual({
        Authorization: 'Basic dXNlcm5hbWU6cGFzc3dvcmQ='
      });
    });

    it('should update username via setValue', async () => {
      const auth = new AuthBasic('old-user', 'password');
      auth.setValue('new-user');
      
      const config: RequestConfig = {
        method: 'get',
        path: '/test'
      };

      const result = await auth.applyAuth(config);
      expect(result.headers).toEqual({
        Authorization: 'Basic bmV3LXVzZXI6cGFzc3dvcmQ='
      });
    });
  });

  describe('AuthBearer', () => {
    it('should apply bearer token', async () => {
      const token = 'test-token-123';
      const auth = new AuthBearer(token);
      const config: RequestConfig = {
        method: 'get',
        path: '/test'
      };

      const result = await auth.applyAuth(config);
      expect(result.headers).toEqual({
        Authorization: `Bearer ${token}`
      });
    });

    it('should update token via setValue', async () => {
      const auth = new AuthBearer('old-token');
      auth.setValue('new-token');
      
      const config: RequestConfig = {
        method: 'get',
        path: '/test'
      };

      const result = await auth.applyAuth(config);
      expect(result.headers).toEqual({
        Authorization: 'Bearer new-token'
      });
    });
  });

  describe('AuthKey', () => {
    it('should apply API key in header', async () => {
      const auth = new AuthKey('api-key', 'header', 'test-key-123');
      const config: RequestConfig = {
        method: 'get',
        path: '/test'
      };

      const result = await auth.applyAuth(config);
      expect(result.headers).toEqual({
        'api-key': 'test-key-123'
      });
    });

    it('should apply API key in query', async () => {
      const auth = new AuthKey('api_key', 'query', 'test-key-123');
      const config: RequestConfig = {
        method: 'get',
        path: '/test',
        query: []
      };

      const result = await auth.applyAuth(config);
      expect(result.query).toContain('api_key=test-key-123');
    });

    it('should append to existing query parameters', async () => {
      const auth = new AuthKey('api_key', 'query', 'test-key-123');
      const config: RequestConfig = {
        method: 'get',
        path: '/test',
        query: ['limit=10']
      };

      const result = await auth.applyAuth(config);
      expect(result.query).toContain('limit=10');
      expect(result.query).toContain('api_key=test-key-123');
    });

    it('should apply API key in cookie', async () => {
      const auth = new AuthKey('session_id', 'cookie', 'abc123');
      const config: RequestConfig = {
        method: 'get',
        path: '/test'
      };

      const result = await auth.applyAuth(config);
      expect(result.headers).toEqual({
        'Cookie': 'session_id=abc123'
      });
    });

    it('should append to existing cookie header', async () => {
      const auth = new AuthKey('session_id', 'cookie', 'abc123');
      const config: RequestConfig = {
        method: 'get',
        path: '/test',
        headers: {
          'Cookie': 'existing=value'
        }
      };

      const result = await auth.applyAuth(config);
      expect(result.headers).toEqual({
        'Cookie': ';session_id=abc123'
      });
    });

    it('should update key via setValue', async () => {
      const auth = new AuthKey('api_key', 'header', 'old-key');
      auth.setValue('new-key');
      
      const config: RequestConfig = {
        method: 'get',
        path: '/test'
      };

      const result = await auth.applyAuth(config);
      expect(result.headers).toEqual({
        'api_key': 'new-key'
      });
    });
  });

  describe('OAuth2', () => {
    beforeEach(() => {
      mockNodeFetch.mockClear();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('OAuth2 Client Credentials Flow', () => {
      it('should handle client credentials grant', async () => {
        const mockTokenResponse = {
          ok: true,
          json: () => Promise.resolve({
            access_token: 'test-access-token',
            token_type: 'Bearer',
            expires_in: 3600
          })
        };
        mockNodeFetch.mockResolvedValue(mockTokenResponse as any);

        const auth = new OAuth2({
          baseUrl: 'https://auth.example.com',
          defaultTokenUrl: '/oauth/token',
          accessTokenPointer: '/access_token',
          expiresInPointer: '/expires_in',
          credentialsLocation: 'request_body',
          bodyContent: 'form',
          requestMutator: new AuthBearer(),
          form: {
            grantType: 'client_credentials',
            clientId: 'test-client',
            clientSecret: 'test-secret'
          }
        });

        const config: RequestConfig = {
          method: 'get',
          path: '/test'
        };

        // Mock the refresh method to simulate OAuth2 flow
        const refreshSpy = jest.spyOn(auth, 'refresh').mockResolvedValue({
          accessToken: 'test-access-token',
          expiresAt: new Date(Date.now() + 3600000)
        });

        await auth.applyAuth(config);

        expect(refreshSpy).toHaveBeenCalled();
        refreshSpy.mockRestore();
      });

      it('should handle token refresh with client credentials', async () => {
        const mockTokenResponse = {
          ok: true,
          json: () => Promise.resolve({
            access_token: 'new-access-token',
            token_type: 'Bearer',
            expires_in: 3600
          })
        };
        mockNodeFetch.mockResolvedValue(mockTokenResponse as any);

        const auth = new OAuth2({
          baseUrl: 'https://auth.example.com',
          defaultTokenUrl: '/oauth/token',
          accessTokenPointer: '/access_token',
          expiresInPointer: '/expires_in',
          credentialsLocation: 'request_body',
          bodyContent: 'form',
          requestMutator: new AuthBearer()
        });

        const clientCredentials = {
          grantType: 'client_credentials' as const,
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret'
        };

        const result = await auth.refresh(clientCredentials);

        expect(mockNodeFetch).toHaveBeenCalledWith(
          'https://auth.example.com/oauth/token',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'content-type': 'application/x-www-form-urlencoded'
            }),
            body: expect.stringContaining('grant_type=client_credentials')
          })
        );
        expect(result.accessToken).toBe('new-access-token');
      });

      it('should handle token refresh with password grant', async () => {
        const mockTokenResponse = {
          ok: true,
          json: () => Promise.resolve({
            access_token: 'password-token',
            token_type: 'Bearer',
            expires_in: 7200
          })
        };
        mockNodeFetch.mockResolvedValue(mockTokenResponse as any);

        const auth = new OAuth2({
          baseUrl: 'https://auth.example.com',
          defaultTokenUrl: '/oauth/token',
          accessTokenPointer: '/access_token',
          expiresInPointer: '/expires_in',
          credentialsLocation: 'request_body',
          bodyContent: 'form',
          requestMutator: new AuthBearer()
        });

        const passwordGrant = {
          grantType: 'password' as const,
          username: 'test-user',
          password: 'test-password',
          clientId: 'test-client',
          clientSecret: 'test-secret'
        };

        const result = await auth.refresh(passwordGrant);

        expect(mockNodeFetch).toHaveBeenCalledWith(
          'https://auth.example.com/oauth/token',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('grant_type=password')
          })
        );
        expect(result.accessToken).toBe('password-token');
      });

      it('should handle token refresh failures', async () => {
        const mockErrorResponse = {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: () => Promise.resolve({
            error: 'invalid_grant',
            error_description: 'Invalid client credentials'
          })
        };
        mockNodeFetch.mockResolvedValue(mockErrorResponse as any);

        const auth = new OAuth2({
          baseUrl: 'https://auth.example.com',
          defaultTokenUrl: '/oauth/token',
          accessTokenPointer: '/access_token',
          expiresInPointer: '/expires_in',
          credentialsLocation: 'request_body',
          bodyContent: 'form',
          requestMutator: new AuthBearer()
        });

        const clientCredentials = {
          grantType: 'client_credentials' as const,
          clientId: 'invalid-client',
          clientSecret: 'invalid-secret'
        };

        await expect(auth.refresh(clientCredentials)).rejects.toThrow();
      });

      it('should handle custom token URLs', async () => {
        const mockTokenResponse = {
          ok: true,
          json: () => Promise.resolve({
            access_token: 'custom-token',
            expires_in: 1800
          })
        };
        mockNodeFetch.mockResolvedValue(mockTokenResponse as any);

        const auth = new OAuth2({
          baseUrl: 'https://custom-auth.com',
          defaultTokenUrl: '/custom/token',
          accessTokenPointer: '/access_token',
          expiresInPointer: '/expires_in',
          credentialsLocation: 'request_body',
          bodyContent: 'form',
          requestMutator: new AuthBearer()
        });

        const clientCredentials = {
          grantType: 'client_credentials' as const,
          clientId: 'custom-client',
          clientSecret: 'custom-secret',
          tokenUrl: '/override/token'
        };

        const result = await auth.refresh(clientCredentials);

        expect(mockNodeFetch).toHaveBeenCalledWith(
          'https://custom-auth.com/override/token',
          expect.any(Object)
        );
        expect(result.accessToken).toBe('custom-token');
      });

      it('should handle custom scopes', async () => {
        const mockTokenResponse = {
          ok: true,
          json: () => Promise.resolve({
            access_token: 'scoped-token',
            expires_in: 3600,
            scope: 'read write'
          })
        };
        mockNodeFetch.mockResolvedValue(mockTokenResponse as any);

        const auth = new OAuth2({
          baseUrl: 'https://auth.example.com',
          defaultTokenUrl: '/oauth/token',
          accessTokenPointer: '/access_token',
          expiresInPointer: '/expires_in',
          credentialsLocation: 'request_body',
          bodyContent: 'form',
          requestMutator: new AuthBearer()
        });

        const clientCredentials = {
          grantType: 'client_credentials' as const,
          clientId: 'scoped-client',
          clientSecret: 'scoped-secret',
          scope: ['read', 'write', 'admin']
        };

        const result = await auth.refresh(clientCredentials);

        expect(mockNodeFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringMatching(/scope=read\+write\+admin/)
          })
        );
        expect(result.accessToken).toBe('scoped-token');
      });

      it('should use basic auth when specified', async () => {
        const mockTokenResponse = {
          ok: true,
          json: () => Promise.resolve({
            access_token: 'basic-auth-token',
            expires_in: 3600
          })
        };
        mockNodeFetch.mockResolvedValue(mockTokenResponse as any);

        const auth = new OAuth2({
          baseUrl: 'https://auth.example.com',
          defaultTokenUrl: '/oauth/token',
          accessTokenPointer: '/access_token',
          expiresInPointer: '/expires_in',
          credentialsLocation: 'basic_authorization_header',
          bodyContent: 'form',
          requestMutator: new AuthBearer()
        });

        const clientCredentials = {
          grantType: 'client_credentials' as const,
          clientId: 'basic-client',
          clientSecret: 'basic-secret'
        };

        const result = await auth.refresh(clientCredentials);

        expect(mockNodeFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': expect.stringMatching(/^Basic /)
            })
          })
        );
        expect(result.accessToken).toBe('basic-auth-token');
      });

      it('should handle JSON body content', async () => {
        const mockTokenResponse = {
          ok: true,
          json: () => Promise.resolve({
            access_token: 'json-token',
            expires_in: 3600
          })
        };
        mockNodeFetch.mockResolvedValue(mockTokenResponse as any);

        const auth = new OAuth2({
          baseUrl: 'https://auth.example.com',
          defaultTokenUrl: '/oauth/token',
          accessTokenPointer: '/access_token',
          expiresInPointer: '/expires_in',
          credentialsLocation: 'request_body',
          bodyContent: 'json',
          requestMutator: new AuthBearer()
        });

        const clientCredentials = {
          grantType: 'client_credentials' as const,
          clientId: 'json-client',
          clientSecret: 'json-secret'
        };

        const result = await auth.refresh(clientCredentials);

        expect(mockNodeFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'content-type': 'application/json'
            }),
            body: expect.stringContaining('"grant_type":"client_credentials"')
          })
        );
        expect(result.accessToken).toBe('json-token');
      });
    });

    describe('setValue method', () => {
      it('should throw error when called', () => {
        const auth = new OAuth2({
          baseUrl: 'https://auth.example.com',
          defaultTokenUrl: '/oauth/token',
          accessTokenPointer: '/access_token',
          expiresInPointer: '/expires_in',
          credentialsLocation: 'request_body',
          bodyContent: 'form',
          requestMutator: new AuthBearer()
        });

        expect(() => {
          auth.setValue('manual-token');
        }).toThrow('an OAuth2 auth provider cannot be used as a requestMutator');
      });
    });

    describe('token caching and expiry', () => {
      it('should reuse valid tokens', async () => {
        const mockTokenResponse = {
          ok: true,
          json: () => Promise.resolve({
            access_token: 'cached-token',
            expires_in: 3600
          })
        };
        mockNodeFetch.mockResolvedValue(mockTokenResponse as any);

        const auth = new OAuth2({
          baseUrl: 'https://auth.example.com',
          defaultTokenUrl: '/oauth/token',
          accessTokenPointer: '/access_token',
          expiresInPointer: '/expires_in',
          credentialsLocation: 'request_body',
          bodyContent: 'form',
          requestMutator: new AuthBearer()
        });

        // Set a valid token with future expiry
        auth.accessToken = 'valid-token';
        auth.expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

        const config: RequestConfig = {
          method: 'get',
          path: '/test'
        };

        const result = await auth.applyAuth(config);

        expect(result.headers).toEqual({
          'Authorization': 'Bearer valid-token'
        });
        expect(mockNodeFetch).not.toHaveBeenCalled();
      });

      it('should refresh expired tokens', async () => {
        const mockTokenResponse = {
          ok: true,
          json: () => Promise.resolve({
            access_token: 'refreshed-token',
            expires_in: 3600
          })
        };
        mockNodeFetch.mockResolvedValue(mockTokenResponse as any);

        const auth = new OAuth2({
          baseUrl: 'https://auth.example.com',
          defaultTokenUrl: '/oauth/token',
          accessTokenPointer: '/access_token',
          expiresInPointer: '/expires_in',
          credentialsLocation: 'request_body',
          bodyContent: 'form',
          requestMutator: new AuthBearer(),
          form: {
            grantType: 'client_credentials',
            clientId: 'test-client',
            clientSecret: 'test-secret'
          }
        });

        // Don't set an access token so refresh gets triggered

        // Mock the refresh method
        const refreshSpy = jest.spyOn(auth, 'refresh').mockResolvedValue({
          accessToken: 'refreshed-token',
          expiresAt: new Date(Date.now() + 3600000)
        });

        const config: RequestConfig = {
          method: 'get',
          path: '/test'
        };

        await auth.applyAuth(config);

        expect(refreshSpy).toHaveBeenCalled();
        refreshSpy.mockRestore();
      });
    });

  });

});