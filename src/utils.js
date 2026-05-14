// crypto-service.ts
// 固定密码（建议设置一个强密码，可以硬编码或从环境变量读取）
const MASTER_PASSWORD = '@miaomiao@!@#$%^&*';
const FIXED_SALT = new Uint8Array([
  0x8e, 0x3f, 0x2a, 0x7b, 0x9d, 0x1c, 0x4e, 0x5f, 0xa2, 0xb8, 0x6c, 0x0d, 0xf3,
  0x7a, 0x91, 0x2c,
]);
const ITERATIONS = 200000;

let cachedKey = null;

async function getKey() {
  if (cachedKey) return cachedKey;

  const passwordBuffer = new TextEncoder().encode(MASTER_PASSWORD);
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  cachedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: FIXED_SALT,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );

  return cachedKey;
}

// 加密：输入字符串，输出 Base64 密文
export async function encrypt(plainText) {
  const key = await getKey();

  // 生成随机 IV（12 字节）
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 将明文字符串编码为 Uint8Array
  const encodedData = new TextEncoder().encode(plainText);

  // 加密
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encodedData,
  );

  // 合并 IV + 密文
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);

  // 转为 Base64 字符串（使用浏览器标准 API）
  return uint8ArrayToBase64(result);
}

// 解密：输入 Base64 密文，输出原始字符串
export async function decrypt(encryptedBase64) {
  const key = await getKey();

  // 从 Base64 还原 Uint8Array（使用浏览器标准 API）
  const encryptedData = base64ToUint8Array(encryptedBase64);

  // 分离 IV（前12字节）和密文
  const iv = encryptedData.subarray(0, 12);
  const ciphertext = encryptedData.subarray(12);

  // 解密
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext,
  );

  // 将解密后的 ArrayBuffer 转为字符串
  return new TextDecoder().decode(decrypted);
}

// Base64 编码工具函数
function uint8ArrayToBase64(uint8Array) {
  let binary = '';
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

// Base64 解码工具函数
function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// 便捷方法：加密 JSON 对象（内部转字符串）
export async function encryptJSON(data) {
  return encrypt(JSON.stringify(data));
}

// 便捷方法：解密并返回 JSON 对象
export async function decryptJSON(encryptedBase64) {
  const plainText = await decrypt(encryptedBase64);
  return JSON.parse(plainText);
}
