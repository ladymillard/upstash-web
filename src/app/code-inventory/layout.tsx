import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Code Inventory & Pricing",
  description: "Scan your codebase and calculate pricing for existing components",
};

export default function CodeInventoryLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
