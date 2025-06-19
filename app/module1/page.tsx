// app/module1/page.tsx (Corrected Structure)
'use client'; 

import { MetricsTable } from '@/components/dashboard/MetricsTable';
import { useSignalAnalysis } from '@/lib/hooks/useSignalAnalysis'; 
import { THESIS_SCORING_RULES } from '@/lib/config/signalThesisRules'; 

const pocThesisNames = Object.keys(THESIS_SCORING_RULES);

export default function Module1Page() {
  const {
    selectedThesis,
    setSelectedThesis,
    evidenceScores, 
    keyMetrics,     
    loading,
    error,
    lastFetched,
  } = useSignalAnalysis();

  const handleThesisChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedThesis(event.target.value);
  };

  const currentThesisDescription = THESIS_SCORING_RULES[selectedThesis]?.thesis_description || "No description available.";

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">Loading economic and market data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-screen text-red-500">
        <p className="text-xl">Error loading data:</p>
        <pre className="mt-2 p-4 bg-red-100 text-red-700 rounded whitespace-pre-wrap">
          {typeof error === 'string' ? error : JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }

  // MAIN RETURN FOR THE PAGE
  return (
    // OUTERMOST PAGE CONTAINER
    <div className="page-container p-4 md:p-6 lg:p-8"> 
      
      {/* STYLED HEADER CARD - This is one direct child of page-container */}
      <div className="mb-8 p-4 sm:p-6 bg-white dark:bg-slate-800 shadow-xl rounded-xl">
        {/* Top section: Title and Last Refresh */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Macro Environment Assessment (PoC)
            </h1>
          </div>
          <div className="mt-2 sm:mt-0 text-xs text-slate-500 dark:text-slate-400">
            Last data refresh: {lastFetched ? new Date(lastFetched).toLocaleString() : 'N/A'}
          </div>
        </div>

        {/* Controls and Score Display Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Thesis Selector */}
          <div className="md:col-span-12 lg:col-span-4">
            <label htmlFor="thesis-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Market Thesis:
            </label>
            <select
              id="thesis-select"
              value={selectedThesis}
              onChange={handleThesisChange}
              className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white py-2.5 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm shadow-sm"
            >
              {pocThesisNames.map((thesisName) => (
                <option key={thesisName} value={thesisName} className="dark:bg-slate-700 dark:text-white">
                  {thesisName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Thesis Info & Score */}
          <div className="md:col-span-12 lg:col-span-8 mt-4 md:mt-0 p-4 sm:p-6 bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600">
            <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
              Analysis for: {selectedThesis.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed italic">
              {currentThesisDescription}
            </p>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
              <p className="text-md font-medium text-slate-800 dark:text-slate-200">
                Weight of Evidence Score:
              </p>
              <span
                className={`px-3 py-1.5 rounded-lg text-xl font-bold
                  ${evidenceScores.overall === undefined || evidenceScores.overall === null ? 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400' :
                    evidenceScores.overall >= 0.05 ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' :
                    evidenceScores.overall > -0.05 ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                    'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                  }`}
              >
                {evidenceScores.overall !== undefined && evidenceScores.overall !== null ? evidenceScores.overall.toFixed(2) : 'N/A'}
              </span>
            </div>
          </div>
        </div> 
      </div> {/* Closes STYLED HEADER CARD */}

      {/* METRICSTABLE - This is the second direct child of page-container */}
      <MetricsTable metricsForTable={keyMetrics} />

    </div> // Closes OUTERMOST PAGE CONTAINER
  ); // Closes MAIN RETURN
} // Closes Module1Page function