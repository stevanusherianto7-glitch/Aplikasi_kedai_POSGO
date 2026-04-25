import { Ingredient, Recipe, TransactionItem } from "../types";

/**
 * Resto ERP Engine - Core Logic
 * Handles stock deduction, conversion, and HPP calculation.
 */

export const ERP_ENGINE = {
  /**
   * Calculate HPP for a single recipe based on current ingredient prices.
   */
  calculateRecipeHPP: (recipe: Recipe, ingredients: Ingredient[]): number => {
    return recipe.items.reduce((totalHpp, item) => {
      const ingredient = ingredients.find(ing => ing.id === item.ingredientId);
      if (!ingredient) return totalHpp;

      // Unit price = Purchase Price / Conversion Value (e.g. 100.000 / 1000gr = 100/gr)
      const unitPrice = ingredient.purchasePrice / (ingredient.conversionValue || 1);
      return totalHpp + (item.quantityNeeded * unitPrice);
    }, 0);
  },

  /**
   * Process a transaction and return the updated ingredients.
   * This handles the core "Stock Deduction" logic.
   */
  processStockDeduction: (
    items: TransactionItem[], 
    recipes: Recipe[], 
    ingredients: Ingredient[]
  ): { updatedIngredients: Ingredient[], totalHpp: number } => {
    const updatedIngredients = [...ingredients];
    let totalHpp = 0;

    items.forEach(soldItem => {
      const recipe = recipes.find(r => r.id === soldItem.recipeId);
      if (!recipe) return;

      // Calculate HPP for this item
      const itemHpp = ERP_ENGINE.calculateRecipeHPP(recipe, ingredients);
      totalHpp += itemHpp * soldItem.quantity;

      // Deduct ingredients
      recipe.items.forEach(bomItem => {
        const ingIndex = updatedIngredients.findIndex(i => i.id === bomItem.ingredientId);
        if (ingIndex !== -1) {
          const ing = updatedIngredients[ingIndex];
          const totalUsage = bomItem.quantityNeeded * soldItem.quantity;
          
          updatedIngredients[ingIndex] = {
            ...ing,
            stockQuantity: Number((ing.stockQuantity - totalUsage).toFixed(2))
          };
        }
      });
    });

    return { updatedIngredients, totalHpp };
  },

  /**
   * Process a voided transaction and return the updated ingredients (Restoration).
   */
  processStockRestoration: (
    items: TransactionItem[],
    recipes: Recipe[],
    ingredients: Ingredient[]
  ): { updatedIngredients: Ingredient[] } => {
    const updatedIngredients = [...ingredients];

    items.forEach(voidedItem => {
      const recipe = recipes.find(r => r.id === voidedItem.recipeId);
      if (!recipe) return;

      // Restore ingredients
      recipe.items.forEach(bomItem => {
        const ingIndex = updatedIngredients.findIndex(i => i.id === bomItem.ingredientId);
        if (ingIndex !== -1) {
          const ing = updatedIngredients[ingIndex];
          const totalRestore = bomItem.quantityNeeded * voidedItem.quantity;

          updatedIngredients[ingIndex] = {
            ...ing,
            stockQuantity: Number((ing.stockQuantity + totalRestore).toFixed(2))
          };
        }
      });
    });

    return { updatedIngredients };
  },

  /**
   * Check for items reaching Safety Stock levels.
   */
  getLowStockAlerts: (ingredients: Ingredient[]) => {
    return ingredients.filter(ing => ing.stockQuantity <= ing.lowStockThreshold);
  },

  /**
   * Conversion Engine Helper
   */
  convert: (value: number, conversionFactor: number): number => {
    return value / conversionFactor;
  }
};
