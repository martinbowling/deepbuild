'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChat } from '@/hooks/useChat';
import { StoredProject, FileImplementation, ProjectBrief } from '@/lib/types';

interface ProjectChatProps {
  project: StoredProject;
  currentFile: FileImplementation | null;
  disabled?: boolean;
  isInitialSetup?: boolean;
  brief?: ProjectBrief;
  onAnswersComplete?: (answers: Record<string, string>) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const ProjectChat = forwardRef<
  { addMessage: (message: string) => void },
  ProjectChatProps
>(({ project, currentFile, disabled, isInitialSetup, brief, onAnswersComplete }, ref) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, isLoading } = useChat();

  useEffect(() => {
    if (isInitialSetup && brief) {
      // Add initial setup messages
      setMessages([
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
      ]);
    }
  }, [isInitialSetup, brief]);

  useImperativeHandle(ref, () => ({
    addMessage: (content: string) => {
      setMessages(prev => [...prev, { role: 'assistant', content }]);
    }
  }));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;

    const userMessage = input;
    setInput('');

    if (isInitialSetup && brief) {
      // Handle Q&A mode
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
        // All questions answered
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Thanks for answering all the questions! I will start generating your project files now.`
        }]);
        onAnswersComplete?.(answers);
      }
    } else {
      // Normal chat mode
      const { message, response } = await sendMessage(userMessage, 'chat');
      setMessages(prev => [...prev, { role: 'assistant', content: message }]);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">Project Chat</h3>
        <p className="text-sm text-muted-foreground">
          Use @filename to reference project files
        </p>
        {disabled && (
          <p className="text-sm text-yellow-600 mt-1">
            Chat disabled while regenerating file...
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              disabled 
                ? "Chat disabled during file regeneration..." 
                : "Ask about your project... (Use @filename to reference files)"
            }
            className="min-h-[60px]"
            disabled={disabled || isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={disabled || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}); 