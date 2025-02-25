import { Prisma, Word } from '@prisma/client';
import { prisma } from '..';

class WordController {
  async getRandomWords(
    langCode: LangCode,
    difficulty: Difficulty,
    excludeIds: number[],
    count = 3
  ) {
    return prisma.$queryRaw<Word[]>`
      SELECT w.id, w.word FROM Word w
      JOIN Language l ON w.languageId = l.id
      JOIN Difficulty d ON w.difficultyId = d.id
      WHERE l.code = ${langCode} 
        AND d.name = ${difficulty} 
        ${
          excludeIds.length
            ? Prisma.sql`AND id NOT IN (${Prisma.join(excludeIds)})`
            : Prisma.empty
        }
      ORDER BY RANDOM() 
      LIMIT ${count};
    `;
  }
}

export const wordController = new WordController();
