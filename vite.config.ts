import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/flashcard-drill/",
  test: {
    include: ["src/**/*.test.ts"],
  },
});
