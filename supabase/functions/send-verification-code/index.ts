import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  email: string;
  code: string;
  userName?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, code, userName } = await req.json() as RequestBody;

    // Validações
    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "Email e código são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Configuração SMTP
    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get("SMTP_HOSTNAME") || "smtp.gmail.com",
        port: Number(Deno.env.get("SMTP_PORT")) || 587,
        tls: true,
        auth: {
          username: Deno.env.get("c.spacetechnologies2022@gmail.com")!,
          password: Deno.env.get("cflo exfy rtsz pgqf")!,
        },
      },
    });

    // Template do email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 16px;
              padding: 40px;
              text-align: center;
            }
            .content {
              background: white;
              border-radius: 12px;
              padding: 40px;
              margin-top: 20px;
            }
            h1 {
              color: white;
              margin: 0 0 10px 0;
              font-size: 28px;
            }
            .subtitle {
              color: rgba(255, 255, 255, 0.9);
              margin: 0 0 30px 0;
              font-size: 16px;
            }
            .code-container {
              background: #f7fafc;
              border: 2px dashed #cbd5e0;
              border-radius: 12px;
              padding: 30px;
              margin: 30px 0;
            }
            .code {
              font-size: 48px;
              font-weight: bold;
              letter-spacing: 12px;
              color: #2d3748;
              font-family: 'Courier New', monospace;
            }
            .info {
              color: #718096;
              font-size: 14px;
              margin: 20px 0;
            }
            .warning {
              background: #fff5f5;
              border-left: 4px solid #f56565;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
              color: #742a2a;
              font-size: 14px;
            }
            .tips {
              text-align: left;
              background: #f7fafc;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .tips h3 {
              margin-top: 0;
              color: #2d3748;
              font-size: 16px;
            }
            .tips ul {
              margin: 0;
              padding-left: 20px;
            }
            .tips li {
              color: #4a5568;
              margin: 8px 0;
              font-size: 14px;
            }
            .footer {
              color: rgba(255, 255, 255, 0.8);
              font-size: 12px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔐 Código de Verificação</h1>
            <p class="subtitle">Confirme seu email para continuar</p>

            <div class="content">
              ${userName ? `<p>Olá <strong>${userName}</strong>,</p>` : ""}

              <p>Recebemos uma solicitação para verificar seu email.</p>
              <p>Use o código abaixo para confirmar sua conta:</p>

              <div class="code-container">
                <div class="code">${code}</div>
              </div>

              <p class="info">⏰ Este código expira em <strong>15 minutos</strong></p>

              <div class="warning">
                ⚠️ Máximo de 5 tentativas por código
              </div>

              <div class="tips">
                <h3>💡 Dicas Importantes:</h3>
                <ul>
                  <li>Digite o código no aplicativo</li>
                  <li>Não compartilhe este código com ninguém</li>
                  <li>Se não solicitou este código, ignore este email</li>
                  <li>Você pode solicitar um novo código após 60 segundos</li>
                </ul>
              </div>

              <p style="color: #718096; font-size: 13px; margin-top: 30px;">
                Se você não criou uma conta, pode ignorar este email com segurança.
              </p>
            </div>

            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p>© ${new Date().getFullYear()} Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Versão texto (fallback)
    const textContent = `
Código de Verificação

Olá${userName ? ` ${userName}` : ""},

Seu código de verificação é: ${code}

Este código expira em 15 minutos.
Máximo de 5 tentativas por código.

Dicas:
- Digite o código no aplicativo
- Não compartilhe com ninguém
- Se não solicitou, ignore este email

---
Este é um email automático, não responda.
    `;

    // Enviar email
    await client.send({
      from: Deno.env.get("SMTP_FROM_EMAIL") || Deno.env.get("SMTP_USERNAME")!,
      to: email,
      subject: `Seu código de verificação: ${code}`,
      content: textContent,
      html: htmlContent,
    });

    await client.close();

    console.log(`✅ Email enviado com sucesso para: ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email enviado com sucesso"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("❌ Erro ao enviar email:", error);

    return new Response(
      JSON.stringify({
        error: "Falha ao enviar email",
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
