import type { SmsProviderConfig, SmsProviderId } from '../shared';
import { fetchJson, uid } from '../util';

/**
 * Iranian SMS web services. Each provider sends a sign-in code through its verification /
 * pattern service when a template is set (fast, delivered on dedicated lines even to numbers
 * that block ads) and falls back to a normal message otherwise.
 *
 * `otpTemplate` is the template name / id / pattern code from the provider's panel. When the
 * template's variable is not the default, write it after a colon, e.g. "123456:CODE".
 */

export class SmsError extends Error {}

interface Provider {
  sendOtp(p: SmsProviderConfig, to: string, code: string, text: string): Promise<void>;
  /** One text to many numbers (the caller splits into batches of `batch`). */
  sendText(p: SmsProviderConfig, to: string[], text: string): Promise<void>;
  batch: number;
}

const template = (raw: string, defaultParam: string) => {
  const i = raw.lastIndexOf(':');
  return i > 0 ? { id: raw.slice(0, i).trim(), param: raw.slice(i + 1).trim() || defaultParam } : { id: raw.trim(), param: defaultParam };
};
const need = (v: string | undefined, what: string) => {
  if (!v) throw new SmsError(`${what} تنظیم نشده است.`);
  return v;
};
/** +98912... for services that want international format. */
const intl = (phone: string) => `+98${phone.slice(1)}`;

// ---------- Kavenegar (kavenegar.com) ----------
const kavenegar: Provider = {
  batch: 200,
  async sendOtp(p, to, code, text) {
    if (!p.otpTemplate) return kavenegar.sendText(p, [to], text);
    const key = need(p.apiKey, 'کلید API کاوه‌نگار');
    const q = new URLSearchParams({ receptor: to, token: code, template: p.otpTemplate });
    const { data } = await fetchJson(`https://api.kavenegar.com/v1/${encodeURIComponent(key)}/verify/lookup.json?${q}`);
    kavenegarCheck(data);
  },
  async sendText(p, to, text) {
    const key = need(p.apiKey, 'کلید API کاوه‌نگار');
    const { data } = await fetchJson(`https://api.kavenegar.com/v1/${encodeURIComponent(key)}/sms/send.json`, {
      method: 'POST',
      form: { receptor: to.join(','), sender: p.sender || undefined, message: text },
    });
    kavenegarCheck(data);
  },
};
function kavenegarCheck(data: any) {
  const status = data?.return?.status;
  if (status !== 200) throw new SmsError(`کاوه‌نگار: ${data?.return?.message ?? 'پاسخ نامعتبر'} (${status ?? '?'})`);
}

// ---------- SMS.ir (sms.ir, API v1) ----------
const smsir: Provider = {
  batch: 100,
  async sendOtp(p, to, code, text) {
    if (!p.otpTemplate) return smsir.sendText(p, [to], text);
    const t = template(p.otpTemplate, 'Code');
    const { data } = await fetchJson('https://api.sms.ir/v1/send/verify', {
      method: 'POST',
      headers: { 'x-api-key': need(p.apiKey, 'کلید API اس‌ام‌اس.آی‌آر') },
      json: { mobile: to, templateId: Number(t.id), parameters: [{ name: t.param, value: code }] },
    });
    smsirCheck(data);
  },
  async sendText(p, to, text) {
    const { data } = await fetchJson('https://api.sms.ir/v1/send/bulk', {
      method: 'POST',
      headers: { 'x-api-key': need(p.apiKey, 'کلید API اس‌ام‌اس.آی‌آر') },
      json: { lineNumber: Number(need(p.sender, 'شماره خط')), messageText: text, mobiles: to },
    });
    smsirCheck(data);
  },
};
function smsirCheck(data: any) {
  if (data?.status !== 1) throw new SmsError(`اس‌ام‌اس.آی‌آر: ${data?.message ?? 'پاسخ نامعتبر'} (${data?.status ?? '?'})`);
}

