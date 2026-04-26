// Unit tests for ThreadsCookieAdapter — mocks axios
import { ThreadsCookieAdapter } from './threads-cookie';

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

function makeAdapter(cookie = 'sessionid=abc; csrftoken=ctoken') {
  return new ThreadsCookieAdapter(cookie);
}

describe('ThreadsCookieAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockResolvedValue({ status: 200, data: { status: 'ok' } }),
    });
  });

  test('connect parses cookies', async () => {
    const adapter = makeAdapter();
    await expect(adapter.connect()).resolves.toBeUndefined();
  });

  test('connect throws when cookie is empty', async () => {
    const adapter = new ThreadsCookieAdapter('');
    await expect(adapter.connect()).rejects.toThrow('Threads cookie not provided');
  });

  test('sendMessage calls configure_text_post_app_feed endpoint', async () => {
    const mockPost = vi.fn().mockResolvedValue({ status: 200, data: { status: 'ok' } });
    mockedAxios.create.mockReturnValue({ post: mockPost });
    const adapter = makeAdapter();
    const res = await adapter.sendMessage('unused', 'Hello Threads!');
    expect(res.success).toBe(true);
    expect(mockPost).toHaveBeenCalledWith(
      '/api/v1/media/configure_text_post_app_feed/',
      expect.any(String),
    );
  });

  test('sendMessage returns failure on HTTP error', async () => {
    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockRejectedValue(new Error('Network Error')),
    });
    const adapter = makeAdapter();
    const res = await adapter.sendMessage('unused', 'fail');
    expect(res.success).toBe(false);
    expect(res.code).toBe('THREADS_COOKIE_POST_ERROR');
  });

  test('replyToMessage includes replied_to_id in text_post_app_info', async () => {
    const mockPost = vi.fn().mockResolvedValue({ status: 200, data: { status: 'ok' } });
    mockedAxios.create.mockReturnValue({ post: mockPost });
    const adapter = makeAdapter();
    const res = await adapter.replyToMessage('post_456', 'Replying!');
    expect(res.success).toBe(true);
    const body: string = mockPost.mock.calls[0][1];
    const params = new URLSearchParams(body);
    const appInfo = JSON.parse(params.get('text_post_app_info') ?? '{}');
    expect(appInfo.replied_to_id).toBe('post_456');
  });

  test('replyToMessage returns failure on HTTP error', async () => {
    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockRejectedValue(new Error('Timeout')),
    });
    const adapter = makeAdapter();
    const res = await adapter.replyToMessage('post_789', 'fail');
    expect(res.success).toBe(false);
    expect(res.code).toBe('THREADS_COOKIE_REPLY_ERROR');
  });

  test('getRateLimitStatus returns expected shape', async () => {
    const adapter = makeAdapter();
    const status = await adapter.getRateLimitStatus();
    expect(status!.limit).toBe(30);
  });
});
