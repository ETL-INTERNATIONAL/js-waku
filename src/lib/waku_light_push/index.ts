import concat from 'it-concat';
import lp from 'it-length-prefixed';
import pipe from 'it-pipe';
import Libp2p from 'libp2p';
import PeerId from 'peer-id';

import { PushResponse } from '../../proto/waku/v2/light_push';
import { WakuMessage } from '../waku_message';
import { DefaultPubsubTopic } from '../waku_relay';

import { PushRPC } from './push_rpc';

export const LightPushCodec = '/vac/waku/lightpush/2.0.0-alpha1';
export { PushResponse };

/**
 * Implements the [Waku v2 Light Push protocol](https://rfc.vac.dev/spec/19/).
 */
export class WakuLightPush {
  constructor(public libp2p: Libp2p) {}

  async push(
    peerId: PeerId,
    message: WakuMessage,
    pubsubTopic: string = DefaultPubsubTopic
  ): Promise<PushResponse | null> {
    const peer = this.libp2p.peerStore.get(peerId);
    if (!peer) throw 'Peer is unknown';
    if (!peer.protocols.includes(LightPushCodec))
      throw 'Peer does not register waku light push protocol';

    const connection = this.libp2p.connectionManager.get(peer.id);
    if (!connection) throw 'Failed to get a connection to the peer';

    const { stream } = await connection.newStream(LightPushCodec);
    try {
      const query = PushRPC.createRequest(message, pubsubTopic);
      const res = await pipe(
        [query.encode()],
        lp.encode(),
        stream,
        lp.decode(),
        concat
      );
      try {
        const response = PushRPC.decode(res.slice()).response;

        if (!response) {
          console.log('No response in PushRPC');
          return null;
        }

        return response;
      } catch (err) {
        console.log('Failed to decode push reply', err);
      }
    } catch (err) {
      console.log('Failed to send waku light push request', err);
    }
    return null;
  }
}
