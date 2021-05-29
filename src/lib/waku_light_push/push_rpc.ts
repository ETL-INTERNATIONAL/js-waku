import { Reader } from 'protobufjs/minimal';
import { v4 as uuid } from 'uuid';

import * as proto from '../../proto/waku/v2/light_push';
import { WakuMessage } from '../waku_message';
import { DefaultPubsubTopic } from '../waku_relay';

export class PushRPC {
  public constructor(public proto: proto.PushRPC) {}

  static createRequest(
    message: WakuMessage,
    pubsubTopic: string = DefaultPubsubTopic
  ): PushRPC {
    return new PushRPC({
      requestId: uuid(),
      request: {
        message,
        pubsubTopic,
      },
      response: undefined,
    });
  }

  static decode(bytes: Uint8Array): PushRPC {
    const res = proto.PushRPC.decode(Reader.create(bytes));
    return new PushRPC(res);
  }

  encode(): Uint8Array {
    return proto.PushRPC.encode(this.proto).finish();
  }

  get query(): proto.PushRequest | undefined {
    return this.proto.request;
  }

  get response(): proto.PushResponse | undefined {
    return this.proto.response;
  }
}
