'use client';

import { useState } from 'react';
import { Brain } from 'lucide-react';
import { getAIConfig, saveAIConfig, type AIConfig } from '@/lib/ai/ai-config';

export default function AISettingsCard({ onChange }: { onChange?: () => void }) {
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => getAIConfig());

  const update = (patch: Partial<AIConfig>) => {
    const next = { ...aiConfig, ...patch };
    setAiConfig(next);
    saveAIConfig(next);
    onChange?.();
  };

  return (
    <div className="col-span-12 lg:col-span-4 glass-card p-5 border border-brand-500/20">
      <div className="flex items-center gap-3 mb-4">
        <Brain className="w-5 h-5 text-brand-400" />
        <h2 className="section-title">AI Diagnostics</h2>
      </div>
      <p className="text-xs text-surface-500 mb-4">
        Expert AI runs on-device. Add an OpenAI-compatible API key for cloud-enhanced analysis (optional).
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={aiConfig.enableCloudAI}
            onChange={(e) => update({ enableCloudAI: e.target.checked })}
          />
          <span className="text-sm text-surface-300">Enable cloud AI</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={aiConfig.preferExpertFirst}
            onChange={(e) => update({ preferExpertFirst: e.target.checked })}
          />
          <span className="text-sm text-surface-300">Hybrid expert + cloud merge</span>
        </label>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-surface-300 mb-2">API Key</label>
          <input
            type="password"
            value={aiConfig.apiKey}
            onChange={(e) => update({ apiKey: e.target.value })}
            placeholder="sk-..."
            className="w-full px-3 py-2 bg-surface-800 border border-surface-700/30 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">API Base URL</label>
          <input
            type="url"
            value={aiConfig.apiBaseUrl}
            onChange={(e) => update({ apiBaseUrl: e.target.value })}
            className="w-full px-3 py-2 bg-surface-800 border border-surface-700/30 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">Model</label>
          <input
            type="text"
            value={aiConfig.model}
            onChange={(e) => update({ model: e.target.value })}
            className="w-full px-3 py-2 bg-surface-800 border border-surface-700/30 rounded-lg text-white"
          />
        </div>
      </div>
    </div>
  );
}
