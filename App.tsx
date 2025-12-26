
import React, { useState, useEffect } from 'react';
import { parseExcelFile, processFiles, downloadExcel } from './services/excelService';
import { ParsedSheet, AnalysisStatus, CalculatorConfig, ProcessedRow, WeightEntry, ShippingRate } from './types';
import FileUpload from './components/FileUpload';
import DataGrid from './components/DataGrid';
import StatsDashboard from './components/StatsDashboard';
import WeightManager from './components/WeightManager';

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="group relative flex items-center ml-1">
    <div className="cursor-help text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    </div>
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded shadow-xl z-50 text-center pointer-events-none">
      {text}
      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-800 dark:border-t-slate-700"></div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calc' | 'logistics'>('calc');
  // Requisito: Siempre abrir en tema oscuro
  const [darkMode, setDarkMode] = useState(true);

  // Base de Pesos y Escalas con persistencia
  const [weights, setWeights] = useState<WeightEntry[]>(() => {
    const saved = localStorage.getItem('app_weights');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [rates, setRates] = useState<ShippingRate[]>(() => {
    const saved = localStorage.getItem('app_shipping_rates');
    return saved ? JSON.parse(saved) : [
      { maxWeight: 0.5, cost: 5500 },
      { maxWeight: 1.0, cost: 6800 },
      { maxWeight: 2.0, cost: 8200 }
    ];
  });

  useEffect(() => {
    localStorage.setItem('app_weights', JSON.stringify(weights));
  }, [weights]);

  useEffect(() => {
    localStorage.setItem('app_shipping_rates', JSON.stringify(rates));
  }, [rates]);

  const [mlSheet, setMlSheet] = useState<ParsedSheet | null>(null);
  const [odooSheet, setOdooSheet] = useState<ParsedSheet | null>(null);
  const [mlFileName, setMlFileName] = useState<string | null>(null);
  const [odooFileName, setOdooFileName] = useState<string | null>(null);

  const [config, setConfig] = useState<CalculatorConfig>({
    stockPercentage: 100,
    retentionsPct: 1,
    includeTaxes: true,
    shippingSurchargeAmount: 0,
    shippingSurchargeType: 'fixed',
    useWeightTable: false
  });

  const [results, setResults] = useState<ProcessedRow[]>([]);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const resultSheet: ParsedSheet | null = results.length > 0 ? {
    name: 'Resultados Calculados',
    data: results,
    columns: Object.keys(results[0])
  } : null;

  const handleMlUpload = async (file: File) => {
    try {
      const parsed = await parseExcelFile(file);
      const validSheet = parsed.find(s => s.columns.includes('ITEM_ID') || s.columns.includes('SKU'));
      if (validSheet) {
        setMlSheet(validSheet);
        setMlFileName(file.name);
      } else {
        throw new Error("El archivo no parece ser de Mercado Libre.");
      }
    } catch (e: any) { setErrorMessage(e.message); }
  };

  const handleOdooUpload = async (file: File) => {
    try {
      const parsed = await parseExcelFile(file);
      const validSheet = parsed.find(s => s.columns.includes('Código Neored') || s.columns.includes('Referencia interna'));
      if (validSheet) {
        setOdooSheet(validSheet);
        setOdooFileName(file.name);
      } else {
        throw new Error("El archivo no parece ser de Odoo.");
      }
    } catch (e: any) { setErrorMessage(e.message); }
  };

  const handleCalculate = () => {
    if (!mlSheet || !odooSheet) {
      setErrorMessage("Por favor carga ambos archivos.");
      return;
    }
    setStatus(AnalysisStatus.PARSING);
    setTimeout(() => {
        try {
            const calculatedData = processFiles(mlSheet, odooSheet, config, weights, rates);
            setResults(calculatedData);
            setStatus(AnalysisStatus.READY);
            setErrorMessage(null);
        } catch (e: any) {
            setErrorMessage("Error: " + e.message);
            setStatus(AnalysisStatus.ERROR);
        }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300">
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 dark:bg-blue-500 p-1.5 rounded-xl shadow-lg shadow-blue-500/20">
                   <div className="text-white font-black text-xs leading-none">ML</div>
                   <div className="text-white font-black text-xs leading-none">+O</div>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white hidden sm:block tracking-tight">Excel AI Explorer</span>
              </div>
              
              {/* Tabs */}
              <div className="flex h-16 items-center">
                <button 
                  onClick={() => setActiveTab('calc')}
                  className={`px-4 h-full border-b-2 transition-all text-sm font-semibold flex items-center gap-2 ${activeTab === 'calc' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  Calculadora
                </button>
                <button 
                  onClick={() => setActiveTab('logistics')}
                  className={`px-4 h-full border-b-2 transition-all text-sm font-semibold flex items-center gap-2 ${activeTab === 'logistics' ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  Logística
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
                 <button 
                    onClick={() => setDarkMode(!darkMode)} 
                    className="p-2.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90"
                    title={darkMode ? "Tema Claro" : "Tema Oscuro"}
                  >
                    {darkMode ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                 </button>
                 {status === AnalysisStatus.READY && (
                    <button onClick={() => downloadExcel(results, "Resultados.xlsx")} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Exportar
                    </button>
                 )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-8 overflow-hidden">
        {activeTab === 'calc' ? (
          <div className="flex flex-col lg:flex-row gap-8 h-full">
            <div className="w-full lg:w-[340px] flex-shrink-0 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
                       <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-xs font-black">1</span>
                       Carga de Archivos
                    </h3>
                    <div className="flex flex-col gap-4">
                        <FileUpload label="Catálogo ML" onFileSelect={handleMlUpload} fileName={mlFileName} />
                        <FileUpload label="Reporte Odoo" onFileSelect={handleOdooUpload} fileName={odooFileName} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
                       <span className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center text-xs font-black">2</span>
                       Parámetros de Cálculo
                    </h3>
                    <div className="space-y-5">
                        <div className="group">
                            <div className="flex items-center mb-1.5"><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Stock a Publicar %</label></div>
                            <input type="number" value={config.stockPercentage} onChange={e => setConfig({...config, stockPercentage: parseFloat(e.target.value) || 0})} className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                        </div>
                        <div>
                            <div className="flex items-center mb-1.5"><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Retenciones Est. %</label></div>
                            <input type="number" value={config.retentionsPct} onChange={e => setConfig({...config, retentionsPct: parseFloat(e.target.value) || 0})} className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                        </div>
                        
                        <div className="space-y-4 pt-2">
                          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800 group">
                             <input type="checkbox" checked={config.includeTaxes} onChange={e => setConfig({...config, includeTaxes: e.target.checked})} className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700" />
                             <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">Incluir IVA (Odoo)</span>
                          </label>

                          <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all border ${config.useWeightTable ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent'}`}>
                             <input type="checkbox" checked={config.useWeightTable} onChange={e => setConfig({...config, useWeightTable: e.target.checked})} className="w-5 h-5 rounded-lg text-amber-600 focus:ring-amber-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700" />
                             <span className={`text-sm font-semibold ${config.useWeightTable ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>Usar Base de Pesos</span>
                          </label>
                        </div>

                        {!config.useWeightTable && (
                          <div className="pt-2 animate-fade-in">
                              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">Recargo Envío Manual</label>
                              <div className="flex gap-2">
                                  <select className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500" value={config.shippingSurchargeType} onChange={e => setConfig({...config, shippingSurchargeType: e.target.value as any})}>
                                      <option value="fixed">$</option>
                                      <option value="percent">%</option>
                                  </select>
                                  <input type="number" value={config.shippingSurchargeAmount} onChange={e => setConfig({...config, shippingSurchargeAmount: parseFloat(e.target.value) || 0})} className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                              </div>
                          </div>
                        )}
                    </div>
                    <button onClick={handleCalculate} disabled={!mlSheet || !odooSheet} className="w-full mt-8 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 transform">
                        PROCESAR DATOS
                    </button>
                </div>
            </div>

            <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                {status === AnalysisStatus.READY && resultSheet ? <DataGrid sheet={resultSheet} /> : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 p-12 text-center space-y-4">
                        <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-full border border-slate-100 dark:border-slate-800">
                           <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <p className="font-medium text-lg">Esperando archivos para procesar...</p>
                        <p className="text-sm max-w-xs mx-auto">Sube el catálogo de ML y el reporte de Odoo para sincronizar stock y precios.</p>
                    </div>
                )}
            </div>

            <div className="w-full lg:w-[300px] flex-shrink-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
               <h3 className="font-bold text-slate-900 dark:text-slate-100 px-2 tracking-tight">Panel de Control</h3>
               {status === AnalysisStatus.READY ? <StatsDashboard results={results} /> : <div className="p-10 text-center text-xs font-bold text-slate-400 dark:text-slate-600 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem]">LISTO PARA ANALIZAR</div>}
            </div>
          </div>
        ) : (
          <WeightManager 
            weights={weights} 
            onWeightsChange={setWeights} 
            rates={rates} 
            onRatesChange={setRates} 
          />
        )}
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default App;
