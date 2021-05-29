import { expect } from 'chai';
import TCP from 'libp2p-tcp';

import { makeLogFileName, NimWaku, NOISE_KEY_1 } from '../../test_utils';
import { delay } from '../delay';
import { Waku } from '../waku';
import { WakuMessage } from '../waku_message';

describe('Waku Light Push', () => {
  let waku: Waku;
  let nimWaku: NimWaku;

  afterEach(async function () {
    nimWaku ? nimWaku.stop() : null;
    waku ? await waku.stop() : null;
  });

  it('Push successfully', async function () {
    this.timeout(5_000);

    nimWaku = new NimWaku(makeLogFileName(this));
    await nimWaku.start({ lightpush: true });

    waku = await Waku.create({
      staticNoiseKey: NOISE_KEY_1,
      modules: { transport: [TCP] },
    });
    await waku.dial(await nimWaku.getMultiaddrWithId());

    // Wait for identify protocol to finish
    await new Promise((resolve) => {
      waku.libp2p.peerStore.once('change:protocols', resolve);
    });

    const nimPeerId = await nimWaku.getPeerId();

    const messageText = 'Light Push works!';
    const message = WakuMessage.fromUtf8String(messageText);

    const pushResponse = await waku.lightPush.push(nimPeerId, message);
    expect(pushResponse?.isSuccess).to.be.true;

    let msgs: WakuMessage[] = [];

    while (msgs.length === 0) {
      await delay(200);
      msgs = await nimWaku.messages();
    }

    expect(msgs[0].contentTopic).to.equal(message.contentTopic);
    expect(msgs[0].version).to.equal(message.version);
    expect(msgs[0].payloadAsUtf8).to.equal(messageText);
  });
});
