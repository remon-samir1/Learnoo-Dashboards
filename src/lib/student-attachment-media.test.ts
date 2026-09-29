import assert from 'node:assert/strict';
import test from 'node:test';

import { attachmentMediaKind, isHlsAttachment } from './student-attachment-media.ts';

test('trusts the mime type before the extension', () => {
  assert.equal(attachmentMediaKind({ mime_type: 'image/png', url: 'a.pdf' }), 'image');
  assert.equal(attachmentMediaKind({ mime: 'video/mp4', name: 'clip.bin' }), 'video');
  assert.equal(attachmentMediaKind({ type: 'application/x-mpegURL' }), 'video');
});

test('recognises the extensions the old preview treated as plain files', () => {
  assert.equal(attachmentMediaKind({ extension: 'jfif' }), 'image');
  assert.equal(attachmentMediaKind({ extension: '.WEBP' }), 'image');
  assert.equal(attachmentMediaKind({ name: 'scan.heic' }), 'image');
  assert.equal(attachmentMediaKind({ url: 'https://cdn.test/a/b/photo.avif' }), 'image');
  assert.equal(attachmentMediaKind({ url: 'https://cdn.test/lesson.mov' }), 'video');
});

test('ignores a query string when reading the extension from a url', () => {
  assert.equal(
    attachmentMediaKind({ url: 'https://cdn.test/photo.jfif?sig=abc.pdf' }),
    'image',
  );
});

test('anything unrecognised stays a plain file', () => {
  assert.equal(attachmentMediaKind({ url: 'https://cdn.test/notes.pdf' }), 'file');
  assert.equal(attachmentMediaKind({}), 'file');
});

test('flags the m3u8 attachments that need hls.js', () => {
  assert.equal(isHlsAttachment({ url: 'https://cdn.test/stream/playlist.m3u8' }), true);
  assert.equal(isHlsAttachment({ mime_type: 'application/vnd.apple.mpegurl' }), true);
  assert.equal(isHlsAttachment({ url: 'https://cdn.test/lesson.mp4' }), false);
});
