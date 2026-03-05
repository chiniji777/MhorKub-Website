import FormDataNode from "form-data";

const SLIPOK_API_KEY = process.env.SLIPOK_API_KEY || "";
const SLIPOK_BRANCH_ID = process.env.SLIPOK_BRANCH_ID || "";

interface SlipProxy {
  type?: string;
  value?: string;
}

interface SlipAccount {
  type?: string;
  value?: string;
}

interface SlipParty {
  displayName: string;
  name?: string;
  proxy?: SlipProxy;
  account?: SlipAccount;
}

export interface SlipOKData {
  transRef: string;
  amount: number;
  sendingBank: string;
  receivingBank: string;
  transDate: string;
  transTime: string;
  sender: SlipParty;
  receiver: SlipParty;
}

interface SlipOKResult {
  success: boolean;
  data?: SlipOKData;
  error?: string;
}

export async function verifySlip(slipBase64: string): Promise<SlipOKResult> {
  try {
    // Strip data URL prefix if present (e.g. "data:image/jpeg;base64,")
    const base64Data = slipBase64.includes(",")
      ? slipBase64.split(",")[1]
      : slipBase64;

    // Detect MIME type from data URL or default to image/jpeg
    let mimeType = "image/jpeg";
    const mimeMatch = slipBase64.match(/^data:([^;]+);base64,/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }

    // Map MIME type to file extension
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/heic": "heic",
    };
    const ext = extMap[mimeType] || "jpg";

    console.log("[SlipOK] Verifying slip...", {
      branchId: SLIPOK_BRANCH_ID ? "set" : "MISSING",
      apiKey: SLIPOK_API_KEY ? "set" : "MISSING",
      base64Length: base64Data.length,
      mimeType,
    });

    // Convert base64 to Buffer
    const buffer = Buffer.from(base64Data, "base64");

    console.log("[SlipOK] Buffer created:", {
      size: buffer.length,
      mimeType,
      ext,
    });

    // Use form-data npm package for reliable Node.js multipart upload
    // Web API FormData + File/Blob doesn't work properly in Node.js serverless
    const formData = new FormDataNode();
    formData.append("files", buffer, {
      filename: `slip.${ext}`,
      contentType: mimeType,
    });

    const url = "https://api.slipok.com/api/line/apikey/" + SLIPOK_BRANCH_ID;
    console.log("[SlipOK] Sending to:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-authorization": SLIPOK_API_KEY,
        ...formData.getHeaders(),
      },
      // form-data getBuffer() returns a proper multipart Buffer
      // Cast via Uint8Array for TypeScript BodyInit compatibility
      body: new Uint8Array(formData.getBuffer()),
    });

    // Read raw response text first for debugging
    const rawText = await response.text();
    console.log("[SlipOK] Raw response:", rawText.substring(0, 500));

    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      console.error("[SlipOK] Failed to parse JSON:", rawText.substring(0, 200));
      return { success: false, error: `SlipOK returned non-JSON: ${rawText.substring(0, 100)}` };
    }

    console.log("[SlipOK] Parsed response:", {
      status: response.status,
      ok: response.ok,
      hasData: !!result.data,
      message: result.message,
      code: result.code,
    });

    if (!response.ok || !result.data) {
      console.error("[SlipOK] Verification failed:", JSON.stringify(result));
      return {
        success: false,
        error: `SlipOK ${response.status}: ${result.message || result.msg || JSON.stringify(result)}`,
      };
    }

    console.log("[SlipOK] Success:", {
      transRef: result.data.transRef,
      amount: result.data.amount,
      transDate: result.data.transDate,
      transTime: result.data.transTime,
      receiver: JSON.stringify(result.data.receiver),
      sender: JSON.stringify(result.data.sender),
    });

    // Extract party info with proxy/account details
    const extractParty = (p: Record<string, unknown>): SlipParty => ({
      displayName: String(p?.displayName || p?.name || ""),
      name: p?.name ? String(p.name) : undefined,
      proxy: p?.proxy && typeof p.proxy === "object"
        ? { type: (p.proxy as Record<string, string>).type, value: (p.proxy as Record<string, string>).value }
        : undefined,
      account: p?.account && typeof p.account === "object"
        ? { type: (p.account as Record<string, string>).type, value: (p.account as Record<string, string>).value }
        : undefined,
    });

    return {
      success: true,
      data: {
        transRef: result.data.transRef,
        amount: parseFloat(result.data.amount),
        sendingBank: result.data.sendingBank,
        receivingBank: result.data.receivingBank,
        transDate: result.data.transDate,
        transTime: result.data.transTime,
        sender: extractParty(result.data.sender || {}),
        receiver: extractParty(result.data.receiver || {}),
      },
    };
  } catch (error) {
    console.error("[SlipOK] Exception:", error);
    return {
      success: false,
      error: `SlipOK exception: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
