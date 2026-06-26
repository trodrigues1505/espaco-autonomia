/**
 * src/lib/supabase.js
 * Responsabilidade: instanciar e exportar o cliente Supabase.
 * Único lugar onde as credenciais aparecem no código.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL  = 'https://kctgcjvfsuinwlbgljdw.supabase.co'
export const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdGdjanZmc3VpbndsYmdsamR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDA5MDUsImV4cCI6MjA5NDg3NjkwNX0.HatTsAaRpvg0Icpxm3MsVbYQgmnKikb6A0ataAEZ_68'
export const sb = createClient(SUPABASE_URL, SUPABASE_ANON)

// Expõe globalmente para módulos não-ESM (ex: onclick inline no HTML)
window._sb = sb    
