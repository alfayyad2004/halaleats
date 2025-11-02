// src/services/product-api.ts

// A mock API to simulate fetching product data for development and testing.
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
    name: 'Gummy Bears (Mock)',
    ingredients: 'Glucose Syrup, Sugar, Water, Gelatin (Pork), Citric Acid, Artificial Flavors, Carnauba Wax, Carmine (for color).',
  },
  '03077109': { // Another product with haram ingredient
    name: 'Fancy Liqueur Chocolates (Mock)',
    ingredients: 'Sugar, Cocoa Mass, Cocoa Butter, Invert Sugar Syrup, Alcohol, Soy Lecithin, Natural Vanilla Flavor.',
  },
  '5000159459578': { // Nutella
    name: 'Nutella',
    ingredients: 'Sugar, Palm Oil, Hazelnuts (13%), Skimmed Milk Powder (8.7%), Fat-Reduced Cocoa (7.4%), Emulsifier: Lecithins (Soya), Vanillin.'
  },
  '6953390214697': { // Holiday Foods Ketchup (Trinidad)
    name: 'Holiday Foods Tomato Ketchup',
    ingredients: 'Tomato Concentrate, Vinegar, Sugar, Salt, Spices, Onion Powder.',
  },
  '074470000105': { // KC Candy (Trinidad)
    name: 'KC Confectionery Chocolate Mint',
    ingredients: 'Sugar, Glucose Syrup, Cocoa Mass, Peppermint Oil, Soy Lecithin. May contain milk.',
  },
  '087684001104': { // Centrum Adult Multivitamin
    name: 'Centrum Adult Multivitamin',
    ingredients: 'Calcium Carbonate, Potassium Chloride, Dibasic Calcium Phosphate, Magnesium Oxide, Ascorbic Acid (Vit. C), Microcrystalline Cellulose, Ferrous Fumarate, Gelatin, Croscarmellose Sodium, Tocopheryl Acetate (Vit. E), Stearic Acid, Niacinamide, Zinc Oxide, Calcium Pantothenate, Manganese Sulfate.',
  },
  '0300054336086': { // Advil Liqui-Gels
    name: 'Advil Liqui-Gels',
    ingredients: 'Solubilized ibuprofen equal to 200 mg ibuprofen, FD&C green no. 3, gelatin, lecithin (soybean), medium-chain triglycerides, pharmaceutical ink, polyethylene glycol, potassium hydroxide, purified water, sorbitol sorbitan solution.',
  }
};

async function fetchProductFromOpenFoodFacts(barcode: string): Promise<{ name: string, ingredients: string } | null> {
    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        if (data.status === 1 && data.product) {
            const productName = data.product.product_name || 'Product name not found.';
            const ingredients = data.product.ingredients_text || 'Ingredients not found for this product.';
            return { name: productName, ingredients };
        }
        return null;
    } catch (error) {
        console.error('Error fetching from Open Food Facts API:', error);
        return null;
    }
}


export async function getProductIngredients(barcode: string): Promise<string> {
  const onlineProduct = await fetchProductFromOpenFoodFacts(barcode);
  if (onlineProduct) {
    return onlineProduct.ingredients;
  }

  const mockProduct = MOCK_PRODUCTS[barcode];
  if (mockProduct) {
    return mockProduct.ingredients;
  }
  
  return 'Ingredients not found for this product.';
}

export async function getProductName(barcode: string): Promise<string> {
    const onlineProduct = await fetchProductFromOpenFoodFacts(barcode);
    if (onlineProduct) {
        return onlineProduct.name;
    }

    const mockProduct = MOCK_PRODUCTS[barcode];
    if (mockProduct) {
        return mockProduct.name;
    }

    return 'Product not found.';
}
