import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, ChevronRight, FileIcon, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { StoredProject, FileImplementation } from "@/lib/types";

interface ProjectCardProps {
  project: StoredProject;
  onClick: () => void;
  onDelete: () => void;
  onExport: () => void;
}

const FileStatus = ({ status }: { status: FileImplementation['status'] }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'regenerating':
    case 'pending':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    default:
      return null;
  }
};

export function ProjectCard({ project, onClick, onDelete, onExport }: ProjectCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExport();
  };

  // Group files by directory
  const fileGroups = project.files.reduce((acc, file) => {
    const dir = file.path.split('/').slice(0, -1).join('/');
    if (!acc[dir]) {
      acc[dir] = [];
    }
    acc[dir].push(file);
    return acc;
  }, {} as Record<string, FileImplementation[]>);

  return (
    <Card 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{project.name}</CardTitle>
            <CardDescription>{project.brief.project_brief.app_summary.purpose}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm space-y-1">
          {Object.entries(fileGroups).map(([dir, files]) => (
            <div key={dir || 'root'} className="space-y-1">
              {dir && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ChevronRight className="h-4 w-4" />
                  <span>{dir}</span>
                </div>
              )}
              <div className="ml-4 space-y-1">
                {files.map(file => (
                  <div key={file.path} className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{file.path.split('/').pop()}</span>
                    <FileStatus status={file.status} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 