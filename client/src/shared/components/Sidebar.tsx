import { useEffect, useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/context/AuthContext';
import { useAccountSettings } from '../../app/context/AccountSettingsContext';
import logo from '../../assets/invoiceflow-logo.svg';
import { currentUser, getUserInitials } from '../../features/account/currentUser';

const links = [
    { to: '/dashboard', label: 'Dashboard', key: 'dashboard' },
    { to: '/businesses', label: 'Business Profile', key: 'businesses' },
    { to: '/clients', label: 'Clients', key: 'clients' },
];

const invoiceSubmenuLinks = [
    { to: '/invoices?group=non-active', label: 'Non-Active' },
    { to: '/invoices?group=active', label: 'Active' },
];

const accountLinks = [
    { to: '/account', label: 'My Account', icon: ManageAccountsOutlinedIcon },
];

function getActiveMenuKey(pathname: string) {
    if (pathname.startsWith('/dashboard')) {
        return 'dashboard';
    }
    if (pathname.startsWith('/businesses')) {
        return 'businesses';
    }
    if (pathname.startsWith('/clients')) {
        return 'clients';
    }
    if (pathname.startsWith('/invoices')) {
        return 'invoices';
    }
    if (pathname.startsWith('/account')) {
        return 'account';
    }
    return 'dashboard';
}

export function Sidebar() {
    const { user } = useAuth();
    const { settings } = useAccountSettings();
    const location = useLocation();
    const isInvoiceRoute = location.pathname.startsWith('/invoices');
    const [isInvoiceMenuOpen, setIsInvoiceMenuOpen] = useState(isInvoiceRoute);
    const [activeMenuKey, setActiveMenuKey] = useState(() => getActiveMenuKey(location.pathname));
    const userInitials = getUserInitials(settings.name);
    const accountEmail = user?.email ?? currentUser.email;

    useEffect(() => {
        const nextActiveMenuKey = getActiveMenuKey(location.pathname);

        setActiveMenuKey(nextActiveMenuKey);

        if (nextActiveMenuKey === 'invoices') {
            setIsInvoiceMenuOpen(true);
        }
    }, [location.pathname]);

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <img src={logo} alt="InvoiceFlow logo" className="sidebar-brand-logo" />
                <div className="sidebar-brand-copy">
                    <span className="sidebar-brand-name">InvoiceFlow</span>
                    <span className="sidebar-brand-tagline">Billing workspace</span>
                </div>
            </div>
            <nav className="sidebar-nav">
                <div className="sidebar-nav-main">
                    {links.map((l) => (
                        <Link
                            key={l.to}
                            to={l.to}
                            className={`sidebar-link${activeMenuKey === l.key ? ' active' : ''}`}
                            onClick={() => setActiveMenuKey(l.key)}
                        >
                            {l.label}
                        </Link>
                    ))}
                    <div className="sidebar-group">
                        <button
                            type="button"
                            className={`sidebar-link sidebar-toggle${activeMenuKey === 'invoices' ? ' active' : ''}`}
                            aria-expanded={isInvoiceMenuOpen}
                            onClick={() => {
                                setActiveMenuKey('invoices');
                                setIsInvoiceMenuOpen((current) => !current);
                            }}
                        >
                            <span className="sidebar-toggle-main">
                                <span>Invoices</span>
                            </span>
                            <span className={`sidebar-toggle-chevron${isInvoiceMenuOpen ? ' open' : ''}`} aria-hidden="true">
                                <ExpandMoreIcon fontSize="inherit" />
                            </span>
                        </button>
                        <div className={`sidebar-submenu${isInvoiceMenuOpen ? ' open' : ''}`}>
                            {invoiceSubmenuLinks.map((link) => {
                                const isSubmenuActive = `${location.pathname}${location.search}` === link.to;

                                return (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className={`sidebar-sublink${isSubmenuActive ? ' active' : ''}`}
                                        onClick={() => setActiveMenuKey('invoices')}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="sidebar-account">
                    <span className="sidebar-section-label">Account</span>

                    <div className="sidebar-account-card">
                        <div className="sidebar-account-avatar" aria-hidden="true">{userInitials}</div>
                        <div className="sidebar-account-meta">
                            <strong className="sidebar-account-name">{settings.name}</strong>
                            <span className="sidebar-account-role">{currentUser.role}</span>
                            <span className="sidebar-account-email">{accountEmail}</span>
                        </div>
                    </div>

                    <div className="sidebar-account-links">
                        {accountLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = location.pathname === link.to;

                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`sidebar-account-link${isActive ? ' active' : ''}`}
                                >
                                    <span className="sidebar-account-link-icon" aria-hidden="true">
                                        <Icon fontSize="inherit" />
                                    </span>
                                    <span>{link.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>
        </aside>
    );
}
