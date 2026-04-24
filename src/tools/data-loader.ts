import * as fs from "fs";
import * as path from "path";

const cache: Record<string, any> = {};

/**
 * Loads and caches a JSON file from the demo-data directory.
 * Subsequent calls for the same file return the cached copy.
 */
export function loadData<T = any>(file: string): T {
  if (!cache[file]) {
    const filePath = path.resolve(__dirname, "../../demo-data", file);
    cache[file] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }
  return cache[file] as T;
}

/**
 * Clears the data cache — useful for testing.
 */
export function clearCache(): void {
  for (const key of Object.keys(cache)) {
    delete cache[key];
  }
}
