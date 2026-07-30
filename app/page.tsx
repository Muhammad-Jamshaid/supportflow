import Link from "next/link";
import DarkModeToggle from "./components/DarkModeToggle";

export default function LandingPage() {
  return (
    <>
      {/* ── Nav ── */}
      <nav className="nav">
        <div className="logo">
          <span className="mark" />
          SupportFlow
        </div>
        <div className="navlinks">
          <a href="#product">Product</a>
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">Docs</a>
        </div>
        <div className="navactions">
          <DarkModeToggle />
          <Link href="/login">Sign in</Link>
          <Link href="/signup" className="btn btn-primary btn-sm">
            Start free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero" id="product">
        <div>
          <div className="eyebrow">AI-powered support desk</div>
          <h1>
            Every ticket, triaged
            <br />
            before your agent
            <br />
            opens it.
          </h1>
          <p>
            Customers submit a ticket. SupportFlow reads it, summarizes it, sets
            the priority, and drafts a reply — so your team resolves issues
            instead of sorting them.
          </p>
          <div className="hero-actions">
            <Link href="/signup" className="btn btn-primary">
              Start free
            </Link>
            <a href="#how-it-works" className="btn btn-ghost">
              Watch it triage a ticket
            </a>
          </div>
          <div className="hero-meta">
            <div>
              <b>41%</b>faster first response
            </div>
            <div>
              <b>3</b>plans, one workspace each
            </div>
            <div>
              <b>100%</b>tenant-isolated data
            </div>
          </div>
        </div>

        {/* Queue visual */}
        <div className="queue-visual">
          <div className="qcard c1">
            <div className="qtop">
              <span className="qid mono">#1042</span>
              <span className="pill low">
                <span className="dot-key" />
                Low
              </span>
            </div>
            <div className="qsubj">Invoice PDF won&apos;t download</div>
            <div className="qai">
              <span className="spark">✦</span> Summarized · Billing
            </div>
          </div>
          <div className="qcard c2">
            <div className="qtop">
              <span className="qid mono">#1043</span>
              <span className="pill normal">
                <span className="dot-key" />
                Normal
              </span>
            </div>
            <div className="qsubj">Change plan from Free to Pro</div>
            <div className="qai">
              <span className="spark">✦</span> Summarized · Account
            </div>
          </div>
          <div className="qcard c3">
            <div className="qtop">
              <span className="qid mono">#1044</span>
              <span className="pill urgent">
                <span className="dot-key" />
                Urgent
              </span>
            </div>
            <div className="qsubj">Production API returning 500s</div>
            <div className="qai">
              <span className="spark">✦</span> Reply drafted · Technical
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section" id="how-it-works">
        <div className="section-head">
          <div className="eyebrow">How it works</div>
          <h2>From a customer&apos;s message to a resolved ticket</h2>
          <p>
            Four steps, and only one of them needs a human until the reply goes
            out.
          </p>
        </div>
        <div className="steps">
          <div className="step">
            <div className="stepnum">01 / SUBMIT</div>
            <h4>Customer opens a ticket</h4>
            <p>
              A short public form — subject, description, attachment. No account
              required.
            </p>
          </div>
          <div className="step">
            <div className="stepnum">02 / ENRICH</div>
            <h4>AI reads it instantly</h4>
            <p>
              Summary, category and priority are generated, and a reply is
              drafted for review.
            </p>
          </div>
          <div className="step">
            <div className="stepnum">03 / RESOLVE</div>
            <h4>Agent reviews and sends</h4>
            <p>
              Accept the draft or rewrite it. The customer is notified the moment
              it&apos;s sent.
            </p>
          </div>
          <div className="step">
            <div className="stepnum">04 / LEARN</div>
            <h4>Admin sees the pattern</h4>
            <p>
              Volume, resolution time and agent load roll up into one dashboard,
              live.
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section alt">
        <div className="section-head">
          <div className="eyebrow">Built for teams, not one inbox</div>
          <h2>What&apos;s actually inside</h2>
        </div>
        <div className="features">
          <div className="feature">
            <div className="ficon">◧</div>
            <h4>Isolated workspaces</h4>
            <p>
              Every company&apos;s tickets, agents and data live behind their own
              workspace_id. No cross-tenant visibility, ever.
            </p>
          </div>
          <div className="feature">
            <div className="ficon">✦</div>
            <h4>AI triage</h4>
            <p>
              Automatic summary, category and priority prediction, plus a
              suggested reply the agent can accept or edit.
            </p>
          </div>
          <div className="feature">
            <div className="ficon">◈</div>
            <h4>Role-based access</h4>
            <p>
              Admin, Agent and Customer roles, enforced on every request against
              auth, role, and workspace together.
            </p>
          </div>
          <div className="feature">
            <div className="ficon">▤</div>
            <h4>Analytics that matter</h4>
            <p>
              Open vs resolved, average resolution time, ticket volume trends,
              and agent-by-agent performance.
            </p>
          </div>
          <div className="feature">
            <div className="ficon">✉</div>
            <h4>Notifications</h4>
            <p>
              Customers hear back automatically the moment an agent replies — no
              manual follow-up emails.
            </p>
          </div>
          <div className="feature">
            <div className="ficon">◐</div>
            <h4>Billing built in</h4>
            <p>
              Free, Pro and Team plans on Stripe, with usage limits enforced per
              workspace.
            </p>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="section" id="pricing">
        <div className="section-head">
          <div className="eyebrow">Pricing</div>
          <h2>One plan per workspace, no per-ticket fees</h2>
        </div>
        <div className="pricing">
          <div className="ptier">
            <div className="ptname">Free</div>
            <div className="ptprice">$0</div>
            <ul>
              <li>1 agent seat</li>
              <li>50 tickets / month</li>
              <li>AI triage included</li>
            </ul>
            <Link href="/signup" className="btn btn-ghost">
              Get started
            </Link>
          </div>
          <div className="ptier">
            <span className="ptbadge">Most popular</span>
            <div className="ptname">Pro</div>
            <div className="ptprice">
              $29<span>/mo</span>
            </div>
            <ul>
              <li>10 agent seats</li>
              <li>Unlimited tickets</li>
              <li>Analytics dashboard</li>
            </ul>
            <Link href="/signup" className="btn btn-ghost">
              Start Pro
            </Link>
          </div>
          <div className="ptier">
            <div className="ptname">Team</div>
            <div className="ptprice">
              $79<span>/mo</span>
            </div>
            <ul>
              <li>Unlimited seats</li>
              <li>Priority support</li>
              <li>Custom roles</li>
            </ul>
            <a href="mailto:hello@supportflow.app" className="btn btn-ghost">
              Talk to us
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section alt" id="faq">
        <div className="section-head">
          <div className="eyebrow">FAQ</div>
          <h2>Questions worth answering upfront</h2>
        </div>
        <div className="faq">
          <div className="faqitem">
            Can one company see another&apos;s tickets?{" "}
            <span>No — ever</span>
          </div>
          <div className="faqitem">
            Does the AI reply automatically? <span>Only agents send replies</span>
          </div>
          <div className="faqitem">
            Can customers track a ticket without an account?{" "}
            <span>Yes, by link</span>
          </div>
          <div className="faqitem">
            What happens if we outgrow Free? <span>Upgrade anytime</span>
          </div>
        </div>
      </section>

      {/* ── CTA Band ── */}
      <div className="cta-band">
        <h2>Set up your workspace in under five minutes.</h2>
        <Link href="/signup" className="btn btn-ghost">
          Start free — no card required
        </Link>
      </div>

      {/* ── Footer ── */}
      <footer className="footer">
        <div>
          <b style={{ color: "var(--ink)" }}>SupportFlow</b> — support desk
          software for teams that outgrew a shared inbox.
        </div>
        <div>© 2026 SupportFlow</div>
      </footer>
    </>
  );
}
