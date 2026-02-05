import crypto from "crypto";
import fs from "fs";
import { pipeline } from "stream/promises";

const ALGORITHM = "aes-256-gcm";
const KEY_HEX = process.env.ENCRYPTION_KEY;

if (!KEY_HEX || KEY_HEX.length !== 64) {
  console.warn(
    "Warning: ENCRYPTION_KEY is missing or invalid (must be 64 hex chars). Encryption will fail.",
  );
}

const key = KEY_HEX ? Buffer.from(KEY_HEX, "hex") : Buffer.alloc(32);

// Encrypt a file buffer and return the encrypted buffer (includes IV and AuthTag)
export const encryptBuffer = (buffer: Buffer): Buffer => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: IV (16) + AuthTag (16) + EncryptedData
  return Buffer.concat([iv, authTag, encrypted]);
};

// Create a decipher stream to read an encrypted file
// Input stream must be the raw file stream from disk
export const getDecipherStream = async (inputPath: string) => {
  // Read first 32 bytes to get IV and AuthTag
  const fd = await fs.promises.open(inputPath, "r");
  const header = Buffer.alloc(32);
  await fd.read(header, 0, 32, 0);
  await fd.close();

  const iv = header.subarray(0, 16);
  const authTag = header.subarray(16, 32);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // We need to create a stream that skips the first 32 bytes
  const readStream = fs.createReadStream(inputPath, { start: 32 });

  // Pipe through decipher
  return readStream.pipe(decipher);
};
