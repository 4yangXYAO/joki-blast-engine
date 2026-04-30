// Unit tests for InstagramCookieAdapter — mocks axios
import { InstagramCookieAdapter } from './instagram-cookie';

vi.mock('axios', () => {
  const instance = {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  };
  return { default: { create: vi.fn(() => instance), ...instance }, __esModule: true };
});

import axios from 'axios';
const mockedAxios = axios as any;

function makeAdapter(cookie = 'sessionid=abc; csrftoken=tok') {
  return new InstagramCookieAdapter(cookie);
}

describe('InstagramCookieAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for axios.create() to return a post/get mock
    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockResolvedValue({ status: 200, data: { status: 'ok' } }),
      get: vi.fn(),
    });
  });

  test('connect parses cookies', async () => {
    const adapter = makeAdapter();
    await expect(adapter.connect()).resolves.toBeUndefined();
  });

  test('connect throws when cookie is empty', async () => {
    const adapter = new InstagramCookieAdapter('');
    await expect(adapter.connect()).rejects.toThrow('Instagram cookie not provided');
  });

  test('sendMessage calls internal configure endpoint and returns success', async () => {
    const mockPost = vi.fn().mockResolvedValue({ status: 200, data: { status: 'ok' } });
    mockedAxios.create.mockReturnValue({ post: mockPost });
    const adapter = makeAdapter();
    const res = await adapter.sendMessage('unused', 'Hello IG!');
    expect(res.success).toBe(true);
    expect(mockPost).toHaveBeenCalledWith('/api/v1/media/configure/', expect.any(String));
  });

  test('sendMessage returns failure on HTTP error', async () => {
    const mockPost = vi.fn().mockRejectedValue(new Error('Network Error'));
    mockedAxios.create.mockReturnValue({ post: mockPost });
    const adapter = makeAdapter();
    const res = await adapter.sendMessage('unused', 'fail');
    expect(res.success).toBe(false);
    expect(res.code).toBe('IG_COOKIE_POST_ERROR');
  });

  test('replyToMessage calls comment endpoint', async () => {
    const mockPost = vi.fn().mockResolvedValue({ status: 200, data: { status: 'ok' } });
    mockedAxios.create.mockReturnValue({ post: mockPost });
    const adapter = makeAdapter();
    const res = await adapter.replyToMessage('media_123', 'Nice post!');
    expect(res.success).toBe(true);
    expect(mockPost).toHaveBeenCalledWith('/api/v1/media/media_123/comment/', expect.any(String));
  });

  test('getRateLimitStatus returns expected shape', async () => {
    const adapter = makeAdapter();
    const status = await adapter.getRateLimitStatus();
    expect(status).not.toBeNull();
    expect(status!.limit).toBe(30);
    expect(typeof status!.remaining).toBe('number');
  });

  test('disconnect clears cookie', async () => {
    const adapter = makeAdapter();
    await adapter.connect();
    await adapter.disconnect();
    // After disconnect, sendMessage should reconnect (no throw, just handled)
    const mockPost = vi.fn().mockResolvedValue({ status: 200, data: { status: 'ok' } });
    mockedAxios.create.mockReturnValue({ post: mockPost });
    const res = await adapter.sendMessage('unused', 're-connect test');
    expect(res.success).toBe(true);
  });
});
