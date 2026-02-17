# Code Inventory & Pricing System

This feature provides a comprehensive system for scanning your codebase to identify existing components, calculate their value, and provide design recommendations for future iterations.

## Overview

The code inventory system addresses the following needs:
- **Code Discovery**: Automatically scan and catalog all components, utilities, pages, and APIs in your codebase
- **Usage Pricing**: Calculate the value of existing code based on complexity and dependencies
- **Design Recommendations**: Provide intelligent suggestions for what to build next based on your current inventory

## Features

### 1. Code Scanner
Located in `src/utils/code-scanner.ts`, this utility:
- Recursively scans the `src/` directory for TypeScript/JavaScript files
- Analyzes each file to extract:
  - Component name and path
  - Type (component, utility, page, api, asset)
  - Lines of code
  - Dependencies (imports)
  - Exports
- Provides filtering and search capabilities
- Excludes common directories (node_modules, .git, .next, dist)

### 2. Pricing Calculator
Located in `src/utils/pricing-calculator.ts`, this utility:
- Calculates pricing based on:
  - Base price per component ($10)
  - Price per line of code ($0.01)
  - Price per external dependency ($2)
- Applies volume discounts (15% for 5+ components)
- Provides pricing tiers (Free, Starter, Professional, Business, Enterprise)
- Generates design recommendations based on inventory analysis

### 3. API Endpoint
Located in `src/app/api/code-scan/route.ts`, this endpoint provides:

#### GET `/api/code-scan`
Scans the entire codebase and returns comprehensive inventory and pricing data.

**Query Parameters:**
- `type` (optional): Filter by component type (component, utility, page, api, asset)
- `search` (optional): Search components by name or path
- `top` (optional): Number of top complex components to return (default: 10)

**Response:**
```json
{
  "inventory": {
    "components": [...],
    "totalComponents": 150,
    "totalLinesOfCode": 50000,
    "lastScanned": "2026-02-17T09:36:21.649Z"
  },
  "pricing": {
    "components": [...],
    "subtotal": 2500.00,
    "discount": 375.00,
    "total": 2125.00,
    "summary": "Total: $2125.00 for 150 components..."
  },
  "pricingTier": "Business",
  "recommendations": [
    "Add API endpoints to expose your components as services",
    "Consider creating a component library..."
  ],
  "summary": {
    "totalComponents": 150,
    "totalLinesOfCode": 50000,
    "componentsByType": {
      "component": 80,
      "utility": 30,
      "page": 25,
      "api": 15
    },
    "topComplexComponents": [...]
  }
}
```

#### POST `/api/code-scan`
Calculate pricing for specific components.

**Request Body:**
```json
{
  "componentPaths": [
    "src/components/pricing/workflow/pricing-table.tsx",
    "src/utils/code-scanner.ts"
  ]
}
```

**Response:**
```json
{
  "components": [...],
  "pricing": {
    "components": [...],
    "subtotal": 50.00,
    "discount": 0,
    "total": 50.00,
    "summary": "Total: $50.00 for 2 components..."
  },
  "message": "Calculated pricing for 2 component(s)"
}
```

### 4. UI Dashboard
Located in `src/app/code-inventory/page.tsx`, this provides:
- Summary cards showing:
  - Total components
  - Total lines of code
  - Current pricing tier
  - Total value
- Pricing breakdown with discount information
- Component distribution by type
- Design recommendations
- Most complex components table
- Filter and search capabilities
- Real-time scanning and refresh

## Usage

### Accessing the Dashboard
Navigate to `/code-inventory` in your browser to view the code inventory dashboard.

### Using the API Programmatically
```typescript
// Scan entire codebase
const response = await fetch('/api/code-scan');
const data = await response.json();

// Filter by type
const components = await fetch('/api/code-scan?type=component');

// Search for specific components
const results = await fetch('/api/code-scan?search=pricing');

// Calculate pricing for specific components
const pricing = await fetch('/api/code-scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    componentPaths: ['src/components/example.tsx']
  })
});
```

## Pricing Model

The default pricing model is:
- **Base Component Price**: $10 per component
- **Complexity Price**: $0.01 per line of code
- **Dependency Price**: $2 per external dependency
- **Volume Discount**: 15% discount when using 5 or more components

### Pricing Tiers
- **Free**: 0 components
- **Starter**: 1-4 components
- **Professional**: 5-19 components
- **Business**: 20-49 components
- **Enterprise**: 50+ components

## Design Recommendations

The system automatically generates recommendations based on your inventory:
- Suggests adding API endpoints if none exist
- Recommends creating a component library for large codebases
- Identifies overly complex components that should be refactored
- Suggests adding utility functions if too few exist

## Customization

### Adjusting Pricing Configuration
Edit `src/utils/pricing-calculator.ts` to modify the `DEFAULT_PRICING` constant:

```typescript
const DEFAULT_PRICING: PricingConfig = {
  pricePerComponent: 10,      // Base price per component
  pricePerLineOfCode: 0.01,   // Price per line
  pricePerDependency: 2,      // Price per dependency
  discountForMultiple: 0.15,  // 15% discount
};
```

### Adding New Component Types
Modify the `analyzeFile` function in `src/utils/code-scanner.ts` to add new component type classifications.

### Customizing Recommendations
Edit the `generateDesignRecommendation` function in `src/utils/pricing-calculator.ts` to add your own recommendation logic.

## Architecture

```
src/
├── app/
│   ├── api/
│   │   └── code-scan/
│   │       └── route.ts          # API endpoint
│   └── code-inventory/
│       ├── layout.tsx             # Page layout
│       └── page.tsx               # Dashboard UI
└── utils/
    ├── code-scanner.ts            # Code analysis utility
    └── pricing-calculator.ts      # Pricing logic
```

## Technical Details

- **Framework**: Next.js 14.2+ with App Router
- **Language**: TypeScript
- **File System**: Node.js fs module for file operations
- **Styling**: TailwindCSS (matches existing design system)
- **API**: RESTful API with CORS support

## Performance Considerations

- The code scanner processes files sequentially to avoid memory issues
- Large codebases (1000+ files) may take several seconds to scan
- Results are not cached; each request performs a fresh scan
- Consider implementing caching for production use

## Future Enhancements

Potential improvements:
1. Add caching mechanism to store scan results
2. Implement real-time file watching for automatic updates
3. Add export functionality (CSV, JSON, PDF reports)
4. Create comparison features to track changes over time
5. Integrate with CI/CD pipelines for automated scanning
6. Add authentication and authorization for multi-user environments
7. Implement database storage for historical data
8. Add visualization charts and graphs

## Troubleshooting

### Scan Takes Too Long
- Reduce the number of files being scanned by adding exclusions
- Consider implementing pagination or lazy loading

### Incorrect Component Counts
- Check that the type classification logic in `analyzeFile` matches your project structure
- Verify that excluded directories are properly configured

### Pricing Seems Off
- Review the pricing configuration in `src/utils/pricing-calculator.ts`
- Ensure external dependencies are being correctly identified

## Contributing

When contributing to this feature:
1. Maintain TypeScript type safety
2. Follow the existing code style and patterns
3. Add tests for new functionality
4. Update this documentation for any changes

## License

This feature is part of the Upstash web project and follows the same license.
