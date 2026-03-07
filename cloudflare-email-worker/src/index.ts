import { createMimeMessage } from "mimetext";

interface Env {
  SEND_EMAIL: SendEmail;
  EMAIL_API_KEY: string;
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    // Validate API key
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${env.EMAIL_API_KEY}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const body = (await request.json()) as EmailRequest;

      if (!body.to || !body.subject || !body.html) {
        return Response.json(
          { error: "Missing required fields: to, subject, html" },
          { status: 400 }
        );
      }

      // Create MIME message
      const msg = createMimeMessage();
      msg.setSender({ name: "MhorKub", addr: "noreply@mhorkub.com" });
      msg.setRecipient(body.to);
      msg.setSubject(body.subject);
      msg.addMessage({
        contentType: "text/html",
        data: body.html,
      });

      // Send via Cloudflare Email
      const message = new EmailMessage(
        "noreply@mhorkub.com",
        body.to,
        msg.asRaw()
      );
      await env.SEND_EMAIL.send(message);

      return Response.json({ success: true });
    } catch (error) {
      console.error("Email send failed:", error);
      return Response.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
  },
};
