
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Zap, Globe, Upload, FileText, Database, Loader2, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { fetchCommunityData, parseImportData } from '../utils/csvImporter';
import { RealWorldData } from '../types';

interface Props {
    onBack: () => void;
    onStartAI: () => void;
}

export const NewGameMenu: React.FC<Props> = ({ onBack, onStartAI }) => {
    const { actions } = useGame();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importedData, setImportedData] = useState<RealWorldData | null>(null);
    const [source, setSource] = useState<'community' | 'file' | null>(null);

    const handleCommunityImport = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchCommunityData();
            setImportedData(data);
            setSource('community');
        } catch (e) {
            setError("Failed to fetch community database. Please check your connection or try file upload.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setLoading(true);
        setError(null);
        try {
            const data = await parseImportData(file);
            setImportedData(data);
            setSource('file');
        } catch (e) {
            setError("Failed to parse CSV file. Ensure it matches the required format.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmImport = () => {
        if (importedData) {
            actions.startImportedGame(importedData);
        }
    };

    if (importedData) {
        const teamCount = Object.keys(importedData).length;
        const playerCount = Object.values(importedData).reduce((acc, players: any) => acc + players.length, 0);

        return (
            <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in">
                <Card title="Database Ready" className="border-emerald-500">
                    <div className="text-center p-6">
                        <div className="w-16 h-16 bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Import Successful</h3>
                        <p className="text-slate-400 mb-6">
                            Successfully loaded data from {source === 'community' ? 'Community Database' : 'Custom File'}.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8 text-center">
                            <div className="bg-slate-900 p-4 rounded border border-slate-800">
                                <div className="text-3xl font-mono text-white font-bold">{teamCount}</div>
                                <div className="text-xs uppercase text-slate-500 font-bold">Teams Matched</div>
                            </div>
                            <div className="bg-slate-900 p-4 rounded border border-slate-800">
                                <div className="text-3xl font-mono text-white font-bold">{playerCount}</div>
                                <div className="text-xs uppercase text-slate-500 font-bold">Players Loaded</div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button variant="secondary" onClick={() => setImportedData(null)}>Cancel</Button>
                            <Button onClick={handleConfirmImport} className="flex-1 flex items-center justify-center gap-2">
                                Start Season <ArrowRight size={16}/>
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
            {/* Option 1: AI Scout */}
            <div className="bg-slate-900 border border-slate-700 hover:border-emerald-500 transition-colors rounded-xl p-6 flex flex-col items-center text-center group cursor-pointer h-full" onClick={onStartAI}>
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-900/50 group-hover:text-emerald-400 transition-colors">
                    <Zap size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">AI Scout (Gemini)</h3>
                <p className="text-sm text-slate-400 mb-4 flex-1">
                    Generate a unique, living world using Google Gemini. Players are created dynamically.
                </p>
                <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-4">Requires API Key</div>
                <Button className="w-full">Select</Button>
            </div>

            {/* Option 2: Community DB */}
            <div className="bg-slate-900 border border-slate-700 hover:border-blue-500 transition-colors rounded-xl p-6 flex flex-col items-center text-center group cursor-pointer h-full" onClick={handleCommunityImport}>
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-900/50 group-hover:text-blue-400 transition-colors">
                    {loading && !importedData ? <Loader2 size={32} className="animate-spin"/> : <Globe size={32} />}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Community DB</h3>
                <p className="text-sm text-slate-400 mb-4 flex-1">
                    Instantly load the latest community-verified roster update from GitHub.
                </p>
                <div className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-4">Recommended</div>
                <Button variant="secondary" className="w-full bg-slate-800 hover:bg-slate-700">Load Database</Button>
            </div>

            {/* Option 3: Custom File */}
            <div className="bg-slate-900 border border-slate-700 hover:border-purple-500 transition-colors rounded-xl p-6 flex flex-col items-center text-center group h-full relative">
                <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={loading} />
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-900/50 group-hover:text-purple-400 transition-colors">
                    {loading && !importedData ? <Loader2 size={32} className="animate-spin"/> : <Upload size={32} />}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Custom File</h3>
                <p className="text-sm text-slate-400 mb-4 flex-1">
                    Upload your own CSV roster file. Perfect for retro seasons or mods.
                </p>
                <div className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-4">Drag & Drop</div>
                <Button variant="secondary" className="w-full bg-slate-800 hover:bg-slate-700">Select File</Button>
            </div>

            <div className="col-span-full text-center mt-4">
                <Button variant="ghost" onClick={onBack}>Back to Main Menu</Button>
            </div>

            {error && (
                <div className="col-span-full p-4 bg-red-900/30 border border-red-500 rounded text-red-200 text-center flex items-center justify-center gap-2">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}
        </div>
    );
};
