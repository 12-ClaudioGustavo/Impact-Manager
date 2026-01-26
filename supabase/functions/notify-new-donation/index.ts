// supabase/functions/notify-new-donation/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_ENDPOINT = 'https://api.expo.dev/v2/push/send';

serve(async (req) => {
  try {
    const { organization_id, donor_name, amount, donation_type } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Encontrar os admins da organização
    const { data: admins, error: adminError } = await supabaseAdmin
      .from('users')
      .select('push_token')
      .eq('organization_id', organization_id)
      .eq('role', 'admin')
      .not('push_token', 'is', null);

    if (adminError) throw adminError;
    if (!admins || admins.length === 0) {
      return new Response(JSON.stringify({ message: 'No admins with push tokens found.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Construir a mensagem de notificação
    const pushTokens = admins.map(a => a.push_token);
    const title = 'Nova Doação Recebida!';
    const body = donation_type === 'Dinheiro'
      ? `${donor_name} doou ${amount} KZ.`
      : `${donor_name} doou ${donation_type}.`;

    const messages = pushTokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
    }));
    
    // 3. Enviar as notificações via Expo
    const expoResponse = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        // Opcional: Adicionar um Expo Access Token se tiver um configurado
        // 'Authorization': `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}`
      },
      body: JSON.stringify(messages),
    });

    const responseData = await expoResponse.json();
    console.log("Expo Push Notification Response:", responseData);

    return new Response(JSON.stringify({ success: true, response: responseData }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
