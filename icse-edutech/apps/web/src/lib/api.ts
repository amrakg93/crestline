// Clean API fetch wrappers for backend services
// URLs driven by NEXT_PUBLIC_API_URL / NEXT_PUBLIC_GRAPH_URL env vars
// Defaults to localhost for local dev

import type {
  ApiResponse,
  SyllabusClassesData,
  SubjectChaptersData,
  GuideData,
  TipsData,
  WalkthroughData,
} from "./types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const GRAPH_URL =
  process.env.NEXT_PUBLIC_GRAPH_URL || "http://localhost:4001";

async function fetchFromBackend<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Backend API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function fetchFromGraph(path: string): Promise<ApiResponse<WalkthroughData>> {
  const res = await fetch(`${GRAPH_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Graph Engine error: ${res.status} ${res.statusText}`);
  }
  // Go engine returns raw walkthrough; wrap in ApiResponse format
  const data = (await res.json()) as WalkthroughData;
  return { success: true, data };
}

export async function getSyllabusClasses(): Promise<ApiResponse<SyllabusClassesData>> {
  return fetchFromBackend<SyllabusClassesData>("/api/syllabus");
}

export async function getClassSubjects(
  classId: string
): Promise<ApiResponse<SyllabusClassesData>> {
  return fetchFromBackend<SyllabusClassesData>(`/api/syllabus/${classId}`);
}

export async function getSubjectChapters(
  classId: string,
  subject: string
): Promise<ApiResponse<SubjectChaptersData>> {
  return fetchFromBackend<SubjectChaptersData>(
    `/api/syllabus/${classId}/${subject}`
  );
}

export async function getChapterGuide(
  classId: string,
  subject: string,
  chapterId: string
): Promise<ApiResponse<GuideData>> {
  return fetchFromBackend<GuideData>(
    `/api/guide/${classId}/${subject}/${chapterId}`
  );
}

export async function getChapterTips(
  classId: string,
  subject: string,
  chapterId: string
): Promise<ApiResponse<TipsData>> {
  return fetchFromBackend<TipsData>(
    `/api/tips/${classId}/${subject}/${chapterId}`
  );
}

export async function getWalkthrough(
  classId: string,
  subject: string,
  chapterId: string
): Promise<ApiResponse<WalkthroughData>> {
  return fetchFromGraph(
    `/walkthrough/${classId}/${subject}/${chapterId}`
  );
}
