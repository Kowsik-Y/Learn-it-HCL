"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { mockCourseData } from "@/lib/mock-course-data";
import { api } from "@/lib/api";

type CourseContextType = {
  completedLessons: string[];
  setCompletedLessons: (ids: string[] | ((prev: string[]) => string[])) => void;
  totalXp: number;
  setTotalXp: (xp: number | ((prev: number) => number)) => void;
};

const CourseContext = createContext<CourseContextType | null>(null);

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [totalXp, setTotalXp] = useState(0);



  useEffect(() => {
    async function loadProgress() {
      try {
        const res = await api.getGamificationProfile() as any;
        if (res.completed_lessons) {
          setCompletedLessons(res.completed_lessons);
        }
        if (res.total_xp !== undefined) {
          setTotalXp(res.total_xp);
        }
      } catch (err) {
        console.error("Failed to load progress from DB", err);
      }
    }
    loadProgress();
  }, []);

  return (
    <CourseContext.Provider 
      value={{ 
        completedLessons, 
        setCompletedLessons, 
        totalXp, 
        setTotalXp 
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}

export function useCourse() {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error("useCourse must be used within CourseProvider");
  return ctx;
}
