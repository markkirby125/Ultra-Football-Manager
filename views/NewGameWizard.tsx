
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Key, Zap, Upload, Check, Loader2, AlertTriangle, ArrowRight, FileText, Database, Lock, ChevronRight, Download } from 'lucide-react';
import { testGeminiConnection, testGrokConnection, parseKeysFromFile } from '../utils/textGenerator';
import { parseImportData } from '../utils/csvImporter';
import { RealWorldData } from '../types';

interface Props {
    onBack: () => void;
}

type WizardStep = 'api_config' | 'data_selection';

export const NewGameWizard: React.FC<Props> = ({ onBack }) => {
    const { actions, apiKey, grokApiKey } = useGame();
    const [step, setStep] = useState<WizardStep>('api_config');
    
    // Step 1 State
    const [geminiKey, setGeminiKey] = useState(apiKey || '');
    const [grokKey, setGrokKey] = useState(grokApiKey || '');
    const [status, setStatus] = useState<'idle' | 'testing' | 'error' | 'success'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    // Step 2 State
    const [loadingImport, setLoadingImport] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importedData, setImportedData] = useState<RealWorldData | null>(null);
    const [importSource, setImportSource] = useState<'community' | 'file' | null>(null);
    
    // --- STEP 1 LOGIC ---

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const parsed = parseKeysFromFile(text);
            if (parsed.gemini) setGeminiKey(parsed.gemini);
            if (parsed.grok) setGrokKey(parsed.grok);
            if (!parsed.gemini && !parsed.grok) setErrorMsg("No keys found in file.");
            else setErrorMsg(null);
        };
        reader.readAsText(file);
    };

    const handleVerifyKeys = async () => {
        if (!geminiKey) {
            setErrorMsg("Gemini API Key is required for online features.");
            return;
        }
        setStatus('testing');
        setErrorMsg(null);

        const geminiOk = await testGeminiConnection(geminiKey);
        if (!geminiOk) {
            setStatus('error');
            setErrorMsg("Gemini API Key validation failed.");
            return;
        }

        if (grokKey) {
            const grokOk = await testGrokConnection(grokKey);
            if (!grokOk) {
                setStatus('error');
                setErrorMsg("Grok API Key validation failed.");
                return;
            }
        }

        setStatus('success');
        setIsOfflineMode(false);
        setTimeout(() => setStep('data_selection'), 800);
    };

    const handleOfflineMode = () => {
        setIsOfflineMode(true);
        setStep('data_selection');
    };

    // --- STEP 2 LOGIC ---

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoadingImport(true);
        setImportError(null);
        try {
            const data = await parseImportData(file);
            setImportedData(data);
            setImportSource('file');
        } catch (e: any) {
            setImportError(e.message || "Failed to parse CSV. Ensure it is a valid player dataset.");
        } finally {
            setLoadingImport(false);
        }
    };

    const finalizeGameStart = (mode: 'ai' | 'import') => {
        // Set keys in context before starting
        if (!isOfflineMode) {
            actions.setApiKey(geminiKey);
            if (grokKey) actions.setGrokApiKey(grokKey);
        }

        if (mode === 'ai') {
            actions.startNewGame(geminiKey);
        } else if (mode === 'import' && importedData) {
            actions.startImportedGame(importedData);
        }
    };

    // --- RENDER ---

    if (step === 'api_config') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
                <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 border-b border-slate-700">
                        <h2 className="text-3xl font-sport text-white mb-2">Initialize Coaching Intelligence</h2>
                        <p className="text-slate-400 text-sm">
                            Configure your AI assistants. This enables dynamic match reports, social media drama, and tactical advice.
                        </p>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-emerald-400 uppercase mb-2 flex justify-between items-center">
                                    <span>Google Gemini API (Required)</span>
                                    {status === 'testing' ? <Loader2 size={14} className="animate-spin"/> : status === 'success' ? <Check size={16} className="text-emerald-500"/> : null}
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        type="password" 
                                        value={geminiKey}
                                        onChange={(e) => setGeminiKey(e.target.value)}
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono text-sm focus:border-emerald-500 outline-none transition-colors"
                                        placeholder="AIzaSy..."
                                    />
                                    <div className="relative group">
                                        <input type="file" accept=".txt" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full"/>
                                        <Button variant="secondary" className="h-full px-4" title="Upload key file"><Upload size={18}/></Button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white uppercase mb-2 flex items-center gap-2">
                                    <Zap size={14} className="text-yellow-400"/> xAI Grok API (Optional)
                                </label>
                                <input 
                                    type="password" 
                                    value={grokKey}
                                    onChange={(e) => setGrokKey(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono text-sm focus:border-yellow-500 outline-none transition-colors"
                                    placeholder="xai-..."
                                />
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="bg-red-900/20 border border-red-500/50 p-3 rounded flex items-center gap-3 text-red-200 text-sm">
                                <AlertTriangle size={18} /> {errorMsg}
                            </div>
                        )}

                        <div className="pt-4 flex flex-col gap-3">
                            <Button onClick={handleVerifyKeys} size="lg" className="w-full py-4 text-lg shadow-emerald-900/20 shadow-lg">
                                {status === 'testing' ? 'Verifying...' : status === 'success' ? 'Access Granted' : 'Verify & Initialize'}
                            </Button>
                            
                            <div className="flex justify-between items-center mt-2">
                                <button onClick={onBack} className="text-slate-500 hover:text-white text-sm transition-colors">Back to Menu</button>
                                <button onClick={handleOfflineMode} className="text-slate-500 hover:text-white text-sm transition-colors flex items-center gap-1">
                                    Continue Offline (No AI) <ChevronRight size={14}/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: Data Selection (Confirmation View)
    if (importedData) {
        const teamCount = Object.keys(importedData).length;
        const playerCount = Object.values(importedData).reduce((acc, players: any) => acc + players.length, 0);

        return (
            <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in flex flex-col items-center justify-center min-h-screen">
                <Card title="Database Ready" className="border-emerald-500 w-full">
                    <div className="text-center p-8">
                        <div className="w-20 h-20 bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500 text-emerald-400">
                            <Database size={40} />
                        </div>
                        <h3 className="text-3xl font-sport text-white mb-2">Import Successful</h3>
                        <p className="text-slate-400 mb-8">
                            Ready to generate world from {importSource === 'community' ? 'Official Database' : 'Custom File'}.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-slate-900 p-4 rounded border border-slate-800">
                                <div className="text-4xl font-mono text-white font-bold">{teamCount}</div>
                                <div className="text-xs uppercase text-slate-500 font-bold mt-1">Teams Found</div>
                            </div>
                            <div className="bg-slate-900 p-4 rounded border border-slate-800">
                                <div className="text-4xl font-mono text-white font-bold">{playerCount}</div>
                                <div className="text-xs uppercase text-slate-500 font-bold mt-1">Players Parsed</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button variant="secondary" onClick={() => setImportedData(null)}>Cancel</Button>
                            <Button onClick={() => finalizeGameStart('import')} className="flex-1 flex items-center justify-center gap-2 py-3 text-lg">
                                Start Season <ArrowRight size={20}/>
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6">
            <div className="w-full max-w-5xl">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-sport text-white mb-2">Select Database Source</h2>
                    <p className="text-slate-400">Choose how you want to populate the football world.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Option 1: AI Scout */}
                    <div 
                        className={`bg-slate-900 border rounded-xl p-6 flex flex-col h-full transition-all duration-300 ${isOfflineMode ? 'border-slate-800 opacity-50 grayscale' : 'border-slate-700 hover:border-emerald-500 hover:shadow-emerald-900/20 hover:shadow-xl cursor-pointer group'}`}
                        onClick={() => !isOfflineMode && finalizeGameStart('ai')}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-lg ${isOfflineMode ? 'bg-slate-800 text-slate-500' : 'bg-emerald-900/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors'}`}>
                                <Zap size={32} />
                            </div>
                            {!isOfflineMode && <span className="bg-emerald-500 text-slate-900 text-[10px] font-bold px-2 py-1 rounded uppercase">Creative</span>}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">AI Scout</h3>
                        <p className="text-sm text-slate-400 mb-6 flex-1">
                            Generates a completely unique, living world using Google Gemini. Players are hallucinations/approximations.
                        </p>
                        {isOfflineMode ? (
                            <div className="mt-auto flex items-center gap-2 text-xs font-bold text-red-400 bg-red-900/20 p-2 rounded justify-center">
                                <Lock size={12}/> Requires Online API
                            </div>
                        ) : (
                            <div className="mt-auto text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
                                Least Accurate • Most Fun
                            </div>
                        )}
                    </div>

                    {/* Option 2: Manual File Upload */}
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col h-full hover:border-purple-500 transition-all hover:shadow-purple-900/20 hover:shadow-xl relative group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-purple-900/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                <FileText size={32} />
                            </div>
                            <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Modding</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Custom File</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Upload your own <span className="text-white font-mono">.csv</span> file.
                        </p>
                        
                        <div className="flex-1 bg-slate-950/50 rounded border border-slate-800 p-3 mb-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-1">
                                <Download size={12}/> Need fresh data?
                            </div>
                            <p className="text-[10px] text-slate-500">
                                Download "Football Players Stats 2024-2025" from <a href="https://www.kaggle.com/datasets/hubertsidorowicz/football-players-stats-2024-2025?resource=download" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline" onClick={e=>e.stopPropagation()}>Kaggle</a> and upload it here.
                            </p>
                        </div>
                        
                        <div className="mt-auto relative">
                            <input 
                                type="file" 
                                accept=".csv" 
                                onChange={handleFileImport} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                disabled={loadingImport}
                            />
                            <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
                                {loadingImport ? <Loader2 size={16} className="animate-spin"/> : <><Upload size={16}/> Select CSV</>}
                            </Button>
                        </div>
                    </div>
                </div>

                {importError && (
                    <div className="mt-6 p-4 bg-red-900/20 border border-red-500/50 rounded flex items-center justify-center gap-2 text-red-200 animate-in fade-in">
                        <AlertTriangle size={18}/> {importError}
                    </div>
                )}

                <div className="mt-8 text-center">
                    <button onClick={() => setStep('api_config')} className="text-slate-500 hover:text-white text-sm transition-colors">
                        Back to API Config
                    </button>
                </div>
            </div>
        </div>
    );
};
