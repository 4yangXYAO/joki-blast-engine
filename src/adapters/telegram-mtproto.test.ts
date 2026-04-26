// Unit tests for TelegramMTProtoAdapter (gramjs)
// Uses clientFactory injection (DI) to avoid module-registry battles with vi.mock + lazy require.
import { TelegramMTProtoAdapter } from './telegram-mtproto';

const mockSendMessage = vi.fn().mockResolvedValue({ id: 1 });
const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockDisconnect = vi.fn().mockResolvedValue(undefined);

/** Creates a mock gramjs client and injects it via clientFactory option. */
function makeAdapter() {
  return new TelegramMTProtoAdapter(
    { apiId: 12345, apiHash: 'test-hash', sessionString: '' },
    {
      clientFactory: async () => ({
        connect: mockConnect,
        disconnect: mockDisconnect,
        sendMessage: mockSendMessage,
      }),
    }
  );
}

describe('TelegramMTProtoAdapter', () => {
  beforeEach(() => {
    mockSendMessage.mockClear();
    mockConnect.mockClear();
    mockDisconnect.mockClear();
  });

  test('connect initializes client via factory', async () => {
    const adapter = makeAdapter();
    await adapter.connect();
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  test('sendMessage calls client.sendMessage', async () => {
    const adapter = makeAdapter();
    await adapter.connect();
    const res = await adapter.sendMessage('@testuser', 'Hello!');
    expect(res.success).toBe(true);
    expect(mockSendMessage).toHaveBeenCalledWith('@testuser', { message: 'Hello!' });
  });

  test('sendMessage auto-connects if not connected', async () => {
    const adapter = makeAdapter();
    const res = await adapter.sendMessage('@testuser', 'Auto-connect test');
    expect(res.success).toBe(true);
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  test('replyToMessage with msgId prefix parses correctly', async () => {
    const adapter = makeAdapter();
    await adapter.connect();
    const res = await adapter.replyToMessage('@testuser', '42::Reply text');
    expect(res.success).toBe(true);
    expect(mockSendMessage).toHaveBeenCalledWith('@testuser', { message: 'Reply text', replyTo: 42 });
  });

  test('getRateLimitStatus returns default values', async () => {
    const adapter = makeAdapter();
    const status = await adapter.getRateLimitStatus();
    expect(status).not.toBeNull();
    expect(status!.limit).toBe(30);
  });

  test('disconnect calls client.disconnect', async () => {
    const adapter = makeAdapter();
    await adapter.connect();
    await adapter.disconnect();
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });
});
