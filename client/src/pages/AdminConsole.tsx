import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Ban,
    Check,
    CreditCard,
    ExternalLink,
    LayoutGrid,
    RefreshCw,
    Search,
    ShieldCheck,
    ShieldOff,
    Sparkles,
    Users,
} from 'lucide-react';
import { api } from '../api';
import type { PlanId } from '../data/pricingPlans';

const PLAN_META: Record<PlanId, { label: string; badge: string }> = {
    free: { label: 'Free', badge: 'bg-gray-100 text-gray-600' },
    starter: { label: 'Starter', badge: 'bg-blue-100 text-blue-700' },
    growth: { label: 'Growth', badge: 'bg-violet-100 text-violet-700' },
    pro: { label: 'Pro', badge: 'bg-amber-100 text-amber-700' },
    enterprise: { label: 'Enterprise', badge: 'bg-emerald-100 text-emerald-700' },
};
const PLAN_ORDER: PlanId[] = ['free', 'starter', 'growth', 'pro', 'enterprise'];

interface Customer {
    id: string;
    email: string | null;
    name: string | null;
    imageUrl: string | null;
    createdAt: number | null;
    lastSignInAt: number | null;
    banned: boolean;
    planId: PlanId;
    aiFollowUpAddon: boolean;
    hasSubscription: boolean;
    stripeCustomerId: string | null;
    leadsThisPeriod: number;
    campaignCount: number;
}

interface Stats {
    totalCustomers: number;
    byPlan: Record<string, number>;
    paidCustomers: number;
    totalCampaigns: number;
}

interface CustomerDetail {
    customer: {
        id: string;
        email: string | null;
        name: string | null;
        imageUrl: string | null;
        createdAt: number | null;
        lastSignInAt: number | null;
        banned: boolean;
    };
    organization: {
        plan_id: PlanId;
        ai_followup_addon: boolean;
        leads_this_period: number;
        stripe_customer_id: string | null;
    } | null;
    campaigns: { id: string; name: string; is_published: boolean; created_at: string }[];
    stripe: {
        customerId: string | null;
        subscriptionId: string | null;
        subscription: {
            id: string;
            status: string;
            currentPeriodEnd: number | null;
            cancelAtPeriodEnd: boolean;
            amount: number | null;
            currency: string | null;
            interval: string | null;
        } | null;
    };
    recentActions: {
        id: string;
        admin_user_id: string;
        action: string;
        details: Record<string, any>;
        created_at: string;
    }[];
}

function PlanBadge({ plan }: { plan: PlanId }) {
    const meta = PLAN_META[plan] || PLAN_META.free;
    return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>;
}

function fromMs(ms: number | null): string {
    if (!ms) return '—';
    return new Date(ms).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}
