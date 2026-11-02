import assert from 'node:assert/strict';
import test from 'node:test';
import { npmReleaseChannel } from './npm-release-channel.mjs';

test('v1 maintenance releases cannot replace the npm v2 latest channel', () => {
  assert.equal(npmReleaseChannel('1.15.3'), 'legacy');
  assert.equal(npmReleaseChannel('2.0.5'), 'latest');
});
test('prereleases stay outside both stable channels', () => {
  assert.equal(npmReleaseChannel('1.15.3-next.1'), 'legacy-next');
  assert.equal(npmReleaseChannel('2.1.0-next.1'), 'next');
});
test('other packages, ranges and unsupported majors cannot select a channel', () => {
  for (const value of ['latest', 'native-v0.1.0', '^2.0.4', '3.0.0', '2.0.4;command']) assert.throws(() => npmReleaseChannel(value));
});
