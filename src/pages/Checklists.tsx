import clsx from 'clsx';
import { Copy, Pencil, Plus, SquareCheck, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { KebabMenu, Toggle } from '../components/ui/controls';
import { fmtNum } from '../lib/format';
import type { Checklist, ChecklistItem } from '../lib/types';
import { toast, uid, useStore } from '../store/useStore';

function ChecklistModal({ open, onClose, checklist }: { open: boolean; onClose: () => void; checklist?: Checklist }) {
  const addChecklist = useStore((s) => s.addChecklist);
  const updateChecklist = useStore((s) => s.updateChecklist);
  const [name, setName] = useState('');
  const [draft, setDraft] = useState('');
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [touched, setTouched] = useState(false);
  const itemInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(checklist?.name ?? '');
    setItems(checklist?.items.map((i) => ({ ...i })) ?? []);
    setDraft('');
    setTouched(false);
  }, [open, checklist]);

  const addItem = () => {
    const text = draft.trim();
    if (!text) return;
    setItems((list) => [...list, { id: uid('ci'), text, required: false }]);
    setDraft('');
    itemInput.current?.focus();
  };

  const errors = {
    name: !name.trim() ? 'نام چک‌لیست را بنویسید.' : '',
    items: items.length === 0 ? 'حداقل یک آیتم اضافه کنید.' : '',
  };

  const save = () => {
    setTouched(true);
    if (errors.name || errors.items) return;
    if (checklist) {
      updateChecklist(checklist.id, { name: name.trim(), items });
      toast('چک‌لیست به‌روزرسانی شد');
    } else {
      addChecklist({ name: name.trim(), items });
      toast(`چک‌لیست «${name.trim()}» ساخته شد`);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={checklist ? 'ویرایش چک‌لیست' : 'ساخت چک‌لیست'}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            انصراف
          </button>
          <button type="button" className="btn-primary" onClick={save}>
            {checklist ? 'ذخیره' : 'ساخت'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <label className="label" htmlFor="checklist-name">
            نام
          </label>
          <input id="checklist-name" className="field" value={name} maxLength={50} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: ویک‌ها" />
          {touched && errors.name && <p className="mt-1.5 text-xs text-loss">{errors.name}</p>}
        </div>

        <div>
          <label className="label" htmlFor="checklist-item">
            آیتم‌های چک‌لیست
          </label>
          <div className="flex gap-2">
            <input
              id="checklist-item"
              ref={itemInput}
              className="field"
              value={draft}
              maxLength={90}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem();
                }
              }}
              placeholder="آیتم را بنویسید و Enter بزنید"
            />
            <button type="button" className="btn-soft shrink-0 px-4" onClick={addItem} disabled={!draft.trim()}>
              افزودن <Plus size={15} />
            </button>
          </div>
          {touched && errors.items && <p className="mt-1.5 text-xs text-loss">{errors.items}</p>}

          {items.length > 0 && (
            <ul className="mt-4 flex flex-col gap-1">
              {items.map((it) => (
                <li key={it.id} className="anim-fade flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-raised/60">
                  <SquareCheck size={17} className="shrink-0 text-muted" />
                  <input
                    aria-label="متن آیتم"
                    className="min-w-0 flex-1 bg-transparent text-[13px] outline-none focus:text-ink"
                    value={it.text}
                    onChange={(e) => setItems((list) => list.map((x) => (x.id === it.id ? { ...x, text: e.target.value } : x)))}
                  />
                  <span className={clsx('shrink-0 text-xs', it.required ? 'text-gain' : 'text-faint')}>الزامی؟</span>
                  <Toggle
                    checked={it.required}
                    label={`الزامی بودن ${it.text}`}
                    onChange={(v) => setItems((list) => list.map((x) => (x.id === it.id ? { ...x, required: v } : x)))}
                  />
                  <button
                    type="button"
                    className="icon-btn h-8 w-8 shrink-0 hover:text-loss"
                    aria-label={`حذف ${it.text}`}
                    onClick={() => setItems((list) => list.filter((x) => x.id !== it.id))}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {items.length > 0 && (
            <p className="num mt-3 text-xs text-faint">
              {fmtNum(items.length)} آیتم، {fmtNum(items.filter((i) => i.required).length)} الزامی. آیتم‌های الزامی باید قبل از ثبت معامله تیک بخورند.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ClipboardArt() {
  return (
    <svg width="132" height="104" viewBox="0 0 132 104" aria-hidden="true" className="text-line">
      <rect x="26" y="10" width="80" height="90" rx="10" fill="rgb(var(--surface))" stroke="currentColor" strokeWidth="2" />
      <rect x="48" y="4" width="36" height="14" rx="5" fill="rgb(var(--raised))" stroke="currentColor" strokeWidth="2" />
      {[34, 54, 74].map((y, i) => (
        <g key={y}>
          <rect x="40" y={y} width="12" height="12" rx="3" fill={i === 0 ? 'rgb(var(--gain))' : 'rgb(var(--raised))'} />
          {i === 0 && <path d={`M43 ${y + 6}l2.5 2.5 4-5`} stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
          <rect x="58" y={y + 3} width={i === 1 ? 26 : 34} height="6" rx="3" fill="rgb(var(--raised))" />
        </g>
      ))}
    </svg>
  );
}

export default function Checklists() {
  const checklists = useStore((s) => s.checklists);
  const sessions = useStore((s) => s.sessions);
  const deleteChecklist = useStore((s) => s.deleteChecklist);
  const addChecklist = useStore((s) => s.addChecklist);
  const [modal, setModal] = useState<{ open: boolean; checklist?: Checklist }>({ open: false });
  const [toDelete, setToDelete] = useState<Checklist | null>(null);

  const createButton = (
    <button type="button" className="btn-primary rounded-full px-5 py-2.5 text-sm" onClick={() => setModal({ open: true })}>
      <Plus size={17} /> ساخت چک‌لیست جدید
    </button>
  );

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold">چک‌لیست‌ها</h1>

      {checklists.length === 0 ? (
        <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
          <ClipboardArt />
          <h2 className="mt-5 text-lg font-bold">هنوز چک‌لیستی نساخته‌اید</h2>
          <p className="mb-6 mt-1.5 max-w-sm text-sm leading-7 text-muted">
            شرایط ورود را به شکل چک‌لیست بنویسید. هنگام ثبت معامله در چارت، آیتم‌های الزامی باید تأیید شوند.
          </p>
          {createButton}
        </div>
      ) : (
        <>
          <div className="mb-8 flex justify-center">{createButton}</div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {checklists.map((c) => {
              const used = sessions.filter((s) => s.checklistId === c.id).length;
              const required = c.items.filter((i) => i.required).length;
              return (
                <article key={c.id} className="card flex flex-col p-5">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[15px] font-bold">{c.name}</h3>
                      <p className="num text-[11px] text-faint">
                        {fmtNum(c.items.length)} آیتم • {fmtNum(required)} الزامی • {used ? `در ${fmtNum(used)} جلسه` : 'بدون جلسه'}
                      </p>
                    </div>
                    <KebabMenu
                      items={[
                        { label: 'ویرایش', icon: <Pencil size={15} />, onClick: () => setModal({ open: true, checklist: c }) },
                        {
                          label: 'تکثیر',
                          icon: <Copy size={15} />,
                          onClick: () => {
                            addChecklist({ name: `${c.name} (کپی)`, items: c.items.map((i) => ({ ...i, id: uid('ci') })) });
                            toast('چک‌لیست تکثیر شد');
                          },
                        },
                        { label: 'حذف', icon: <Trash2 size={15} />, onClick: () => setToDelete(c), danger: true },
                      ]}
                    />
                  </div>
                  <ul className="flex flex-col gap-2 border-t border-line/60 pt-3">
                    {c.items.map((it) => (
                      <li key={it.id} className="flex items-center gap-2.5 text-[13px]">
                        <SquareCheck size={16} className="shrink-0 text-muted" />
                        <span className="min-w-0 flex-1">{it.text}</span>
                        {it.required && <span className="shrink-0 rounded-md bg-gain/15 px-1.5 py-0.5 text-[10px] font-bold text-gain">الزامی</span>}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </>
      )}

      <ChecklistModal open={modal.open} checklist={modal.checklist} onClose={() => setModal({ open: false })} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="حذف چک‌لیست"
        message={`چک‌لیست «${toDelete?.name ?? ''}» حذف می‌شود و از جلساتی که از آن استفاده می‌کنند جدا می‌شود.`}
        confirmLabel="حذف چک‌لیست"
        onConfirm={() => {
          if (toDelete) deleteChecklist(toDelete.id);
          toast('چک‌لیست حذف شد', 'info');
        }}
      />
    </div>
  );
}
