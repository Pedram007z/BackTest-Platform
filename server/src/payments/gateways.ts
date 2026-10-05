import type { GatewayConfig, GatewayId } from '../shared';
import { fetchJson } from '../util';

/**
 * Iranian payment gateways (Shaparak PSP aggregators). Every gateway works the same way:
 *   1. request: register the payment and get a token ("authority" / trackId),
 *   2. send the browser to the gateway's page with that token,
 *   3. the gateway sends the browser back to our callback URL,
 *   4. verify: confirm with the gateway (server to server) that the money arrived.
 * A payment counts only after step 4; the callback's own "success" flag is never trusted.
 */

export class GatewayError extends Error {}

export interface RequestInput {
  paymentId: string;
  amountToman: number;
  callbackUrl: string;
  description: string;
  mobile: string;
}

export interface CallbackInfo {
  /** Token the gateway echoes back; must match the one saved at request time. */
  authority?: string;
  /** The gateway says the payer finished (still has to be verified). */
  ok: boolean;
}

export interface VerifyResult {
  ok: boolean;
  refId?: string;
  cardPan?: string;
  /** Amount the gateway reports, in rial, when it reports one. */
  amountRial?: number;
  message?: string;
}

interface Gateway {
  request(g: GatewayConfig, input: RequestInput): Promise<{ authority: string; redirectUrl: string }>;
  callback(params: Record<string, string>): CallbackInfo;
  verify(g: GatewayConfig, input: { authority: string; amountToman: number; paymentId: string }): Promise<VerifyResult>;
}

const rial = (toman: number) => Math.round(toman * 10);
const need = (g: GatewayConfig) => {
  if (!g.merchantId) throw new GatewayError(`شناسه‌ی پذیرنده‌ی ${g.name} وارد نشده است.`);
  return g.merchantId;
};

// ---------- Zarinpal (REST v4) ----------
const zpBase = (g: GatewayConfig) => (g.sandbox ? 'https://sandbox.zarinpal.com' : 'https://payment.zarinpal.com');
const zpError = (data: any) => {
  const e = data?.errors;
  const msg = (e && !Array.isArray(e) && (e.message as string)) || data?.data?.message || 'پاسخ نامعتبر';
  const code = (e && !Array.isArray(e) && e.code) ?? data?.data?.code;
  return `زرین‌پال: ${msg} (${code ?? '?'})`;
};
const zarinpal: Gateway = {
  async request(g, i) {
    const { data } = await fetchJson(`${zpBase(g)}/pg/v4/payment/request.json`, {
      method: 'POST',
      json: {
        merchant_id: need(g),
        amount: rial(i.amountToman),
        currency: 'IRR',
        callback_url: i.callbackUrl,
        description: i.description,
        metadata: { mobile: i.mobile, order_id: i.paymentId },
      },
    });
    if (data?.data?.code !== 100 || !data.data.authority) throw new GatewayError(zpError(data));
    return { authority: data.data.authority, redirectUrl: `${zpBase(g)}/pg/StartPay/${data.data.authority}` };
  },
  callback: (p) => ({ authority: p.Authority ?? p.authority, ok: (p.Status ?? p.status) === 'OK' }),
  async verify(g, i) {
    const { data } = await fetchJson(`${zpBase(g)}/pg/v4/payment/verify.json`, {
      method: 'POST',
      json: { merchant_id: need(g), amount: rial(i.amountToman), authority: i.authority },
    });
    const code = data?.data?.code;
    // 101 = already verified (a repeated callback)
    if (code === 100 || code === 101) return { ok: true, refId: String(data.data.ref_id), cardPan: data.data.card_pan };
    return { ok: false, message: zpError(data) };
  },
};

// ---------- Zibal ----------
const zibalMerchant = (g: GatewayConfig) => (g.sandbox ? 'zibal' : need(g));
const zibal: Gateway = {
  async request(g, i) {
    const { data } = await fetchJson('https://gateway.zibal.ir/v1/request', {
      method: 'POST',
      json: { merchant: zibalMerchant(g), amount: rial(i.amountToman), callbackUrl: i.callbackUrl, description: i.description, orderId: i.paymentId, mobile: i.mobile },
    });
    if (data?.result !== 100 || !data.trackId) throw new GatewayError(`زیبال: ${data?.message ?? 'پاسخ نامعتبر'} (${data?.result ?? '?'})`);
    return { authority: String(data.trackId), redirectUrl: `https://gateway.zibal.ir/start/${data.trackId}` };
  },
  callback: (p) => ({ authority: p.trackId, ok: p.success === '1' }),
  async verify(g, i) {
    const { data } = await fetchJson('https://gateway.zibal.ir/v1/verify', { method: 'POST', json: { merchant: zibalMerchant(g), trackId: Number(i.authority) } });
    // 201 = already verified
    if (data?.result === 100 || data?.result === 201)
      return { ok: true, refId: data.refNumber ? String(data.refNumber) : undefined, cardPan: data.cardNumber, amountRial: Number(data.amount) || undefined };
    return { ok: false, message: `زیبال: ${data?.message ?? 'تأیید نشد'} (${data?.result ?? '?'})` };
  },
};

