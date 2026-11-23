"use client";

import { Group, Loader } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Range = [string | null, string | null];

export function ReportsFilter({ from, to }: { from: string | null; to: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<Range>([from, to]);

  const apply = (next: Range) => {
    setValue(next);
    const [start, end] = next;
    // A range picker reports [start, null] after the first click. Wait for the second.
    if (start && !end) return;

    const params = new URLSearchParams();
    if (start) params.set("from", start);
    if (end) params.set("to", end);
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `/admin/reports?${query}` : "/admin/reports");
    });
  };

  return (
    <Group gap="sm" align="flex-end">
      <DatePickerInput
        type="range"
        label="Created between"
        placeholder="Pick a date range"
        valueFormat="DD MMM YYYY"
        value={value}
        onChange={apply}
        clearable
        w={300}
      />
      {pending && <Loader size="sm" />}
    </Group>
  );
}