import { InstagramAdapter } from "./instagram";
import axios from "axios";

// Mock axios
jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Helper to set required env vars for config loader (mirrors Threads tests)
function setEnv() {
  process.env.DATABASE_PATH = ":memory:";
  process.env.API_PORT = "3000";
  process.env.API_HOST = "localhost";
  process.env.DASHBOARD_PORT = "4000";
  process.env.JWT_SECRET = "test-secret";
  process.env.LOG_LEVEL = "debug";
  process.env.WHATSAPP_CLOUD_API_TOKEN = "xw";
  process.env.TELEGRAM_BOT_TOKEN = "tok";
  process.env.TWITTER_BEARER_TOKEN = "tb";
  process.env.TWITTER_API_KEY = "tk";
  process.env.TWITTER_API_SECRET = "ts";
  // Instagram-specific token (used by tests)
  process.env.INSTAGRAM_ACCESS_TOKEN = "insta-test-token";
  // Additional required tokens (per plan) to satisfy config loader
  process.env.THREADS_ACCESS_TOKEN = "threads-token";
}

describe("InstagramAdapter (Graph API primary path)", () => {
  beforeAll(() => setEnv());
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test("connect requires token and ig id and then postMessage succeeds when Graph API responds", async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = "test_token";
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = "123456789";
    const adapter = new InstagramAdapter();
    // Mock axios responses for create and publish
    mockedAxios.post.mockImplementationOnce(async () => ({ data: { id: "container_1" } }));
    mockedAxios.post.mockImplementationOnce(async () => ({ data: { id: "publish_1" } }));

    await adapter.connect();
    const res = await adapter.postMessage("to", "hello world");
    expect(res.success).toBe(true);
  });

  test("getMessageStatus returns status for a message", async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = "test_token";
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = "123456789";
    const adapter = new InstagramAdapter();
    await adapter.connect();
    mockedAxios.get.mockImplementationOnce(async () => ({ data: { status: "Published" } }));
    const status = await adapter.getMessageStatus("mid_1");
    expect(status).toBeTruthy();
    expect(status?.status).toBe("Published");
  });

  test("listAccounts returns data array when token present", async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = "test_token";
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = "123456789";
    const adapter = new InstagramAdapter();
    await adapter.connect();
    mockedAxios.get.mockImplementationOnce(async () => ({ data: { data: [{ id: "acc1" }] } }));
    const accounts = await adapter.listAccounts();
    expect(Array.isArray(accounts)).toBe(true);
    expect(accounts.length).toBeGreaterThanOrEqual(0);
  });
});
