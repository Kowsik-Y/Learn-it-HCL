"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, BookOpen, Clock, Star, Users, PlayCircle, ArrowRight, ChevronRight } from "lucide-react";

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  useEffect(() => {
    async function loadCourses() {
      try {
        const res = (await api.getCourses()) as any;
        setCourses(res.items || []);
        if (res.items && res.items.length > 0) {
          loadCourseDetail(res.items[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  const loadCourseDetail = async (id: string) => {
    try {
      const detail = (await api.getCourse(id)) as any;
      setSelectedCourse({ ...detail, id });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold  ">Learning Paths & Courses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Structured curriculum aligned to your target career role.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="gap-8 flex flex-col lg:flex-row">
          <div className="w-full lg:w-5/12 space-y-4">
            <Skeleton className="h-6 w-1/3 mb-4" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </Card>
            ))}
          </div>
          <div className="w-full lg:w-7/12">
             <Skeleton className="h-[600px] w-full rounded-xl" />
          </div>
        </div>
      ) : (
        <div className="gap-8">
          {/* Course List Column */}
          <div >
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Available Courses ({filteredCourses.length})
            </h2>

            <div className="space-y-4 grid grid-cols-1 lg:grid-cols-12 w-full">
              {filteredCourses.map((course) => (
                <Card
                  key={course.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${selectedCourse?.id === course.id ? "border-primary bg-primary/5" : ""
                    }`}
                  onClick={() => loadCourseDetail(course.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="uppercase text-[10px] font-semibold">
                        {course.difficulty_level}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                        <Star className="h-3.5 w-3.5 fill-amber-500" />
                        {course.rating || 4.8}
                      </div>
                    </div>
                    <CardTitle className="text-lg font-bold">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.short_description || course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-2 flex justify-between text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {course.estimated_duration_hours}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {course.enrollment_count} learners
                    </span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>

          {/* Selected Course Detail */}
          <div className="lg:col-span-7">
            {selectedCourse ? (
              <Card className="sticky top-20 border-primary/30">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary text-primary-foreground font-semibold">
                      {selectedCourse.difficulty_level}
                    </Badge>
                    <Badge variant="secondary">{selectedCourse.estimated_duration_hours} Hours</Badge>
                  </div>
                  <CardTitle className="text-2xl font-extrabold">{selectedCourse.title}</CardTitle>
                  <CardDescription className="text-sm mt-2">{selectedCourse.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Course Curriculum & Modules
                  </h3>

                  {selectedCourse.modules && selectedCourse.modules.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCourse.modules.map((mod: any, mIdx: number) => (
                        <div key={mod.id} className="border border-border/70 rounded-lg p-4 bg-card">
                          <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                            <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                              {mIdx + 1}
                            </span>
                            {mod.title}
                          </h4>

                          <div className="space-y-2 pl-8">
                            {mod.chapters &&
                              mod.chapters.map((ch: any) => (
                                <div
                                  key={ch.id}
                                  className="flex items-center justify-between p-2.5 rounded-md bg-muted/40 hover:bg-muted text-sm font-medium transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <PlayCircle className="h-4 w-4 text-primary" />
                                    <span>{ch.title}</span>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No modules loaded for this course.</p>
                  )}
                </CardContent>

                <CardFooter className="border-t border-border pt-4">
                  <Link href={`/courses/${selectedCourse.id}`} className="w-full">
                    <Button className="w-full gap-2 font-bold">
                      Start Learning Course <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                Select a course to view curriculum
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
