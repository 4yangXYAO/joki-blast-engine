// Unit tests for TwitterCookieAdapter — mocks axios
import { TwitterCookieAdapter } from './twitter-cookie';

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

const TWEET_RESPONSE = {
  data: {
    data: { create_tweet: { tweet_results: { result: { rest_id: '1234567890' } } } },
  },
};

function makeAdapter(cookie = 'auth_token=abc; ct0=csrf_tok') {
  return new TwitterCookieAdapter(cookie);
}

describe('TwitterCookieAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockResolvedValue(TWEET_RESPONSE),
    });
  });

  test('connect parses cookies and extracts ct0 csrf token', async () => {
    const adapter = makeAdapter();
    await expect(adapter.connect()).resolves.toBeUndefined();
  });

  test('connect throws when cookie is empty', async () => {
    const adapter = new TwitterCookieAdapter('');
    await expect(adapter.connect()).rejects.toThrow('Twitter cookie not provided');
  });

  test('sendMessage posts tweet and returns success', async () => {
    const mockPost = vi.fn().mockResolvedValue(TWEET_RESPONSE);
    mockedAxios.create.mockReturnValue({ post: mockPost });
    const adapter = makeAdapter();
    const res = await adapter.sendMessage('unused', 'Hello Twitter!');
    expect(res.success).toBe(true);
    const [url, body] = mockPost.mock.calls[0];
    expect(url).toContain('CreateTweet');
    expect(body.variables.tweet_text).toBe('Hello Twitter!');
  });

  test('sendMessage returns failure on HTTP error', async () => {
    mockedAxios.create.mockReturnValue({
      post: vi.fn().mockRejectedValue(new Error('Timeout')),
    });
    const adapter = makeAdapter();
    const res = await adapter.sendMessage('unused', 'fail');
    expect(res.success).toBe(false);
    expect(res.code).toBe('TWITTER_COOKIE_POST_ERROR');
  });

  test('replyToMessage includes reply object with in_reply_to_tweet_id', async () => {
    const mockPost = vi.fn().mockResolvedValue(TWEET_RESPONSE);
    mockedAxios.create.mockReturnValue({ post: mockPost });
    const adapter = makeAdapter();
    const res = await adapter.replyToMessage('tweet_999', 'Great!');
    expect(res.success).toBe(true);
    const body = mockPost.mock.calls[0][1];
    expect(body.variables.reply.in_reply_to_tweet_id).toBe('tweet_999');
  });

  test('replyToMessage returns failure when rate limit exceeded', async () => {
    const adapter = makeAdapter();
    await adapter.connect();
    // Drain rate completely
    (adapter as any).rateRemaining = 0;
    const res = await adapter.replyToMessage('tweet_1', 'rate limited');
    expect(res.success).toBe(false);
    expect(res.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  test('getRateLimitStatus returns expected shape', async () => {
    const adapter = makeAdapter();
    const status = await adapter.getRateLimitStatus();
    expect(status!.limit).toBe(50);
  });
});
