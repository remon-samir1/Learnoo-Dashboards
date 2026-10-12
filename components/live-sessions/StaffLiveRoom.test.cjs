const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');

function room({ pathname = '/live-sessions/70/room', capture = true, recording = false, enabled = true, userAgent = 'iPad' } = {}) {
  const state = [], refs = [], effects = [], commands = [], destinations = [];
  let onStage = 'instructor', cursor, refCursor, meeting, localRecording, closed = false, tree, markup;
  const module = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(join(__dirname, 'StaffLiveRoom.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const jitsi = { exports: {} };
  new Function('module', 'exports', 'process', ts.transpileModule(readFileSync(join(__dirname, '../../src/lib/jitsi.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(jitsi, jitsi.exports, { env: {} });
  new Function('require', 'module', 'exports', 'navigator', 'process', compiled)(id => {
    if (id === 'react') return { ...React,
      useEffect: callback => effects.push(callback),
      useRef: initial => refs[refCursor++] ??= { current: initial },
      useState: initial => { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], next => state[index] = next]; },
    };
    if (id === 'next/navigation') return { usePathname: () => pathname, useRouter: () => ({ push: path => destinations.push(path) }) };
    if (id === 'next/link') return ({ children }) => React.createElement('a', null, children);
    if (id === '@/src/hooks/useLiveRooms') return { useLiveRoom: () => ({ data: { attributes: { title: 'QA room', enable_recording: enabled } }, isLoading: false }) };
    if (id === '@/lib/auth') return { getUserData: () => ({ attributes: { first_name: 'مدرس & # " عربي' } }) };
    if (id === '@/src/lib/jitsi') return jitsi.exports;
    if (id === './LiveMeetingStage') return { __esModule: true, default: ({ children }) => React.createElement('div', { 'data-meeting-stage': true }, children) };
    if (id === './LocalSessionRecording') return { __esModule: true, default: props => { localRecording = props; return React.createElement('span', null, 'Local recorder'); } };
    if (id === '@jitsi/react-sdk') return { JitsiMeeting: props => { meeting = props; return React.createElement('iframe'); } };
    return require(id);
  }, module, module.exports, { userAgent, mediaDevices: capture ? { getDisplayMedia: () => { throw new Error('Must not capture browser media'); } } : {} }, { env: { NEXT_PUBLIC_JITSI_RECORDING_ENABLED: String(recording) } });
  const render = () => {
    cursor = refCursor = 0;
    meeting = null;
    tree = module.exports.default({ roomId: '70', basePath: '/live-sessions', onClose: () => closed = true });
    markup = renderToStaticMarkup(tree);
    return markup;
  };
  const elements = (node = tree) => !node || typeof node !== 'object' ? [] : [node, ...React.Children.toArray(node.props?.children).flatMap(child => elements(child))];
  render();
  effects.shift()();
  render();
  return { render, elements, commands, destinations, select: id => onStage = id, get meeting() { return meeting; }, get localRecording() { return localRecording; }, get closed() { return closed; }, get markup() { return markup; }, ready() {
    const listeners = {};
    meeting.onApiReady({ _getOnStageParticipant: () => onStage, executeCommand: (...args) => commands.push(args), addEventListeners: value => Object.assign(listeners, value) });
    return listeners;
  } };
}

test('staff hangup preserves another page and returns from the room page', () => {
  for (const pathname of ['/exams/create', '/live-sessions/70/room']) {
    const view = room({ pathname });
    assert.equal(view.meeting.interfaceConfigOverwrite.SHOW_JITSI_WATERMARK, false);
    assert.equal(view.meeting.interfaceConfigOverwrite.SHOW_BRAND_WATERMARK, false);
    assert.equal(view.meeting.interfaceConfigOverwrite.APP_NAME, 'Learnoo');
    assert.equal(view.meeting.interfaceConfigOverwrite.PROVIDER_NAME, 'Learnoo');
    assert.equal(view.meeting.interfaceConfigOverwrite.SHOW_POWERED_BY, false);
    assert.equal(view.meeting.configOverwrite.toolbarButtons.includes('help'), false);
    assert.equal(view.meeting.configOverwrite.toolbarButtons.includes('feedback'), false);
    assert.equal(view.meeting.configOverwrite.whiteboard.collabServerBaseUrl, 'https://whiteboard.learnoo.app');
    const button = () => view.elements().find(node => node.type === 'button' && React.Children.toArray(node.props.children).includes(' السبورة'));
    assert.equal(button().props.disabled, true);
    view.ready().videoConferenceJoined();
    view.render();
    assert.equal(button().props.disabled, false);
    button().props.onClick();
    assert.deepEqual(view.commands, [['toggleWhiteboard']]);
    view.meeting.onReadyToClose();
    assert.equal(view.closed, true);
    assert.deepEqual(view.destinations, pathname.endsWith('/room') ? ['/live-sessions'] : []);
  }
});

test('iPad opens the same native room without joining twice; Android uses an intent', () => {
  for (const userAgent of ['iPad', 'Macintosh', 'Android']) {
    const view = room({ capture: false, userAgent });
    assert.equal(view.meeting, null);
    const link = view.elements().find(node => node.type === 'a' && /^(org\.jitsi\.meet|intent):/.test(node.props.href));
    assert.ok(link.props.href.startsWith(userAgent === 'Android' ? 'intent://meet.learnoo.app/learnooroom70' : 'org.jitsi.meet://meet.learnoo.app/learnooroom70'));
    const name = link.props.href.split('#userInfo.displayName=')[1].split('#Intent')[0];
    assert.equal(JSON.parse(decodeURIComponent(name)), 'مدرس & # " عربي');
    view.elements().find(node => node.type === 'button' && String(node.props.children).startsWith('فتح الجلسة والسبورة')).props.onClick();
    view.render();
    assert.equal(view.meeting.roomName, 'learnooroom70');
    assert.ok(view.markup.includes('data-meeting-stage'));
    view.elements().find(node => node.type === 'a' && node.props.children === 'فتح في تطبيق مشاركة الشاشة').props.onClick();
    view.render();
    assert.equal(view.meeting, null);
    assert.equal(view.closed, false);
  }
});

test('staff uses device recording with room permission and disables server recording', () => {
  for (const enabled of [true, false]) {
    const view = room({ enabled });
    assert.equal(view.meeting.configOverwrite.recordingService.enabled, false);
    assert.equal(view.meeting.configOverwrite.toolbarButtons.includes('recording'), false);
    assert.equal(view.meeting.configOverwrite.localRecording.disable, true);
    assert.equal(view.localRecording.enabled, enabled);
    assert.equal(view.localRecording.joined, false);
    assert.equal(view.localRecording.roomId, '70');
    view.ready().videoConferenceJoined();
    view.render();
    assert.equal(view.localRecording.joined, true);
  }
});

test('staff scales only the visible whiteboard and restores video after closing it', () => {
  const view = room();
  const stage = () => view.elements().find(node => node.props?.whiteboardOpen !== undefined);
  const listeners = view.ready();
  assert.equal(stage().props.whiteboardOpen, false);
  listeners.whiteboardStatusChanged({ status: 'INSTANTIATED' });
  view.render();
  assert.equal(stage().props.whiteboardOpen, false);
  listeners.whiteboardStatusChanged({ status: 'SHOWN' });
  view.render();
  assert.equal(stage().props.whiteboardOpen, true);
  view.select('instructor-sharing-screen');
  listeners.largeVideoChanged();
  view.render();
  assert.equal(stage().props.whiteboardOpen, false);
  view.select('whiteboard');
  listeners.largeVideoChanged();
  view.render();
  assert.equal(stage().props.whiteboardOpen, true);
  listeners.whiteboardStatusChanged({ status: 'HIDDEN' });
  view.render();
  assert.equal(stage().props.whiteboardOpen, false);
});
