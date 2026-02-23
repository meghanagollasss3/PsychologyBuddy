import React from 'react';
import { Pen, Mic, Palette } from 'lucide-react';

interface TabProps {
  activeTab: 'writing' | 'audio' | 'art';
  setActiveTab: (tab: 'writing' | 'audio' | 'art') => void;
  config?: {
    writingEnabled: boolean;
    audioEnabled: boolean;
    artEnabled: boolean;
  };
}

export default function JournalTabs({ activeTab, setActiveTab, config }: TabProps) {
  console.log('=== JOURNAL TABS DEBUG ===');
  console.log('Config received:', config);
  
  const allTabs = [
    { id: 'writing' as const, label: 'Write Journals', icon: Pen },
    { id: 'audio' as const, label: 'Audio Journals', icon: Mic },
    { id: 'art' as const, label: 'Art Journals', icon: Palette },
  ];

  // Filter tabs based on admin configuration
  const tabs = allTabs.filter(tab => {
    if (!config) {
      console.log('No config provided, showing all tabs');
      return true; // Show all if no config (fallback)
    }
    
    let enabled = false;
    switch (tab.id) {
      case 'writing': 
        enabled = config.writingEnabled;
        console.log(`Writing tab enabled: ${enabled}`);
        break;
      case 'audio': 
        enabled = config.audioEnabled;
        console.log(`Audio tab enabled: ${enabled}`);
        break;
      case 'art': 
        enabled = config.artEnabled;
        console.log(`Art tab enabled: ${enabled}`);
        break;
      default: 
        enabled = true;
    }
    return enabled;
  });

  console.log('Filtered tabs:', tabs);
  console.log('=== JOURNAL TABS DEBUG END ===');

  // If no tabs are enabled, don't render anything
  if (tabs.length === 0) {
    console.log('No tabs enabled, returning null');
    return null;
  }

  return (
    <div className="bg-white/50 backdrop-blur-sm p-1 sm:p-1.5 lg:p-1.5 rounded-full flex items-center justify-between gap-1 sm:gap-2 shadow-inner border border-white/60 mb-6 sm:mb-8 max-w-4xl mx-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 py-2 sm:py-3 px-3 sm:px-6 rounded-full text-xs sm:text-base font-medium transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 ${
            activeTab === tab.id
              ? 'bg-[#1B9EE0] text-white shadow-lg shadow-blue-400/30 transform scale-[1.02]'
              : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
          }`}
        >
          {/* <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" /> // Icons hidden in design but good for accessibility structure if needed */}
          <span className="hidden xs:block sm:block">{tab.label}</span>
          <span className="block xs:hidden sm:hidden text-xs">{tab.label.replace(' Journals', '')}</span>
        </button>
      ))}
    </div>
  );
}
