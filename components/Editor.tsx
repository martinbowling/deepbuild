'use client';

import { FileImplementation } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EditorProps {
  file: FileImplementation;
  language: string;
}

export function Editor({ file, language }: EditorProps) {
  const [monaco, setMonaco] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dynamically import Monaco editor
    import('@monaco-editor/react').then(({ default: MonacoEditor }) => {
      setMonaco(MonacoEditor);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const MonacoEditor = monaco;
  return (
    <MonacoEditor
      height="100vh"
      language={language}
      theme="vs-dark"
      value={file.content}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        wordWrap: 'on',
        scrollBeyondLastLine: false,
      }}
    />
  );
} 