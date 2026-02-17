/**
 * Code Scanner Utility
 * Scans the codebase to identify existing components, features, and assets
 * that can be inventoried and priced for usage
 */

import fs from "fs";
import path from "path";

export interface ComponentInfo {
  name: string;
  path: string;
  type: "component" | "utility" | "page" | "api" | "asset";
  linesOfCode: number;
  dependencies: string[];
  exports: string[];
}

export interface CodeInventory {
  components: ComponentInfo[];
  totalComponents: number;
  totalLinesOfCode: number;
  lastScanned: string;
}

/**
 * Scans a directory recursively for code files
 */
function scanDirectory(dirPath: string, baseDir: string): ComponentInfo[] {
  const components: ComponentInfo[] = [];
  
  try {
    if (!fs.existsSync(dirPath)) {
      return components;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // Skip node_modules, .git, and other common directories
      if (entry.name === "node_modules" || entry.name === ".git" || 
          entry.name === ".next" || entry.name === "dist") {
        continue;
      }

      if (entry.isDirectory()) {
        components.push(...scanDirectory(fullPath, baseDir));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
          const componentInfo = analyzeFile(fullPath, baseDir);
          if (componentInfo) {
            components.push(componentInfo);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }

  return components;
}

/**
 * Analyzes a single file to extract component information
 */
function analyzeFile(filePath: string, baseDir: string): ComponentInfo | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const relativePath = path.relative(baseDir, filePath);
    
    // Determine component type based on path
    let type: ComponentInfo["type"] = "component";
    if (relativePath.includes("/utils/")) {
      type = "utility";
    } else if (relativePath.includes("/pages/") || relativePath.includes("/app/")) {
      type = "page";
    } else if (relativePath.includes("/api/")) {
      type = "api";
    }

    // Extract dependencies (import statements)
    const dependencies: string[] = [];
    const importRegex = /import\s+.*\s+from\s+['"](.*)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }

    // Extract exports
    const exports: string[] = [];
    const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return {
      name: path.basename(filePath, path.extname(filePath)),
      path: relativePath,
      type,
      linesOfCode: lines.length,
      dependencies: [...new Set(dependencies)], // Remove duplicates
      exports,
    };
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error);
    return null;
  }
}

/**
 * Main function to scan the entire codebase
 */
export function scanCodebase(rootDir: string): CodeInventory {
  const srcDir = path.join(rootDir, "src");
  const components = scanDirectory(srcDir, rootDir);
  
  const totalLinesOfCode = components.reduce(
    (sum, comp) => sum + comp.linesOfCode,
    0
  );

  return {
    components,
    totalComponents: components.length,
    totalLinesOfCode,
    lastScanned: new Date().toISOString(),
  };
}

/**
 * Filter components by type
 */
export function filterByType(
  inventory: CodeInventory,
  type: ComponentInfo["type"]
): ComponentInfo[] {
  return inventory.components.filter((comp) => comp.type === type);
}

/**
 * Get components sorted by lines of code (most complex first)
 */
export function sortByComplexity(inventory: CodeInventory): ComponentInfo[] {
  return [...inventory.components].sort((a, b) => b.linesOfCode - a.linesOfCode);
}

/**
 * Search components by name or path
 */
export function searchComponents(
  inventory: CodeInventory,
  query: string
): ComponentInfo[] {
  const lowerQuery = query.toLowerCase();
  return inventory.components.filter(
    (comp) =>
      comp.name.toLowerCase().includes(lowerQuery) ||
      comp.path.toLowerCase().includes(lowerQuery)
  );
}
