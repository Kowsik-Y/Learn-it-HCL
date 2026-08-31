import { AiCourseGenerator } from '@/components/ai-course-generator';
import { PageHeader } from '@/components/ui/page-header';

export default function TeacherGenerateCoursePage() {
  return (
    <div className="container max-w-4xl py-8">
      <PageHeader
        title="AI Course Generator"
        description="Generate an end-to-end course roadmap, materials, and tests using LangGraph."
      />
      <AiCourseGenerator />
    </div>
  );
}
