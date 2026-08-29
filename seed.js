/**
 * Standalone FAQ seeder.
 * Usage: node seed.js
 *
 * Requires MONGO_URI and MISTRAL_API_KEY in the environment (.env).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Faq = require('./models/Faq');
const { getEmbedding } = require('./services/embedding');

const MONGO_URI = process.env.MONGO_URI;
const guildId = process.env.SEED_GUILD_ID || '1377306965872611388';

const faqs = [
  {
    question: 'Is coffee provided in the hackathon?',
    answer: 'Yes, coffee will be available throughout the event.',
  },
  {
    question: 'Will there be Wi-Fi at the venue?',
    answer: 'Yes, high-speed Wi-Fi will be provided to all participants.',
  },
  {
    question: 'Are there resting areas at the hackathon?',
    answer: 'Yes, there will be designated rest zones with bean bags and beds.',
  },
  {
    question: 'Are goodies provided in the hackathon?',
    answer: 'Yes, participants will receive goodies during the event.',
  },
  {
    question: 'Will we receive goodies?',
    answer: 'Yes, each participant receives a goodie bag.',
  },
];

async function seed() {
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  await Faq.deleteMany({ guildId });

  for (const item of faqs) {
    const embedding = await getEmbedding(item.question);
    await Faq.create({
      guildId,
      question: item.question,
      answer: item.answer,
      embedding: embedding || undefined,
    });
    console.log(`✅ Seeded: ${item.question}`);
  }

  console.log('🎉 Seeding complete.');
}

seed()
  .catch((err) => {
    console.error('Error seeding DB:', err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
