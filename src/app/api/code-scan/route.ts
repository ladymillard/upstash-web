import { NextRequest, NextResponse } from "next/server";
import path from "path";
import {
  scanCodebase,
  filterByType,
  sortByComplexity,
  searchComponents,
  type CodeInventory,
} from "@/utils/code-scanner";
import {
  calculateUsageReport,
  generateInventoryPricing,
  generateDesignRecommendation,
  getPricingTier,
} from "@/utils/pricing-calculator";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export type CodeScanResponse = {
  inventory: CodeInventory;
  pricing: ReturnType<typeof generateInventoryPricing>;
  pricingTier: string;
  recommendations: string[];
  summary: {
    totalComponents: number;
    totalLinesOfCode: number;
    componentsByType: Record<string, number>;
    topComplexComponents: Array<{
      name: string;
      path: string;
      linesOfCode: number;
    }>;
  };
};

/**
 * GET /api/code-scan
 * Scans the codebase and returns inventory, pricing, and recommendations
 * 
 * Query parameters:
 * - type: Filter by component type (component, utility, page, api, asset)
 * - search: Search components by name or path
 * - top: Number of top complex components to return (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filterType = searchParams.get("type");
    const searchQuery = searchParams.get("search");
    const topCount = parseInt(searchParams.get("top") || "10", 10);

    // Scan the codebase
    const rootDir = path.resolve(process.cwd());
    let inventory = scanCodebase(rootDir);

    // Apply filters if requested
    let filteredComponents = inventory.components;
    if (filterType) {
      filteredComponents = filterByType(inventory, filterType as any);
      inventory = {
        ...inventory,
        components: filteredComponents,
        totalComponents: filteredComponents.length,
        totalLinesOfCode: filteredComponents.reduce(
          (sum, c) => sum + c.linesOfCode,
          0
        ),
      };
    }

    if (searchQuery) {
      filteredComponents = searchComponents(inventory, searchQuery);
      inventory = {
        ...inventory,
        components: filteredComponents,
        totalComponents: filteredComponents.length,
        totalLinesOfCode: filteredComponents.reduce(
          (sum, c) => sum + c.linesOfCode,
          0
        ),
      };
    }

    // Generate pricing
    const pricing = generateInventoryPricing(inventory);
    const pricingTier = getPricingTier(inventory.totalComponents);

    // Generate recommendations
    const recommendations = generateDesignRecommendation(inventory);

    // Get top complex components
    const sortedComponents = sortByComplexity(inventory);
    const topComplexComponents = sortedComponents.slice(0, topCount).map((c) => ({
      name: c.name,
      path: c.path,
      linesOfCode: c.linesOfCode,
    }));

    // Generate component counts by type
    const componentsByType: Record<string, number> = {};
    for (const component of inventory.components) {
      componentsByType[component.type] =
        (componentsByType[component.type] || 0) + 1;
    }

    const response: CodeScanResponse = {
      inventory,
      pricing,
      pricingTier,
      recommendations,
      summary: {
        totalComponents: inventory.totalComponents,
        totalLinesOfCode: inventory.totalLinesOfCode,
        componentsByType,
        topComplexComponents,
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error scanning codebase:", error);
    return NextResponse.json(
      {
        error: "Failed to scan codebase",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

/**
 * POST /api/code-scan
 * Calculate pricing for specific components
 * 
 * Body: {
 *   componentPaths: string[]  // Array of component paths to price
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { componentPaths } = body;

    if (!Array.isArray(componentPaths)) {
      return NextResponse.json(
        { error: "componentPaths must be an array" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Scan the codebase
    const rootDir = path.resolve(process.cwd());
    const inventory = scanCodebase(rootDir);

    // Filter components by the provided paths
    const selectedComponents = inventory.components.filter((comp) =>
      componentPaths.includes(comp.path)
    );

    if (selectedComponents.length === 0) {
      return NextResponse.json(
        { error: "No matching components found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Calculate pricing for selected components
    const usageReport = calculateUsageReport(selectedComponents);

    return NextResponse.json(
      {
        components: selectedComponents,
        pricing: usageReport,
        message: `Calculated pricing for ${selectedComponents.length} component(s)`,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error calculating pricing:", error);
    return NextResponse.json(
      {
        error: "Failed to calculate pricing",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
