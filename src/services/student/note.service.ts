import getUserDataFromJWT from '@/lib/server.utils';
import type { CreateNoteRequest, Note } from '@/src/types';

interface ServiceResponse<T> {
  success: boolean;
  data?: {
    data: T;
  };
  message?: string;
}

async function parseResponseBody(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { message: 'Invalid response from server' };
  }
}

/**
 * Update a note (PUT /v1/note/{id}).
 * Server-side service — mirrors `notesApi.update` (JSON body, or multipart when `attachment` is set).
 */
export const updateNote = async (
  id: number | string,
  data: Partial<CreateNoteRequest>
): Promise<ServiceResponse<Note>> => {
  const userData = await getUserDataFromJWT();
  const token = userData?.token;

  try {
    const authHeaders: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };

    let res: Response;

    if (data.attachment) {
      const formData = new FormData();
      if (data.title) formData.append('title', data.title);
      if (data.type) formData.append('type', data.type);
      if (data.content !== undefined) formData.append('content', data.content);
      if (data.linked_lecture !== undefined) {
        formData.append('linked_lecture', data.linked_lecture);
      }
      formData.append('attachment', data.attachment);

      res = await fetch(`https://api.learnoo.app/v1/note/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: formData,
      });
    } else {
      res = await fetch(`https://api.learnoo.app/v1/note/${id}`, {
        method: 'PUT',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    }

    const payload = await parseResponseBody(res);

    if (!res.ok) {
      return {
        success: false,
        message: (payload.message as string) || `Request failed (${res.status})`,
      };
    }

    return {
      success: true,
      data: payload as { data: Note },
    };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message,
    };
  }
};

/**
 * Delete a note (DELETE /v1/note/{id}).
 * Server-side service — same response shape handling as other student services.
 */
export const deleteNote = async (id: number | string): Promise<ServiceResponse<Note>> => {
  const userData = await getUserDataFromJWT();
  const token = userData?.token;

  try {
    const res = await fetch(`https://api.learnoo.app/v1/note/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const payload = await parseResponseBody(res);

    if (!res.ok) {
      return {
        success: false,
        message: (payload.message as string) || `Request failed (${res.status})`,
      };
    }

    const out: ServiceResponse<Note> = { success: true };
    if (Object.keys(payload).length > 0) {
      out.data = payload as { data: Note };
    }
    return out;
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message,
    };
  }
};
