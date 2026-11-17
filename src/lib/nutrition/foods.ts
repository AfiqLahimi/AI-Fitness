/**
 * Malaysian & everyday food database.
 * Values are per typical serving and are approximate — compiled from commonly
 * cited figures (e.g. Malaysian Food Composition Database / MyFCD, HPB Singapore
 * food listings for shared hawker dishes, USDA for basics). Real portions vary
 * a lot between stalls, so the UI always labels these as estimates.
 */
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";
export type FoodTag =
  | "halal" | "vegetarian" | "vegan" | "beef" | "seafood" | "dairy" | "spicy" | "high_protein" | "fried" | "local";

export interface Food {
  id: string;
  name: string;
  serving: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  slots: MealSlot[];
  tags: FoodTag[];
  note?: string;
}

const F = (
  id: string, name: string, serving: string, kcal: number, protein: number, carbs: number, fat: number,
  slots: MealSlot[], tags: FoodTag[], note?: string,
): Food => ({ id, name, serving, kcal, protein, carbs, fat, slots, tags, note });

export const FOODS: Food[] = [
  // ── Malaysian classics
  F("nasi-lemak-biasa", "Nasi lemak (egg, sambal, ikan bilis, peanuts)", "1 plate", 495, 14, 60, 22, ["breakfast", "lunch"], ["halal", "local", "spicy", "seafood"], "Ask for less santan rice or extra cucumber to lighten it."),
  F("nasi-lemak-ayam", "Nasi lemak with fried chicken", "1 plate", 790, 34, 72, 40, ["lunch", "dinner"], ["halal", "local", "spicy", "fried", "high_protein"]),
  F("nasi-lemak-light", "Nasi lemak — half rice, boiled egg, extra cucumber", "1 plate", 360, 13, 42, 15, ["breakfast", "lunch"], ["halal", "local", "spicy", "seafood"]),
  F("chicken-rice-roasted", "Chicken rice (roasted)", "1 plate", 600, 30, 70, 21, ["lunch", "dinner"], ["halal", "local", "high_protein"], "Halal at certified stalls only — check the logo."),
  F("chicken-rice-steamed-skinless", "Steamed chicken rice, skin removed", "1 plate", 480, 32, 66, 9, ["lunch", "dinner"], ["halal", "local", "high_protein"]),
  F("nasi-ayam-penyet", "Nasi ayam penyet", "1 plate", 720, 38, 70, 30, ["lunch", "dinner"], ["halal", "local", "spicy", "fried", "high_protein"]),
  F("roti-canai-kosong", "Roti canai kosong with dhal", "1 piece", 300, 7, 40, 12, ["breakfast", "snack"], ["halal", "vegetarian", "local"]),
  F("roti-telur", "Roti telur with dhal", "1 piece", 390, 13, 42, 18, ["breakfast"], ["halal", "vegetarian", "local"]),
  F("thosai", "Thosai with chutney", "1 piece", 210, 5, 36, 5, ["breakfast", "snack"], ["halal", "vegetarian", "vegan", "local"]),
  F("chapati-dhal", "Chapati with dhal", "2 pieces", 360, 13, 56, 9, ["breakfast", "dinner"], ["halal", "vegetarian", "vegan", "local"]),
  F("nasi-campur-lean", "Nasi campur — rice, ayam bakar, 2 vegetables", "1 plate", 560, 36, 68, 15, ["lunch", "dinner"], ["halal", "local", "high_protein"]),
  F("nasi-campur-fish", "Nasi campur — rice, ikan bakar, sayur", "1 plate", 520, 34, 66, 12, ["lunch", "dinner"], ["halal", "local", "seafood", "high_protein"]),
  F("nasi-goreng-kampung", "Nasi goreng kampung", "1 plate", 640, 20, 80, 26, ["lunch", "dinner"], ["halal", "local", "spicy", "seafood", "fried"]),
  F("mee-goreng-mamak", "Mee goreng mamak", "1 plate", 660, 20, 86, 26, ["lunch", "dinner"], ["halal", "local", "spicy", "fried"]),
  F("char-kuey-teow", "Char kuey teow", "1 plate", 740, 23, 76, 38, ["lunch", "dinner"], ["seafood", "local", "fried"], "Usually not halal (lard) unless at a certified stall."),
  F("mee-rebus", "Mee rebus", "1 bowl", 560, 20, 82, 16, ["breakfast", "lunch"], ["halal", "local"]),
  F("laksa-asam", "Asam laksa", "1 bowl", 435, 22, 70, 7, ["lunch", "dinner"], ["halal", "local", "seafood", "spicy"]),
  F("curry-laksa", "Curry laksa", "1 bowl", 590, 24, 50, 32, ["lunch", "dinner"], ["halal", "local", "spicy", "seafood"]),
  F("soto-ayam", "Soto ayam with nasi impit", "1 bowl", 420, 26, 54, 10, ["lunch", "dinner"], ["halal", "local", "high_protein"]),
  F("bihun-sup", "Bihun sup ayam", "1 bowl", 360, 22, 52, 7, ["breakfast", "lunch", "dinner"], ["halal", "local"]),
  F("yong-tau-foo-soup", "Yong tau foo (soup, 6 pieces + noodles)", "1 bowl", 400, 25, 48, 11, ["lunch", "dinner"], ["local", "seafood", "high_protein"], "Many stalls are halal-certified — check."),
  F("satay-ayam", "Satay ayam with kuah kacang", "10 sticks", 420, 36, 18, 22, ["dinner", "snack"], ["halal", "local", "high_protein"]),
  F("satay-ayam-ketupat", "Satay ayam (6) with ketupat & cucumber", "1 serving", 420, 26, 40, 16, ["dinner"], ["halal", "local", "high_protein"]),
  F("ayam-bakar-rice", "Ayam bakar with rice & ulam", "1 plate", 580, 40, 62, 16, ["lunch", "dinner"], ["halal", "local", "high_protein"]),
  F("ikan-bakar-rice", "Ikan bakar with rice & air asam", "1 plate", 500, 38, 60, 11, ["lunch", "dinner"], ["halal", "local", "seafood", "high_protein", "spicy"]),
  F("rendang-daging-rice", "Beef rendang with rice", "1 plate", 690, 32, 66, 32, ["lunch", "dinner"], ["halal", "local", "beef", "spicy"]),
  F("sup-tulang", "Sup daging with rice", "1 plate", 560, 32, 62, 18, ["lunch", "dinner"], ["halal", "local", "beef"]),
  F("kuey-teow-soup", "Kuey teow soup with fish balls", "1 bowl", 380, 20, 58, 7, ["breakfast", "lunch"], ["local", "seafood"]),
  F("nasi-kerabu", "Nasi kerabu with ayam percik", "1 plate", 610, 33, 76, 18, ["lunch", "dinner"], ["halal", "local", "high_protein"]),
  F("tosai-masala", "Masala thosai", "1 piece", 350, 7, 52, 12, ["breakfast", "lunch"], ["halal", "vegetarian", "vegan", "local", "spicy"]),
  F("banana-leaf-veg", "Banana leaf rice — vegetarian", "1 plate", 620, 15, 98, 18, ["lunch"], ["halal", "vegetarian", "local", "spicy"]),
  F("kaya-toast-set", "Kaya toast, 2 half-boiled eggs & kopi-o kosong", "1 set", 390, 16, 40, 18, ["breakfast"], ["halal", "vegetarian", "local", "dairy"]),
  F("oats-pisang", "Oats with banana & milk", "1 bowl", 330, 13, 55, 7, ["breakfast"], ["halal", "vegetarian", "dairy"]),
  F("bubur-ayam", "Bubur ayam (chicken porridge)", "1 bowl", 330, 22, 46, 6, ["breakfast", "dinner"], ["halal", "local", "high_protein"]),
  F("ubi-rebus", "Ubi kayu rebus with sambal ikan bilis", "1 serving", 280, 7, 52, 5, ["snack", "breakfast"], ["halal", "local", "seafood", "spicy"]),
  F("kuih-muih", "Kuih (e.g. kuih lapis / seri muka)", "2 pieces", 240, 3, 42, 7, ["snack"], ["halal", "vegetarian", "local"]),
  F("goreng-pisang", "Pisang goreng", "3 pieces", 330, 3, 42, 17, ["snack"], ["halal", "vegetarian", "vegan", "local", "fried"]),
  F("tauhu-bakar", "Tauhu bakar with peanut sauce", "1 serving", 290, 17, 15, 18, ["snack", "dinner"], ["halal", "vegetarian", "vegan", "local", "high_protein"]),
  F("tempeh-goreng-rice", "Rice, tempeh goreng & sayur campur", "1 plate", 560, 26, 70, 19, ["lunch", "dinner"], ["halal", "vegetarian", "vegan", "local", "high_protein"]),
  // ── Clean / home-cooked staples
  F("grilled-chicken-rice-veg", "Grilled chicken breast, rice & vegetables", "1 plate", 520, 45, 58, 10, ["lunch", "dinner"], ["halal", "high_protein"]),
  F("grilled-chicken-salad", "Grilled chicken salad with olive oil", "1 bowl", 380, 40, 14, 18, ["lunch", "dinner"], ["halal", "high_protein"]),
  F("steamed-fish-rice", "Steamed fish (siakap), rice & sayur", "1 plate", 470, 38, 56, 9, ["lunch", "dinner"], ["halal", "seafood", "high_protein"]),
  F("salmon-potato", "Baked salmon, potatoes & broccoli", "1 plate", 560, 38, 42, 25, ["dinner"], ["halal", "seafood", "high_protein"]),
  F("tuna-sandwich", "Wholemeal tuna sandwich", "1 sandwich", 340, 26, 34, 10, ["breakfast", "lunch", "snack"], ["halal", "seafood", "high_protein"]),
  F("egg-white-omelette", "3-egg omelette with vegetables & wholemeal toast", "1 plate", 380, 25, 28, 18, ["breakfast"], ["halal", "vegetarian", "high_protein"]),
  F("boiled-eggs", "Hard-boiled eggs", "2 eggs", 155, 13, 1, 11, ["breakfast", "snack"], ["halal", "vegetarian", "high_protein"]),
  F("brown-rice-chicken", "Brown rice, ayam masak kicap (lean) & kangkung", "1 plate", 540, 38, 62, 14, ["lunch", "dinner"], ["halal", "local", "high_protein"]),
  F("tofu-stirfry", "Tofu & vegetable stir-fry with brown rice", "1 plate", 480, 24, 62, 15, ["lunch", "dinner"], ["halal", "vegetarian", "vegan", "high_protein"]),
  F("dhal-rice", "Dhal curry, rice & cucumber", "1 plate", 450, 17, 76, 8, ["lunch", "dinner"], ["halal", "vegetarian", "vegan", "local"]),
  F("lean-beef-stirfry", "Lean beef & broccoli stir-fry with rice", "1 plate", 560, 38, 58, 17, ["dinner"], ["halal", "beef", "high_protein"]),
  F("prawn-noodle-soup", "Prawn & vegetable noodle soup", "1 bowl", 420, 28, 56, 8, ["lunch", "dinner"], ["halal", "seafood", "high_protein"]),
  // ── Snacks & extras
  F("greek-yogurt", "Greek yogurt (plain) with berries", "1 cup", 190, 18, 18, 4, ["snack", "breakfast"], ["halal", "vegetarian", "dairy", "high_protein"]),
  F("soy-milk", "Unsweetened soy milk", "1 glass (250 ml)", 100, 8, 4, 5, ["snack", "breakfast"], ["halal", "vegetarian", "vegan"]),
  F("whey-shake", "Whey protein shake with water", "1 scoop", 120, 24, 3, 1.5, ["snack"], ["halal", "vegetarian", "dairy", "high_protein"], "Choose a halal-certified brand if needed."),
  F("banana", "Banana (pisang)", "1 medium", 105, 1.3, 27, 0.4, ["snack", "breakfast"], ["halal", "vegetarian", "vegan"]),
  F("papaya", "Papaya", "1 cup", 60, 0.7, 15, 0.4, ["snack", "breakfast"], ["halal", "vegetarian", "vegan", "local"]),
  F("mixed-nuts", "Mixed nuts (unsalted)", "30 g", 180, 5, 6, 16, ["snack"], ["halal", "vegetarian", "vegan"]),
  F("milo-kosong", "Milo kosong (no added sugar, low-fat milk)", "1 cup", 130, 7, 20, 3, ["snack", "breakfast"], ["halal", "vegetarian", "dairy", "local"]),
  F("teh-tarik", "Teh tarik", "1 cup", 160, 4, 26, 4.5, ["snack", "breakfast"], ["halal", "vegetarian", "dairy", "local"], "Ask for 'kurang manis' to cut sugar."),
  F("edamame", "Edamame", "1 cup", 190, 17, 14, 8, ["snack"], ["halal", "vegetarian", "vegan", "high_protein"]),
  F("chicken-breast-cooked", "Chicken breast, grilled", "100 g", 165, 31, 0, 3.6, ["snack", "lunch", "dinner"], ["halal", "high_protein"]),
  F("white-rice", "White rice", "1 cup cooked (160 g)", 205, 4.2, 45, 0.4, ["lunch", "dinner"], ["halal", "vegetarian", "vegan"]),
  F("sayur-campur", "Stir-fried mixed vegetables", "1 cup", 90, 3, 10, 4.5, ["lunch", "dinner"], ["halal", "vegetarian", "vegan"]),
];

export const FOOD_BY_ID = new Map(FOODS.map((f) => [f.id, f]));
