import assert from 'node:assert/strict';
import test from 'node:test';

import { chapterHasVideo, isChapterHiddenFromStudent } from './student-chapter-access.ts';

/** Minimal chapter stub; the helpers only read `attributes`. */
function chapter(attributes: Record<string, unknown>) {
  return { id: '1', attributes } as never;
}

test('a chapter the server marks not published is hidden from the student', () => {
  assert.equal(isChapterHiddenFromStudent(chapter({ watch_access_state: 'not_published' })), true);
  assert.equal(isChapterHiddenFromStudent(chapter({ watch_access_state: 'available' })), false);
});

test('falls back to the schedule when the payload carries no access state', () => {
  const future = new Date(Date.now() + 86_400_000).toISOString();
  const past = new Date(Date.now() - 86_400_000).toISOString();

  assert.equal(isChapterHiddenFromStudent(chapter({ schedule: future })), true);
  assert.equal(isChapterHiddenFromStudent(chapter({ schedule: past })), false);
  // `YYYY-MM-DD HH:mm:ss`, which older parsers reject, must still be understood.
  assert.equal(
    isChapterHiddenFromStudent(chapter({ schedule_start: '2999-01-01 08:00:00' })),
    true,
  );
  assert.equal(isChapterHiddenFromStudent(chapter({ schedule: null })), false);
});

test('a PDF-only part is detected before any activation branch runs', () => {
  assert.equal(chapterHasVideo({ video_status: 'none' } as never), false);
  assert.equal(chapterHasVideo({ video_status: 'ready' } as never), true);
  // Locked lessons withhold the URLs, so a non-zero duration still means "has video".
  assert.equal(chapterHasVideo({ duration: '12:30' } as never), true);
  assert.equal(chapterHasVideo({ duration: '00:00' } as never), false);
  assert.equal(
    chapterHasVideo({ video: 'https://api.learnoo.app/storage', duration: '—' } as never),
    false,
  );
  assert.equal(
    chapterHasVideo({ video_mp4_url: 'https://api.learnoo.app/storage/x.mp4' } as never),
    true,
  );
});
