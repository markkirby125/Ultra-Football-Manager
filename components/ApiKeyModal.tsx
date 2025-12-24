
import React, { useState } from 'react';
import { Button } from './Button';
import { Key, Zap, Check, X, Loader2, Upload, AlertTriangle, FileText } from 'lucide-react';
import { testGeminiConnection, testGrokConnection, parseKeysFromFile } from '../utils/textGenerator';

interface Props {
    initialGemini?: string;
    initialGrok?: string;
    onConfirm: (geminiKey: string, grokKey: string) => void;
    onCancel: () => void;
    canCancel: boolean;
}

export const ApiKeyModal: React.FC<Props> = ({ initialGemini = '', initialGrok = '', onConfirm, onCancel, canCancel }) => {
    const [geminiKey, setGeminiKey] = useState(initialGemini);
    const [grokKey, setGrokKey] = useState(initialGrok);
    
    const [status, setStatus] = useState<'idle' | 'testing' | 'error' | 'success'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [statusMap, setStatusMap] = useState({ gemini: false, grok: false });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const parsed = parseKeysFromFile(text);
            
            if (parsed.gemini) setGeminiKey(parsed.gemini);
            if (parsed.grok) setGrokKey(parsed.grok);
            
            if (!parsed.gemini && !parsed.grok) {
                setErrorMsg("No valid keys found in file.");
            } else {
                setErrorMsg(null);
            }
        };
        reader.readAsText(file);
    };

    const handleVerify = async () => {
        if (!geminiKey) {
            setErrorMsg("Gemini API Key is required.");
            return;
        }

        setStatus('testing');
        setErrorMsg(null);

        // Test Gemini (Required)
        const geminiOk = await testGeminiConnection(geminiKey);
        
        if (!geminiOk) {
            setStatus('error');
            setErrorMsg("Gemini API Key validation failed. Please check the key.");
            setStatusMap({ ...statusMap, gemini: false });
            return;
        }

        // Test Grok (Optional)
        let grokOk = true;
        if (grokKey) {
            grokOk = await testGrokConnection(grokKey);
            if (!grokOk) {
                setStatus('error');
                setErrorMsg("Grok API Key validation failed. Clear it to continue without Grok, or fix the key.");
                setStatusMap({ gemini: true, grok: false });
                return;
            }
        }

        setStatusMap({ gemini: true, grok: grokKey ? true : false });
        setStatus('success');
        
        // Delay slightly for visual feedback
        setTimeout(() => {
            onConfirm(geminiKey, grokKey);
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-emerald-500/50 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="bg-slate-950 p-6 border-b border-slate-800 text-center">
                    <div className="mx-auto w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center border border-emerald-500 text-emerald-400 mb-3 shadow-lg shadow-emerald-900/20">
                        <Key size={24} />
                    </div>
                    <h2 className="text-2xl font-sport text-white">Security Clearance</h2>
                    <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">API Configuration Required</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* File Upload Shortcut */}
                    <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-lg p-4 text-center relative group hover:bg-slate-800 transition-colors">
                        <input 
                            type="file" 
                            accept=".txt" 
                            onChange={handleFileUpload} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-white">
                            <Upload size={20} />
                            <span className="text-xs font-bold uppercase">Upload Config File</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Gemini Input */}
                        <div>
                            <label className="block text-xs font-bold text-emerald-400 uppercase mb-1 flex justify-between">
                                <span>Google Gemini API (Required)</span>
                                {status === 'testing' ? <Loader2 size={12} className="animate-spin"/> : statusMap.gemini ? <Check size={12} /> : null}
                            </label>
                            <input 
                                type="password" 
                                value={geminiKey}
                                onChange={(e) => setGeminiKey(e.target.value)}
                                className={`w-full bg-slate-950 border ${statusMap.gemini ? 'border-emerald-500' : 'border-slate-700'} rounded p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono`}
                                placeholder="AIzaSy..."
                            />
                        </div>

                        {/* Grok Input */}
                        <div>
                            <label className="block text-xs font-bold text-white uppercase mb-1 flex justify-between">
                                <span className="flex items-center gap-1"><Zap size={12} className="text-yellow-400"/> xAI Grok API (Optional)</span>
                                {status === 'testing' && grokKey ? <Loader2 size={12} className="animate-spin"/> : statusMap.grok ? <Check size={12} /> : null}
                            </label>
                            <input 
                                type="password" 
                                value={grokKey}
                                onChange={(e) => setGrokKey(e.target.value)}
                                className={`w-full bg-slate-950 border ${statusMap.grok ? 'border-emerald-500' : 'border-slate-700'} rounded p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono`}
                                placeholder="xai-..."
                            />
                            <p className="text-[10px] text-slate-500 mt-1 italic">
                                Enables uncensored social media feeds and dynamic personalities.
                            </p>
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="bg-red-900/20 border border-red-500/50 p-3 rounded flex items-start gap-3 text-red-200 text-xs">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        {canCancel && (
                            <Button variant="secondary" onClick={onCancel} className="flex-1">
                                Cancel
                            </Button>
                        )}
                        <Button 
                            variant="primary" 
                            onClick={handleVerify} 
                            disabled={status === 'testing' || !geminiKey}
                            className="flex-1"
                        >
                            {status === 'testing' ? 'Verifying...' : status === 'success' ? 'Access Granted' : 'Verify & Continue'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
