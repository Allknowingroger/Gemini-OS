
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React from 'react';
import {AppDefinition} from '../types';

interface IconProps {
  app: AppDefinition;
  onInteract: () => void;
}

export const Icon: React.FC<IconProps> = ({app, onInteract}) => {
  return (
    <div
      className="group w-24 h-28 flex flex-col items-center justify-center text-center p-2 cursor-pointer select-none rounded-2xl transition-all hover:bg-white/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400"
      onClick={onInteract}
      onKeyDown={(e) => e.key === 'Enter' && onInteract()}
      tabIndex={0}
      role="button"
      aria-label={`Open ${app.name}`}>
      <div className="text-5xl mb-2 drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] group-hover:scale-110 transition-transform duration-200">
        {app.icon}
      </div>
      <div className="text-xs text-white font-semibold drop-shadow-md break-words max-w-full leading-tight">
        {app.name}
      </div>
    </div>
  );
};
