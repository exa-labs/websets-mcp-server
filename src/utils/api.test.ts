import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { ExaApiClient, handleApiError } from './api.js';
import { API_CONFIG } from '../tools/config.js';

vi.mock('axios');

describe('ExaApiClient', () => {
  let client: ExaApiClient;
  const apiKey = 'test-api-key';
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (axios.create as any).mockReturnValue(mockAxiosInstance);
    client = new ExaApiClient(apiKey);
  });

  it('should create axios instance with correct config', () => {
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: API_CONFIG.BASE_URL,
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': apiKey
      },
      timeout: 30000
    });
  });

  it('should make GET request correctly', async () => {
    const mockData = { id: '123', name: 'Test' };
    mockAxiosInstance.get.mockResolvedValue({ data: mockData });

    const result = await client.get('/test', { param: 'value' });

    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', { params: { param: 'value' } });
    expect(result).toEqual(mockData);
  });

  it('should make POST request correctly', async () => {
    const mockData = { success: true };
    mockAxiosInstance.post.mockResolvedValue({ data: mockData });

    const payload = { name: 'New Item' };
    const result = await client.post('/test', payload);

    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', payload);
    expect(result).toEqual(mockData);
  });
});

describe('handleApiError', () => {
  const mockLogger = {
    log: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should handle axios error with response', () => {
    const axiosError = new Error('API Error') as any;
    axiosError.isAxiosError = true;
    axiosError.response = {
      status: 400,
      data: {
        message: 'Bad Request',
        details: 'Invalid parameter'
      }
    };
    // Mock axios.isAxiosError to return true for this object
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const result = handleApiError(axiosError, mockLogger, 'testing error');

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error testing error (400): Bad Request');
    expect(result.content[0].text).toContain('Details: Invalid parameter');
  });

  it('should handle generic error', () => {
    const error = new Error('Something went wrong');
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

    const result = handleApiError(error, mockLogger, 'testing generic');

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error testing generic: Something went wrong');
  });

  it('should use help text generator for specific status codes', () => {
    const axiosError = new Error('API Error') as any;
    axiosError.isAxiosError = true;
    axiosError.response = { status: 400, data: { message: 'Bad Request' } };
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const generator = (status: number) => status === 400 ? '\nHelpful tip' : '';
    const result = handleApiError(axiosError, mockLogger, 'testing help', generator);

    expect(result.content[0].text).toContain('Helpful tip');
  });
});

