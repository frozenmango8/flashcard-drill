# Flashcard Drill

Spaced-repetition flashcards in the browser. Decks stay on this machine.

https://frozenmango8.github.io/flashcard-drill/

## Use

Create a deck and paste one card per line. Separate the front and back with a tab, a comma, or ` - `.

```
France - Paris
Spain, Madrid
```

Open the deck and choose Study. Space or a click shows the answer. Then grade it with 1-4: Again, Hard, Good, or Easy. Scheduling is SM-2 (ease, interval, and repetitions).

Each deck shows how many cards are due, a 30-day review chart, and the retention rate. Set how many new cards to introduce per day.

You can import and export a deck as CSV. From the deck list, download a JSON backup of every deck and import that file later to replace them.

The header switches between light and dark. A sample deck of world capitals is added the first time you open the app.

## Develop

```sh
npm install
npm run dev
```

The dev server is at http://localhost:5173/flashcard-drill/ because the Vite base path is `/flashcard-drill/`.

`npm test` runs the scheduler and parser tests. `npm run lint`, `npm run typecheck`, and `npm run build` are what CI runs. Pushes to `main` also publish the `dist` folder with GitHub Pages.
