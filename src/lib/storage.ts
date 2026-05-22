import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set — file uploads will fail');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadProofImage(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('proofs')
    .upload(filename, buffer, {
      contentType,
      upsert: true,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('proofs')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
