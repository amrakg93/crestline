// Clean API fetch wrappers for backend services
// URLs driven by NEXT_PUBLIC_API_URL env var
// Defaults to localhost for local dev

import type {
  ApiResponse,
  SyllabusClassesData,
  SubjectChaptersData,
  GuideData,
  TipsData,
} from "./types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// GET requests — no Content-Type header (avoids CORS preflight on cross-origin requests)
const STATIC_FETCH: RequestInit = {
  next: { revalidate: 86400 },
};

async function fetchFromBackend<T>(path: string, init: RequestInit = STATIC_FETCH): Promise<ApiResponse<T>> {
  const res = await fetch(`${BACKEND_URL}${path}`, init);
  if (!res.ok) {
    throw new Error(`Backend API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
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
