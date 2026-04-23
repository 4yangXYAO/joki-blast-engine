// Lightweight unit tests for WhatsAppAdapter using mocks
import WhatsAppAdapter from "./whatsapp";

describe("WhatsAppAdapter", () => {
  beforeAll(() => {
    // Provide required config via environment variable for loader
    process.env.DATABASE_PATH = "/tmp/db.sqlite";
    process.env.API_PORT = "3000";
    process.env.API_HOST = "localhost";
    process.env.DASHBOARD_PORT = "4000";
    process.env.JWT_SECRET = "secret";
    process.env.LOG_LEVEL = "info";
    process.env.WHATSAPP_CLOUD_API_TOKEN = "test-token";
  });

  test("initializes and reports rate limit status", async () => {
    const adapter = new WhatsAppAdapter({ mode: "cloud-api" });
    await adapter.connect();
    const status = await adapter.getRateLimitStatus();
    expect(status).toBeDefined();
    expect(typeof status?.limit).toBe("number");
    await adapter.disconnect();
  });

  test("sends a message successfully via cloud path (mocked)", async () => {
    const adapter = new WhatsAppAdapter({ mode: "cloud-api" });
    await adapter.connect();
    const res = await adapter.sendMessage("+1234567890", "Hello world");
    expect(res.success).toBe(true);
    await adapter.disconnect();
  });

  test("returns rate limit error when exhausted", async () => {
    const adapter = new WhatsAppAdapter({ mode: "cloud-api" });
    // Manually exhaust rate
    // @ts-ignore
    (adapter as any).rateRemaining = 0;
    await adapter.connect();
    const res = await adapter.sendMessage("+15551234567", "Test");
    expect(res.success).toBe(false);
    expect(res.code).toBe("RATE_LIMIT_EXCEEDED");
  });
});
