/**
 * One-time script: Generate embeddings for all FAQs that don't have them yet.
 * Run with: node scripts/backfill-embeddings.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Faq = require('../models/Faq');
const { getEmbedding } = require('../services/embedding');

async function backfill() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const faqs = await Faq.find({ $or: [{ embedding: { $size: 0 } }, { embedding: { $exists: false } }] });
    console.log(`Found ${faqs.length} FAQs without embeddings. Generating...\n`);

    let success = 0;
    let failed = 0;

    for (const faq of faqs) {
        try {
            const embedding = await getEmbedding(faq.question);
            if (embedding) {
                faq.embedding = embedding;
                await faq.save();
                success++;
                console.log(`  ✅ "${faq.question.substring(0, 50)}..."`);
            } else {
                failed++;
                console.log(`  ❌ No embedding returned for: "${faq.question.substring(0, 50)}"`);
            }
            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 500));
        } catch (err) {
            failed++;
            console.error(`  ❌ Error for "${faq.question.substring(0, 50)}": ${err.message}`);
        }
    }

    console.log(`\n🎉 Done! Success: ${success}, Failed: ${failed}`);
    await mongoose.disconnect();
}

backfill().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