// ---------- IDPay (v1.1) ----------
const idpayHeaders = (g: GatewayConfig) => ({ 'X-API-KEY': need(g), ...(g.sandbox ? { 'X-SANDBOX': '1' } : {}) });
const idpay: Gateway = {
  async request(g, i) {
    const { data } = await fetchJson('https://api.idpay.ir/v1.1/payment', {
      method: 'POST',
      headers: idpayHeaders(g),
      json: { order_id: i.paymentId, amount: rial(i.amountToman), phone: i.mobile, desc: i.description, callback: i.callbackUrl },
    });
    if (!data?.id || !data.link) throw new GatewayError(`آیدی‌پی: ${data?.error_message ?? 'پاسخ نامعتبر'} (${data?.error_code ?? '?'})`);
    return { authority: String(data.id), redirectUrl: data.link };
  },
  // status 10 = paid, waiting for verification
  callback: (p) => ({ authority: p.id, ok: String(p.status) === '10' }),
  async verify(g, i) {
    const { data } = await fetchJson('https://api.idpay.ir/v1.1/payment/verify', { method: 'POST', headers: idpayHeaders(g), json: { id: i.authority, order_id: i.paymentId } });
    const status = Number(data?.status);
    if (status === 100 || status === 101)
      return { ok: true, refId: String(data.track_id ?? data.payment?.track_id ?? ''), cardPan: data.payment?.card_no, amountRial: Number(data.amount) || undefined };
    return { ok: false, message: `آیدی‌پی: ${data?.error_message ?? 'تأیید نشد'} (${data?.error_code ?? data?.status ?? '?'})` };
  },
};

// ---------- NextPay (amounts in toman) ----------
const nextpay: Gateway = {
  async request(g, i) {
    const { data } = await fetchJson('https://nextpay.org/nx/gateway/token', {
      method: 'POST',
      form: { api_key: need(g), amount: i.amountToman, currency: 'IRT', order_id: i.paymentId, callback_uri: i.callbackUrl, customer_phone: i.mobile, payer_desc: i.description },
    });
    if (Number(data?.code) !== -1 || !data.trans_id) throw new GatewayError(`نکست‌پی: کد خطا ${data?.code ?? '?'}`);
    return { authority: String(data.trans_id), redirectUrl: `https://nextpay.org/nx/gateway/payment/${data.trans_id}` };
  },
  callback: (p) => ({ authority: p.trans_id, ok: Boolean(p.trans_id) }),
  async verify(g, i) {
    const { data } = await fetchJson('https://nextpay.org/nx/gateway/verify', {
      method: 'POST',
      form: { api_key: need(g), trans_id: i.authority, amount: i.amountToman, currency: 'IRT' },
    });
    if (Number(data?.code) === 0) return { ok: true, refId: data.Shaparak_Ref_Id ? String(data.Shaparak_Ref_Id) : undefined, cardPan: data.card_holder };
    return { ok: false, message: `نکست‌پی: تأیید نشد (کد ${data?.code ?? '?'})` };
  },
};

// ---------- Pay.ir ----------
const payirApi = (g: GatewayConfig) => (g.sandbox ? 'test' : need(g));
const payir: Gateway = {
  async request(g, i) {
    const { data } = await fetchJson('https://pay.ir/pg/send', {
      method: 'POST',
      json: { api: payirApi(g), amount: rial(i.amountToman), redirect: i.callbackUrl, mobile: i.mobile, factorNumber: i.paymentId, description: i.description },
    });
    if (Number(data?.status) !== 1 || !data.token) throw new GatewayError(`پی‌دات‌آی‌آر: ${data?.errorMessage ?? 'پاسخ نامعتبر'} (${data?.errorCode ?? '?'})`);
    return { authority: String(data.token), redirectUrl: `https://pay.ir/pg/${data.token}` };
  },
  callback: (p) => ({ authority: p.token, ok: String(p.status) === '1' }),
  async verify(g, i) {
    const { data } = await fetchJson('https://pay.ir/pg/verify', { method: 'POST', json: { api: payirApi(g), token: i.authority } });
    if (Number(data?.status) === 1)
      return { ok: true, refId: data.transId ? String(data.transId) : undefined, cardPan: data.cardNumber, amountRial: Number(data.amount) || undefined };
    return { ok: false, message: `پی‌دات‌آی‌آر: ${data?.errorMessage ?? 'تأیید نشد'} (${data?.errorCode ?? '?'})` };
  },
};

export const GATEWAYS: Record<GatewayId, Gateway> = { zarinpal, zibal, idpay, nextpay, payir };
export const toRial = rial;
