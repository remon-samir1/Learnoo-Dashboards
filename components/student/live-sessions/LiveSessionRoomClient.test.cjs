const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');

test('leaving a Student meeting returns to the localized session list', () => {
  for (const locale of ['ar', 'en']) {
    let meeting, stage, cursor = 0, onStage = 'instructor';
    const state = [];
    const destinations = [];
    function load(file) {
      const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
      }).outputText;
      const module = { exports: {} };
      new Function('require', 'module', 'exports', compiled)((id) => {
        if (id === 'react') return { ...React,
          useRef: initial => ({ current: initial }),
          useEffect: () => {},
          useState: initial => { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], value => state[index] = value]; },
        };
        if (id === 'next/navigation') return { useRouter: () => ({ replace: path => destinations.push(path) }) };
        if (id === 'next-intl') return { useLocale: () => locale, useTranslations: () => key => key };
        if (id === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
        if (id === '@jitsi/react-sdk') return { JitsiMeeting: props => { meeting = props; return null; } };
        if (id === '@/components/live-sessions/LiveMeetingStage') return { __esModule: true, default: props => { stage = props; return React.createElement('div', { 'data-meeting-stage': true }, props.children); } };
        if (id === '@/components/student/watch/VideoWatermark') return { VideoWatermark: () => { throw new Error('Live meetings must not render a watermark'); } };
        if (id === '@/src/services/student/platform-feature.service') return { getStudentPlatformFeatures: async () => [] };
        if (id === '@/src/lib/watermark-from-features') return { resolveEnabledWatermarkBucket: () => null };
        if (id.startsWith('@/')) return load(resolve(__dirname, '../../..', id.slice(2) + '.ts'));
        return require(id);
      }, module, module.exports);
      return module.exports;
    }
    const { default: Room } = load(resolve(__dirname, 'LiveSessionRoomClient.tsx'));
    const render = () => { cursor = 0; return renderToStaticMarkup(React.createElement(Room, {
      room: { id: '70', attributes: { title: 'QA live lesson', status: 'live' } }, studentName: 'QA Student',
    })); };
    const markup = render();
    assert.ok(markup.includes('data-meeting-stage'));
    assert.ok(markup.includes(locale === 'ar' ? 'تشغيل الميكروفون' : 'Unmute microphone'));
    assert.equal(meeting.roomName, 'learnooroom70');
    assert.equal(meeting.userInfo.displayName, 'QA Student');
    assert.equal(meeting.configOverwrite.prejoinConfig.enabled, false);
    assert.equal(meeting.configOverwrite.startWithAudioMuted, true);
    assert.equal(meeting.configOverwrite.startWithVideoMuted, true);
    assert.equal(meeting.configOverwrite.whiteboard.collabServerBaseUrl, 'https://whiteboard.learnoo.app');
    assert.equal(meeting.interfaceConfigOverwrite.SHOW_JITSI_WATERMARK, false);
    assert.equal(meeting.interfaceConfigOverwrite.SHOW_BRAND_WATERMARK, false);
    assert.equal(meeting.interfaceConfigOverwrite.APP_NAME, 'Learnoo');
    assert.equal(meeting.interfaceConfigOverwrite.PROVIDER_NAME, 'Learnoo');
    assert.equal(meeting.interfaceConfigOverwrite.SHOW_POWERED_BY, false);
    assert.equal(typeof meeting.onReadyToClose, 'function');
    const listeners = {};
    meeting.onApiReady({ _getOnStageParticipant: () => onStage, addEventListeners: value => Object.assign(listeners, value) });
    assert.equal(stage.whiteboardOpen, false);
    listeners.whiteboardStatusChanged({ status: 'INSTANTIATED' });
    render();
    assert.equal(stage.whiteboardOpen, false);
    listeners.whiteboardStatusChanged({ status: 'SHOWN' });
    render();
    assert.equal(stage.whiteboardOpen, true);
    onStage = 'instructor-sharing-screen';
    listeners.largeVideoChanged();
    render();
    assert.equal(stage.whiteboardOpen, false);
    onStage = 'whiteboard';
    listeners.largeVideoChanged();
    render();
    assert.equal(stage.whiteboardOpen, true);
    listeners.whiteboardStatusChanged({ status: 'HIDDEN' });
    render();
    assert.equal(stage.whiteboardOpen, false);
    meeting.onReadyToClose();
    assert.deepEqual(destinations, [`/${locale}/student/live-sessions`]);
  }
});
