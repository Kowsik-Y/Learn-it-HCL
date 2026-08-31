'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type Column, DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';

const mockCourses = [
  {
    id: '1',
    title: 'Introduction to AI',
    teacher: 'Alice Smith (teacher_01)',
    enrollment: 120,
    status: 'Published',
  },
  {
    id: '2',
    title: 'Advanced React',
    teacher: 'Bob Jones (teacher_02)',
    enrollment: 85,
    status: 'Draft',
  },
  {
    id: '3',
    title: 'System Design basics',
    teacher: 'Admin (Self)',
    enrollment: 0,
    status: 'Draft',
  },
];

const columns: Column<any>[] = [
  { accessor: 'title', header: 'Course Title' },
  { accessor: 'teacher', header: 'Created By' },
  { accessor: 'enrollment', header: 'Total Enrolled' },
  {
    accessor: 'status',
    header: 'Status',
    render: (item: any) => (
      <span
        className={`px-2 py-1 rounded text-xs ${item.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
      >
        {item.status}
      </span>
    ),
  },
  {
    header: 'Actions',
    render: (_item: any) => (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          Manage
        </Button>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </div>
    ),
  },
];

export default function AdminCoursesPage() {
  return (
    <div className="container max-w-6xl py-8">
      <div className="flex justify-between items-center mb-6">
        <PageHeader
          title="All Courses"
          description="Global view of all courses across the organization. View creators and manage content."
        />
        <Link href="/admin/courses/generate">
          <Button>Generate New Course</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns} data={mockCourses} keyExtractor={(item) => item.id} />
        </CardContent>
      </Card>
    </div>
  );
}
