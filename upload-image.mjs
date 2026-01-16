import { createClient } from '@supabase/supabase-js';
import https from 'https';

const supabaseUrl = 'https://lnfzvpaonuzbcnlulyyk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuZnp2cGFvbnV6YmNubHVseXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTU3MDcsImV4cCI6MjA3Mzc3MTcwN30.031UwVA_BNJTAvEVbjhSjzVmfLmD2hSpXZl8flSy1cw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
  });
}

async function uploadImageToSupabase() {
  try {
    // Download image - użyj obrazka z attachmentu
    const imageUrl = 'https://abedward.com/wp-content/uploads/2026/01/GUTTER-APRON.5154.png';
    console.log('Downloading drip edge flashing image...');
    const imageBuffer = await downloadImage(imageUrl);
    
    // Upload to Supabase Storage with public access
    const fileName = `public/gutter-apron-${Date.now()}.png`;
    console.log('Uploading to Supabase Storage...');
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      
      // Try alternative approach - update bucket to allow public uploads
      console.log('\nTrying to make bucket allow anonymous uploads...');
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    console.log('\n✅ Success! Public URL:', urlData.publicUrl);
    console.log('\nCopy this URL to sampleProducts.ts');
  } catch (error) {
    console.error('Error:', error);
  }
}

uploadImageToSupabase();
