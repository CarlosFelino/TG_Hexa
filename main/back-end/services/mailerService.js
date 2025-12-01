// ============================================
// 📧 SERVIÇO DE EMAIL COM RESEND - DESIGN FINAL PRO
// ============================================

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API);

// 🖼️ URL do logo hospedado no GitHub
const LOGO_URL = process.env.LOGO_URL || 'https://raw.githubusercontent.com/CarlosFelino/TG_Hexa/main/main/front-end/assets/images/logo.png';

/**
 * Envia email de redefinição de senha
 * @param {string} nome - Nome do usuário
 * @param {string} email - Email do destinatário
 * @param {string} token - Token de recuperação
 */
export async function enviarEmailRedefinirSenha(nome, email, token) {
  try {
    // Usa a URL configurada no Secret do Replit
    const baseUrl = process.env.FRONTEND_URL || 'https://40cd6f62-b9ce-40bf-9b67-5082637ff496-00-2goj6eo5b4z6a.riker.replit.dev';
    const link = `${baseUrl}/login.html?token=${token}`;

    console.log('🔗 URL Base:', baseUrl);
    console.log('🔗 Link completo:', link);

    const htmlContent = gerarTemplateEmail(nome, link);

    const { data, error } = await resend.emails.send({
      from: 'Support Nexus <onboarding@resend.dev>',
      to: [email],
      subject: '🔐 Redefinição de Senha - Support Nexus',
      html: htmlContent,
    });

    if (error) {
      console.error('❌ Erro ao enviar email:', error);
      throw new Error('Falha ao enviar email de recuperação');
    }

    console.log('✅ Email enviado com sucesso:', data);
    return data;
  } catch (err) {
    console.error('❌ Erro no serviço de email:', err);
    throw err;
  }
}

/**
 * Gera o template HTML HÍBRIDO (melhor dos dois mundos)
 * @param {string} nome - Nome do usuário
 * @param {string} link - Link de redefinição
 * @returns {string} HTML do email
 */
