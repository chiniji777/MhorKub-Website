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
    const response = await fetch("https://api.slipok.com/api/line/apikey/" + SLIPOK_BRANCH_ID, {
      method: "POST",
      headers: {
        "x-authorization": SLIPOK_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: slipBase64,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.data) {
      return { success: false, error: result.message || "Slip verification failed" };
    }

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
    return { success: false, error: "Failed to connect to SlipOK" };
  }
}
