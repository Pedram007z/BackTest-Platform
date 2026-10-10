import { Download, Share, Smartphone } from 'lucide-react';
import { installApp, useInstall } from '../../lib/pwa';
import { toast } from '../../store/useStore';

const install = () =>
  void installApp().then((ok) => {
    if (ok) toast('اپلیکیشن نصب شد؛ از صفحه‌ی اصلی گوشی بازش کنید.');
  });

/** Header button, shown while the browser offers to install the app. */
export function InstallButton() {
  const canInstall = useInstall((s) => s.canInstall);
  if (!canInstall) return null;
  return (
    <button type="button" className="icon-btn" onClick={install} aria-label="نصب اپلیکیشن" title="نصب اپلیکیشن روی این دستگاه">
      <Download size={19} />
    </button>
  );
}

/** Settings: install the app on this phone or computer (or how to, on iPhone). */
export function InstallCard() {
  const { canInstall, installed, ios } = useInstall();
  return (
    <section className="card mb-4 p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
        <Smartphone size={16} /> اپلیکیشن
      </h2>
      {installed ? (
        <p className="text-xs leading-6 text-muted">بک‌تست‌لب روی این دستگاه نصب است.</p>
      ) : canInstall ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="min-w-0 flex-1 text-xs leading-6 text-muted">بک‌تست‌لب را مثل یک اپلیکیشن روی گوشی یا کامپیوتر نصب کنید: با یک لمس از صفحه‌ی اصلی باز می‌شود و تمام‌صفحه است.</p>
          <button type="button" className="btn-primary" onClick={install}>
            <Download size={15} /> نصب اپلیکیشن
          </button>
        </div>
      ) : ios ? (
        <p className="text-xs leading-6 text-muted">
          برای نصب روی آیفون یا آیپد: در Safari دکمه‌ی اشتراک‌گذاری <Share size={13} className="inline align-[-2px]" /> را بزنید و «Add to Home Screen» را انتخاب کنید.
        </p>
      ) : (
        <p className="text-xs leading-6 text-muted">برای نصب، صفحه را در Chrome باز کنید و از منوی مرورگر «نصب برنامه» یا «Add to Home screen» را بزنید.</p>
      )}
    </section>
  );
}
