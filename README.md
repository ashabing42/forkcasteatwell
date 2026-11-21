# Forkcasteatwell

Build a web app called "MealMap", a healthy meal planner for people who follow a specific diet (vegan, low-sugar, high-protein, etc.) and find planning every week exhausting. The app picks the week's recipes, builds the shopping list, and reminds you about prep tasks like "thaw the chicken tonight".

This is a lean MVP. Focus on making the main flow work from start to finish, with a clean, friendly, mobile-first design. The app is in English.

## Tech
- Use Lovable Cloud for auth (email + Google sign-in) and the database. Each user only sees their own data.
- Fully responsive. Most people will use it on their phone while shopping or cooking.

## Core flow
1. **Onboarding (first login):** the user picks their diet. Options: Vegan, Vegetarian, Low-sugar, High-protein, Gluten-free, Balanced/No restriction. They can pick more than one. They also choose which meals to plan (breakfast, lunch, dinner, snacks), how many days (default 7) and how many servings. Save this as their profile. They can change it later in Settings.

2. **Recipe book:**
   - Each recipe has: title, image, servings, prep and cook time, diet tags, ingredients (name, quantity, unit, shopping category), steps, and optional prep tasks (see below).
   - Seed every new account with about 20 sample recipes that cover all the diets, so the app works right away.
   - Users can add a recipe by hand, edit it, or delete it.
   - **Import from a link:** the user pastes the URL of an online recipe. A backend function fetches the page and pulls out the recipe from its schema.org Recipe JSON-LD data. If that data isn't there, use AI to extract it from the page text. Show the result in an editable form so the user can check it before saving. Auto-suggest diet tags.

3. **Weekly plan:**
   - A "Generate my week" button fills a calendar grid (days × chosen meals) with recipes from the user's recipe book that match their diet.
   - Avoid repeating a recipe within the same week where possible.
   - The user can swap any slot (pick another recipe or "surprise me"), lock slots they like, and regenerate the rest.
   - Save one plan per week. The user can move between weeks.

4. **Shopping list:**
   - Built automatically from the week's plan, scaled to the user's servings.
   - Combine the same ingredient across recipes (e.g. 2 onions + 1 onion = 3 onions) and group items by category (produce, protein, dairy, pantry, frozen, etc.).
   - Items can be checked off, and the user can add their own items by hand.

5. **Prep reminders:**
   - A recipe can have prep tasks, each with a lead time, e.g. "Thaw chicken: 24h before", "Soak chickpeas: 12h before", "Marinate tofu: 2h before".
   - When importing or creating a recipe, auto-suggest prep tasks from the ingredients and steps (frozen meat/fish → thaw, dried beans → soak, "marinate" in the steps → marinate). The user can edit or remove them.
   - When a plan is saved, work out the exact date and time of each prep task from when the meal is planned (use default meal times: breakfast 8:00, lunch 14:00, dinner 21:00; editable in Settings).
   - Show a **"Today"** dashboard as the home screen: today's meals plus the prep tasks due today or tonight.
   - **Calendar integration:** an "Add reminders to my calendar" button that downloads an .ics file with every prep task in the week as a calendar event with an alarm. This works with Google Calendar, Apple Calendar and Outlook. Also give each user a private calendar subscription URL (an .ics feed) that updates automatically when their plan changes.

## Navigation
Bottom tab bar on mobile: Today · Plan · Shopping · Recipes · Settings.

## Design
Fresh and calm, not clinical: plenty of white space, a soft green accent, rounded cards, recipe photos big and visible. Use a friendly, encouraging tone in empty states and buttons.

## Out of scope for now (don't build yet)
Push notifications, nutrition/calorie tracking, sharing plans with family, grocery delivery integrations. I'll add these in later prompts.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://forkcasteatwell.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3b7bdb6f-29c0-4476-9a14-1e526be1aa52).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
