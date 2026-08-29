import { PageHeader } from "@/components/ui/page-header";
import { AiCourseGenerator } from "@/components/ai-course-generator";

export default function AdminGenerateCoursePage() {
  return (
    <div className="container max-w-4xl py-8">
      <PageHeader 
        title="Admin: AI Course Generator" 
        description="Generate an end-to-end course roadmap, materials, and tests as an administrator." 
      />
      <AiCourseGenerator />
    </div>
  );
}
