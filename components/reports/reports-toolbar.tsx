"use client";

import { Button, Group, Loader, Pagination } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Filters = { from: string | null; to: string | null; page: number };

function buildUrl(basePath: string, f: Filters) {
  const p = new URLSearchParams();
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.page > 1) p.set("page", String(f.page));
  const query = p.toString();
  return query ? `${basePath}?${query}` : basePath;
}

type ToolbarProps = {
  basePath: string;
  from: string | null;
  to: string | null;
};

export function ReportsToolbar({ basePath, from, to }: ToolbarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [range, setRange] = useState<[string | null, string | null]>([from, to]);

  // Changing the range always goes back to the first page.
  const go = (next: Partial<Filters>) =>
    startTransition(() => router.replace(buildUrl(basePath, { from, to, page: 1, ...next })));

  const onRange = (next: [string | null, string | null]) => {
    setRange(next);
    const [start, end] = next;
    // A range picker reports [start, null] after the first click. Wait for the second.
    if (start && !end) return;
    go({ from: start, to: end });
  };

  const active = Boolean(from || to);

  return (
    <Group gap="sm" align="flex-end">
      <DatePickerInput
        type="range"
        label="Report date"
        placeholder="Pick a date range"
        valueFormat="DD MMM YYYY"
        value={range}
        onChange={onRange}
        clearable
        w={260}
      />
      {active && (
        <Button
          variant="subtle"
          size="sm"
          onClick={() => {
            setRange([null, null]);
            startTransition(() => router.replace(basePath));
          }}
        >
          Clear filter
        </Button>
      )}
      {pending && <Loader size="sm" mb={8} />}
    </Group>
  );
}

type PaginationProps = {
  basePath: string;
  from: string | null;
  to: string | null;
  page: number;
  pageCount: number;
};

export function ReportsPagination({ basePath, from, to, page, pageCount }: PaginationProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (pageCount <= 1) return null;

  return (
    <Pagination
      total={pageCount}
      value={page}
      size="sm"
      disabled={pending}
      onChange={(next) =>
        startTransition(() => router.push(buildUrl(basePath, { from, to, page: next })))
      }
    />
  );
}