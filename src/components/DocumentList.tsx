import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  FileSpreadsheet,
  FileText,
  Lock,
  Eye,
  Calendar,
  Layers,
  ShieldCheck,
  Clock,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  X,
  Zap,
  Tag,
  Hash,
} from 'lucide-react';
import { HealthDocument, Department, ConfidentialityLevel, DocumentStatus } from '../types';

interface DocumentListProps {
  documents: HealthDocument[];
  onSelectDocument: (doc: HealthDocument) => void;
  onOpenScanner: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onSelectDocument,
  onOpenScanner,
  onExportCsv,
  onExportPdf,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'ALL' | 'TITLE' | 'REF' | 'CATEGORY'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedConfidentiality, setSelectedConfidentiality] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [retrievalTimeMs, setRetrievalTimeMs] = useState<number>(0.6);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const categories: Department[] = [
    'Reproductive, Maternal & Child Health',
    'IT Help Desk & Infrastructure',
    'Epidemiology & Disease Control',
    'Pharmacy & Logistics (NatPharm)',
    'Clinical Guidelines & Standards',
    'Finance & Health Procurement',
    'Personnel & Administration',
  ];

  // Global hotkey: press '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute category counts for fast filtering tabs
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: documents.length };
    categories.forEach((cat) => {
      counts[cat] = documents.filter((d) => d.category === cat).length;
    });
    return counts;
  }, [documents]);

  // Real-time Filtering and Sorting (Ordered by Date and Category)
  const filteredDocuments = useMemo(() => {
    const start = performance.now();
    const q = searchQuery.trim().toLowerCase();

    const result = documents
      .filter((doc) => {
        // Real-time multi-target search
        if (q) {
          if (searchScope === 'TITLE') {
            if (!doc.title.toLowerCase().includes(q)) return false;
          } else if (searchScope === 'REF') {
            if (!doc.referenceNo.toLowerCase().includes(q)) return false;
          } else if (searchScope === 'CATEGORY') {
            if (!doc.category.toLowerCase().includes(q)) return false;
          } else {
            // ALL Fields
            const matchTitle = doc.title.toLowerCase().includes(q);
            const matchRef = doc.referenceNo.toLowerCase().includes(q);
            const matchCat = doc.category.toLowerCase().includes(q);
            const matchSummary = doc.summary.toLowerCase().includes(q);
            const matchTags = doc.tags.some((t) => t.toLowerCase().includes(q));
            if (!matchTitle && !matchRef && !matchCat && !matchSummary && !matchTags) {
              return false;
            }
          }
        }

        // Category filter
        if (selectedCategory !== 'ALL' && doc.category !== selectedCategory) {
          return false;
        }

        // Confidentiality filter
        if (selectedConfidentiality !== 'ALL' && doc.confidentiality !== selectedConfidentiality) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'ALL' && doc.status !== selectedStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Primary sort: Date
        const timeA = new Date(a.dateCreated).getTime();
        const timeB = new Date(b.dateCreated).getTime();
        if (sortOrder === 'desc') {
          if (timeB !== timeA) return timeB - timeA;
        } else {
          if (timeA !== timeB) return timeA - timeB;
        }
        // Secondary sort: Category
        return a.category.localeCompare(b.category);
      });

    const elapsed = Math.max(0.2, Number((performance.now() - start).toFixed(1)));
    setRetrievalTimeMs(elapsed);

    return result;
  }, [documents, searchQuery, searchScope, selectedCategory, selectedConfidentiality, selectedStatus, sortOrder]);

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
    return `${(bytes / 1000).toFixed(0)} KB`;
  };

  // Helper to highlight matching text in title / ref
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={index}
          className="bg-emerald-200/90 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-100 rounded-xs px-0.5"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* High-Performance Real-Time Search & Filtering Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Main Search Input with Target Scope Selector */}
          <div className="flex-1 flex items-center gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  searchScope === 'TITLE'
                    ? 'Search by document title (e.g. Immunization, Audit)...'
                    : searchScope === 'REF'
                    ? 'Search by reference number (e.g. MOHCC-PED-*, MOHCC-IT-*)...'
                    : searchScope === 'CATEGORY'
                    ? 'Filter by category (e.g. Maternal & Child Health)...'
                    : 'Real-time search across title, reference #, or category...'
                }
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-emerald-600 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Target Field Scope Dropdown */}
            <select
              value={searchScope}
              onChange={(e) => setSearchScope(e.target.value as any)}
              className="px-2.5 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 shrink-0"
              title="Select search target field"
            >
              <option value="ALL">All Fields</option>
              <option value="TITLE">Title Only</option>
              <option value="REF">Reference #</option>
              <option value="CATEGORY">Category</option>
            </select>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 shrink-0">
            {/* Date Sort Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
              title="Toggle Chronological Ordering"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Date: {sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={onExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            {/* Export PDF */}
            <button
              onClick={onExportPdf}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>Official PDF</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Cards
              </button>
            </div>
          </div>
        </div>

        {/* Quick Category Fast-Filter Buttons Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Category:
          </span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>All Departments</span>
            <span className="text-[10px] font-mono opacity-80">({categoryCounts['ALL'] || 0})</span>
          </button>
          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-700 text-white dark:bg-emerald-600 font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat}</span>
                <span className="text-[10px] font-mono opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Sub-Filters: Status & Clearance + Retrieval Speed Metric */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="NEEDS_REVISION">Needs Revision</option>
                <option value="ARCHIVED">Cold Archive</option>
              </select>
            </div>

            {/* Clearance Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Clearance:</span>
              <select
                value={selectedConfidentiality}
                onChange={(e) => setSelectedConfidentiality(e.target.value)}
                className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="ALL">All Clearances</option>
                <option value="RESTRICTED_MEDICAL">RESTRICTED_MEDICAL</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="INTERNAL">INTERNAL</option>
                <option value="PUBLIC">PUBLIC</option>
              </select>
            </div>

            {/* Quick Filter Reset */}
            {(searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || selectedConfidentiality !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedStatus('ALL');
                  setSelectedConfidentiality('ALL');
                }}
                className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold hover:underline"
              >
                Reset All Filters
              </button>
            )}
          </div>

          {/* Real-Time Retrieval Speed Indicator */}
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400 ml-auto">
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Retrieved in {retrievalTimeMs}ms</span>
            </span>
            <span>·</span>
            <span>
              <strong className="text-slate-700 dark:text-slate-200">{filteredDocuments.length}</strong> of {documents.length} records
            </span>
            <span className="hidden sm:inline text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
              Press <kbd className="font-bold">/</kbd> to search
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid View */}
      {filteredDocuments.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <FolderOpen className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No health records matched your real-time search query
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            No matches found for "{searchQuery}" in {selectedCategory === 'ALL' ? 'all categories' : selectedCategory}.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
            >
              Clear Search Filter
            </button>
            <button
              onClick={onOpenScanner}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
            >
              Scan New Record
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Record Identifier</th>
                  <th className="py-3 px-4">Document Title &amp; Department</th>
                  <th className="py-3 px-4">Date Created</th>
                  <th className="py-3 px-4">Clearance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Integrity / Encryption</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => onSelectDocument(doc)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    {/* Identifier with match highlighting */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      {highlightMatch(doc.referenceNo, searchQuery)}
                    </td>

                    {/* Title & Metadata with match highlighting */}
                    <td className="py-3.5 px-4 min-w-[280px]">
                      <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {highlightMatch(doc.title, searchQuery)}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {highlightMatch(doc.category, searchQuery)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{doc.authorName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{formatFileSize(doc.fileSize)}</span>
                      </div>
                    </td>

                    {/* Date Created */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono">
                      {new Date(doc.dateCreated).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Clearance */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          doc.confidentiality === 'RESTRICTED_MEDICAL'
                            ? 'text-rose-600 dark:text-rose-400'
                            : doc.confidentiality === 'CONFIDENTIAL'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {doc.confidentiality.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          doc.status === 'APPROVED'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : doc.status === 'PENDING_REVIEW'
                            ? 'text-amber-600 dark:text-amber-400'
                            : doc.status === 'NEEDS_REVISION'
                            ? 'text-rose-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {doc.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Integrity & Encryption */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>AES-256</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-[10px] text-slate-400">{doc.encryption.keyFingerprint}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDocument(doc);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-colors"
                      >
                        Inspect Dossier →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onSelectDocument(doc)}
              className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 cursor-pointer shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-emerald-700 dark:text-emerald-400 mb-2 font-semibold">
                  <span>{highlightMatch(doc.referenceNo, searchQuery)}</span>
                  <span
                    className={`font-sans font-semibold text-[11px] ${
                      doc.confidentiality === 'RESTRICTED_MEDICAL'
                        ? 'text-rose-600 dark:text-rose-400'
                        : doc.confidentiality === 'CONFIDENTIAL'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {doc.confidentiality.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                  {highlightMatch(doc.title, searchQuery)}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {doc.summary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {highlightMatch(doc.category, searchQuery)}
                  </span>
                  <span
                    className={`font-semibold ${
                      doc.status === 'APPROVED'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {doc.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                  <span>
                    {new Date(doc.dateCreated).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Lock className="w-3 h-3" />
                    <span>AES-GCM</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
