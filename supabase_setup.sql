-- Ejecutá este script en el SQL Editor de tu proyecto en Supabase:

CREATE TABLE IF NOT EXISTS public.invitaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  attendance TEXT NOT NULL CHECK (attendance IN ('asistire', 'no_asistire', 'no_lo_se')),
  is_celiac BOOLEAN DEFAULT FALSE,
  is_vegetarian BOOLEAN DEFAULT FALSE,
  is_allergic BOOLEAN DEFAULT FALSE,
  dietary_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.invitaciones ENABLE ROW LEVEL SECURITY;

-- Permitir inserción pública desde el formulario de invitación
CREATE POLICY "Permitir insertar confirmaciones" ON public.invitaciones
  FOR INSERT WITH CHECK (true);

-- Permitir lectura para el panel de administración
CREATE POLICY "Permitir lectura de confirmaciones" ON public.invitaciones
  FOR SELECT USING (true);
