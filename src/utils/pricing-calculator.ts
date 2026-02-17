/**
 * Pricing Calculator
 * Calculates the cost of using existing code components
 * based on their complexity and usage
 */

import { ComponentInfo, CodeInventory } from "./code-scanner";

export interface PricingConfig {
  pricePerComponent: number;
  pricePerLineOfCode: number;
  pricePerDependency: number;
  discountForMultiple: number; // percentage discount when using multiple components
}

export interface ComponentPrice {
  component: ComponentInfo;
  basePrice: number;
  complexityPrice: number;
  dependencyPrice: number;
  totalPrice: number;
}

export interface UsageReport {
  components: ComponentPrice[];
  subtotal: number;
  discount: number;
  total: number;
  summary: string;
}

// Default pricing configuration
const DEFAULT_PRICING: PricingConfig = {
  pricePerComponent: 10, // $10 per component
  pricePerLineOfCode: 0.01, // $0.01 per line of code
  pricePerDependency: 2, // $2 per external dependency
  discountForMultiple: 0.15, // 15% discount for using 5+ components
};

/**
 * Calculate the price for a single component
 */
export function calculateComponentPrice(
  component: ComponentInfo,
  config: PricingConfig = DEFAULT_PRICING
): ComponentPrice {
  const basePrice = config.pricePerComponent;
  const complexityPrice = component.linesOfCode * config.pricePerLineOfCode;
  
  // Count external dependencies (exclude relative imports)
  const externalDeps = component.dependencies.filter(
    (dep) => !dep.startsWith(".") && !dep.startsWith("/")
  );
  const dependencyPrice = externalDeps.length * config.pricePerDependency;

  const totalPrice = basePrice + complexityPrice + dependencyPrice;

  return {
    component,
    basePrice,
    complexityPrice,
    dependencyPrice,
    totalPrice: Math.round(totalPrice * 100) / 100, // Round to 2 decimal places
  };
}

/**
 * Calculate total pricing for multiple components
 */
export function calculateUsageReport(
  components: ComponentInfo[],
  config: PricingConfig = DEFAULT_PRICING
): UsageReport {
  const componentPrices = components.map((comp) =>
    calculateComponentPrice(comp, config)
  );

  const subtotal = componentPrices.reduce(
    (sum, price) => sum + price.totalPrice,
    0
  );

  // Apply discount if using 5 or more components
  const discount =
    components.length >= 5 ? subtotal * config.discountForMultiple : 0;

  const total = subtotal - discount;

  const summary = `Total: $${total.toFixed(2)} for ${components.length} component${components.length !== 1 ? "s" : ""} (${componentPrices.reduce((sum, p) => sum + p.component.linesOfCode, 0)} lines of code)${discount > 0 ? ` with ${(config.discountForMultiple * 100).toFixed(0)}% discount` : ""}`;

  return {
    components: componentPrices,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
    summary,
  };
}

/**
 * Generate pricing breakdown for entire inventory
 */
export function generateInventoryPricing(
  inventory: CodeInventory,
  config: PricingConfig = DEFAULT_PRICING
): UsageReport {
  return calculateUsageReport(inventory.components, config);
}

/**
 * Get pricing tier based on component count
 */
export function getPricingTier(componentCount: number): string {
  if (componentCount === 0) return "Free";
  if (componentCount < 5) return "Starter";
  if (componentCount < 20) return "Professional";
  if (componentCount < 50) return "Business";
  return "Enterprise";
}

/**
 * Generate a recommendation for what to build next
 */
export function generateDesignRecommendation(
  inventory: CodeInventory
): string[] {
  const recommendations: string[] = [];
  
  const componentTypes = new Set(inventory.components.map((c) => c.type));
  
  if (!componentTypes.has("api")) {
    recommendations.push(
      "Add API endpoints to expose your components as services"
    );
  }
  
  if (inventory.components.filter((c) => c.type === "component").length > 20) {
    recommendations.push(
      "Consider creating a component library or design system to organize your components"
    );
  }
  
  const avgLinesPerComponent =
    inventory.totalLinesOfCode / inventory.totalComponents;
  if (avgLinesPerComponent > 200) {
    recommendations.push(
      "Some components are complex - consider breaking them down into smaller, reusable pieces"
    );
  }
  
  if (inventory.components.filter((c) => c.type === "utility").length < 5) {
    recommendations.push(
      "Add more utility functions to support common operations"
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Your codebase is well-structured. Consider adding more features or expanding existing ones."
    );
  }

  return recommendations;
}
