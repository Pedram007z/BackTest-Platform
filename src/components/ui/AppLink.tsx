import { forwardRef } from 'react';
import { Link as RouterLink, NavLink as RouterNavLink, useLocation, useNavigate, useResolvedPath, type LinkProps, type NavLinkProps } from 'react-router-dom';

/**
 * In-app links. In the regular build they are React Router's own with `reloadDocument`: a click loads the
 * new page from the server (a full page load, see lib/nav). The hosted single-file preview
 * runs inside claude.ai, which takes over clicks on anything with an href and opens it as a separate
 * web page (an empty one). There the links render without an href and navigate on click or Enter.
 */
const PREVIEW = import.meta.env.MODE === 'artifact';

const PreviewLink = forwardRef<HTMLAnchorElement, LinkProps>(function PreviewLink(
  { to, replace, state, relative, preventScrollReset, reloadDocument: _reload, viewTransition: _transition, onClick, onKeyDown, style, ...rest },
  ref,
) {
  const navigate = useNavigate();
  const go = () => navigate(to, { replace, state, relative, preventScrollReset });
  return (
    <a
      ref={ref}
      role="link"
      tabIndex={0}
      {...rest}
      style={{ cursor: 'pointer', ...style }}
      onClick={(e) => {
        const before = e.defaultPrevented;
        onClick?.(e);
        // the caller cancelled the navigation
        if (!before && e.defaultPrevented) return;
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        go();
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (!e.defaultPrevented && e.key === 'Enter') {
          e.preventDefault();
          go();
        }
      }}
    />
  );
});

const PreviewNavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function PreviewNavLink({ to, end, caseSensitive, className, style, children, ...rest }, ref) {
  const location = useLocation();
  const resolved = useResolvedPath(to, { relative: rest.relative });
  // same rule as React Router's NavLink
  let current = location.pathname;
  let target = resolved.pathname;
  if (!caseSensitive) {
    current = current.toLowerCase();
    target = target.toLowerCase();
  }
  const slashAt = target !== '/' && target.endsWith('/') ? target.length - 1 : target.length;
  const isActive = current === target || (!end && current.startsWith(target) && current.charAt(slashAt) === '/');
  const renderProps = { isActive, isPending: false, isTransitioning: false };
  return (
    <PreviewLink
      ref={ref}
      to={to}
      {...rest}
      aria-current={isActive ? 'page' : undefined}
      className={typeof className === 'function' ? className(renderProps) : className}
      style={typeof style === 'function' ? style(renderProps) : style}
    >
      {typeof children === 'function' ? children(renderProps) : children}
    </PreviewLink>
  );
});

const ReloadLink = forwardRef<HTMLAnchorElement, LinkProps>(function ReloadLink(props, ref) {
  return <RouterLink ref={ref} reloadDocument {...props} />;
});
const ReloadNavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function ReloadNavLink(props, ref) {
  return <RouterNavLink ref={ref} reloadDocument {...props} />;
});

export const Link = (PREVIEW ? PreviewLink : ReloadLink) as typeof RouterLink;
export const NavLink = (PREVIEW ? PreviewNavLink : ReloadNavLink) as typeof RouterNavLink;
