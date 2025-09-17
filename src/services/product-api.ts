// A mock API to simulate fetching product data.
const MOCK_PRODUCTS: { [barcode: string]: { name: string, ingredients: string } } = {
  '8992761134010': { // Indomie Mi Goreng
    name: 'Indomie Mi Goreng',
    ingredients: 'Noodles: Wheat Flour, Edible Vegetable Oil (Palm), Salt, Potassium Carbonate, Sodium Carbonate, Riboflavin. Seasoning Powder: Salt, Sugar, Monosodium Glutamate, Artificial Chicken Flavor, Onion Powder, Garlic Powder, White Pepper. Seasoning Oil: Edible Vegetable Oil (Palm), Onion. Sweet Soy Sauce: Sugar, Water, Salt, Soybean, Wheat. Chili Sauce: Chili, Water, Sugar, Salt, Acetic Acid, Potassium Sorbate. Fried Onion.',
  },
  '049000050103': { // Coca-Cola
    name: 'Coca-Cola Classic',
    ingredients: 'Carbonated Water, High Fructose Corn Syrup, Caramel Color, Phosphoric Acid, Natural Flavors, Caffeine.',
  },
  '7891000055013': { // Product with haram ingredient
    name: 'Gummy Bears',
    ingredients: 'Glucose Syrup, Sugar, Water, Gelatin, Citric Acid, Artificial Flavors, Carnauba Wax, Carmine (for color).',
  },
  '03077109': { // Another product with haram ingredient
    name: 'Fancy Liqueur Chocolates',
    ingredients: 'Sugar, Cocoa Mass, Cocoa Butter, Invert Sugar Syrup, Alcohol, Soy Lecithin, Natural Vanilla Flavor.',
  }
};

export async function getProductIngredients(barcode: string): Promise<string> {
  const product = MOCK_PRODUCTS[barcode];
  if (product) {
    return product.ingredients;
  }
  return 'Ingredients not found for this product.';
}

export async function getProductName(barcode: string): Promise<string> {
    const product = MOCK_PRODUCTS[barcode];
    if (product) {
        return product.name;
    }
    return 'Product not found.';
}