function gerarTemplateEmail(nome, link) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinição de Senha - Support Nexus</title>

        <!--[if !mso]><!-->
        <style type="text/css">
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        </style>
        <!--<![endif]-->

        <style type="text/css" rel="stylesheet" media="all">
            @media only screen and (max-width: 640px) {
                .ms-header { display: none !important; }
                .ms-content { width: 100% !important; border-radius: 0; }
                .ms-content-body { padding: 30px !important; }
                .ms-footer { width: 100% !important; }
                .mobile-wide { width: 100% !important; }
                .logo-container { padding: 30px !important; }
            }
        </style>

        <!--[if mso]>
        <style type="text/css">
            body, td, th, p, a, span, div { font-family: Arial, Helvetica, sans-serif !important; }
        </style>
        <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; background-color: #0a101f; width: 100% !important; height: 100%;">

        <!-- Preheader oculto -->
        <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
            Redefina sua senha do Support Nexus de forma segura
        </div>

        <!-- Wrapper Principal -->
        <table class="ms-body" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse; background-color: #0a101f; margin: 0; padding: 0;">
            <tr>
                <td align="center" style="padding: 40px 20px;">

                    <!-- Espaçamento Superior -->
                    <table class="ms-header" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                        <tr>
                            <td height="20" style="font-size: 0; line-height: 0;">&nbsp;</td>
                        </tr>
                    </table>

                    <!-- Container Principal do Email -->
                    <table class="ms-content" width="640" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse; width: 640px; max-width: 640px; background: linear-gradient(135deg, #101728 0%, #0f1819 100%); border-radius: 16px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); border: 1px solid rgba(122, 4, 235, 0.2); overflow: hidden;">

                        <!-- ============================================ -->
                        <!-- HEADER COM LOGO -->
                        <!-- ============================================ -->
                        <tr>
                            <td class="logo-container" align="center" style="background: linear-gradient(135deg, #7a04eb 0%, #ff00e2 100%); padding: 50px 40px; position: relative;">

                                <!-- Logo e Título -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                                    <tr>
                                        <td align="center">
                                            <!-- Logo limpo sem fundo (proporção mantida) -->
                                            <div style="margin-bottom: 20px;">
                                                <img src="${LOGO_URL}" alt="Support Nexus Logo" width="150" style="display: block; height: auto; margin: 0 auto; max-width: 100%; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;">
                                            </div>

                                            <!-- Título -->
                                            <h1 style="margin: 0; padding: 0; color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: 2px; text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); line-height: 1.2;">
                                                SUPPORT NEXUS
                                            </h1>

                                            <!-- Subtítulo -->
                                            <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
                                                Sistema de Gestão Interna
                                            </p>
                                        </td>
                                    </tr>
                                </table>

                            </td>
                        </tr>

                        <!-- ============================================ -->
                        <!-- CONTEÚDO PRINCIPAL -->
                        <!-- ============================================ -->
                        <tr>
                            <td class="ms-content-body" style="padding: 50px 50px 40px 50px; color: #ffffff;">

                                <!-- Saudação -->
                                <h2 style="margin: 0 0 8px 0; color: #ffffff; font-size: 28px; font-weight: 700; line-height: 1.3;">
                                    Olá, ${nome}! 👋
                                </h2>

                                <!-- Linha decorativa -->
                                <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #7a04eb 0%, #ff00e2 100%); border-radius: 2px; margin-bottom: 30px;"></div>

                                <!-- Texto Principal -->
                                <p style="color: rgba(255, 255, 255, 0.95); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                                    Recebemos uma solicitação para <strong style="color: #ffffff; font-weight: 600;">redefinir a senha</strong> da sua conta no Support Nexus.
                                </p>

                                <p style="color: rgba(255, 255, 255, 0.85); font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                    Para sua segurança, criamos um link temporário. Clique no botão abaixo para criar sua nova senha:
                                </p>

                                <!-- Botão de Ação -->
                                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse; margin: 35px 0;">
                                    <tr>
                                        <td align="center">
                                            <table cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                                                <tr>
                                                    <td style="background: linear-gradient(135deg, #7a04eb 0%, #ff00e2 100%); border-radius: 10px; box-shadow: 0 12px 35px rgba(122, 4, 235, 0.5), 0 0 0 4px rgba(122, 4, 235, 0.1);">
                                                        <a href="${link}" target="_blank" style="display: inline-block; padding: 16px 45px; color: #0f1819; text-decoration: none; font-weight: 800; font-size: 16px; letter-spacing: 0.5px; border-radius: 10px; text-shadow: 0 1px 2px rgba(255, 255, 255, 0.2);">
                                                             Redefinir Minha Senha
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Card de Aviso - Tempo -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 35px 0 30px 0;">
                                    <tr>
                                        <td style="background: linear-gradient(135deg, rgba(255, 0, 226, 0.15) 0%, rgba(122, 4, 235, 0.12) 100%); border-left: 4px solid #ff00e2; border-radius: 10px; padding: 20px 24px; border: 1px solid rgba(255, 0, 226, 0.2);">
                                            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                                                <tr>
                                                    <td width="36" valign="top" style="padding-right: 16px;">
                                                        <div style="width: 36px; height: 36px; background: rgba(255, 0, 226, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 36px;">
                                                            <span style="font-size: 20px;">⏰</span>
                                                        </div>
                                                    </td>
                                                    <td valign="top">
                                                        <p style="color: #ff6b9d; font-size: 15px; font-weight: 700; margin: 0 0 6px 0; letter-spacing: 0.3px;">
                                                            IMPORTANTE: Link Temporário
                                                        </p>
                                                        <p style="color: rgba(255, 107, 157, 0.9); font-size: 14px; margin: 0; line-height: 1.5; font-weight: 500;">
                                                            Este link de recuperação <strong>expira em 1 hora</strong> por motivos de segurança.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Dica de Segurança -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 30px 0;">
                                    <tr>
                                        <td style="background: rgba(122, 4, 235, 0.08); border-radius: 10px; padding: 20px 24px; border: 1px solid rgba(122, 4, 235, 0.15);">
                                            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                                                <tr>
                                                    <td width="36" valign="top" style="padding-right: 16px;">
                                                        <div style="width: 36px; height: 36px; background: rgba(122, 4, 235, 0.15); border-radius: 8px; text-align: center; line-height: 36px;">
                                                            <span style="font-size: 20px;">💡</span>
                                                        </div>
                                                    </td>
                                                    <td valign="top">
                                                        <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 600; margin: 0 0 6px 0;">
                                                            Não solicitou esta alteração?
                                                        </p>
                                                        <p style="color: rgba(255, 255, 255, 0.7); font-size: 13px; margin: 0; line-height: 1.5;">
                                                            Sua conta está segura. Ignore este email e nenhuma alteração será feita.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Separador -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 35px 0 25px 0;">
                                    <tr>
                                        <td style="border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 0; line-height: 0;">&nbsp;</td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="font-size: 0; line-height: 0;">&nbsp;</td>
                                    </tr>
                                </table>

                                <!-- Link Alternativo -->
                                <p style="color: rgba(255, 255, 255, 0.6); font-size: 13px; margin: 0 0 12px 0; font-weight: 500;">
                                    Se você estiver tendo problemas com o botão acima, copie e cole a URL abaixo no seu navegador:
                                </p>
                                <div style="background: rgba(122, 4, 235, 0.1); border: 1px solid rgba(122, 4, 235, 0.3); border-radius: 8px; padding: 14px 16px; word-break: break-all; margin: 0 0 30px 0;">
                                    <a href="${link}" style="color: #a78bfa; text-decoration: none; font-size: 12px; font-family: 'Courier New', Consolas, monospace; font-weight: 600; word-break: break-all;">
                                        ${link}
                                    </a>
                                </div>

                                <!-- Assinatura -->
                                <p style="color: rgba(255, 255, 255, 0.85); font-size: 16px; margin: 30px 0 0 0; line-height: 1.6;">
                                    Atenciosamente,<br>
                                    <strong style="font-weight: 600; color: #ffffff;">Equipe Support Nexus</strong>
                                </p>

                            </td>
                        </tr>

                        <!-- ============================================ -->
                        <!-- FOOTER -->
                        <!-- ============================================ -->
                        <tr>
                            <td class="ms-footer" style="background: rgba(10, 16, 31, 0.6); padding: 40px 50px; border-top: 1px solid rgba(122, 4, 235, 0.2);">

                                <!-- Informações -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
                                    <tr>
                                        <td align="center">
                                            <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; margin: 0 0 8px 0; font-weight: 600; line-height: 1.5;">
                                                Support Nexus - Sistema de Gestão Interna
                                            </p>
                                            <p style="color: rgba(255, 255, 255, 0.4); font-size: 12px; margin: 0; line-height: 1.6;">
                                                Fatec Carapicuíba | Tecnologia em Análise e Desenvolvimento de Sistemas
                                            </p>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Copyright -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 20px;">
                                    <tr>
                                        <td align="center">
                                            <p style="color: rgba(255, 255, 255, 0.35); font-size: 11px; margin: 0; line-height: 1.6;">
                                                © 2025 Support Nexus. Todos os direitos reservados.<br>
                                                Este é um email automático, por favor não responda.
                                            </p>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Badge de Segurança -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 20px;">
                                    <tr>
                                        <td align="center">

                                        </td>
                                    </tr>
                                </table>

                            </td>
                        </tr>

                    </table>
                    <!-- Fim do Container Principal -->

                    <!-- Aviso de Segurança Final -->
                    <table width="640" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 640px; margin-top: 24px;">
                        <tr>
                            <td align="center" style="padding: 0 20px;">
                                <p style="color: rgba(255, 255, 255, 0.3); font-size: 11px; line-height: 1.6; margin: 0;">
                                    🔒 <strong>Aviso de Segurança:</strong> Nunca compartilhe este email ou link com terceiros. O Support Nexus nunca solicitará sua senha por email.
                                </p>
                            </td>
                        </tr>
                    </table>

                </td>
            </tr>
        </table>

    </body>
    </html>
  `;
}

// ============================================
// 📝 FUNÇÃO ADICIONAL: Email de Boas-Vindas
// ============================================
export async function enviarEmailBoasVindas(nome, email, role) {
  try {
    const roleNames = {
      'professor': 'Professor',
      'suporte': 'Suporte Técnico',
      'admin': 'Administrador'
    };

    // Usa a URL configurada no Secret do Replit
    const baseUrl = process.env.FRONTEND_URL || 'https://40cd6f62-b9ce-40bf-9b67-5082637ff496-00-2goj6eo5b4z6a.riker.replit.dev';

    const { data, error } = await resend.emails.send({
      from: 'Support Nexus <onboarding@resend.dev>',
      to: [email],
      subject: '🎉 Bem-vindo(a) ao Support Nexus!',
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a101f; font-family: 'Inter', -apple-system, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a101f;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table width="640" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #101728 0%, #0f1819 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(122, 4, 235, 0.2);">

                  <!-- Header -->
                  <tr>
                    <td align="center" style="background: linear-gradient(135deg, #7a04eb 0%, #ff00e2 100%); padding: 50px 40px;">
                      <!-- Logo limpo sem fundo (proporção mantida) -->
                      <div style="margin-bottom: 20px;">
                        <img src="${LOGO_URL}" alt="Support Nexus Logo" width="150" style="display: block; height: auto; margin: 0 auto; max-width: 100%; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;">
                      </div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: 2px; text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">BEM-VINDO(A)!</h1>
                      <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 600; letter-spacing: 1px;">
                        Sua conta foi criada com sucesso
                      </p>
                    </td>
                  </tr>

                  <!-- Conteúdo -->
                  <tr>
                    <td style="padding: 50px 50px 40px 50px;">
                      <h2 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">
                        Olá, ${nome}! 👋
                      </h2>

                      <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #7a04eb 0%, #ff00e2 100%); border-radius: 2px; margin-bottom: 30px;"></div>

                      <p style="color: rgba(255, 255, 255, 0.95); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                        Sua conta no <strong>Support Nexus</strong> foi criada com sucesso como <strong style="color: #ff00e2;">${roleNames[role] || role}</strong>.
                      </p>

                      <div style="background: rgba(122, 4, 235, 0.1); border-left: 4px solid #7a04eb; padding: 20px 24px; border-radius: 10px; margin: 30px 0;">
                        <p style="color: rgba(255, 255, 255, 0.85); font-size: 14px; margin: 0; line-height: 1.7;">
                          <strong style="color: #ffffff; font-weight: 600;">Próximos passos:</strong><br>
                          • Acesse o sistema com seu email e senha<br>
                          • Configure seu perfil<br>
                          • Explore as funcionalidades disponíveis
                        </p>
                      </div>

                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 35px 0;">
                        <tr>
                          <td align="center">
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="background: linear-gradient(135deg, #7a04eb 0%, #ff00e2 100%); border-radius: 10px; box-shadow: 0 12px 35px rgba(122, 4, 235, 0.5);">
                                  <a href="${baseUrl}/login.html" target="_blank" style="display: inline-block; padding: 16px 45px; color: #0f1819; text-decoration: none; font-weight: 800; font-size: 16px; letter-spacing: 0.5px;">
                                    🚀 Acessar Sistema
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td align="center" style="background: rgba(10, 16, 31, 0.6); padding: 30px; border-top: 1px solid rgba(122, 4, 235, 0.2);">
                      <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; margin: 0 0 5px 0; font-weight: 600;">
                        Support Nexus - Sistema de Gestão Interna
                      </p>
                      <p style="color: rgba(255, 255, 255, 0.35); font-size: 11px; margin: 0;">
                        © 2025 Support Nexus | Fatec Carapicuíba
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Erro ao enviar email de boas-vindas:', error);
      return false;
    }

    console.log('✅ Email de boas-vindas enviado:', data);
    return true;
  } catch (err) {
    console.error('❌ Erro no email de boas-vindas:', err);
    return false;
  }
}