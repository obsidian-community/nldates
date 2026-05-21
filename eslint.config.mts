import { globalIgnores } from "eslint/config";
import tsEslint from "typescript-eslint";
import globals from "globals"
import obsidianmd from "eslint-plugin-obsidianmd";

export default tsEslint.config(
  globalIgnores(["node_modules/**"]),
  {
    languageOptions: {
      globals: {...globals.browser},
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "manifest.json",
            "eslint.config.mts"
          ],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".json"]
      },
    }
  },
  ...obsidianmd.configs.recommended,
)
