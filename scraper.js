const { chromium } = require("playwright");

// Function to load all recipes by clicking the "Load More" button until it's no longer visible
async function loadAllRecipes(page, loadMoreButtonSelector) {
  while (await page.isVisible(loadMoreButtonSelector)) {
    await page.click(loadMoreButtonSelector);
    await page.waitForTimeout(2000); // Wait for 2 seconds before the next action
  }
}

// Function to scrape recipe links from the main page
async function scrapeRecipeLinksFromMainPage(page) {
  const recipeLinks = [];
  try {
    await page.goto("https://www.foodnetwork.com/recipes");

    await loadAllRecipes(page, ".o-Button--load-more");

    const recipeElements = await page.$$(
      ".o-Capsule__m-MediaBlock.m-MediaBlock"
    );
    for (const recipeElement of recipeElements) {
      const textWrap = await recipeElement.$(".m-MediaBlock__m-TextWrap");
      if (textWrap) {
        const url = await textWrap.$eval("a", (a) => a.href); // Extract the href attribute of the anchor tag
        console.log(url);
        recipeLinks.push(url);
      }
    }
    console.log("Total recipes from main page: " + recipeLinks.length);
  } catch (error) {
    console.error("Error in scrapeRecipeLinksFromMainPage: ", error);
  }

  return recipeLinks;
}

// Function to scrape recipe links from the A-Z pages
async function scrapeRecipeLinksFromAlphabetPage(page) {
  const recipeLinks = [];

  try {
    for (let pageNum = 1; pageNum <= 5; pageNum++) {
      await page.goto(
        `https://www.foodnetwork.com/recipes/recipes-a-z/s/p/${pageNum}`
      );

      const recipeElements = await page.$$(".m-PromoList__a-ListItem");
      for (const recipeElement of recipeElements) {
        const url = await recipeElement.$eval("a", (a) => a.href); // Extract the href attribute of the anchor tag
        console.log(url);
        recipeLinks.push(url);
      }

      console.log(`--------- End of page ${pageNum} ---------`);
    }

    console.log("Total recipes from A-Z pages: " + recipeLinks.length);
  } catch (error) {
    console.error("Error in scrapeRecipeLinksFromAlphabetPage: ", error);
  }

  return recipeLinks;
}

// Function to filter and print recipe URLs that contain the word "soup"
async function filterSoupRecipes(recipeUrls) {
  const soupRegex = /soup/i;

  recipeUrls.forEach((url) => {
    if (soupRegex.test(url)) {
      console.log("Recipe URL containing 'soup': " + url);
    }
  });
}

// Function to scrape details (author, ingredients, instructions) from a specific recipe URL
async function scrapeRecipeDetails(page, recipeUrl) {
  const recipeDetails = [];

  try {
    await page.goto(recipeUrl);

    const authorElement = await page.$(".o-Attribution__a-Name");
    const authorName = await authorElement.$eval("a", (a) =>
      a.textContent.trim()
    );
    recipeDetails.push(authorName);

    const ingredientElements = await page.$$(".o-Ingredients__a-Ingredient");
    for (const ingredientElement of ingredientElements) {
      const ingredientText = await ingredientElement.$eval(
        ".o-Ingredients__a-Ingredient--CheckboxLabel",
        (span) => span.textContent.trim()
      );
      recipeDetails.push(ingredientText);
      console.log(ingredientText);
    }

    const instructionElements = await page.$$(".o-Method__m-Step");
    for (const instructionElement of instructionElements) {
      const instructionText = await instructionElement.evaluate((txt) =>
        txt.textContent.trim()
      );
      recipeDetails.push(instructionText);
      console.log(instructionText);
    }

    return recipeDetails;
  } catch (error) {
    console.error("Error in scrapeRecipeDetails: ", error);
  }
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Scrape recipe links from the main page
    const mainPageRecipeLinks = await scrapeRecipeLinksFromMainPage(page);

    // Scrape recipe links from the A-Z pages
    const alphabetPageRecipeLinks = await scrapeRecipeLinksFromAlphabetPage(
      page
    );

    // Combine all recipe links from both sources
    const allRecipeLinks = mainPageRecipeLinks.concat(alphabetPageRecipeLinks);

    // Filter and print soup recipes
    filterSoupRecipes(allRecipeLinks);

    // Scrape and print details of a specific recipe
    const recipeDetails = await scrapeRecipeDetails(
      page,
      "https://www.foodnetwork.com/recipes/michael-chiarello/super-tuscan-white-bean-soup-recipe-1947697"
    );
    console.log(recipeDetails);
  } catch (error) {
    console.error("Error in main function: ", error);
  } finally {
    await browser.close(); // Ensure the browser is closed after the script completes
  }
})();
