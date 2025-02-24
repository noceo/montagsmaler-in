import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  // 1. Create the 'English' language
  const englishLanguage = await prisma.language.create({
    data: {
      name: 'English',
      code: 'en',
    },
  });

  // 2. Create difficulties from A1 to C2
  const difficulties = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const difficultyEntries = await Promise.all(
    difficulties.map(async (difficultyName) => {
      return prisma.difficulty.upsert({
        where: { name: difficultyName },
        update: {},
        create: { name: difficultyName },
      });
    })
  );

  // 3. Read words from a text file (one word per line)
  const wordsFilePath = path.join(__dirname, '..', 'word-lists', 'en.txt');
  const wordsData = fs
    .readFileSync(wordsFilePath, 'utf-8')
    .split('\n')
    .map((word) => word.trim())
    .filter((word) => word);

  // 4. Insert words into the database with English language and random difficulty (A1 to C2)
  for (const word of wordsData) {
    // Assign a random difficulty level from the available difficulties
    const randomDifficulty =
      difficultyEntries[Math.floor(Math.random() * difficultyEntries.length)];

    await prisma.word.create({
      data: {
        word,
        languageId: englishLanguage.id,
        difficultyId: randomDifficulty.id,
      },
    });
  }

  console.log(
    `Successfully seeded ${wordsData.length} words with difficulties!`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
