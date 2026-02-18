'use client';

import { useState } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export default function PromptInput({ onSubmit, isLoading }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col gap-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the video you want to generate..."
          maxLength={500}
          className="w-full h-32 p-4 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="flex justify-between items-center">
          <span className="text-sm text-zinc-500">
            {prompt.length}/500 characters
          </span>
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? 'Generating...' : 'Generate Video'}
          </button>
        </div>
      </div>
    </form>
  );
}
