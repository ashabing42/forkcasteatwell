// Recipes supplied by the MealMap owner ("20 Easy, Fast, Healthy Recipes").
import type { Recipe } from "./mealmap";

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=1000&q=80&auto=format&fit=crop`;

export const USER_RECIPES: Omit<Recipe, "id">[] = [
 {
  "title": "Chickpea & Spinach Curry",
  "image_url": img("1455619452474-d2be8b1e70cd"),
  "servings": 2,
  "prep_minutes": 5,
  "cook_minutes": 15,
  "diet_tags": [
   "vegan",
   "vegetarian",
   "gluten-free"
  ],
  "meal_types": [
   "lunch",
   "dinner"
  ],
  "ingredients": [
   {
    "name": "chickpeas (400 g)",
    "quantity": 1,
    "unit": "tin",
    "category": "pantry"
   },
   {
    "name": "chopped tomatoes (400 g)",
    "quantity": 1,
    "unit": "tin",
    "category": "pantry"
   },
   {
    "name": "coconut milk",
    "quantity": 100,
    "unit": "ml",
    "category": "pantry"
   },
   {
    "name": "spinach (60 g)",
    "quantity": 2,
    "unit": "handful",
    "category": "produce"
   },
   {
    "name": "onion",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "garlic",
    "quantity": 2,
    "unit": "clove",
    "category": "produce"
   },
   {
    "name": "curry powder",
    "quantity": 1,
    "unit": "tbsp",
    "category": "spices"
   },
   {
    "name": "olive oil",
    "quantity": 1,
    "unit": "tbsp",
    "category": "pantry"
   },
   {
    "name": "salt",
    "quantity": null,
    "unit": "",
    "category": "spices"
   }
  ],
  "steps": [
   "Fry the onion in the oil for 5 min until soft. Add the garlic and curry powder and cook for 1 min.",
   "Add the tomatoes, chickpeas and coconut milk. Simmer for 10 min.",
   "Stir in the spinach until it wilts. Season and serve with rice or bread."
  ],
  "prep_tasks": []
 },
 {
  "title": "Peanut Noodle Bowl",
  "image_url": img("1569718212165-3a8278d5f624"),
  "servings": 2,
  "prep_minutes": 5,
  "cook_minutes": 10,
  "diet_tags": [
   "vegan",
   "vegetarian"
  ],
  "meal_types": [
   "lunch",
   "dinner"
  ],
  "ingredients": [
   {
    "name": "rice or wholewheat noodles",
    "quantity": 150,
    "unit": "g",
    "category": "pantry"
   },
   {
    "name": "peanut butter",
    "quantity": 2,
    "unit": "tbsp",
    "category": "pantry"
   },
   {
    "name": "soy sauce",
    "quantity": 2,
    "unit": "tbsp",
    "category": "spices"
   },
   {
    "name": "lime juice",
    "quantity": 1,
    "unit": "tbsp",
    "category": "produce"
   },
   {
    "name": "maple syrup",
    "quantity": 1,
    "unit": "tsp",
    "category": "pantry"
   },
   {
    "name": "carrot",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "cucumber",
    "quantity": 0.5,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "spring onions",
    "quantity": 2,
    "unit": "",
    "category": "produce"
   }
  ],
  "steps": [
   "Cook the noodles as the packet says, then drain.",
   "Whisk the peanut butter, soy sauce, lime juice, maple syrup and 3 tbsp hot water into a sauce.",
   "Toss the noodles in the sauce and top with the carrot, cucumber and spring onions."
  ],
  "prep_tasks": []
 },
 {
  "title": "Black Bean Tacos",
  "image_url": img("1599020792689-9fde458e7e17"),
  "servings": 2,
  "prep_minutes": 5,
  "cook_minutes": 10,
  "diet_tags": [
   "vegan",
   "vegetarian"
  ],
  "meal_types": [
   "lunch",
   "dinner"
  ],
  "ingredients": [
   {
    "name": "black beans (400 g)",
    "quantity": 1,
    "unit": "tin",
    "category": "pantry"
   },
   {
    "name": "small corn tortillas",
    "quantity": 6,
    "unit": "",
    "category": "bakery"
   },
   {
    "name": "avocado",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "tomato",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "red onion",
    "quantity": 0.5,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "cumin",
    "quantity": 1,
    "unit": "tsp",
    "category": "spices"
   },
   {
    "name": "smoked paprika",
    "quantity": 1,
    "unit": "tsp",
    "category": "spices"
   },
   {
    "name": "lime",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "salt",
    "quantity": null,
    "unit": "",
    "category": "spices"
   }
  ],
  "steps": [
   "Warm the beans in a pan with the cumin, paprika and a splash of water, about 5 min. Mash them lightly.",
   "Mash the avocado with half the lime juice and a pinch of salt.",
   "Warm the tortillas. Fill them with beans, avocado, tomato and onion, then squeeze over the rest of the lime."
  ],
  "prep_tasks": []
 },
 {
  "title": "Red Lentil Soup",
  "image_url": img("1547592180-85f173990554"),
  "servings": 2,
  "prep_minutes": 5,
  "cook_minutes": 20,
  "diet_tags": [
   "vegan",
   "vegetarian",
   "gluten-free"
  ],
  "meal_types": [
   "lunch",
   "dinner"
  ],
  "ingredients": [
   {
    "name": "red lentils",
    "quantity": 150,
    "unit": "g",
    "category": "pantry"
   },
   {
    "name": "onion",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "carrot",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "garlic",
    "quantity": 2,
    "unit": "clove",
    "category": "produce"
   },
   {
    "name": "cumin",
    "quantity": 1,
    "unit": "tsp",
    "category": "spices"
   },
   {
    "name": "vegetable stock",
    "quantity": 750,
    "unit": "ml",
    "category": "pantry"
   },
   {
    "name": "olive oil",
    "quantity": 1,
    "unit": "tbsp",
    "category": "pantry"
   },
   {
    "name": "lemon",
    "quantity": 0.5,
    "unit": "",
    "category": "produce"
   }
  ],
  "steps": [
   "Fry the onion and carrot in the oil for 5 min. Add the garlic and cumin and cook for 1 min.",
   "Add the lentils and stock. Simmer for 15–18 min until the lentils are soft.",
   "Blend partly or fully, squeeze in the lemon and season."
  ],
  "prep_tasks": []
 },
 {
  "title": "Overnight Oats with Berries",
  "image_url": img("1517673400267-0251440c45dc"),
  "servings": 1,
  "prep_minutes": 5,
  "cook_minutes": 0,
  "diet_tags": [
   "vegan",
   "vegetarian"
  ],
  "meal_types": [
   "breakfast"
  ],
  "ingredients": [
   {
    "name": "rolled oats",
    "quantity": 50,
    "unit": "g",
    "category": "pantry"
   },
   {
    "name": "plant milk",
    "quantity": 150,
    "unit": "ml",
    "category": "dairy"
   },
   {
    "name": "chia seeds",
    "quantity": 1,
    "unit": "tbsp",
    "category": "pantry"
   },
   {
    "name": "maple syrup",
    "quantity": 1,
    "unit": "tsp",
    "category": "pantry"
   },
   {
    "name": "berries",
    "quantity": 1,
    "unit": "handful",
    "category": "produce"
   }
  ],
  "steps": [
   "Mix the oats, milk, chia and maple syrup in a jar.",
   "Cover and chill overnight.",
   "Top with the berries in the morning."
  ],
  "prep_tasks": [
   {
    "title": "Make the overnight oats",
    "hours_before": 10
   }
  ]
 },
 {
  "title": "Chicken & Veg Stir-fry",
  "image_url": img("1512058564366-18510be2db19"),
  "servings": 2,
  "prep_minutes": 5,
  "cook_minutes": 15,
  "diet_tags": [
   "high-protein"
  ],
  "meal_types": [
   "lunch",
   "dinner"
  ],
  "ingredients": [
   {
    "name": "chicken breast",
    "quantity": 300,
    "unit": "g",
    "category": "protein"
   },
   {
    "name": "pepper",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "broccoli",
    "quantity": 1,
    "unit": "head",
    "category": "produce"
   },
   {
    "name": "soy sauce",
    "quantity": 2,
    "unit": "tbsp",
    "category": "spices"
   },
   {
    "name": "grated ginger",
    "quantity": 1,
    "unit": "tsp",
    "category": "produce"
   },
   {
    "name": "garlic",
    "quantity": 1,
    "unit": "clove",
    "category": "produce"
   },
   {
    "name": "oil",
    "quantity": 1,
    "unit": "tbsp",
    "category": "pantry"
   }
  ],
  "steps": [
   "Stir-fry the chicken in the oil over high heat for 5–6 min until cooked through.",
   "Add the broccoli, pepper, garlic and ginger and stir-fry for 4 min.",
   "Add the soy sauce and toss. Serve with rice."
  ],
  "prep_tasks": [
   {
    "title": "Thaw the chicken in the fridge",
    "hours_before": 24
   }
  ]
 },
 {
  "title": "Greek Yogurt Protein Bowl",
  "image_url": img("1488477181946-6428a0291777"),
  "servings": 1,
  "prep_minutes": 5,
  "cook_minutes": 0,
  "diet_tags": [
   "vegetarian",
   "high-protein"
  ],
  "meal_types": [
   "breakfast"
  ],
  "ingredients": [
   {
    "name": "Greek yogurt",
    "quantity": 200,
    "unit": "g",
    "category": "dairy"
   },
   {
    "name": "granola",
    "quantity": 30,
    "unit": "g",
    "category": "pantry"
   },
   {
    "name": "peanut or almond butter",
    "quantity": 1,
    "unit": "tbsp",
    "category": "pantry"
   },
   {
    "name": "banana",
    "quantity": 0.5,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "honey",
    "quantity": 1,
    "unit": "tsp",
    "category": "pantry"
   }
  ],
  "steps": [
   "Spoon the yogurt into a bowl.",
   "Top with the granola, banana and nut butter, then drizzle with the honey."
  ],
  "prep_tasks": []
 },
 {
  "title": "Tuna & White Bean Salad",
  "image_url": img("1515543237350-b3eea1ec8082"),
  "servings": 2,
  "prep_minutes": 10,
  "cook_minutes": 0,
  "diet_tags": [
   "high-protein",
   "gluten-free"
  ],
  "meal_types": [
   "lunch",
   "dinner"
  ],
  "ingredients": [
   {
    "name": "tuna",
    "quantity": 2,
    "unit": "tin",
    "category": "protein"
   },
   {
    "name": "white beans (400 g)",
    "quantity": 1,
    "unit": "tin",
    "category": "pantry"
   },
   {
    "name": "red onion",
    "quantity": 0.5,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "cherry tomatoes",
    "quantity": 10,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "rocket",
    "quantity": 1,
    "unit": "handful",
    "category": "produce"
   },
   {
    "name": "olive oil",
    "quantity": 2,
    "unit": "tbsp",
    "category": "pantry"
   },
   {
    "name": "lemon juice",
    "quantity": 1,
    "unit": "tbsp",
    "category": "produce"
   },
   {
    "name": "salt and pepper",
    "quantity": null,
    "unit": "",
    "category": "spices"
   }
  ],
  "steps": [
   "Put everything except the oil and lemon in a bowl.",
   "Whisk the oil, lemon juice, salt and pepper, pour over and toss."
  ],
  "prep_tasks": []
 },
 {
  "title": "Turkey Mince Lettuce Wraps",
  "image_url": img("1529042410759-befb1204b468"),
  "servings": 2,
  "prep_minutes": 5,
  "cook_minutes": 10,
  "diet_tags": [
   "high-protein",
   "gluten-free"
  ],
  "meal_types": [
   "lunch",
   "dinner"
  ],
  "ingredients": [
   {
    "name": "turkey mince",
    "quantity": 300,
    "unit": "g",
    "category": "protein"
   },
   {
    "name": "garlic",
    "quantity": 2,
    "unit": "clove",
    "category": "produce"
   },
   {
    "name": "carrot",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "soy sauce",
    "quantity": 2,
    "unit": "tbsp",
    "category": "spices"
   },
   {
    "name": "sesame oil",
    "quantity": 1,
    "unit": "tsp",
    "category": "pantry"
   },
   {
    "name": "little gem lettuce",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "spring onions",
    "quantity": 2,
    "unit": "",
    "category": "produce"
   }
  ],
  "steps": [
   "Brown the mince in a hot pan for 6–7 min, breaking it up.",
   "Add the garlic, carrot, soy sauce and sesame oil and cook for 2 min.",
   "Spoon into the lettuce leaves and top with the spring onions."
  ],
  "prep_tasks": [
   {
    "title": "Thaw the mince in the fridge",
    "hours_before": 24
   }
  ]
 },
 {
  "title": "Baked Salmon with Green Beans",
  "image_url": img("1467003909585-2f8a72700288"),
  "servings": 2,
  "prep_minutes": 5,
  "cook_minutes": 15,
  "diet_tags": [
   "high-protein",
   "gluten-free"
  ],
  "meal_types": [
   "lunch",
   "dinner"
  ],
  "ingredients": [
   {
    "name": "salmon fillets",
    "quantity": 2,
    "unit": "",
    "category": "protein"
   },
   {
    "name": "green beans",
    "quantity": 200,
    "unit": "g",
    "category": "produce"
   },
   {
    "name": "lemon",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "olive oil",
    "quantity": 1,
    "unit": "tbsp",
    "category": "pantry"
   },
   {
    "name": "garlic",
    "quantity": 1,
    "unit": "clove",
    "category": "produce"
   },
   {
    "name": "salt and pepper",
    "quantity": null,
    "unit": "",
    "category": "spices"
   }
  ],
  "steps": [
   "Heat the oven to 200 °C.",
   "Put the beans on a tray, toss with half the oil and the garlic, and lay the salmon on top.",
   "Drizzle with the rest of the oil, season, add lemon slices and bake for 12–15 min."
  ],
  "prep_tasks": [
   {
    "title": "Thaw the salmon in the fridge",
    "hours_before": 24
   }
  ]
 },
 {
  "title": "Veggie Omelette",
  "image_url": img("1482049016688-2d3e1b311543"),
  "servings": 1,
  "prep_minutes": 10,
  "cook_minutes": 0,
  "diet_tags": [
   "vegetarian",
   "high-protein",
   "gluten-free"
  ],
  "meal_types": [
   "breakfast",
   "lunch"
  ],
  "ingredients": [
   {
    "name": "eggs",
    "quantity": 3,
    "unit": "",
    "category": "dairy"
   },
   {
    "name": "pepper",
    "quantity": 0.25,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "spinach",
    "quantity": 1,
    "unit": "handful",
    "category": "produce"
   },
   {
    "name": "feta or cheddar",
    "quantity": 30,
    "unit": "g",
    "category": "dairy"
   },
   {
    "name": "butter or oil",
    "quantity": 1,
    "unit": "tsp",
    "category": "dairy"
   },
   {
    "name": "salt and pepper",
    "quantity": null,
    "unit": "",
    "category": "spices"
   }
  ],
  "steps": [
   "Beat the eggs with salt and pepper.",
   "Soften the pepper in the butter for 2 min, then add the spinach.",
   "Pour in the eggs and cook over medium heat. When the omelette is almost set, add the cheese, fold it in half and serve."
  ],
  "prep_tasks": []
 },
 {
  "title": "Caprese Wholewheat Pasta",
  "image_url": img("1473093295043-cdd812d0e601"),
  "servings": 2,
  "prep_minutes": 5,
  "cook_minutes": 10,
  "diet_tags": [
   "vegetarian"
  ],
  "meal_types": [
   "lunch",
   "dinner"
  ],
  "ingredients": [
   {
    "name": "wholewheat pasta",
    "quantity": 180,
    "unit": "g",
    "category": "pantry"
   },
   {
    "name": "cherry tomatoes",
    "quantity": 200,
    "unit": "g",
    "category": "produce"
   },
   {
    "name": "mozzarella",
    "quantity": 125,
    "unit": "g",
    "category": "dairy"
   },
   {
    "name": "basil",
    "quantity": 1,
    "unit": "handful",
    "category": "produce"
   },
   {
    "name": "olive oil",
    "quantity": 2,
    "unit": "tbsp",
    "category": "pantry"
   },
   {
    "name": "garlic",
    "quantity": 1,
    "unit": "clove",
    "category": "produce"
   }
  ],
  "steps": [
   "Cook the pasta as the packet says.",
   "Warm the oil and garlic in a pan for 1 min, then add the tomatoes and cook for 3 min.",
   "Toss in the drained pasta, then the mozzarella and basil. Season and serve."
  ],
  "prep_tasks": []
 },
 {
  "title": "Halloumi & Veg Traybake",
  "image_url": img("1505576399279-565b52d4ac71"),
  "servings": 2,
  "prep_minutes": 5,
  "cook_minutes": 25,
  "diet_tags": [
   "vegetarian",
   "gluten-free"
  ],
  "meal_types": [
   "lunch",
   "dinner"
  ],
  "ingredients": [
   {
    "name": "halloumi",
    "quantity": 225,
    "unit": "g",
    "category": "dairy"
   },
   {
    "name": "courgette",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "red pepper",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "red onion",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "cherry tomatoes",
    "quantity": 200,
    "unit": "g",
    "category": "produce"
   },
   {
    "name": "olive oil",
    "quantity": 2,
    "unit": "tbsp",
    "category": "pantry"
   },
   {
    "name": "dried oregano",
    "quantity": 1,
    "unit": "tsp",
    "category": "spices"
   }
  ],
  "steps": [
   "Heat the oven to 200 °C.",
   "Toss the veg with the oil and oregano on a tray and roast for 15 min.",
   "Add the halloumi and roast for another 10 min until golden."
  ],
  "prep_tasks": []
 },
 {
  "title": "Shakshuka",
  "image_url": img("1511690656952-34342bb7c2f2"),
  "servings": 2,
  "prep_minutes": 5,
  "cook_minutes": 15,
  "diet_tags": [
   "vegetarian",
   "gluten-free"
  ],
  "meal_types": [
   "lunch",
   "dinner"
  ],
  "ingredients": [
   {
    "name": "eggs",
    "quantity": 4,
    "unit": "",
    "category": "dairy"
   },
   {
    "name": "chopped tomatoes (400 g)",
    "quantity": 1,
    "unit": "tin",
    "category": "pantry"
   },
   {
    "name": "onion",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "red pepper",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "garlic",
    "quantity": 2,
    "unit": "clove",
    "category": "produce"
   },
   {
    "name": "cumin",
    "quantity": 1,
    "unit": "tsp",
    "category": "spices"
   },
   {
    "name": "paprika",
    "quantity": 1,
    "unit": "tsp",
    "category": "spices"
   },
   {
    "name": "olive oil",
    "quantity": 1,
    "unit": "tbsp",
    "category": "pantry"
   },
   {
    "name": "parsley",
    "quantity": null,
    "unit": "",
    "category": "produce"
   }
  ],
  "steps": [
   "Fry the onion and pepper in the oil for 5 min. Add the garlic and spices and cook for 1 min.",
   "Add the tomatoes and simmer for 5 min.",
   "Make 4 hollows, crack an egg into each, then cover and cook for 5–7 min until the whites are set. Top with parsley."
  ],
  "prep_tasks": []
 },
 {
  "title": "Hummus & Veggie Wrap",
  "image_url": img("1540189549336-e6e99c3679fe"),
  "servings": 2,
  "prep_minutes": 5,
  "cook_minutes": 0,
  "diet_tags": [
   "vegetarian"
  ],
  "meal_types": [
   "lunch",
   "dinner"
  ],
  "ingredients": [
   {
    "name": "large wholewheat wraps",
    "quantity": 2,
    "unit": "",
    "category": "bakery"
   },
   {
    "name": "hummus",
    "quantity": 4,
    "unit": "tbsp",
    "category": "pantry"
   },
   {
    "name": "carrot",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "cucumber",
    "quantity": 0.5,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "spinach",
    "quantity": 1,
    "unit": "handful",
    "category": "produce"
   },
   {
    "name": "feta",
    "quantity": 40,
    "unit": "g",
    "category": "dairy"
   }
  ],
  "steps": [
   "Spread the hummus over each wrap.",
   "Add the veg and feta, roll up tightly and cut in half."
  ],
  "prep_tasks": []
 },
 {
  "title": "One-pan Chicken & Potatoes",
  "image_url": img("1504674900247-0877df9cc836"),
  "servings": 2,
  "prep_minutes": 5,
  "cook_minutes": 25,
  "diet_tags": [
   "gluten-free"
  ],
  "meal_types": [
   "lunch",
   "dinner"
  ],
  "ingredients": [
   {
    "name": "chicken thighs",
    "quantity": 4,
    "unit": "",
    "category": "protein"
   },
   {
    "name": "baby potatoes",
    "quantity": 400,
    "unit": "g",
    "category": "produce"
   },
   {
    "name": "red onion",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "olive oil",
    "quantity": 2,
    "unit": "tbsp",
    "category": "pantry"
   },
   {
    "name": "paprika",
    "quantity": 1,
    "unit": "tsp",
    "category": "spices"
   },
   {
    "name": "dried thyme",
    "quantity": 1,
    "unit": "tsp",
    "category": "spices"
   },
   {
    "name": "salt and pepper",
    "quantity": null,
    "unit": "",
    "category": "spices"
   }
  ],
  "steps": [
   "Heat the oven to 210 °C.",
   "Toss everything together on a tray, keeping the chicken skin-side up.",
   "Roast for 25–30 min until the chicken is cooked through and the potatoes are golden."
  ],
  "prep_tasks": [
   {
    "title": "Thaw the chicken in the fridge",
    "hours_before": 24
   }
  ]
 },
 {
  "title": "Prawn & Garlic Rice",
  "image_url": img("1476124369491-e7addf5db371"),
  "servings": 2,
  "prep_minutes": 5,
  "cook_minutes": 15,
  "diet_tags": [
   "high-protein",
   "gluten-free"
  ],
  "meal_types": [
   "lunch",
   "dinner"
  ],
  "ingredients": [
   {
    "name": "raw prawns",
    "quantity": 200,
    "unit": "g",
    "category": "protein"
   },
   {
    "name": "rice",
    "quantity": 150,
    "unit": "g",
    "category": "pantry"
   },
   {
    "name": "garlic",
    "quantity": 3,
    "unit": "clove",
    "category": "produce"
   },
   {
    "name": "frozen peas",
    "quantity": 100,
    "unit": "g",
    "category": "frozen"
   },
   {
    "name": "olive oil",
    "quantity": 1,
    "unit": "tbsp",
    "category": "pantry"
   },
   {
    "name": "lemon",
    "quantity": 0.5,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "parsley",
    "quantity": null,
    "unit": "",
    "category": "produce"
   }
  ],
  "steps": [
   "Cook the rice, if it isn't pre-cooked.",
   "Fry the garlic in the oil for 1 min, then add the prawns and cook for 3 min until pink.",
   "Add the rice and peas and stir-fry for 3 min. Finish with the lemon juice and parsley."
  ],
  "prep_tasks": [
   {
    "title": "Thaw the prawns in the fridge",
    "hours_before": 12
   }
  ]
 },
 {
  "title": "Beef & Veg Chilli",
  "image_url": img("1516684732162-798a0062be99"),
  "servings": 3,
  "prep_minutes": 5,
  "cook_minutes": 25,
  "diet_tags": [
   "high-protein",
   "gluten-free"
  ],
  "meal_types": [
   "lunch",
   "dinner"
  ],
  "ingredients": [
   {
    "name": "lean beef mince",
    "quantity": 300,
    "unit": "g",
    "category": "protein"
   },
   {
    "name": "kidney beans (400 g)",
    "quantity": 1,
    "unit": "tin",
    "category": "pantry"
   },
   {
    "name": "chopped tomatoes (400 g)",
    "quantity": 1,
    "unit": "tin",
    "category": "pantry"
   },
   {
    "name": "onion",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "pepper",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "garlic",
    "quantity": 2,
    "unit": "clove",
    "category": "produce"
   },
   {
    "name": "chilli powder",
    "quantity": 1,
    "unit": "tsp",
    "category": "spices"
   },
   {
    "name": "cumin",
    "quantity": 1,
    "unit": "tsp",
    "category": "spices"
   }
  ],
  "steps": [
   "Brown the mince with the onion and pepper for 7 min.",
   "Add the garlic and spices and cook for 1 min.",
   "Add the tomatoes and beans and simmer for 15 min. Serve with rice or in a baked potato."
  ],
  "prep_tasks": [
   {
    "title": "Thaw the mince in the fridge",
    "hours_before": 24
   }
  ]
 },
 {
  "title": "Chicken Caesar-ish Salad",
  "image_url": img("1546069901-ba9599a7e63c"),
  "servings": 2,
  "prep_minutes": 5,
  "cook_minutes": 10,
  "diet_tags": [
   "high-protein"
  ],
  "meal_types": [
   "lunch",
   "dinner"
  ],
  "ingredients": [
   {
    "name": "chicken breasts",
    "quantity": 2,
    "unit": "",
    "category": "protein"
   },
   {
    "name": "romaine lettuce",
    "quantity": 1,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "parmesan",
    "quantity": 30,
    "unit": "g",
    "category": "dairy"
   },
   {
    "name": "wholegrain bread",
    "quantity": 1,
    "unit": "slice",
    "category": "bakery"
   },
   {
    "name": "Greek yogurt",
    "quantity": 3,
    "unit": "tbsp",
    "category": "dairy"
   },
   {
    "name": "dijon mustard",
    "quantity": 1,
    "unit": "tsp",
    "category": "spices"
   },
   {
    "name": "lemon juice",
    "quantity": 1,
    "unit": "tbsp",
    "category": "produce"
   }
  ],
  "steps": [
   "Season the chicken and pan-fry it for 5–6 min per side, then slice. Toast the bread cubes in the same pan.",
   "Mix the yogurt, mustard, lemon juice and a pinch of salt into a dressing.",
   "Toss the lettuce with the dressing and top with the chicken, croutons and parmesan."
  ],
  "prep_tasks": []
 },
 {
  "title": "Banana Oat Pancakes",
  "image_url": img("1525351484163-7529414344d8"),
  "servings": 2,
  "prep_minutes": 5,
  "cook_minutes": 10,
  "diet_tags": [
   "vegetarian"
  ],
  "meal_types": [
   "breakfast"
  ],
  "ingredients": [
   {
    "name": "ripe bananas",
    "quantity": 2,
    "unit": "",
    "category": "produce"
   },
   {
    "name": "eggs",
    "quantity": 2,
    "unit": "",
    "category": "dairy"
   },
   {
    "name": "oats",
    "quantity": 80,
    "unit": "g",
    "category": "pantry"
   },
   {
    "name": "baking powder",
    "quantity": 1,
    "unit": "tsp",
    "category": "pantry"
   },
   {
    "name": "cinnamon",
    "quantity": 1,
    "unit": "pinch",
    "category": "spices"
   },
   {
    "name": "oil",
    "quantity": 1,
    "unit": "tsp",
    "category": "pantry"
   },
   {
    "name": "berries or yogurt",
    "quantity": null,
    "unit": "",
    "category": "produce"
   }
  ],
  "steps": [
   "Blend everything except the oil into a batter (or mash and stir it by hand).",
   "Cook spoonfuls of batter in a lightly oiled pan, 2 min per side.",
   "Serve with berries or yogurt."
  ],
  "prep_tasks": []
 }
];
