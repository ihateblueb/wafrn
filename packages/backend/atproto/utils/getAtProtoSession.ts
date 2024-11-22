import {Model} from "sequelize";
import {environment} from "../../environment.js";
import {BskyAgent} from "@atproto/api";

async function getAtProtoSession(user?: Model<any, any>): Promise<BskyAgent> {
  /*await agent.createAccount({
          email: localUser.url + '@' + environment.instanceUrl,
          password: localUser.bskyAuthData,
          handle: localUser.url.replaceAll('_', '-') + '.' + environment.bskyPds,
          inviteCode: 'INVITECODE',
        })
        */
  const agent = new BskyAgent({
    service: 'https://' + environment.bskyPds
  })
  if(user) {
    await agent.login({
      identifier: user.url + '@' + environment.instanceUrl,
      // this is cursed BUTT its an autogenerated one. And the login endpoints are blocked too. so its safe-ish.
      password: user.bskyAuthData
    })
  }
  return agent;
}

export {getAtProtoSession}
