
import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Key, Zap, Check, X, RefreshCw, Save, ToggleLeft, ToggleRight, Volume2, Monitor, Upload, FileText, Database, Trash2, Terminal, Send, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { testGeminiConnection, testGrokConnection, parseKeysFromFile } from '../utils/textGenerator';
import { executeAdminCommand } from '../utils/admin';
import { ApiKeyModal } from '../components/ApiKeyModal';

export const Settings: React.FC = () => {
  const { apiKey, grokApiKey, actions, gameState } = useGame();
  const [geminiInput, setGeminiInput] = useState(apiKey);
  const [grokInput, setGrokInput] = useState(grokApiKey);
  const [showKeyModal, setShowKeyModal] = useState(false);
  
  // Auto-minimize if keys exist
  const [isApiConfigExpanded, setIsApiConfigExpanded] = useState(!apiKey && !grokApiKey);
  
  const [testStatus, setTestStatus] = useState<{ type: 'gemini' | 'grok', status: 'success' | 'error' | 'loading' | null }>({ type: 'gemini', status: null });

  // Console State
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleLogs, setConsoleLogs] = useState<{ type: 'in' | 'out' | 'err', text: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const pageTopRef = useRef<HTMLDivElement>(null);

  const userSettings = gameState?.userSettings || { audioEnabled: true, motionEffectsEnabled: true };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          const parsed = parseKeysFromFile(text);
          
          if (parsed.gemini) {
              setGeminiInput(parsed.gemini);
              setTestStatus({ type: 'gemini', status: null }); // Reset status to force re-verify if needed
          }
          if (parsed.grok) {
              setGrokInput(parsed.grok);
              setTestStatus({ type: 'grok', status: null });
          }

          if (!parsed.gemini && !parsed.grok) {
              alert("No valid keys found in file. Format expected: gemini_api=\"YOUR_KEY\"");
          } else {
              // Auto expand to show imported keys
              setIsApiConfigExpanded(true);
          }
      };
      reader.readAsText(file);
  };

  const handleSaveKeys = () => {
      actions.setApiKey(geminiInput);
      actions.setGrokApiKey(grokInput);
      alert("API Keys Saved!");
      setIsApiConfigExpanded(false); // Minimized on save
  };

  const handleTestGemini = async () => {
      setTestStatus({ type: 'gemini', status: 'loading' });
      actions.setApiKey(geminiInput); 
      const success = await testGeminiConnection(geminiInput);
      setTestStatus({ type: 'gemini', status: success ? 'success' : 'error' });
  };

  const handleTestGrok = async () => {
      setTestStatus({ type: 'grok', status: 'loading' });
      actions.setGrokApiKey(grokInput);
      const success = await testGrokConnection(grokInput);
      setTestStatus({ type: 'grok', status: success ? 'success' : 'error' });
  };

  const handleResign = () => {
      if (confirm("Are you sure you want to resign? You will leave your current club but the game world will persist.")) {
          actions.resign();
          window.location.reload();
      }
  };

  const handleFactoryReset = () => {
      if (confirm("WARNING: This will delete your save file PERMANENTLY. Are you sure?")) {
          actions.factoryReset();
          window.location.reload();
      }
  };

  const toggleUserSetting = (key: keyof typeof userSettings) => {
      actions.updateSettings({ ...userSettings, [key]: !userSettings[key] });
  };

  // Admin Console Logic
  const handleConsoleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!consoleInput.trim() || !gameState) return;

      const cmd = consoleInput;
      
      // Verification: Check if API key is present
      if (!apiKey) {
          setConsoleLogs(prev => [...prev, { type: 'in', text: cmd }]);
          setConsoleLogs(prev => [...prev, { type: 'err', text: "Authentication Error: No Gemini API Key found." }]);
          setConsoleLogs(prev => [...prev, { type: 'err', text: "Launching configuration sequence..." }]);
          setConsoleInput('');
          setShowKeyModal(true);
          return;
      }

      setConsoleInput('');
      setConsoleLogs(prev => [...prev, { type: 'in', text: cmd }]);
      setIsProcessing(true);

      try {
          const result = await executeAdminCommand(gameState, cmd);
          if (result.success && result.newState) {
              actions.forceUpdateState(result.newState);
              setConsoleLogs(prev => [...prev, { type: 'out', text: result.message }]);
          } else {
              setConsoleLogs(prev => [...prev, { type: 'err', text: result.message }]);
          }
      } catch (err: any) {
          setConsoleLogs(prev => [...prev, { type: 'err', text: "System Error: " + err.message }]);
      } finally {
          setIsProcessing(false);
      }
  };

  useEffect(() => {
      // Use block: 'nearest' to avoid scrolling the entire page if possible
      logsEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [consoleLogs]);

  useEffect(() => {
      if (!apiKey) {
          setConsoleLogs([{ type: 'err', text: "System: Offline Mode Detected. API Key required for commands." }]);
      } else {
          setConsoleLogs([{ type: 'out', text: "System: Connected to Gemini AI. Ready." }]);
      }
  }, [apiKey]);

  // Scroll to top on mount
  useEffect(() => {
      pageTopRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, []);

  const handleModalConfirm = (gKey: string, xKey: string) => {
      actions.setApiKey(gKey);
      if (xKey) actions.setGrokApiKey(xKey);
      setGeminiInput(gKey);
      setGrokInput(xKey);
      setShowKeyModal(false);
      setConsoleLogs(prev => [...prev, { type: 'out', text: "API Key configured successfully. Access granted." }]);
  };

  return (
    <div className="space-y-6" ref={pageTopRef}>
        <h2 className="text-3xl font-sport text-white">Game Configuration</h2>
        
        {/* 1. Game Master Console */}
        <Card title="Game Master Console (Experimental)" className="border-purple-500/50 shadow-purple-900/10">
            <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-sm h-64 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                    <div className="text-slate-500 italic">Connected to Game State v{gameState?.dbVersion}...</div>
                    <div className="text-slate-500 italic">Type commands in natural language. E.g., "Give Arsenal 500m budget" or "Set Saka's pace to 99".</div>
                    {consoleLogs.map((log, i) => (
                        <div key={i} className={`${log.type === 'in' ? 'text-blue-400' : log.type === 'err' ? 'text-red-400' : 'text-emerald-400'}`}>
                            <span className="opacity-50 mr-2">{log.type === 'in' ? '>' : '#'}</span>
                            <span className="whitespace-pre-wrap">{log.text}</span>
                        </div>
                    ))}
                    {isProcessing && <div className="text-purple-400 animate-pulse"><span className="opacity-50 mr-2">#</span> Processing...</div>}
                    <div ref={logsEndRef} />
                </div>
                
                <form onSubmit={handleConsoleSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Terminal size={16} className="text-slate-500" />
                        </div>
                        <input 
                            type="text" 
                            value={consoleInput}
                            onChange={(e) => setConsoleInput(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white font-mono text-sm focus:outline-none focus:border-purple-500 transition-colors"
                            placeholder="Enter command..."
                            disabled={isProcessing}
                        />
                    </div>
                    <Button type="submit" disabled={isProcessing || !consoleInput.trim()} className="bg-purple-600 hover:bg-purple-500 border-purple-500">
                        <Send size={16} />
                    </Button>
                </form>
            </div>
        </Card>

        {/* 2. API Config Card */}
        <Card 
            title="API Configuration" 
            action={
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input 
                            type="file" 
                            accept=".txt" 
                            onChange={handleFileUpload} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            title="Upload config.txt"
                        />
                        <Button size="sm" variant="secondary" className="flex items-center gap-2">
                            <Upload size={14}/> <span className="hidden md:inline">Import</span>
                        </Button>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => setIsApiConfigExpanded(!isApiConfigExpanded)}>
                        {isApiConfigExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                </div>
            }
        >
            {isApiConfigExpanded ? (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-900 p-4 rounded border border-slate-800">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-2">
                                Gemini API Key 
                                {testStatus.type === 'gemini' && testStatus.status === 'success' && <Check size={12} className="text-emerald-400"/>}
                                {testStatus.type === 'gemini' && testStatus.status === 'error' && <X size={12} className="text-red-400"/>}
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    type="password" 
                                    value={geminiInput} 
                                    onChange={e => setGeminiInput(e.target.value)} 
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none" 
                                    placeholder="AIzaSy..." 
                                />
                                <Button size="sm" onClick={handleTestGemini} disabled={testStatus.type === 'gemini' && testStatus.status === 'loading'}>
                                    {testStatus.type === 'gemini' && testStatus.status === 'loading' ? <RefreshCw className="animate-spin" size={14}/> : 'Verify'}
                                </Button>
                            </div>
                        </div>
                        <div className="bg-slate-900 p-4 rounded border border-slate-800">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-2">
                                Grok API Key
                                {testStatus.type === 'grok' && testStatus.status === 'success' && <Check size={12} className="text-emerald-400"/>}
                                {testStatus.type === 'grok' && testStatus.status === 'error' && <X size={12} className="text-red-400"/>}
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    type="password" 
                                    value={grokInput} 
                                    onChange={e => setGrokInput(e.target.value)} 
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none" 
                                    placeholder="xai-..." 
                                />
                                <Button size="sm" variant="secondary" onClick={handleTestGrok} disabled={testStatus.type === 'grok' && testStatus.status === 'loading'}>
                                    {testStatus.type === 'grok' && testStatus.status === 'loading' ? <RefreshCw className="animate-spin" size={14}/> : 'Verify'}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSaveKeys} className="flex items-center gap-2"><Save size={16}/> Save Configuration</Button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-6 items-center text-sm">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        <span className="text-slate-400 font-bold">Gemini:</span>
                        <span className={apiKey ? "text-emerald-400" : "text-slate-600"}>{apiKey ? 'Active' : 'Missing'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${grokApiKey ? 'bg-yellow-500' : 'bg-slate-700'}`}></div>
                        <span className="text-slate-400 font-bold">Grok:</span>
                        <span className={grokApiKey ? "text-yellow-400" : "text-slate-600"}>{grokApiKey ? 'Active' : 'Missing'}</span>
                    </div>
                </div>
            )}
        </Card>

        {/* 3. Global Game Settings */}
        <Card title="Interface & Audio">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-3">
                        <Volume2 size={20} className={userSettings.audioEnabled ? "text-emerald-400" : "text-slate-500"}/>
                        <div><div className="text-sm font-bold text-white">Sound Effects</div></div>
                    </div>
                    <button onClick={() => toggleUserSetting('audioEnabled')} className="text-2xl transition-colors text-slate-500 hover:text-white">
                        {userSettings.audioEnabled ? <ToggleRight className="text-emerald-500" size={32}/> : <ToggleLeft size={32}/>}
                    </button>
                </div>
                <div className="flex items-center justify-between p-3 rounded bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-3">
                        <Monitor size={20} className={userSettings.motionEffectsEnabled ? "text-blue-400" : "text-slate-500"}/>
                        <div><div className="text-sm font-bold text-white">Motion Effects</div></div>
                    </div>
                    <button onClick={() => toggleUserSetting('motionEffectsEnabled')} className="text-2xl transition-colors text-slate-500 hover:text-white">
                        {userSettings.motionEffectsEnabled ? <ToggleRight className="text-emerald-500" size={32}/> : <ToggleLeft size={32}/>}
                    </button>
                </div>
            </div>
        </Card>

        <Card title="Data & Storage">
            <div className="space-y-4">
                <div className="bg-slate-900 p-4 rounded border border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white font-bold"><Database size={18}/> Storage Usage</div>
                        <span className="text-emerald-400 font-mono">IndexedDB Active</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">
                        Game data is stored locally in your browser's IndexedDB. Clear cache to reset.
                    </p>
                    <Button variant="danger" size="sm" onClick={() => actions.clearCache()} className="flex items-center gap-2">
                        <Trash2 size={14}/> Clear Database & Reload
                    </Button>
                </div>
            </div>
        </Card>

        <Card title="Danger Zone" className="border-red-900/50">
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-900/10 border border-red-900/30 rounded">
                    <div><h4 className="font-bold text-white">Resign</h4><p className="text-xs text-slate-400">Step down as manager.</p></div>
                    <Button variant="secondary" onClick={handleResign} className="border-red-500/50 text-red-400">Resign</Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-900/10 border border-red-900/30 rounded">
                    <div><h4 className="font-bold text-white">Factory Reset</h4><p className="text-xs text-slate-400">Delete everything.</p></div>
                    <Button variant="danger" onClick={handleFactoryReset}>Reset</Button>
                </div>
            </div>
        </Card>

        {showKeyModal && (
            <ApiKeyModal 
                initialGemini={apiKey} 
                initialGrok={grokApiKey} 
                onConfirm={handleModalConfirm} 
                onCancel={() => setShowKeyModal(false)} 
                canCancel={true} 
            />
        )}
    </div>
  );
};
