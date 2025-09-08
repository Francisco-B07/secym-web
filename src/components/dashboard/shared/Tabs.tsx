"use client";

import { useState } from "react";

interface TabsProps {
  tabs: { name: string; content: React.ReactNode }[];
}

export default function Tabs({ tabs }: TabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab, index) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(index)}
              className={`${
                index === activeTab
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-6">{tabs[activeTab].content}</div>
    </div>
  );
}
