import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import { PrismaClient, Unit } from "@prisma/client";
const prisma = new PrismaClient();

const UNITS = [Unit.CUP, Unit.TABLESPOON, Unit.TEASPOON];

async function main() {
  // Create fixed users
  const pwdAlice = await bcrypt.hash("aliceprisma", 10);
  const pwdBob = await bcrypt.hash("bobprisma", 10);
  const fixedUsers = [
    { name: "Alice", email: "alice@prisma.io", password: pwdAlice },
    { name: "Bob", email: "bob@prisma.io", password: pwdBob },
  ];

  // Create random users
  const randomUsers = Array.from({ length: 8 }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
  }));

  // Combine fixed and random users
  const allUsers = [...fixedUsers, ...randomUsers];

  // Create users in the database
  const createdUsers = await Promise.all(
    allUsers.map((user) =>
      prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: user.password,
        },
      })
    )
  );

  console.log("Created sample users.");

  // Create random ingredients
  const ingredients = [];
  for (let i = 0; i < 100; i++) {
    const ingredient = await prisma.ingredient.create({
      data: {
        name: faker.commerce.productName(),
      },
    });
    ingredients.push(ingredient);
  }

  console.log("Created sample ingredients.");

  // Create recipes assigned to each user
  const createdRecipes = [];
  for (let i = 0; i < 10; i++) {
    const randomUser =
      createdUsers[Math.floor(Math.random() * createdUsers.length)];

    const recipe = await prisma.recipe.create({
      data: {
        title: faker.commerce.product(),
        description: faker.commerce.productDescription(),
        published: true,
        authorId: randomUser.id,
      },
    });

    // Assign random ingredients to this recipe
    const ingredientsToAdd = [];
    const randomIngredientIds: Number[] = [];
    for (let j = 0; j < 5; j++) {
      let randomIngredientId = Math.floor(Math.random() * ingredients.length);
      while (randomIngredientIds.includes(randomIngredientId)) {
        randomIngredientId = Math.floor(Math.random() * ingredients.length);
      }
      randomIngredientIds.push(randomIngredientId);
      const randomIngredient = ingredients[randomIngredientId];
      const unit = UNITS[Math.floor(Math.random() * UNITS.length)];
      const quantity = Math.floor(Math.random() * 100) + 1;

      ingredientsToAdd.push({
        recipeId: recipe.id,
        ingredientId: randomIngredient.id,
        unit: unit,
        quantity: quantity,
      });
    }

    // Create IngredientsOnRecipes entries
    await prisma.ingredientsOnRecipes.createMany({
      data: ingredientsToAdd,
    });

    createdRecipes.push(recipe);
  }

  console.log("Created sample recipes.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
