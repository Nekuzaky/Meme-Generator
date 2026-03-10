const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const SHARE_QUERY_KEY = "memeShare";
export const MAX_SHARE_PAYLOAD_LENGTH = 3500;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toBase64Url(value: string): string {
  return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  if (padding === 0) return normalized;
  return normalized + "=".repeat(4 - padding);
}

export function encodeSharePayload<T>(payload: T): string {
  return toBase64Url(bytesToBase64(encoder.encode(JSON.stringify(payload))));
}

export function decodeSharePayload<T>(raw: string): T {
  const bytes = base64ToBytes(fromBase64Url(raw));
  return JSON.parse(decoder.decode(bytes)) as T;
}

export function isSharePayloadTooLarge<T>(payload: T): boolean {
  return encodeSharePayload(payload).length > MAX_SHARE_PAYLOAD_LENGTH;
}
