import Button from '@mui/material/Button';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import { Link } from 'react-router-dom';
import logo from '../../assets/invoiceflow-logo.svg';

const featureCards = [
    {
        title: 'Business Profiles',
        body: 'Create and manage billing identities with contact details, address data, currency defaults, and active status controls.',
    },
    {
        title: 'Client Management',
        body: 'Keep customer records organized with company details, billing contacts, activity status, and quick edit workflows.',
    },
    {
        title: 'Invoice Workflow',
        body: 'Draft, submit, track active vs non-active invoices, record payments, and review invoice detail history in one workspace.',
    },
    {
        title: 'Operational Dashboard',
        body: 'See outstanding balances, due-soon invoices, paid revenue, recent activity, and workflow breakdowns at a glance.',
    },
] as const;

const usageSteps = [
    {
        step: '1',
        title: 'Create your billing setup',
        body: 'Start with a business profile so the workspace has a default sender, currency, and payment details.',
    },
    {
        step: '2',
        title: 'Add clients and issue invoices',
        body: 'Create client records, prepare invoices, and move them through draft, active, paid, or archived states.',
    },
    {
        step: '3',
        title: 'Track cash flow and follow-up',
        body: 'Use the dashboard and invoice boards to spot overdue work, record payments, and keep billing momentum visible.',
    },
] as const;

const benefits = [
    'Reduces spreadsheet switching by keeping business, client, and invoice work in one place.',
    'Makes invoice status easy to understand with active and non-active workflow views.',
    'Surfaces overdue balances and recent invoice activity so follow-up is faster.',
    'Gives each user a personalized account area with locale, timezone, theme, and profile controls.',
] as const;

export function LandingPage() {
    return (
        <div className="landing-page">
            <header className="landing-header">
                <Link to="/" className="landing-brand">
                    <img src={logo} alt="InvoiceFlow logo" className="landing-brand-logo" />
                    <div className="landing-brand-copy">
                        <strong>InvoiceFlow</strong>
                        <span>Billing workspace</span>
                    </div>
                </Link>

                <div className="landing-header-actions">
                    <Button component={Link} to="/signin" variant="text" startIcon={<LoginRoundedIcon />}>
                        Sign In
                    </Button>
                    <Button component={Link} to="/signup" variant="contained" startIcon={<PersonAddAlt1RoundedIcon />}>
                        Sign Up
                    </Button>
                </div>
            </header>

            <main className="landing-main">
                <section className="landing-hero">
                    <div className="landing-hero-copy">
                        <span className="landing-kicker">Invoice operations for small teams</span>
                        <h1>Stay on top of clients, invoices, and collections without leaving one workspace.</h1>
                        <p>
                            InvoiceFlow is built for teams that need a focused billing hub. The current application already supports
                            business profiles, client management, invoice tracking, payment recording, and dashboard visibility for the work that needs attention.
                        </p>

                        <div className="landing-proof">
                            <div>
                                <strong>One workspace</strong>
                                <span>Business setup, clients, invoices, and payments together.</span>
                            </div>
                            <div>
                                <strong>Action visibility</strong>
                                <span>Overdue balances, due-soon invoices, and recent activity always visible.</span>
                            </div>
                        </div>
                    </div>

                    <div className="landing-hero-panel">
                        <div className="landing-preview-card landing-preview-card-primary">
                            <span className="landing-preview-label">Current functionality</span>
                            <h2>What you can do today</h2>
                            <ul className="landing-preview-list">
                                <li>Create and edit business profiles</li>
                                <li>Manage active and inactive clients</li>
                                <li>Draft, submit, cancel, void, and review invoices</li>
                                <li>Record payments and inspect payment history</li>
                                <li>Monitor billing activity from the dashboard</li>
                            </ul>
                        </div>
                        <div className="landing-preview-card landing-preview-card-secondary">
                            <span className="landing-preview-label">Best fit</span>
                            <p>Teams that want a clear operational billing workflow before adding heavier accounting complexity.</p>
                        </div>
                    </div>
                </section>

                <section className="landing-section">
                    <div className="landing-section-heading">
                        <span className="landing-kicker">How to use InvoiceFlow</span>
                        <h2>Move from setup to collections in a simple flow.</h2>
                    </div>
                    <div className="landing-steps">
                        {usageSteps.map((item) => (
                            <article key={item.step} className="landing-step-card">
                                <span className="landing-step-number">{item.step}</span>
                                <h3>{item.title}</h3>
                                <p>{item.body}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="landing-section">
                    <div className="landing-section-heading">
                        <span className="landing-kicker">Why teams use it</span>
                        <h2>Benefits grounded in the features already available.</h2>
                    </div>
                    <div className="landing-benefits">
                        {benefits.map((benefit) => (
                            <div key={benefit} className="landing-benefit-item">
                                {benefit}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="landing-section">
                    <div className="landing-section-heading">
                        <span className="landing-kicker">Inside the workspace</span>
                        <h2>Core areas available in the current build.</h2>
                    </div>
                    <div className="landing-feature-grid">
                        {featureCards.map((card) => (
                            <article key={card.title} className="landing-feature-card">
                                <h3>{card.title}</h3>
                                <p>{card.body}</p>
                            </article>
                        ))}
                    </div>
                </section>

            </main>
        </div>
    );
}
