const SLIPOK_API_KEY = process.env.SLIPOK_API_KEY || "";
const SLIPOK_BRANCH_ID = process.env.SLIPOK_BRANCH_ID || "";

interface SlipOKResult {
  success: boolean;
  data?: {
    transRef: string;
    amount: number;
    sendingBank: string;
    receivingBank: string;
    transDate: string;
    transTime: string;
    sender: { displayName: string };
    receiver: { displayName: string };
  };
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

    console.log("[SlipOK] Verifying slip...", {
      branchId: SLIPOK_BRANCH_ID ? "set" : "MISSING",
      apiKey: SLIPOK_API_KEY ? "set" : "MISSING",
      base64Length: base64Data.length,
      mimeType,
    });

    // Convert base64 to Blob for multipart/form-data upload
    const buffer = Buffer.from(base64Data, "base64");
    const blob = new Blob([buffer], { type: mimeType });

    // SlipOK API requires multipart/form-data (NOT JSON)
    const formData = new FormData();
    formData.append("files", blob, "slip.jpg");

    const response = await fetch("https://api.slipok.com/api/line/apikey/" + SLIPOK_BRANCH_ID, {
      method: "POST",
      headers: {
        "x-authorization": SLIPOK_API_KEY,
        // Do NOT set Content-Type — let FormData set it with boundary
      },
      body: formData,
    });

    const result = await response.json();

    console.log("[SlipOK] Response:", {
      status: response.status,
      ok: response.ok,
      hasData: !!result.data,
      message: result.message,
      code: result.code,
    });

    if (!response.ok || !result.data) {
      console.error("[SlipOK] Verification failed:", result);
      return { success: false, error: result.message || "Slip verification failed" };
    }

    console.log("[SlipOK] Success:", {
      transRef: result.data.transRef,
      amount: result.data.amount,
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
        sender: result.data.sender,
        receiver: result.data.receiver,
      },
    };
  } catch (error) {
    console.error("[SlipOK] Exception:", error);
    return { success: false, error: "Failed to connect to SlipOK" };
  }
}
