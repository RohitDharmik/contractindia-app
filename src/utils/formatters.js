export const formatINR = (n) => '\u20B9' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
export const formatRelativeTime = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)
        return 'just now';
    if (m < 60)
        return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)
        return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7)
        return `${d}d ago`;
    return new Date(iso).toLocaleDateString('en-IN');
};
export const truncate = (s, n = 80) => s.length > n ? s.slice(0, n - 1) + '\u2026' : s;
