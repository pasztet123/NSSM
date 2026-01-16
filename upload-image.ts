import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as https from 'https';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
  });
}

async function uploadImageToSupabase() {
  try {
    // Download image from Imgur
    const imageUrl = 'https://i.imgur.com/9XLZ8Qm.png';
    console.log('Downloading image...');
    const imageBuffer = await downloadImage(imageUrl);
    
    // Upload to Supabase Storage
    const fileName = `coping-cap-${Date.now()}.png`;
    console.log('Uploading to Supabase Storage...');
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    console.log('Success! Public URL:', urlData.publicUrl);
    console.log('\nUpdate your sampleProducts.ts with this URL');
  } catch (error) {
    console.error('Error:', error);
  }
}

uploadImageToSupabase();
