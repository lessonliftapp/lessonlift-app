import { supabase } from '../lib/supabase';

export interface LessonRequest {
  yearGroup: string;
  abilityLevel: string;
  lessonDuration: number;
  subject: string;
  topic: string;
  lessonName?: string;
  learningObjective?: string;
  senEalNotes?: string;
  regenerationInstruction?: string;
}

export interface Lesson {
  id: string;
  user_id: string;
  year_group: string;
  ability_level: string;
  lesson_duration: number;
  subject: string;
  topic: string;
  lesson_name?: string;
  learning_objective?: string;
  sen_eal_notes?: string;
  regeneration_instruction?: string;
  lesson_content: string;
  lesson_text: string;
  created_at: string;
}

export interface StartGenerationResponse {
  success: boolean;
  jobId?: string;
  error?: string;
  limitReached?: boolean;
}

export interface PollJobResponse {
  success: boolean;
  status?: 'processing' | 'completed' | 'failed';
  lesson?: Lesson;
  error?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

async function getAuthHeader(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return `Bearer ${session.access_token}`;
}

export async function startLessonGeneration(request: LessonRequest): Promise<StartGenerationResponse> {
  try {
    const authHeader = await getAuthHeader();
    const apiUrl = `${SUPABASE_URL}/functions/v1/generate-lesson`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        limitReached: data.limitReached ?? false,
        error: data.error || `Request failed with status ${response.status}`,
      };
    }

    return { success: true, jobId: data.jobId };
  } catch (error: any) {
    console.error('Start generation error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function pollLessonJob(jobId: string): Promise<PollJobResponse> {
  try {
    const authHeader = await getAuthHeader();
    const apiUrl = `${SUPABASE_URL}/functions/v1/poll-lesson-job?jobId=${encodeURIComponent(jobId)}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Authorization': authHeader },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, status: 'failed', error: data.error || 'Poll failed' };
    }

    return data;
  } catch (error: any) {
    console.error('Poll job error:', error);
    return { success: false, status: 'failed', error: error.message };
  }
}

export async function fetchLessonHistory(): Promise<Lesson[]> {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching lesson history:', error);
    return [];
  }
}

export async function deleteLesson(lessonId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return false;
  }
}

export async function deleteLessons(lessonIds: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .in('id', lessonIds);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting lessons:', error);
    return false;
  }
}
