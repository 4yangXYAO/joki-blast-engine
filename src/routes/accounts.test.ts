import { accountsRouter } from "./accounts";
import "../../vitest.setup";
import { encrypt, decrypt } from "../utils/crypto";

describe("Accounts API & Crypto", () => {
  it("should encrypt and decrypt correctly", () => {
    const secret = "test-secret";
    process.env.JWT_SECRET = secret;
    const original = "my-credential";
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
    expect(encrypted).not.toBe(original);
  });

  // Mock-based route tests would go here
  // For now we rely on the manual curl verification for the actual endpoints
});