function fromIso(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
}
function fromUnix(s: number | null): string {
    if (!s) return '—';
    return new Date(s * 1000).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminConsole() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<CustomerDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const LIMIT = 25;

    const loadCustomers = useCallback(async (searchTerm: string, off: number) => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getAdminCustomers(searchTerm, LIMIT, off);
            setCustomers(data.customers || []);
            setTotal(data.total || 0);
            setForbidden(false);
        } catch (err: any) {
            if (err?.message === 'Forbidden') setForbidden(true);
            else setError('Could not load customers.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        api.getAdminStats().then(setStats).catch(() => undefined);
    }, []);

    // Debounced search.
    useEffect(() => {
        const t = setTimeout(() => {
            setOffset(0);
            loadCustomers(search, 0);
        }, 300);
        return () => clearTimeout(t);
    }, [search, loadCustomers]);

    const openCustomer = async (id: string) => {
        setSelectedId(id);
        setDetailLoading(true);
        setDetail(null);
        try {
            const data = await api.getAdminCustomer(id);
            setDetail(data);
        } catch {
            setError('Could not load that customer.');
        } finally {
            setDetailLoading(false);
        }
    };

    const refreshAll = () => {
        api.getAdminStats().then(setStats).catch(() => undefined);
        loadCustomers(search, offset);
        if (selectedId) openCustomer(selectedId);
    };

    if (forbidden) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md text-center">
                    <ShieldOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Not authorized</h1>
                    <p className="text-gray-500 mb-6">This console is only available to platform operators.</p>
                    <Link to="/admin" className="text-primary font-semibold hover:underline">
                        Back to dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center gap-4 shrink-0 sticky top-0 z-20">
                <Link to="/admin" className="flex items-center gap-2 text-gray-500 hover:text-primary transition text-sm font-medium">
                    <ArrowLeft size={16} />
                    <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-primary" />
                    <h1 className="font-bold text-gray-900">Customer Admin</h1>
                </div>
                <button
                    type="button"
                    onClick={refreshAll}
                    className="ml-auto flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    <span className="hidden sm:inline">Refresh</span>
                </button>
            </header>

            {error && <div className="bg-red-50 border-b border-red-100 text-red-600 text-sm px-6 py-2">{error}</div>}

            {/* Stats */}
            <div className="px-4 md:px-6 py-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={<Users size={18} />} label="Total customers" value={stats?.totalCustomers ?? '—'} />
                <StatCard icon={<CreditCard size={18} />} label="Paid customers" value={stats?.paidCustomers ?? '—'} accent />
                <StatCard icon={<LayoutGrid size={18} />} label="Total campaigns" value={stats?.totalCampaigns ?? '—'} />
                <StatCard
                    icon={<Sparkles size={18} />}
                    label="Plan mix"
                    value={
                        stats
                            ? PLAN_ORDER.filter((p) => stats.byPlan[p]).map((p) => `${PLAN_META[p].label} ${stats.byPlan[p]}`).join(' · ') || 'All free'
                            : '—'
                    }
                    small
                />
            </div>

            <div className="flex flex-1 min-h-0 px-4 md:px-6 pb-6 gap-4">
                {/* List */}
                <section className={`flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full lg:w-[420px] lg:shrink-0 ${selectedId ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or email…"
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading && customers.length === 0 ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                        ) : customers.length === 0 ? (
                            <div className="text-center py-16 px-6 text-gray-400 text-sm">No customers found.</div>
                        ) : (
                            customers.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => openCustomer(c.id)}
                                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition flex items-center gap-3 ${selectedId === c.id ? 'bg-primary/5' : ''}`}
                                >
                                    <Avatar url={c.imageUrl} name={c.name} email={c.email} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate text-sm font-semibold text-gray-900">
                                                {c.name || c.email || c.id}
                                            </span>
                                            {c.banned && <Ban size={13} className="text-red-500 shrink-0" />}
                                        </div>
                                        <div className="truncate text-xs text-gray-500">{c.email || '—'}</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <PlanBadge plan={c.planId} />
                                        <span className="text-[11px] text-gray-400">{c.campaignCount} campaigns</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                    {/* Pagination */}
                    {total > LIMIT && (
                        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 text-sm">
                            <button
                                type="button"
                                disabled={offset === 0}
                                onClick={() => { const o = Math.max(0, offset - LIMIT); setOffset(o); loadCustomers(search, o); }}
                                className="text-gray-500 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                            >
                                ← Prev
                            </button>
                            <span className="text-gray-400 text-xs">
                                {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
                            </span>
                            <button
                                type="button"
                                disabled={offset + LIMIT >= total}
                                onClick={() => { const o = offset + LIMIT; setOffset(o); loadCustomers(search, o); }}
                                className="text-gray-500 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </section>

                {/* Detail */}
                <section className={`flex-1 min-w-0 ${selectedId ? 'block' : 'hidden lg:block'}`}>
                    {!selectedId ? (
                        <div className="h-full flex items-center justify-center text-gray-300 bg-white rounded-2xl border border-gray-100">
                            <div className="text-center">
                                <Users className="w-12 h-12 mx-auto mb-3" />
                                <p className="text-sm">Select a customer to manage their account</p>
                            </div>
                        </div>
                    ) : detailLoading || !detail ? (
                        <div className="h-full flex items-center justify-center bg-white rounded-2xl border border-gray-100">
                            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <CustomerDetailPanel
                            detail={detail}
                            onBack={() => { setSelectedId(null); setDetail(null); }}
                            onChanged={() => { refreshAll(); }}
                        />
                    )}
                </section>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, accent, small }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent?: boolean; small?: boolean }) {
    return (
        <div className={`rounded-2xl border p-4 ${accent ? 'bg-primary/5 border-primary/10' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
                {icon}
                <span className="text-xs font-medium">{label}</span>
            </div>
            <div className={`font-bold text-gray-900 ${small ? 'text-sm leading-snug' : 'text-2xl'}`}>{value}</div>
        </div>
    );
}

function Avatar({ url, name, email }: { url: string | null; name: string | null; email: string | null }) {
    if (url) return <img src={url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />;
    const initial = (name || email || '?').trim().charAt(0).toUpperCase();
    return (
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            {initial}
        </div>
    );
}

function CustomerDetailPanel({
    detail,
    onBack,
    onChanged,
}: {
    detail: CustomerDetail;
    onBack: () => void;
    onChanged: () => void;
}) {
    const currentPlan = (detail.organization?.plan_id || 'free') as PlanId;
    const currentAddon = detail.organization?.ai_followup_addon || false;

    const [plan, setPlan] = useState<PlanId>(currentPlan);
    const [addon, setAddon] = useState<boolean>(currentAddon);
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

    useEffect(() => {
        setPlan(currentPlan);
        setAddon(currentAddon);
        setNote('');
        setStatus('idle');
    }, [detail.customer.id, currentPlan, currentAddon]);

    const dirty = plan !== currentPlan || addon !== currentAddon;

    const applyPlan = async () => {
        setSaving(true);
        setStatus('idle');
        try {
            await api.updateAdminCustomerPlan(detail.customer.id, {
                planId: plan,
                aiFollowUpAddon: addon,
                note,
            });
            setStatus('saved');
            onChanged();
        } catch {
            setStatus('error');
        } finally {
            setSaving(false);
        }
    };

    const stripeLink = detail.stripe.customerId
        ? `https://dashboard.stripe.com/customers/${detail.stripe.customerId}`
        : null;

    const sub = detail.stripe.subscription;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full overflow-y-auto">
            {/* Profile header */}
            <div className="p-5 border-b border-gray-100 flex items-start gap-4">
                <button type="button" onClick={onBack} className="lg:hidden text-gray-400 hover:text-primary mt-1">
                    <ArrowLeft size={18} />
                </button>
                <Avatar url={detail.customer.imageUrl} name={detail.customer.name} email={detail.customer.email} />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h2 className="font-bold text-gray-900 truncate">{detail.customer.name || detail.customer.email || 'Unknown user'}</h2>
                        <PlanBadge plan={currentPlan} />
                        {detail.customer.banned && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Banned</span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{detail.customer.email || '—'}</p>
                    <p className="text-xs text-gray-400 mt-1 font-mono truncate">{detail.customer.id}</p>
                </div>
            </div>

            <div className="p-5 grid grid-cols-2 gap-4 border-b border-gray-100 text-sm">
                <Field label="Joined" value={fromMs(detail.customer.createdAt)} />
                <Field label="Last active" value={fromMs(detail.customer.lastSignInAt)} />
                <Field label="Campaigns" value={String(detail.campaigns.length)} />
                <Field label="Leads this period" value={String(detail.organization?.leads_this_period ?? 0)} />
            </div>

            {/* Plan management */}
            <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" /> Plan management
                </h3>
                <label className="block text-xs font-medium text-gray-500 mb-1">Plan tier</label>
                <div className="flex flex-wrap gap-2 mb-4">
                    {PLAN_ORDER.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPlan(p)}
                            className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${
                                plan === p
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-gray-200 text-gray-600 hover:border-primary'
                            }`}
                        >
                            {PLAN_META[p].label}
                        </button>
                    ))}
                </div>

                <label className="flex items-center gap-3 mb-4 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={addon}
                        onChange={(e) => setAddon(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                    />
                    <span className="text-sm text-gray-700">AI Follow-up add-on</span>
                </label>

                <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Reason / note (optional, logged)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-sm mb-3"
                />

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={applyPlan}
                        disabled={!dirty || saving}
                        className="h-10 px-5 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 hover:bg-primary-light transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check size={15} />
                        {saving ? 'Applying…' : 'Apply changes'}
                    </button>
                    {status === 'saved' && <span className="text-sm text-green-600 font-medium">Saved.</span>}
                    {status === 'error' && <span className="text-sm text-red-500 font-medium">Failed — try again.</span>}
                    {dirty && status === 'idle' && (
                        <span className="text-xs text-amber-600">Grants {PLAN_META[plan].label} immediately (no charge).</span>
                    )}
                </div>
            </div>

            {/* Billing */}
            <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CreditCard size={16} className="text-primary" /> Billing
                </h3>
                {detail.stripe.customerId ? (
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Subscription</span>
                            <span className="font-medium text-gray-900">
                                {sub ? (
                                    <span className="capitalize">
                                        {sub.status}
                                        {sub.amount != null && sub.currency
                                            ? ` · ${(sub.amount / 100).toLocaleString(undefined, { style: 'currency', currency: sub.currency.toUpperCase() })}/${sub.interval || 'mo'}`
                                            : ''}
                                    </span>
                                ) : (
                                    'No active subscription'
                                )}
                            </span>
                        </div>
                        {sub?.currentPeriodEnd && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">{sub.cancelAtPeriodEnd ? 'Cancels' : 'Renews'}</span>
                                <span className="font-medium text-gray-900">{fromUnix(sub.currentPeriodEnd)}</span>
                            </div>
                        )}
                        {stripeLink && (
                            <a
                                href={stripeLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline pt-1"
                            >
                                Open in Stripe <ExternalLink size={13} />
                            </a>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400">No Stripe customer linked (never subscribed).</p>
                )}
            </div>

            {/* Campaigns */}
            <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <LayoutGrid size={16} className="text-primary" /> Campaigns ({detail.campaigns.length})
                </h3>
                {detail.campaigns.length === 0 ? (
                    <p className="text-sm text-gray-400">No campaigns yet.</p>
                ) : (
                    <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                        {detail.campaigns.map((c) => (
                            <li key={c.id} className="flex items-center justify-between text-sm">
                                <span className="truncate text-gray-700">{c.name || 'Untitled'}</span>
                                <span className={`text-xs font-medium shrink-0 ml-2 ${c.is_published ? 'text-green-600' : 'text-gray-400'}`}>
                                    {c.is_published ? 'Published' : 'Draft'}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Audit log */}
            {detail.recentActions.length > 0 && (
                <div className="p-5">
                    <h3 className="font-bold text-gray-900 mb-3">Admin activity</h3>
                    <ul className="space-y-2">
                        {detail.recentActions.map((a) => (
                            <li key={a.id} className="text-xs text-gray-500 border-l-2 border-gray-100 pl-3">
                                <span className="font-semibold text-gray-700">{a.action}</span>
                                {a.action === 'plan_override' && a.details?.to?.plan_id && (
                                    <> → {a.details.from?.plan_id} to {a.details.to.plan_id}</>
                                )}
                                {a.details?.note ? <> · “{a.details.note}”</> : null}
                                <div className="text-gray-400">{fromIso(a.created_at)}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs text-gray-400 mb-0.5">{label}</div>
            <div className="font-medium text-gray-900">{value}</div>
        </div>
    );
}
