import { WechatLoginResponse } from "../types/wechat.js";

const WECHAT_API_BASE = "https://api.weixin.qq.com";

export async function code2Session(code: string): Promise<WechatLoginResponse> {
  const appId = process.env.WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("WeChat credentials not configured");
  }

  const url = new URL(`${WECHAT_API_BASE}/sns/jscode2session`);
  url.searchParams.set("appid", appId);
  url.searchParams.set("secret", appSecret);
  url.searchParams.set("js_code", code);
  url.searchParams.set("grant_type", "authorization_code");

  const response = await fetch(url.toString());
  const data = (await response.json()) as WechatLoginResponse;

  if (data.errcode) {
    throw new Error(`WeChat API Error: ${data.errmsg} (${data.errcode})`);
  }

  return data;
}
