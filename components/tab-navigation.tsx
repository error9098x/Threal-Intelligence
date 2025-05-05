"use client"

interface TabNavigationProps {
  tabs: { id: string; label: string }[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex space-x-2 overflow-x-auto pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`glass-tab px-4 py-2 rounded-md transition-all duration-200 ${
            activeTab === tab.id ? "active text-blue-100" : "text-blue-300 hover:text-blue-100"
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
