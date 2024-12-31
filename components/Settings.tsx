'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { getConfig, updateConfig, isConfigured } from '@/lib/config';
import type { ChatConfig } from '@/lib/config';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function SettingLabel({ children, tooltip }: { children: React.ReactNode; tooltip: string }) {
  return (
    <div className="flex items-center gap-2">
      <Label>{children}</Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function Settings({ onSaved }: { onSaved?: () => void }) {
  const [selectedModel, setSelectedModel] = useState<'deepseek' | 'hyperbolic'>('deepseek');
  const [apiKey, setApiKey] = useState('');
  const [deepseekConfig, setDeepseekConfig] = useState<ChatConfig>({
    model: 'deepseek-chat',
    max_tokens: 8000,
    temperature: 0.7,
    top_p: 0.9,
    stream: false
  });
  const [hyperbolicConfig, setHyperbolicConfig] = useState<ChatConfig>({
    model: 'deepseek-ai/DeepSeek-V3',
    max_tokens: 512,
    temperature: 0.7,
    top_p: 0.9,
    stream: false
  });
  const [showUnconfiguredWarning, setShowUnconfiguredWarning] = useState(false);

  useEffect(() => {
    const config = getConfig();
    setSelectedModel(config.selectedModel);
    setApiKey(config.selectedModel === 'deepseek' ? config.deepseekKey || '' : config.hyperbolicKey || '');
    setDeepseekConfig({ ...config.deepseekConfig, model: 'deepseek-chat' });
    setHyperbolicConfig({ ...config.hyperbolicConfig, model: 'deepseek-ai/DeepSeek-V3' });
    setShowUnconfiguredWarning(!isConfigured());
  }, []);

  // Update API key when model changes
  useEffect(() => {
    const config = getConfig();
    setApiKey(selectedModel === 'deepseek' ? config.deepseekKey || '' : config.hyperbolicKey || '');
  }, [selectedModel]);

  const handleSave = () => {
    const config = getConfig();
    const updatedConfig = {
      ...config,
      selectedModel,
      deepseekConfig: selectedModel === 'deepseek' ? deepseekConfig : config.deepseekConfig,
      hyperbolicConfig: selectedModel === 'hyperbolic' ? hyperbolicConfig : config.hyperbolicConfig
    };

    // Save API key based on selected model
    if (selectedModel === 'deepseek') {
      updatedConfig.deepseekKey = apiKey;
    } else {
      updatedConfig.hyperbolicKey = apiKey;
    }

    // Use the updateConfig function from lib/config.ts
    updateConfig(updatedConfig);
    setShowUnconfiguredWarning(!isConfigured());
    
    // Call the onSaved callback if provided
    onSaved?.();
  };

  return (
    <div className="space-y-6">
      {showUnconfiguredWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800">
          ⚠️ API key not configured. Please set up your API key to use the chat functionality.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <SettingLabel tooltip="Choose between DeepSeek's powerful language model or Hyperbolic's optimized inference. Each provider requires its own API key.">
            Model Provider
          </SettingLabel>
          <Select
            value={selectedModel}
            onValueChange={(value: 'deepseek' | 'hyperbolic') => setSelectedModel(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deepseek">DeepSeek</SelectItem>
              <SelectItem value="hyperbolic">Hyperbolic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <SettingLabel tooltip={`API key for ${selectedModel === 'deepseek' ? 'DeepSeek' : 'Hyperbolic'} services. You can get this from your account dashboard on their website. The key will be stored securely in your browser's local storage.`}>
            API Key
          </SettingLabel>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`Enter your ${selectedModel} API key`}
          />
        </div>

        <div>
          <SettingLabel tooltip={`The specific model version used by ${selectedModel === 'deepseek' ? 'DeepSeek' : 'Hyperbolic'}. This is preset for optimal performance.`}>
            Model
          </SettingLabel>
          <Input
            value={selectedModel === 'deepseek' ? deepseekConfig.model : hyperbolicConfig.model}
            disabled
          />
        </div>

        <div>
          <SettingLabel tooltip="Maximum number of tokens (words and symbols) the model can generate in a single response. Higher values allow for longer responses but may take more time.">
            Max Tokens
          </SettingLabel>
          <Input
            type="number"
            value={selectedModel === 'deepseek' ? deepseekConfig.max_tokens : hyperbolicConfig.max_tokens}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (selectedModel === 'deepseek') {
                setDeepseekConfig(prev => ({ ...prev, max_tokens: value }));
              } else {
                setHyperbolicConfig(prev => ({ ...prev, max_tokens: value }));
              }
            }}
          />
        </div>

        <div>
          <SettingLabel tooltip="Controls the randomness of responses. Higher values (closer to 1) make responses more creative but less focused, while lower values make them more deterministic and precise.">
            Temperature
          </SettingLabel>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={selectedModel === 'deepseek' ? deepseekConfig.temperature : hyperbolicConfig.temperature}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (selectedModel === 'deepseek') {
                setDeepseekConfig(prev => ({ ...prev, temperature: value }));
              } else {
                setHyperbolicConfig(prev => ({ ...prev, temperature: value }));
              }
            }}
          />
        </div>

        <div>
          <SettingLabel tooltip="Controls diversity by limiting cumulative probability of tokens considered for generation. Higher values allow more diverse word choices.">
            Top P
          </SettingLabel>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={selectedModel === 'deepseek' ? deepseekConfig.top_p : hyperbolicConfig.top_p}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (selectedModel === 'deepseek') {
                setDeepseekConfig(prev => ({ ...prev, top_p: value }));
              } else {
                setHyperbolicConfig(prev => ({ ...prev, top_p: value }));
              }
            }}
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Settings
        </Button>
      </div>
    </div>
  );
} 