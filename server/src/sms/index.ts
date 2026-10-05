import { db, save } from '../db';
import type { SmsLog } from '../shared';
import { UpstreamError, uid } from '../util';
import { PROVIDERS, SmsError } from './providers';

/**
 * Sends through the provider chosen in the admin panel and records every message in the SMS log.
 * While "real sending" is off (development) messages are only logged and printed to the console.
 */

function record(entry: Omit<SmsLog, 'id' | 'createdAt'>): SmsLog {
  const log: SmsLog = { id: uid('sms'), createdAt: Date.now(), ...entry };
  const d = db();
  d.smsLogs.unshift(log);
  if (d.smsLogs.length > 5000) d.smsLogs.length = 5000;
  save();
  return log;
}

const reason = (e: unknown) => (e instanceof SmsError || e instanceof UpstreamError ? e.message : `خطای ناشناخته: ${(e as Error)?.message ?? e}`);

function activeProvider() {
  const s = db().sms;
  const config = s.providers.find((p) => p.id === s.active);
  if (!config) throw new SmsError('سامانه‌ی پیامک انتخاب نشده است.');
  return { config, impl: PROVIDERS[s.active] };
}

/** Sign-in code. Resolves with the log entry; the entry's status says whether it went out. */
export async function sendOtpSms(to: string, code: string, text: string): Promise<SmsLog> {
  if (!db().sms.enabled) {
    console.log(`[sms:dev] ${to} ← ${code}`);
    return record({ to, text, provider: 'dev', kind: 'otp', status: 'sent' });
  }
  const { config, impl } = activeProvider();
  try {
    await impl.sendOtp(config, to, code, text);
    return record({ to, text, provider: config.id, kind: 'otp', status: 'sent' });
  } catch (e) {
    console.warn(`[sms] otp to ${to} failed:`, reason(e));
    return record({ to, text, provider: config.id, kind: 'otp', status: 'failed', error: reason(e) });
  }
}

/** One message to many numbers, in the provider's batch size. */
export async function sendTextSms(to: string[], text: string, kind: SmsLog['kind']): Promise<{ sent: number; failed: number; logs: SmsLog[] }> {
  const logs: SmsLog[] = [];
  if (!db().sms.enabled) {
    for (const n of to) logs.push(record({ to: n, text, provider: 'dev', kind, status: 'sent' }));
    console.log(`[sms:dev] ${kind} to ${to.length} number(s): ${text.slice(0, 80)}`);
    return { sent: to.length, failed: 0, logs };
  }
  const { config, impl } = activeProvider();
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < to.length; i += impl.batch) {
    const chunk = to.slice(i, i + impl.batch);
    try {
      await impl.sendText(config, chunk, text);
      sent += chunk.length;
      for (const n of chunk) logs.push(record({ to: n, text, provider: config.id, kind, status: 'sent' }));
    } catch (e) {
      failed += chunk.length;
      for (const n of chunk) logs.push(record({ to: n, text, provider: config.id, kind, status: 'failed', error: reason(e) }));
    }
  }
  return { sent, failed, logs };
}
