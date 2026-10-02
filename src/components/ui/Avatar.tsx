import type { UserProfile } from '../../lib/types';

export function Avatar({ user, size = 40 }: { user: UserProfile; size?: number }) {
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('‌');

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover ring-2 ring-line"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-line"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--violet)))',
      }}
    >
      {initials}
    </span>
  );
}
