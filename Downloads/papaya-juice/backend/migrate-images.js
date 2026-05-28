// ══════════════════════════════════════════════
//  Papaya Juice — Migration base64 → Supabase Storage
//  Run: node migrate-images.js
// ══════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rlwshuurruvtnqwgbjkl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsd3NodXVycnV2dG5xd2diamtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI3OTMyMCwiZXhwIjoyMDk0ODU1MzIwfQ.ry0g0Qi3C3OQd2M11jqdh2JG_4OvNp7tSI5usyMKdtA';
const BUCKET = 'product-images';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrate() {
    console.log('🚀 Bda migration...\n');

    // 1. Fetch all products
    const { data: products, error } = await supabase.from('products').select('*');
    if (error) { console.error('❌ Error fetching products:', error.message); return; }
    console.log(`📦 ${products.length} produits trouvés\n`);

    // 2. Create bucket if not exists
    const { error: bucketErr } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (bucketErr && !bucketErr.message.includes('already exists')) {
        console.error('❌ Bucket error:', bucketErr.message); return;
    }
    console.log(`🪣 Bucket "${BUCKET}" prêt\n`);

    let success = 0, skipped = 0, failed = 0;

    for (const product of products) {
        const { id, title, image } = product;

        // Skip if already a URL (already migrated)
        if (!image || image.startsWith('http')) {
            console.log(`⏭️  Skip "${title}" (déjà URL ou pas d'image)`);
            skipped++;
            continue;
        }

        try {
            // Parse base64
            const matches = image.match(/^data:(.+);base64,(.+)$/);
            if (!matches) {
                console.log(`⚠️  Skip "${title}" (format invalide)`);
                skipped++;
                continue;
            }

            const mimeType = matches[1]; // ex: image/png
            const base64Data = matches[2];
            const ext = mimeType.split('/')[1] || 'png';
            const fileName = `product_${id}.${ext}`;

            // Convert base64 to buffer
            const buffer = Buffer.from(base64Data, 'base64');

            // Upload to Supabase Storage
            const { error: uploadErr } = await supabase.storage
                .from(BUCKET)
                .upload(fileName, buffer, {
                    contentType: mimeType,
                    upsert: true
                });

            if (uploadErr) throw uploadErr;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from(BUCKET)
                .getPublicUrl(fileName);

            const publicUrl = urlData.publicUrl;

            // Update product record
            const { error: updateErr } = await supabase
                .from('products')
                .update({ image: publicUrl })
                .eq('id', id);

            if (updateErr) throw updateErr;

            console.log(`✅ "${title}" → ${publicUrl}`);
            success++;

        } catch (err) {
            console.error(`❌ "${title}" failed:`, err.message);
            failed++;
        }
    }

    console.log('\n══════════════════════════════');
    console.log(`✅ Migrated: ${success}`);
    console.log(`⏭️  Skipped:  ${skipped}`);
    console.log(`❌ Failed:   ${failed}`);
    console.log('══════════════════════════════');

    if (success > 0) {
        console.log('\n🎉 Migration terminée! Les images sont maintenant dans Supabase Storage.');
        console.log('📌 Les URLs sont déjà sauvegardées dans la table products.');
    }
}

migrate();
