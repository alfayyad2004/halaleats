// src/services/product-api.ts

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
  
  return 'Ingredients not found for this product.';
}

export async function getProductName(barcode: string): Promise<string> {
    const onlineProduct = await fetchProductFromOpenFoodFacts(barcode);
    if (onlineProduct) {
        return onlineProduct.name;
    }

    return 'Product not found.';
}
