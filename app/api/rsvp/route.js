import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getUser(request) {
  const token = request.cookies.get("sb-access-token")?.value;
  if (!token) return null;
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function GET(request) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("invitaciones")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data || []);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const full_name = body.full_name?.toString().trim();
    const attendance = body.attendance?.toString().trim();
    const is_celiac = Boolean(body.is_celiac);
    const is_vegetarian = Boolean(body.is_vegetarian);
    const is_allergic = Boolean(body.is_allergic);
    const dietary_notes = body.dietary_notes?.toString().trim() || null;

    if (!full_name) {
      return Response.json(
        { error: "Por favor ingresá tu nombre y apellido." },
        { status: 400 }
      );
    }

    const validAttendances = ["asistire", "no_asistire", "no_lo_se"];
    if (!validAttendances.includes(attendance)) {
      return Response.json(
        { error: "Seleccioná una opción de asistencia válida." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("invitaciones")
      .insert([
        {
          full_name,
          attendance,
          is_celiac,
          is_vegetarian,
          is_allergic,
          dietary_notes,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error al guardar confirmación:", error);
      return Response.json(
        { error: "No se pudo guardar la confirmación. Verificá que la tabla 'invitaciones' esté creada en Supabase." },
        { status: 500 }
      );
    }

    return Response.json(data, { status: 201 });
  } catch (err) {
    console.error("Error en POST /api/rsvp:", err);
    return Response.json(
      { error: "Error al procesar la solicitud." },
      { status: 400 }
    );
  }
}

export async function DELETE(request) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "ID requerido." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("invitaciones")
    .delete()
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
