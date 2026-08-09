"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useRef, useTransition } from "react";
import Select from "./Select";

interface Agent {
  id: string;
  name: string | null;
}

interface TicketFiltersProps {
  /** Total count for each status tab, already RBAC-scoped on the server */
  counts: { all: number; open: number; resolved: number; closed: number };
  /** Agents in the company — passed as empty array for CUSTOMER role */
  agents: Agent[];
  userRole: string;
}

const STATUSES = [
  { value: "",         label: "All"      },
  { value: "OPEN",     label: "Open"     },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED",   label: "Closed"   },
] as const;

const PRIORITIES = [
  { value: "",       label: "Any priority" },
  { value: "URGENT", label: "Urgent"       },
  { value: "HIGH",   label: "High"         },
  { value: "NORMAL", label: "Normal"       },
  { value: "LOW",    label: "Low"          },
] as const;

export default function TicketFilters({ counts, agents, userRole }: TicketFiltersProps) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStatus   = searchParams.get("status")   ?? "";
  const currentPriority = searchParams.get("priority") ?? "";
  const currentAssignee = searchParams.get("assignee") ?? "";
  const currentQ        = searchParams.get("q")        ?? "";

  /** Push a new URL, resetting page to 1 on any filter change */
  const push = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else   params.delete(k);
      });
      params.delete("page"); // reset to page 1 whenever a filter changes
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push({ q: val }), 300);
  };

  const isCustomer = userRole === "CUSTOMER";

  const statusLabel = (v: string) => {
    const count =
      v === ""         ? counts.all      :
      v === "OPEN"     ? counts.open     :
      v === "RESOLVED" ? counts.resolved :
      v === "CLOSED"   ? counts.closed   : 0;
    const label = STATUSES.find((s) => s.value === v)?.label ?? "All";
    return `${label} · ${count}`;
  };

  return (
    <>
      {/* Search box — in the topbar, rendered inline by the parent */}
      <input
        id="ticket-search"
        className="search"
        type="search"
        placeholder="Search tickets…"
        aria-label="Search tickets"
        defaultValue={currentQ}
        onChange={handleSearch}
      />

      {/* Filter bar */}
      <div className="filterbar" role="group" aria-label="Ticket filters">
        {/* Status chips */}
        {STATUSES.map(({ value }) => (
          <button
            key={value}
            type="button"
            className={`fchip${currentStatus === value ? " active" : ""}`}
            onClick={() => push({ status: value })}
            aria-pressed={currentStatus === value}
          >
            {statusLabel(value)}
          </button>
        ))}

        <span style={{ flex: 1 }} />

        {/* Priority select */}
        <Select
          id="priority-filter"
          className="fchip fselect"
          value={currentPriority}
          onChange={(e) => push({ priority: e.target.value })}
          aria-label="Filter by priority"
        >
          {PRIORITIES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>

        {/* Assignee select — hidden for CUSTOMER (agent name enumeration risk) */}
        {!isCustomer && agents.length > 0 && (
          <Select
            id="assignee-filter"
            className="fchip fselect"
            value={currentAssignee}
            onChange={(e) => push({ assignee: e.target.value })}
            aria-label="Filter by assignee"
          >
            <option value="">Any assignee</option>
            <option value="unassigned">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name ?? a.id}</option>
            ))}
          </Select>
        )}
      </div>
    </>
  );
}
