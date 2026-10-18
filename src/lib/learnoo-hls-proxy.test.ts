import assert from 'node:assert/strict';
import test from 'node:test';
import {
  rewriteLearnooHlsPlaylistBody,
  toProxiedLearnooHlsUrl,
} from './learnoo-hls-proxy.ts';

test('keeps signed HLS URLs same-origin without exposing the user token', () => {
  const playlist = [
    '#EXTM3U',
    '#EXT-X-KEY:METHOD=AES-128,URI="https://api.learnoo.app/hls/key/chapter/332/key.key?signature=key-signature"',
    'https://api.learnoo.app/hls/segment/chapter/332/segment.ts?signature=segment-signature',
  ].join('\n');

  const rewritten = rewriteLearnooHlsPlaylistBody(playlist);

  assert.match(rewritten, /\/api\/learnoo-origin\/hls\/key\/chapter\/332\/key\.key\?signature=key-signature/);
  assert.match(rewritten, /\/api\/learnoo-origin\/hls\/segment\/chapter\/332\/segment\.ts\?signature=segment-signature/);
  assert.doesNotMatch(rewritten, /[?&](?:token|auth)=/i);
  assert.equal(
    toProxiedLearnooHlsUrl('https://api.learnoo.app/hls/chapter/332/playlist?signature=master-signature'),
    '/api/learnoo-origin/hls/chapter/332/playlist?signature=master-signature'
  );
});


test('signed attachment playlists use the same-origin media proxy and retain their signature', () => {
  assert.equal(
    toProxiedLearnooHlsUrl('https://api.learnoo.app/v1/attachment/420/preview/summary.m3u8?device_version=1&expires=2000000000&signature=master-signature'),
    '/api/learnoo-origin/v1/attachment/420/preview/summary.m3u8?device_version=1&expires=2000000000&signature=master-signature'
  );
  assert.equal(
    toProxiedLearnooHlsUrl('https://external.example/v1/attachment/420/preview/summary.m3u8?signature=external'),
    'https://external.example/v1/attachment/420/preview/summary.m3u8?signature=external'
  );
});
