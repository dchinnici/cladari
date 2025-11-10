'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search, Filter, Download, Droplets, Plus, Zap,
  SortAsc, X, ChevronDown
} from 'lucide-react'

interface CompactControlsProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  sortBy: string
  setSortBy: (sort: string) => void
  onFilterClick: () => void
  onQuickCareClick: () => void
  onExportClick: () => void
  onAddPlantClick: () => void
  activeFilterCount: number
  searchInputRef: React.RefObject<HTMLInputElement>
}

export default function CompactControls({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  onFilterClick,
  onQuickCareClick,
  onExportClick,
  onAddPlantClick,
  activeFilterCount,
  searchInputRef
}: CompactControlsProps) {
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)

  const sortOptions = [
    { value: 'oldest', label: 'Needs Attention', icon: '⚠️' },
    { value: 'newest', label: 'Recently Active', icon: '🕐' },
    { value: 'alphabetical', label: 'Alphabetical', icon: '🔤' }
  ]

  const currentSort = sortOptions.find(opt => opt.value === sortBy)

  return (
    <div className="glass rounded-2xl p-3 mb-6">
      {/* Mobile Layout */}
      <div className="flex md:hidden items-center gap-2">
        {/* Search - Expandable on mobile */}
        <div className={`flex-1 transition-all ${searchExpanded ? '' : 'max-w-[48px]'}`}>
          {searchExpanded ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>
              <button
                onClick={() => {
                  setSearchExpanded(false)
                  setSearchTerm('')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchExpanded(true)}
              className="p-2 hover:bg-gray-100 rounded-lg relative"
              title="Search"
            >
              <Search className="w-5 h-5" />
              {searchTerm && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
              )}
            </button>
          )}
        </div>

        {/* Action buttons for mobile */}
        {!searchExpanded && (
          <>
            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title={currentSort?.label}
              >
                <SortAsc className="w-5 h-5" />
              </button>
              {sortDropdownOpen && (
                <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[160px]">
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value)
                        setSortDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                        sortBy === option.value ? 'bg-emerald-50 text-emerald-700' : ''
                      }`}
                    >
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter */}
            <button
              onClick={onFilterClick}
              className="p-2 hover:bg-gray-100 rounded-lg relative"
              title="Filters"
            >
              <Filter className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Quick Care */}
            <button
              onClick={onQuickCareClick}
              className="p-2 bg-yellow-100 hover:bg-yellow-200 rounded-lg"
              title="Quick Care (Cmd+K)"
            >
              <Zap className="w-5 h-5 text-yellow-600" />
            </button>

            {/* Batch Care */}
            <Link
              href="/batch-care"
              className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg"
              title="Batch Care"
            >
              <Droplets className="w-5 h-5 text-blue-600" />
            </Link>

            {/* Add Plant */}
            <button
              onClick={onAddPlantClick}
              className="p-2 bg-emerald-100 hover:bg-emerald-200 rounded-lg"
              title="Add Plant"
            >
              <Plus className="w-5 h-5 text-emerald-600" />
            </button>
          </>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-3">
        {/* Search bar - always visible on desktop */}
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search plants... (Press / to focus)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Sort dropdown - compact */}
        <div className="relative">
          <button
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <span>{currentSort?.icon}</span>
            <span className="hidden lg:inline">{currentSort?.label}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {sortDropdownOpen && (
            <div className="absolute right-0 top-11 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[180px]">
              {sortOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value)
                    setSortDropdownOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                    sortBy === option.value ? 'bg-emerald-50 text-emerald-700' : ''
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Icon buttons with tooltips */}
        <button
          onClick={onFilterClick}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 relative group"
          title="Filters"
        >
          <Filter className="w-5 h-5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Filters
          </span>
        </button>

        <button
          onClick={onQuickCareClick}
          className="p-2 rounded-lg bg-yellow-100 hover:bg-yellow-200 group relative"
          title="Quick Care (Cmd+K)"
        >
          <Zap className="w-5 h-5 text-yellow-600" />
          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Quick Care (⌘K)
          </span>
        </button>

        <button
          onClick={onExportClick}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 group relative"
          title="Export CSV"
        >
          <Download className="w-5 h-5" />
          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Export CSV
          </span>
        </button>

        <div className="h-6 w-px bg-gray-300" />

        <Link
          href="/batch-care"
          className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 group relative"
        >
          <Droplets className="w-5 h-5 text-blue-600" />
          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Batch Care
          </span>
        </Link>

        <button
          onClick={onAddPlantClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden lg:inline">Add Plant</span>
        </button>
      </div>
    </div>
  )
}