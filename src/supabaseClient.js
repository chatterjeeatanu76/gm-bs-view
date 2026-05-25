import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://soubaetsvxxuubnruuyd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvdWJhZXRzdnh4dXVibnJ1dXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MzQ1NzAsImV4cCI6MjA5NTAxMDU3MH0.oB4XXGrYzZPoyoT6ioxJh5KKz8ULnSyum2SvmpjzdJk'
)
