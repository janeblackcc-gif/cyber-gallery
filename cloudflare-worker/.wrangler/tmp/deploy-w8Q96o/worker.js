var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8"
};
var GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
var GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
var cachedToken = null;
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = buildCorsHeaders(request, env);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (request.method !== "POST") {
      return jsonError("Method not allowed", 405, corsHeaders);
    }
    if (url.pathname === "/upload/init") {
      return handleUploadInit(request, env, corsHeaders);
    }
    if (url.pathname === "/upload/complete") {
      return handleUploadComplete(request, env, corsHeaders);
    }
    return jsonError("Not found", 404, corsHeaders);
  }
};
async function handleUploadInit(request, env, corsHeaders) {
  const body = await readJson(request);
  if (!body) return jsonError("Invalid JSON", 400, corsHeaders);
  const { filename, contentType, size } = body;
  if (!filename || !size) {
    return jsonError("Missing filename or size", 400, corsHeaders);
  }
  const maxBytes = parseInt(env.MAX_UPLOAD_BYTES || "1073741824", 10);
  if (Number.isFinite(maxBytes) && size > maxBytes) {
    return jsonError("File too large", 413, corsHeaders);
  }
  const safeName = sanitizeFilename(filename);
  const objectKey = buildObjectKey(safeName);
  const expires = parseInt(env.PRESIGN_EXPIRES || "900", 10);
  const uploadUrl = await createPresignedUrl(env, objectKey, expires);
  const fileUrl = buildPublicUrl(env.PUBLIC_R2_BASE_URL, objectKey);
  return jsonResponse(
    {
      uploadUrl,
      objectKey,
      fileUrl,
      contentType: contentType || "application/octet-stream"
    },
    200,
    corsHeaders
  );
}
__name(handleUploadInit, "handleUploadInit");
async function handleUploadComplete(request, env, corsHeaders) {
  const body = await readJson(request);
  if (!body) return jsonError("Invalid JSON", 400, corsHeaders);
  const { objectKey, title, date, desc } = body;
  if (!objectKey) return jsonError("Missing objectKey", 400, corsHeaders);
  const object = await env.R2_BUCKET.head(objectKey);
  if (!object) return jsonError("Object not found", 404, corsHeaders);
  const spreadsheetId = env.SPREADSHEET_ID;
  const sheetName = env.SHEET_NAME || "Sheet1";
  if (!spreadsheetId) {
    return jsonError("Missing SPREADSHEET_ID", 500, corsHeaders);
  }
  const submissionId = crypto.randomUUID();
  const fileUrl = buildPublicUrl(env.PUBLIC_R2_BASE_URL, objectKey);
  const values = [[submissionId, title || "", date || "", desc || "", fileUrl]];
  await appendToSheet(env, spreadsheetId, sheetName, values);
  return jsonResponse(
    {
      ok: true,
      submissionId,
      fileUrl
    },
    200,
    corsHeaders
  );
}
__name(handleUploadComplete, "handleUploadComplete");
async function appendToSheet(env, spreadsheetId, sheetName, values) {
  const token = await getGoogleAccessToken(env);
  const range = `${sheetName}!A:E`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({ values })
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Sheets append failed: ${response.status} ${text}`);
  }
}
__name(appendToSheet, "appendToSheet");
async function getGoogleAccessToken(env) {
  const now = Math.floor(Date.now() / 1e3);
  if (cachedToken && cachedToken.exp - 60 > now) {
    return cachedToken.token;
  }
  const jwt = await createJwt(env);
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Token error: ${response.status} ${JSON.stringify(data)}`);
  }
  cachedToken = {
    token: data.access_token,
    exp: now + (data.expires_in || 3600)
  };
  return cachedToken.token;
}
__name(getGoogleAccessToken, "getGoogleAccessToken");
async function createJwt(env) {
  const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = env.GOOGLE_PRIVATE_KEY || "";
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google service account credentials");
  }
  const now = Math.floor(Date.now() / 1e3);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: GOOGLE_SHEETS_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = await signJwt(privateKey, unsignedToken);
  return `${unsignedToken}.${signature}`;
}
__name(createJwt, "createJwt");
async function signJwt(privateKeyPem, data) {
  const keyData = pemToArrayBuffer(privateKeyPem);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(data)
  );
  return base64UrlEncode(signature);
}
__name(signJwt, "signJwt");
async function createPresignedUrl(env, objectKey, expiresSeconds) {
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  const accountId = env.R2_ACCOUNT_ID;
  const bucket = env.R2_BUCKET_NAME || "cyber-gallery-uploads";
  if (!accessKeyId || !secretAccessKey || !accountId) {
    throw new Error("Missing R2 credentials");
  }
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const method = "PUT";
  const now = /* @__PURE__ */ new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const signedHeaders = "host";
  const canonicalUri = `/${bucket}/${encodeR2Key(objectKey)}`;
  const query = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresSeconds),
    "X-Amz-SignedHeaders": signedHeaders
  };
  const canonicalQuery = buildCanonicalQuery(query);
  const canonicalHeaders = `host:${host}
`;
  const payloadHash = "UNSIGNED-PAYLOAD";
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest)
  ].join("\n");
  const signingKey = await getSignatureKey(
    secretAccessKey,
    dateStamp,
    "auto",
    "s3"
  );
  const signature = await hmacHex(signingKey, stringToSign);
  return `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
__name(createPresignedUrl, "createPresignedUrl");
function buildObjectKey(filename) {
  const now = /* @__PURE__ */ new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}/${crypto.randomUUID()}-${filename}`;
}
__name(buildObjectKey, "buildObjectKey");
function sanitizeFilename(name) {
  const base = name.split(/[\\\/]/).pop() || "upload.bin";
  return base.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 120);
}
__name(sanitizeFilename, "sanitizeFilename");
function buildPublicUrl(baseUrl, objectKey) {
  const trimmed = (baseUrl || "").replace(/\/+$/, "");
  return `${trimmed}/${encodeR2Key(objectKey)}`;
}
__name(buildPublicUrl, "buildPublicUrl");
function encodeR2Key(key) {
  return key.split("/").map(encodeURIComponent).join("/");
}
__name(encodeR2Key, "encodeR2Key");
function buildCanonicalQuery(query) {
  return Object.keys(query).sort().map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`).join("&");
}
__name(buildCanonicalQuery, "buildCanonicalQuery");
function toAmzDate(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}
__name(toAmzDate, "toAmzDate");
async function sha256Hex(data) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(data)
  );
  return toHex(hash);
}
__name(sha256Hex, "sha256Hex");
async function hmacHex(key, data) {
  const signature = await hmacRaw(key, data);
  return toHex(signature);
}
__name(hmacHex, "hmacHex");
async function hmacRaw(key, data) {
  const keyBytes = typeof key === "string" ? new TextEncoder().encode(key) : new Uint8Array(key);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}
__name(hmacRaw, "hmacRaw");
async function getSignatureKey(secretKey, dateStamp, regionName, serviceName) {
  const kDate = await hmacRaw(`AWS4${secretKey}`, dateStamp);
  const kRegion = await hmacRaw(kDate, regionName);
  const kService = await hmacRaw(kRegion, serviceName);
  return hmacRaw(kService, "aws4_request");
}
__name(getSignatureKey, "getSignatureKey");
function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(toHex, "toHex");
function base64UrlEncode(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(base64UrlEncode, "base64UrlEncode");
function pemToArrayBuffer(pem) {
  const cleaned = pem.replace(/-----BEGIN PRIVATE KEY-----/g, "").replace(/-----END PRIVATE KEY-----/g, "").replace(/\s+/g, "");
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
__name(pemToArrayBuffer, "pemToArrayBuffer");
function buildCorsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.CORS_ORIGIN || "*").trim();
  if (allowed === "*") {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin"
    };
  }
  const allowedList = allowed.split(",").map((item) => item.trim()).filter(Boolean);
  const allowOrigin = allowedList.includes(origin) ? origin : allowedList[0] || "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}
__name(buildCorsHeaders, "buildCorsHeaders");
function jsonResponse(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...corsHeaders }
  });
}
__name(jsonResponse, "jsonResponse");
function jsonError(message, status, corsHeaders) {
  return jsonResponse({ error: message }, status, corsHeaders);
}
__name(jsonError, "jsonError");
async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
__name(readJson, "readJson");
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
