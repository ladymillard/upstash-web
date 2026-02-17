"use client";

import React, { useEffect, useState } from "react";
import Container from "@/components/container";
import PageHeaderTitle from "@/components/page-header-title";
import PageHeaderDesc from "@/components/page-header-desc";
import type { CodeScanResponse } from "../api/code-scan/route";

export default function CodeInventoryPage() {
  const [data, setData] = useState<CodeScanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filterType) params.append("type", filterType);
      if (searchQuery) params.append("search", searchQuery);
      
      const response = await fetch(`/api/code-scan?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch code inventory");
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = () => {
    fetchData();
  };

  const handleReset = () => {
    setFilterType("");
    setSearchQuery("");
    setTimeout(fetchData, 0);
  };

  if (loading) {
    return (
      <Container>
        <div className="py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-lg">Scanning codebase...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="py-16 text-center">
          <p className="text-lg text-red-500">Error: {error}</p>
          <button
            onClick={fetchData}
            className="mt-4 rounded bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </Container>
    );
  }

  if (!data) return null;

  return (
    <div className="py-16">
      <Container>
        {/* Header */}
        <div className="mb-12 text-center">
          <PageHeaderTitle>Code Inventory & Pricing</PageHeaderTitle>
          <PageHeaderDesc>
            Scan your codebase to discover existing components and calculate
            pricing for what you&apos;ve already built.
          </PageHeaderDesc>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-bg-mute">
            <h3 className="mb-2 text-sm font-medium text-text-mute">
              Total Components
            </h3>
            <p className="text-3xl font-bold text-primary-text">
              {data.summary.totalComponents}
            </p>
          </div>
          
          <div className="rounded-lg bg-white p-6 shadow dark:bg-bg-mute">
            <h3 className="mb-2 text-sm font-medium text-text-mute">
              Lines of Code
            </h3>
            <p className="text-3xl font-bold text-primary-text">
              {data.summary.totalLinesOfCode.toLocaleString()}
            </p>
          </div>
          
          <div className="rounded-lg bg-white p-6 shadow dark:bg-bg-mute">
            <h3 className="mb-2 text-sm font-medium text-text-mute">
              Pricing Tier
            </h3>
            <p className="text-3xl font-bold text-primary-text">
              {data.pricingTier}
            </p>
          </div>
          
          <div className="rounded-lg bg-white p-6 shadow dark:bg-bg-mute">
            <h3 className="mb-2 text-sm font-medium text-text-mute">
              Total Value
            </h3>
            <p className="text-3xl font-bold text-emerald-600">
              ${data.pricing.total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Pricing Details */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-bg-mute">
          <h2 className="mb-4 text-xl font-bold text-primary-text">
            Pricing Breakdown
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-text-mute">Subtotal:</span>
              <span className="font-semibold text-primary-text">
                ${data.pricing.subtotal.toFixed(2)}
              </span>
            </div>
            {data.pricing.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-text-mute">Discount (15%):</span>
                <span className="font-semibold text-emerald-600">
                  -${data.pricing.discount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="border-t border-bg-mute pt-2">
              <div className="flex justify-between text-lg">
                <span className="font-bold text-primary-text">Total:</span>
                <span className="font-bold text-emerald-600">
                  ${data.pricing.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-text-mute">{data.pricing.summary}</p>
        </div>

        {/* Components by Type */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-bg-mute">
          <h2 className="mb-4 text-xl font-bold text-primary-text">
            Components by Type
          </h2>
          <div className="grid gap-4 md:grid-cols-5">
            {Object.entries(data.summary.componentsByType).map(([type, count]) => (
              <div
                key={type}
                className="rounded border border-bg-mute p-4 text-center"
              >
                <p className="text-sm text-text-mute capitalize">{type}</p>
                <p className="text-2xl font-bold text-primary-text">{count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Design Recommendations */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-bg-mute">
          <h2 className="mb-4 text-xl font-bold text-primary-text">
            Design Recommendations
          </h2>
          <ul className="space-y-2">
            {data.recommendations.map((rec, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-text-mute"
              >
                <span className="mt-1 text-emerald-500">✓</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Complex Components */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-bg-mute">
          <h2 className="mb-4 text-xl font-bold text-primary-text">
            Most Complex Components
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-bg-mute text-left">
                  <th className="pb-2 text-sm font-medium text-text-mute">
                    Component
                  </th>
                  <th className="pb-2 text-sm font-medium text-text-mute">
                    Path
                  </th>
                  <th className="pb-2 text-right text-sm font-medium text-text-mute">
                    Lines of Code
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.summary.topComplexComponents.map((comp, index) => (
                  <tr
                    key={index}
                    className="border-b border-bg-mute last:border-0"
                  >
                    <td className="py-2 text-primary-text">{comp.name}</td>
                    <td className="py-2 text-sm text-text-mute">{comp.path}</td>
                    <td className="py-2 text-right font-semibold text-primary-text">
                      {comp.linesOfCode}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-bg-mute">
          <h2 className="mb-4 text-xl font-bold text-primary-text">
            Filter Components
          </h2>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-text-mute">
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full rounded border border-bg-mute bg-white px-4 py-2 dark:bg-bg-mute"
              >
                <option value="">All Types</option>
                <option value="component">Component</option>
                <option value="utility">Utility</option>
                <option value="page">Page</option>
                <option value="api">API</option>
                <option value="asset">Asset</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-text-mute">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or path..."
                className="w-full rounded border border-bg-mute bg-white px-4 py-2 dark:bg-bg-mute"
              />
            </div>
            
            <div className="flex items-end gap-2">
              <button
                onClick={handleFilter}
                className="rounded bg-primary px-6 py-2 text-white hover:bg-primary/90"
              >
                Apply
              </button>
              <button
                onClick={handleReset}
                className="rounded border border-bg-mute px-6 py-2 hover:bg-bg-mute"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={fetchData}
            className="rounded bg-emerald-600 px-8 py-3 text-lg font-semibold text-white hover:bg-emerald-700"
          >
            Refresh Scan
          </button>
        </div>
      </Container>
    </div>
  );
}
