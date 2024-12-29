'use client';

import { FileImplementation } from '@/lib/types';
import { cn } from '@/lib/utils';
import { File, Folder, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileTreeProps {
  files: FileImplementation[];
  selectedFile: FileImplementation | null;
  onFileSelect: (file: FileImplementation) => void;
  onFileRefresh?: (file: FileImplementation) => void;
}

export function FileTree({ 
  files, 
  selectedFile, 
  onFileSelect,
  onFileRefresh 
}: FileTreeProps) {
  // Group files by directory
  const fileTree = files.reduce((acc, file) => {
    const parts = file.path.split('/');
    let current = acc;
    
    parts.slice(0, -1).forEach(part => {
      if (!current[part]) {
        current[part] = { files: {}, dirs: {} };
      }
      current = current[part].dirs;
    });
    
    const fileName = parts[parts.length - 1];
    current[fileName] = { file };
    
    return acc;
  }, {} as any);

  const renderTree = (tree: any, path: string = '') => {
    return Object.entries(tree).map(([name, value]: [string, any]) => {
      if (value.file) {
        return (
          <div
            key={value.file.path}
            onClick={() => onFileSelect(value.file)}
            className={cn(
              "flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-accent rounded group",
              selectedFile?.path === value.file.path && "bg-accent"
            )}
          >
            <File className="h-4 w-4" />
            <span className="text-sm">{name}</span>
            <span 
              className={cn(
                "ml-auto text-xs flex items-center gap-2",
                value.file.status === 'completed' && "text-green-600",
                value.file.status === 'error' && "text-red-600",
                value.file.status === 'pending' && "text-yellow-600",
                value.file.status === 'regenerating' && "text-blue-600"
              )}
            >
              {value.file.status === 'regenerating' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                value.file.status
              )}
              {value.file.status === 'error' && onFileRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileRefresh(value.file);
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </span>
          </div>
        );
      }

      return (
        <div key={path + name} className="space-y-1">
          <div className="flex items-center gap-2 px-2 py-1">
            <Folder className="h-4 w-4" />
            <span className="text-sm font-medium">{name}</span>
          </div>
          <div className="pl-4 space-y-1">
            {renderTree(value.dirs, path + name + '/')}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="p-4 space-y-2">
      <h3 className="font-semibold mb-4">Project Files</h3>
      {renderTree(fileTree)}
    </div>
  );
} 