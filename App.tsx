
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useCallback, useEffect, useState} from 'react';
import {GeneratedContent} from './components/GeneratedContent';
import {Icon} from './components/Icon';
import {ParametersPanel} from './components/ParametersPanel';
import {Window} from './components/Window';
import {APP_DEFINITIONS_CONFIG, INITIAL_MAX_HISTORY_LENGTH} from './constants';
import {streamAppContent} from './services/geminiService';
import {AppDefinition, InteractionData} from './types';

const DesktopView: React.FC<{onAppOpen: (app: AppDefinition) => void}> = ({
  onAppOpen,
}) => (
  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 p-8">
    {APP_DEFINITIONS_CONFIG.map((app) => (
      <Icon key={app.id} app={app} onInteract={() => onAppOpen(app)} />
    ))}
  </div>
);

const Taskbar: React.FC<{
  activeApp: AppDefinition | null;
  onAppOpen: (app: AppDefinition) => void;
  onToggleParameters: () => void;
  isParametersOpen: boolean;
}> = ({activeApp, onAppOpen, onToggleParameters, isParametersOpen}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 glass px-2 py-2 rounded-2xl flex items-center gap-2 shadow-2xl z-50 border border-white/40">
      <button 
        onClick={onToggleParameters}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isParametersOpen ? 'bg-blue-500 text-white' : 'hover:bg-black/5'}`}
        title="Settings & Parameters"
      >
        <span className="text-xl">⚙️</span>
      </button>
      
      <div className="w-px h-6 bg-gray-300/50 mx-1" />

      {APP_DEFINITIONS_CONFIG.slice(0, 6).map((app) => (
        <button
          key={app.id}
          onClick={() => onAppOpen(app)}
          className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all relative group ${
            activeApp?.id === app.id ? 'bg-white/50 scale-110 shadow-sm' : 'hover:bg-white/30'
          }`}
          title={app.name}
        >
          <span className="text-2xl">{app.icon}</span>
          {activeApp?.id === app.id && (
             <div className="absolute -bottom-1 w-1 h-1 bg-blue-500 rounded-full" />
          )}
        </button>
      ))}

      <div className="w-px h-6 bg-gray-300/50 mx-1" />

      <div className="px-3 flex flex-col items-center justify-center min-w-[80px]">
        <span className="text-[10px] font-bold text-gray-500 uppercase">
          {time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
        <span className="text-sm font-bold text-gray-800">
          {time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeApp, setActiveApp] = useState<AppDefinition | null>(null);
  const [llmContent, setLlmContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [interactionHistory, setInteractionHistory] = useState<
    InteractionData[]
  >([]);
  const [isParametersOpen, setIsParametersOpen] = useState<boolean>(false);
  const [currentMaxHistoryLength, setCurrentMaxHistoryLength] =
    useState<number>(INITIAL_MAX_HISTORY_LENGTH);

  // Statefulness feature state
  const [isStatefulnessEnabled, setIsStatefulnessEnabled] =
    useState<boolean>(false);
  const [appContentCache, setAppContentCache] = useState<
    Record<string, string>
  >({});
  const [currentAppPath, setCurrentAppPath] = useState<string[]>([]);

  const internalHandleLlmRequest = useCallback(
    async (historyForLlm: InteractionData[], maxHistoryLength: number) => {
      if (historyForLlm.length === 0) return;

      setIsLoading(true);
      setError(null);

      let accumulatedContent = '';
      try {
        const stream = streamAppContent(historyForLlm, maxHistoryLength);
        for await (const chunk of stream) {
          accumulatedContent += chunk;
          setLlmContent((prev) => prev + chunk);
        }
      } catch (e: any) {
        setError('Failed to stream content from Gemini.');
        setLlmContent(`<div class="p-6 text-red-600 bg-red-50 rounded-xl border border-red-100 m-4">
          <h3 class="font-bold text-lg mb-2">System Error</h3>
          <p>We encountered an issue connecting to the Gemini OS backend. Please check your network and API configuration.</p>
        </div>`);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (
      !isLoading &&
      currentAppPath.length > 0 &&
      isStatefulnessEnabled &&
      llmContent
    ) {
      const cacheKey = currentAppPath.join('__');
      if (appContentCache[cacheKey] !== llmContent) {
        setAppContentCache((prevCache) => ({
          ...prevCache,
          [cacheKey]: llmContent,
        }));
      }
    }
  }, [llmContent, isLoading, currentAppPath, isStatefulnessEnabled, appContentCache]);

  const handleInteraction = useCallback(
    async (interactionData: InteractionData) => {
      const newHistory = [
        interactionData,
        ...interactionHistory.slice(0, currentMaxHistoryLength - 1),
      ];
      setInteractionHistory(newHistory);

      const newPath = activeApp
        ? [...currentAppPath, interactionData.id]
        : [interactionData.id];
      setCurrentAppPath(newPath);
      const cacheKey = newPath.join('__');

      setLlmContent('');
      setError(null);

      if (isStatefulnessEnabled && appContentCache[cacheKey]) {
        setLlmContent(appContentCache[cacheKey]);
        setIsLoading(false);
      } else {
        internalHandleLlmRequest(newHistory, currentMaxHistoryLength);
      }
    },
    [interactionHistory, internalHandleLlmRequest, activeApp, currentMaxHistoryLength, currentAppPath, isStatefulnessEnabled, appContentCache],
  );

  const handleAppOpen = (app: AppDefinition) => {
    if (activeApp?.id === app.id) return;
    
    setIsParametersOpen(false);
    setActiveApp(app);
    setLlmContent('');
    setError(null);

    const initialInteraction: InteractionData = {
      id: app.id,
      type: 'app_open',
      elementText: app.name,
      elementType: 'icon',
      appContext: app.id,
    };

    const newHistory = [initialInteraction];
    setInteractionHistory(newHistory);

    const appPath = [app.id];
    setCurrentAppPath(appPath);
    const cacheKey = appPath.join('__');

    if (isStatefulnessEnabled && appContentCache[cacheKey]) {
      setLlmContent(appContentCache[cacheKey]);
      setIsLoading(false);
    } else {
      internalHandleLlmRequest(newHistory, currentMaxHistoryLength);
    }
  };

  const handleCloseAppView = () => {
    setActiveApp(null);
    setLlmContent('');
    setError(null);
    setInteractionHistory([]);
    setCurrentAppPath([]);
  };

  const handleToggleParametersPanel = () => {
    setIsParametersOpen(!isParametersOpen);
    if (!isParametersOpen) {
      setActiveApp(null);
    } else {
      setInteractionHistory([]);
      setCurrentAppPath([]);
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col relative bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center">
      <div className="flex-grow flex items-center justify-center p-4">
        {(!activeApp && !isParametersOpen) ? (
          <DesktopView onAppOpen={handleAppOpen} />
        ) : (
          <Window
            title={isParametersOpen ? 'System Parameters' : activeApp?.name || 'Gemini OS'}
            onClose={() => isParametersOpen ? setIsParametersOpen(false) : handleCloseAppView()}
            isAppOpen={!!activeApp}
            onToggleParameters={handleToggleParametersPanel}
            onExitToDesktop={handleCloseAppView}
            isParametersPanelOpen={isParametersOpen}
          >
            <div className="w-full h-full bg-white relative">
              {isParametersOpen ? (
                <ParametersPanel
                  currentLength={currentMaxHistoryLength}
                  onUpdateHistoryLength={(len) => setCurrentMaxHistoryLength(len)}
                  onClosePanel={() => setIsParametersOpen(false)}
                  isStatefulnessEnabled={isStatefulnessEnabled}
                  onSetStatefulness={setIsStatefulnessEnabled}
                />
              ) : (
                <>
                  {isLoading && llmContent.length === 0 && (
                    <div className="flex flex-col gap-4 justify-center items-center h-full text-blue-600">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">G</div>
                      </div>
                      <p className="text-sm font-medium animate-pulse">Initializing Virtual Application...</p>
                    </div>
                  )}
                  {error && (
                    <div className="p-4 text-red-600 bg-red-50 m-4 rounded-xl border border-red-100">
                      {error}
                    </div>
                  )}
                  {(!isLoading || llmContent) && (
                    <GeneratedContent
                      htmlContent={llmContent}
                      onInteract={handleInteraction}
                      appContext={activeApp?.id || null}
                      isLoading={isLoading}
                    />
                  )}
                </>
              )}
            </div>
          </Window>
        )}
      </div>

      <Taskbar 
        activeApp={activeApp} 
        onAppOpen={handleAppOpen} 
        onToggleParameters={handleToggleParametersPanel}
        isParametersOpen={isParametersOpen}
      />
    </div>
  );
};

export default App;
