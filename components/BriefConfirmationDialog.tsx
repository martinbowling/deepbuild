'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BriefOverview } from './BriefOverview';
import { ProjectBrief } from '@/lib/types';

interface BriefConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brief: ProjectBrief | null;
  isLoading: boolean;
  onConfirm: (answers: Record<string, string>) => Promise<void>;
  onReject: () => void;
}

export function BriefConfirmationDialog({
  open,
  onOpenChange,
  brief,
  isLoading,
  onConfirm,
  onReject,
}: BriefConfirmationDialogProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');

  if (!brief) return null;

  const questions = brief.clarifying_questions;
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleNext = () => {
    if (!currentAnswer.trim()) return;

    const newAnswers = {
      ...answers,
      [currentQuestion.question]: currentAnswer
    };
    setAnswers(newAnswers);
    setCurrentAnswer('');

    if (isLastQuestion) {
      onConfirm(newAnswers);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Brief Review</DialogTitle>
          <DialogDescription>
            Review the generated brief and answer some clarifying questions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <BriefOverview brief={brief} />

          <div className="mt-6 space-y-4">
            <h4 className="font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </h4>
            <p>{currentQuestion.question}</p>
            <p className="text-sm text-muted-foreground">
              Why we ask: {currentQuestion.why_needed}
            </p>
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              className="w-full min-h-[100px] p-2 border rounded"
              placeholder="Type your answer here..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onReject}>
            Start Over
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={isLoading || !currentAnswer.trim()}
          >
            {isLastQuestion ? 'Generate Project' : 'Next Question'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 