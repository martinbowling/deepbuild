'use client';

import { ProjectBrief } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface BriefOverviewProps {
  brief: ProjectBrief;
}

export function BriefOverview({ brief }: BriefOverviewProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="summary">
        <AccordionTrigger>App Summary</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <p><strong>Purpose:</strong> {brief.project_brief.app_summary.purpose}</p>
            <div>
              <strong>Main Features:</strong>
              <ul className="list-disc pl-4">
                {brief.project_brief.app_summary.main_features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="technical">
        <AccordionTrigger>Technical Details</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <div>
              <strong>Tech Stack:</strong>
              <ul className="list-disc pl-4">
                {brief.project_brief.technical_outline.tech_stack.map((tech, i) => (
                  <li key={i}>{tech}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Dependencies:</strong>
              <ul className="list-disc pl-4">
                {brief.project_brief.technical_outline.external_dependencies.map((dep, i) => (
                  <li key={i}>{dep}</li>
                ))}
              </ul>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="implementation">
        <AccordionTrigger>Implementation Notes</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <p><strong>Starting Point:</strong> {brief.project_brief.implementation_notes.starting_point}</p>
            <div>
              <strong>Key Considerations:</strong>
              <ul className="list-disc pl-4">
                {brief.project_brief.implementation_notes.key_considerations.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Potential Challenges:</strong>
              <ul className="list-disc pl-4">
                {brief.project_brief.implementation_notes.potential_challenges.map((challenge, i) => (
                  <li key={i}>{challenge}</li>
                ))}
              </ul>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
} 