// ---------- Melipayamak (melipayamak.com) ----------
// With a username and web-service password it uses the REST service; otherwise the console API key.
const melipayamak: Provider = {
  batch: 100,
  async sendOtp(p, to, code, text) {
    if (!p.otpTemplate) return melipayamak.sendText(p, [to], text);
    const bodyId = template(p.otpTemplate, '').id;
    if (p.username && p.password) {
      const { data } = await fetchJson('https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber', {
        method: 'POST',
        form: { username: p.username, password: p.password, to, bodyId, text: code },
      });
      melipayamakRestCheck(data);
    } else {
      const { data } = await fetchJson(`https://console.melipayamak.com/api/send/shared/${encodeURIComponent(need(p.apiKey, 'کلید API ملی‌پیامک'))}`, {
        method: 'POST',
        json: { bodyId: Number(bodyId), to, args: [code] },
      });
      melipayamakConsoleCheck(data);
    }
  },
  async sendText(p, to, text) {
    const from = need(p.sender, 'شماره خط');
    if (p.username && p.password) {
      const { data } = await fetchJson('https://rest.payamak-panel.com/api/SendSMS/SendSMS', {
        method: 'POST',
        form: { username: p.username, password: p.password, to: to.join(','), from, text, isflash: 'false' },
      });
      melipayamakRestCheck(data);
    } else {
      for (const one of to) {
        const { data } = await fetchJson(`https://console.melipayamak.com/api/send/simple/${encodeURIComponent(need(p.apiKey, 'کلید API ملی‌پیامک'))}`, {
          method: 'POST',
          json: { from, to: one, text },
        });
        melipayamakConsoleCheck(data);
      }
    }
  },
};
function melipayamakRestCheck(data: any) {
  if (Number(data?.RetStatus) !== 1) throw new SmsError(`ملی‌پیامک: ${data?.StrRetStatus ?? 'پاسخ نامعتبر'} (${data?.RetStatus ?? '?'})`);
}
function melipayamakConsoleCheck(data: any) {
  if (!(Number(data?.recId) > 1000)) throw new SmsError(`ملی‌پیامک: ${data?.status ?? 'پاسخ نامعتبر'}`);
}

// ---------- Ghasedak (ghasedak.me, gateway API v1) ----------
const ghasedak: Provider = {
  batch: 100,
  async sendOtp(p, to, code, text) {
    if (!p.otpTemplate) return ghasedak.sendText(p, [to], text);
    const t = template(p.otpTemplate, 'Code');
    const { data } = await fetchJson('https://gateway.ghasedak.me/rest/api/v1/WebService/SendOtpSMS', {
      method: 'POST',
      headers: { ApiKey: need(p.apiKey, 'کلید API قاصدک') },
      json: { receptors: [{ mobile: to, clientReferenceId: uid('otp') }], templateName: t.id, inputs: [{ param: t.param, value: code }], udh: false },
    });
    ghasedakCheck(data);
  },
  async sendText(p, to, text) {
    const { data } = await fetchJson('https://gateway.ghasedak.me/rest/api/v1/WebService/SendBulkSMS', {
      method: 'POST',
      headers: { ApiKey: need(p.apiKey, 'کلید API قاصدک') },
      json: { lineNumber: need(p.sender, 'شماره خط'), receptors: to, message: text, clientReferenceId: uid('sms'), udh: false },
    });
    ghasedakCheck(data);
  },
};
function ghasedakCheck(data: any) {
  if (data?.isSuccess !== true) throw new SmsError(`قاصدک: ${data?.message ?? 'پاسخ نامعتبر'} (${data?.statusCode ?? '?'})`);
}

// ---------- FarazSMS / IPPanel (ippanel.com, API v1) ----------
const farazsms: Provider = {
  batch: 100,
  async sendOtp(p, to, code, text) {
    if (!p.otpTemplate) return farazsms.sendText(p, [to], text);
    const t = template(p.otpTemplate, 'code');
    const { data } = await fetchJson('https://api2.ippanel.com/api/v1/sms/pattern/normal/send', {
      method: 'POST',
      headers: { apikey: need(p.apiKey, 'کلید API فراز اس‌ام‌اس') },
      json: { code: t.id, sender: need(p.sender, 'شماره خط'), recipient: intl(to), variable: { [t.param]: code } },
    });
    ippanelCheck(data);
  },
  async sendText(p, to, text) {
    const { data } = await fetchJson('https://api2.ippanel.com/api/v1/sms/send/webservice/single', {
      method: 'POST',
      headers: { apikey: need(p.apiKey, 'کلید API فراز اس‌ام‌اس') },
      json: { recipient: to.map(intl), sender: need(p.sender, 'شماره خط'), message: text },
    });
    ippanelCheck(data);
  },
};
function ippanelCheck(data: any) {
  if (String(data?.status).toUpperCase() !== 'OK') {
    const detail = data?.error_message ?? data?.message ?? (typeof data?.data === 'object' ? JSON.stringify(data.data).slice(0, 160) : 'پاسخ نامعتبر');
    throw new SmsError(`فراز اس‌ام‌اس: ${detail} (${data?.code ?? '?'})`);
  }
}

export const PROVIDERS: Record<SmsProviderId, Provider> = { kavenegar, smsir, melipayamak, ghasedak, farazsms };
