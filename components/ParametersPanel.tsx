
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useEffect, useState} from 'react';

interface ParametersPanelProps {
  currentLength: number;
  onUpdateHistoryLength: (newLength: number) => void;
  onClosePanel: () => void;
  isStatefulnessEnabled: boolean;
  onSetStatefulness: (enabled: boolean) => void;
}

export const ParametersPanel: React.FC<ParametersPanelProps> = ({
  currentLength,
  onUpdateHistoryLength,
  onClosePanel,
  isStatefulnessEnabled,
  onSetStatefulness,
}) => {
  const [localHistoryLengthInput, setLocalHistoryLengthInput] =
    useState<string>(currentLength.toString());
  const [localStatefulnessChecked, setLocalStatefulnessChecked] =
    useState<boolean>(isStatefulnessEnabled);

  const handleApplyParameters = () => {
    const newLength = parseInt(localHistoryLengthInput, 10);
    if (!isNaN(newLength) && newLength >= 0 && newLength <= 20) {
      onUpdateHistoryLength(newLength);
    } else {
      alert('History length must be between 0 and 20.');
      return;
    }
    onSetStatefulness(localStatefulnessChecked);
    onClosePanel();
  };

  return (
    <div className="p-8 h-full bg-white flex flex-col max-w-lg mx-auto overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">System Preferences</h2>
        <p className="text-sm text-gray-500">Tune the core Gemini OS performance and behavior.</p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-gray-700">Memory Depth (History)</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="20"
              value={localHistoryLengthInput}
              onChange={(e) => setLocalHistoryLengthInput(e.target.value)}
              className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="w-8 text-center font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {localHistoryLengthInput}
            </span>
          </div>
          <p className="text-xs text-gray-400 italic">Determines how many previous interactions the AI "remembers" when generating content.</p>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <label className="text-sm font-bold text-gray-700 block">Neural Caching (Statefulness)</label>
            <p className="text-xs text-gray-500">Cache app views to speed up navigation.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={localStatefulnessChecked}
              onChange={(e) => setLocalStatefulnessChecked(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div className="mt-auto pt-8 flex gap-3">
        <button
          onClick={handleApplyParameters}
          className="flex-grow py-3 px-6 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
        >
          Save Changes
        </button>
        <button
          onClick={onClosePanel}
          className="py-3 px-6 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
