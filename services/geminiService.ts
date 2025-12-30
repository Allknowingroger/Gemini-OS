
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {GoogleGenAI} from '@google/genai';
import {APP_DEFINITIONS_CONFIG, getSystemPrompt} from '../constants';
import {InteractionData} from '../types';

if (!process.env.API_KEY) {
  console.error('API_KEY environment variable is not set.');
}

// Fix: Always use named parameter for GoogleGenAI initialization
const ai = new GoogleGenAI({apiKey: process.env.API_KEY || ''});

export async function* streamAppContent(
  interactionHistory: InteractionData[],
  currentMaxHistoryLength: number,
): AsyncGenerator<string, void, void> {
  // Fix: Correct model name for complex UI tasks as per guidelines
  const model = 'gemini-3-pro-preview';

  if (!process.env.API_KEY) {
    yield `<div class="p-6 text-red-700 bg-red-50 rounded-xl border border-red-200">
      <h2 class="font-bold text-xl mb-2">OS Configuration Required</h2>
      <p>The system API_KEY is missing. Please configure your environment to enable Gemini OS features.</p>
    </div>`;
    return;
  }

  if (interactionHistory.length === 0) {
    yield `<div class="p-6 text-orange-700 bg-orange-50 rounded-xl">
      <p class="font-bold">Waiting for user input...</p>
    </div>`;
    return;
  }

  const systemPrompt = getSystemPrompt(currentMaxHistoryLength);

  const currentInteraction = interactionHistory[0];
  const pastInteractions = interactionHistory.slice(1);

  const currentAppDef = APP_DEFINITIONS_CONFIG.find(
    (app) => app.id === currentInteraction.appContext,
  );
  
  let interactionLog = `User Action: ${currentInteraction.type} on '${currentInteraction.elementText || currentInteraction.id}'`;
  if (currentInteraction.value) interactionLog += ` (Input: "${currentInteraction.value}")`;
  
  const appContextStr = currentAppDef ? `Context: Application '${currentAppDef.name}'` : 'Context: System Desktop';

  let historyStr = "";
  if (pastInteractions.length > 0) {
    historyStr = "\n\nSession History (most recent last):";
    [...pastInteractions].reverse().forEach((h, i) => {
       historyStr += `\n${i+1}. [${h.appContext || 'OS'}] ${h.type} on '${h.elementText || h.id}'${h.value ? `: "${h.value}"` : ''}`;
    });
  }

  const fullPrompt = `${systemPrompt}

Current State:
${appContextStr}
${interactionLog}
${historyStr}

Task: Generate the view layer HTML for the current app state. Focus on aesthetics and usability.

Response:`;

  try {
    const response = await ai.models.generateContentStream({
      model: model,
      contents: fullPrompt,
      config: {
        // Fix: Use a thinking budget to allow for high-quality complex reasoning in UI generation
        thinkingConfig: { thinkingBudget: 2000 }
      },
    });

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error('Gemini Stream Error:', error);
    yield `<div class="p-6 text-red-700 bg-red-50 rounded-xl">
      <h3 class="font-bold text-lg mb-2">Kernel Panic</h3>
      <p>The generative engine encountered an error. This usually happens during high load or network instability.</p>
      <p class="mt-4 text-xs font-mono bg-red-100 p-2 rounded">${String(error)}</p>
    </div>`;
  }
}
