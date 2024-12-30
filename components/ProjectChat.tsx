'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Send, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChat } from '@/hooks/useChat';
import { StoredProject, FileImplementation, ProjectBrief } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Detect OS for keyboard shortcut display
const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modifierKey = isMac ? '⌘' : 'Ctrl';

interface ProjectChatProps {
  project: StoredProject;
  currentFile: FileImplementation | null;
  disabled?: boolean;
  inputDisabled?: boolean;
  isInitialSetup?: boolean;
  brief?: ProjectBrief;
  onAnswersComplete?: (answers: Record<string, string>) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRef {
  addMessage: (message: string) => void;
}

const KeyboardShortcuts = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6" type="button">
          <Keyboard className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm">
        <div className="space-y-2">
          <p className="font-medium">Keyboard Shortcuts:</p>
          <ul className="text-sm space-y-1">
            <li><kbd className="px-1 rounded bg-muted">{modifierKey}+Enter</kbd> Send message</li>
            <li><kbd className="px-1 rounded bg-muted">Shift+Enter</kbd> New line</li>
            <li><kbd className="px-1 rounded bg-muted">@</kbd> Reference file</li>
          </ul>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const ProjectChat = forwardRef<ChatRef, ProjectChatProps>(({
  project,
  currentFile,
  disabled,
  inputDisabled,
  isInitialSetup,
  brief,
  onAnswersComplete
}, ref) => {
  const [input, setInput] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGeneratingFiles, setIsGeneratingFiles] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage } = useChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Expose addMessage method via ref
  useImperativeHandle(ref, () => ({
    addMessage: (content: string) => {
      if (isInitialSetup && !isGeneratingFiles) {
        // Don't add messages during initial setup unless we're generating files
        return;
      }
      setMessages(prev => [...prev, { role: 'assistant', content }]);
    }
  }));

  // Initialize messages with project brief if it's initial setup
  useEffect(() => {
    if (isInitialSetup && brief && !isGeneratingFiles) {
      const initialMessages = [
        {
          role: 'assistant',
          content: `# Project Brief Overview\n\n` +
            `## App Summary\n` +
            `**Purpose:** ${brief.project_brief.app_summary.purpose}\n\n` +
            `**Main Features:**\n${brief.project_brief.app_summary.main_features.map(f => `- ${f}`).join('\n')}\n\n` +
            `## Technical Stack\n` +
            `- Technologies: ${brief.project_brief.technical_outline.tech_stack.join(', ')}\n` +
            `- Dependencies: ${brief.project_brief.technical_outline.external_dependencies.join(', ')}\n\n` +
            `## Implementation Notes\n` +
            `**Starting Point:** ${brief.project_brief.implementation_notes.starting_point}\n\n` +
            `**Key Considerations:**\n${brief.project_brief.implementation_notes.key_considerations.map(c => `- ${c}`).join('\n')}\n\n` +
            `**Potential Challenges:**\n${brief.project_brief.implementation_notes.potential_challenges.map(c => `- ${c}`).join('\n')}`
        },
        {
          role: 'assistant',
          content: `Let's get started! I have a few questions to help me better understand your needs:\n\n${brief.clarifying_questions[0].question}\n\nWhy I ask: ${brief.clarifying_questions[0].why_needed}`
        }
      ];
      setMessages(initialMessages);
    }
  }, [isInitialSetup, brief, isGeneratingFiles]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;

    const userMessage = input;
    setInput('');

    if (isInitialSetup && brief && !isGeneratingFiles) {
      // Add user message
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      
      // Store the answer
      setAnswers(prev => ({
        ...prev,
        [brief.clarifying_questions[currentQuestionIndex].question]: userMessage
      }));

      if (currentQuestionIndex < brief.clarifying_questions.length - 1) {
        // Move to next question
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        const nextQuestion = brief.clarifying_questions[nextIndex];
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Thanks! Next question:\n\n${nextQuestion.question}\n\nWhy I ask: ${nextQuestion.why_needed}`
        }]);
      } else {
        // All questions answered, start file generation
        setIsGeneratingFiles(true);
        // Keep the messages but add a generation start message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '🚀 Starting project generation based on your answers...'
        }]);
        onAnswersComplete?.(answers);
      }
    } else {
      // Normal chat mode
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      const { message } = await sendMessage(userMessage, 'chat');
      setMessages(prev => [...prev, { role: 'assistant', content: message }]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Project Chat</h3>
          <KeyboardShortcuts />
        </div>
        <p className="text-sm text-muted-foreground">
          Use @filename to reference project files • Press {modifierKey}+Enter to send
        </p>
        {inputDisabled && (
          <p className="text-sm text-yellow-600 mt-1">
            Chat input disabled while generating files...
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              inputDisabled
                ? "Chat input disabled during file generation..." 
                : `Ask about your project... (Use @filename to reference files) • ${modifierKey}+Enter to send`
            }
            className="min-h-[60px]"
            disabled={inputDisabled || disabled}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={inputDisabled || disabled}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Send message ({modifierKey}+Enter)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </form>
    </div>
  );
});

ProjectChat.displayName = 'ProjectChat'; 