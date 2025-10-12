import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface AlertRequest {
  phoneNumber: string;
  latitude: number;
  longitude: number;
  triggerReason: string;
  sensorData?: any;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { phoneNumber, latitude, longitude, triggerReason, sensorData }: AlertRequest = await req.json();

    if (!phoneNumber || !latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: phoneNumber, latitude, longitude" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    const message = `🚨 EMERGENCY ALERT\n\nUser is in danger!\n\nReason: ${triggerReason}\n\nLocation: ${mapsUrl}\n\nPlease check on them immediately!`;

    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioWhatsAppNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER") || "whatsapp:+14155238886";

    if (!twilioAccountSid || !twilioAuthToken) {
      console.warn("Twilio credentials not configured. Simulating alert...");
      
      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          message: "Alert simulated (Twilio not configured)",
          data: {
            phoneNumber,
            location: mapsUrl,
            triggerReason,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formattedPhone = phoneNumber.startsWith("whatsapp:") ? phoneNumber : `whatsapp:${phoneNumber}`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const formData = new URLSearchParams();
    formData.append("From", twilioWhatsAppNumber);
    formData.append("To", formattedPhone);
    formData.append("Body", message);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio error:", twilioData);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send WhatsApp message",
          details: twilioData,
        }),
        {
          status: twilioResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        simulated: false,
        message: "WhatsApp alert sent successfully",
        messageId: twilioData.sid,
        data: {
          phoneNumber,
          location: mapsUrl,
          triggerReason,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-whatsapp-alert:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
