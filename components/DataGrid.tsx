
import React, { useState } from 'react';
import { ParsedSheet } from '../types';

interface DataGridProps {
  sheet: ParsedSheet;
}

const DataGrid: React.FC<DataGridProps> = ({ sheet }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 15;

  const filteredData = sheet.data.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
      {/* Search Header */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            Resultados
            <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full uppercase tracking-widest">
              {filteredData.length} registros
            </span>
          </h2>
        </div>
        
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-11 pr-4 py-2.5 w-full text-sm font-medium border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-all shadow-sm"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto scrollbar-hide relative">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="sticky top-0 z-20 shadow-sm">
            <tr className="bg-slate-100 dark:bg-slate-800">
              {sheet.columns.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className="px-6 py-4 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap border-b border-slate-200 dark:border-slate-700"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            {currentData.length > 0 ? (
              currentData.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                  {sheet.columns.map((col, cIdx) => {
                    const value = row[col];
                    const isAlert = col === 'Notas' && String(value) !== 'OK';
                    return (
                      <td
                        key={`${rIdx}-${cIdx}`}
                        className={`px-6 py-4 text-sm font-medium whitespace-nowrap max-w-[280px] overflow-hidden text-ellipsis transition-colors
                          ${isAlert ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-700 dark:text-slate-300'}
                          ${col === 'SKU' || col === 'PRECIO PUBLICACIÓN SUGERIDO' ? 'font-black text-slate-900 dark:text-white' : ''}
                        `}
                      >
                        {value !== undefined && value !== null ? String(value) : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={sheet.columns.length} className="px-6 py-24 text-center">
                  <p className="text-slate-400 dark:text-slate-600 font-bold text-lg">No hay datos que coincidan</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 backdrop-blur-sm flex justify-between items-center">
        <div className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
          {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredData.length)} de {filteredData.length}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-xs font-black text-slate-900 dark:text-white min-w-[80px] text-center">
            Pág. {page} / {Math.max(1, totalPages)}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataGrid;
