import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, name, email, phone, company, zip_code, license_number, num_techs, use_case, referral_source } = body;

    if (!type || !name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const res = await fetch(`${supabaseUrl}/rest/v1/waitlist_signups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          type,
          name,
          email,
          phone: phone || null,
          company: company || null,
          zip_code: zip_code || null,
          license_number: license_number || null,
          num_techs: num_techs ? parseInt(num_techs) : null,
          use_case: use_case || null,
          referral_source: referral_source || null,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Supabase insert failed:", errorText);
        return NextResponse.json({ error: "Failed to save signup" }, { status: 500 });
      }
    } else {
      console.log("Waitlist signup (no Supabase configured):", { type, name, email });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
