"use client";

import {
    ActionIcon,
    Autocomplete,
    Button,
    Checkbox,
    Grid,
    Group,
    NumberInput,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { randomId } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";

import { Panel } from "@/components/admin-ui";
import { formatMoney } from "@/lib/formats";
import { createReport, NewReportInput } from "@/app/(authenticated)/foreman/reports/new/actions";


type Num = number | string;
type MachineRow = { key: string; category: string; number: Num; hours: Num };
type MaterialRow = { key: string; name: string; quantity: Num; unit: string; unitCost: Num };
type WorkerRow = { workerId: string; name: string; trade: string; onDuty: boolean; hours: Num };
type FormValues = {
    notes: string;
    machineries: MachineRow[];
    materials: MaterialRow[];
    workers: WorkerRow[];
};

export type SiteWorker = { id: string; name: string; trade: string };

// Suggestions keep names consistent; anything else can still be typed.
const MACHINE_SUGGESTIONS = ["Excavator", "Bulldozer", "Backhoe loader", "Roller", "Grader", "Concrete mixer", "Crane", "Dump truck", "Generator"];
const MATERIAL_SUGGESTIONS = ["Cement", "Sand", "Ballast", "Gravel", "Steel bars", "Timber", "Bricks", "Paint"];
const UNIT_SUGGESTIONS = ["bags", "tonnes", "kg", "m3", "pieces", "litres", "lengths"];

const inRange = (v: Num, min: number, max: number) =>
    v !== "" && Number(v) >= min && Number(v) <= max;

export function ReportForm({ siteWorkers }: { siteWorkers: SiteWorker[] }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const form = useForm<FormValues>({
        mode: "controlled",
        initialValues: {
            notes: "",
            machineries: [],
            materials: [],
            workers: siteWorkers.map((w) => ({
                workerId: w.id,
                name: w.name,
                trade: w.trade,
                onDuty: false,
                hours: 8,
            })),
        },
        validate: {
            machineries: {
                category: (v) => (v.trim() ? null : "Enter a category"),
                number: (v) => (Number.isInteger(Number(v)) && inRange(v, 1, 1000) ? null : "At least 1"),
                hours: (v) => (inRange(v, 0, 24) ? null : "0 to 24"),
            },
            materials: {
                name: (v) => (v.trim() ? null : "Enter a name"),
                quantity: (v) => (v !== "" && Number(v) > 0 ? null : "More than 0"),
                unit: (v) => (v.trim() ? null : "Enter a unit"),
                unitCost: (v) => (inRange(v, 0, 9_999_999_999) ? null : "0 or more"),
            },
        },
    });

    // Live totals, so the foreman sees the day's figures before submitting.
    const totals = useMemo(() => {
        const v = form.values;
        const onDuty = v.workers.filter((w) => w.onDuty);
        return {
            machines: v.machineries.reduce((n, m) => n + (Number(m.number) || 0), 0),
            onDuty: onDuty.length,
            workerHours: onDuty.reduce((n, w) => n + (Number(w.hours) || 0), 0),
            materialsCost: v.materials.reduce(
                (n, m) => n + (Number(m.quantity) || 0) * (Number(m.unitCost) || 0),
                0,
            ),
        };
    }, [form.values]);

    const addMachine = () =>
        form.insertListItem("machineries", { key: randomId(), category: "", number: 1, hours: 8 });
    const addMaterial = () =>
        form.insertListItem("materials", { key: randomId(), name: "", quantity: "", unit: "", unitCost: "" });
    const setAllOnDuty = (onDuty: boolean) =>
        form.setFieldValue(
            "workers",
            form.values.workers.map((w) => ({ ...w, onDuty })),
        );

    const submit = (values: FormValues) => {
        // The hours of a worker only matter when they are ticked as on duty.
        let bad = false;
        values.workers.forEach((w, i) => {
            if (w.onDuty && !(Number(w.hours) > 0 && Number(w.hours) <= 24)) {
                form.setFieldError(`workers.${i}.hours`, "1 to 24");
                bad = true;
            }
        });
        if (bad) return;

        const payload: NewReportInput = {
            notes: values.notes.trim(),
            machineries: values.machineries.map((m) => ({
                category: m.category.trim(),
                number: Number(m.number),
                hours: Number(m.hours),
            })),
            materials: values.materials.map((m) => ({
                name: m.name.trim(),
                quantity: Number(m.quantity),
                unit: m.unit.trim(),
                unitCost: Number(m.unitCost),
            })),
            workers: values.workers
                .filter((w) => w.onDuty)
                .map((w) => ({ workerId: w.workerId, hours: Number(w.hours) })),
        };

        if (payload.machineries.length + payload.materials.length + payload.workers.length === 0) {
            notifications.show({
                color: "red",
                title: "Nothing to submit",
                message: "Add at least one machine, material or worker.",
            });
            return;
        }

        // A submitted report is final for the foreman, so ask first.
        modals.openConfirmModal({
            title: "Submit today's report?",
            children: (
                <Text size="sm">
                    Once submitted you can't edit it. Only the secretary can correct a report afterwards.
                </Text>
            ),
            labels: { confirm: "Submit report", cancel: "Keep editing" },
            onConfirm: () =>
                startTransition(async () => {
                    const result = await createReport(payload);
                    if (!result.ok) {
                        notifications.show({ color: "red", title: "Could not submit", message: result.error });
                        return;
                    }
                    notifications.show({ color: "green", message: "Report submitted" });
                    router.push(`/foreman/reports/${result.id}`);
                }),
        });
    };

    return (
        <form onSubmit={form.onSubmit(submit)} noValidate>
            <Stack gap="lg">
                {/* ---------- Workers ---------- */}
                <Panel
                    title="Workers on duty"
                    description="Tick the workers who were on site today and enter their hours"
                    action={
                        siteWorkers.length > 0 ? (
                            <Group gap="xs">
                                <Button size="xs" variant="subtle" onClick={() => setAllOnDuty(true)}>
                                    Select all
                                </Button>
                                <Button size="xs" variant="subtle" color="gray" onClick={() => setAllOnDuty(false)}>
                                    Clear
                                </Button>
                            </Group>
                        ) : undefined
                    }
                >
                    {siteWorkers.length === 0 ? (
                        <Text c="dimmed" size="sm">
                            No workers are registered on your site yet. You can still submit the report without
                            them.
                        </Text>
                    ) : (
                        <Stack gap="sm">
                            {form.values.workers.map((w, i) => (
                                <Group key={w.workerId} justify="space-between" wrap="nowrap">
                                    <Checkbox
                                        checked={w.onDuty}
                                        onChange={(e) => form.setFieldValue(`workers.${i}.onDuty`, e.currentTarget.checked)}
                                        label={
                                            <>
                                                <Text span fw={600}>
                                                    {w.name}
                                                </Text>{" "}
                                                <Text span c="dimmed" size="sm" tt="capitalize">
                                                    {w.trade}
                                                </Text>
                                            </>
                                        }
                                    />
                                    <NumberInput
                                        w={110}
                                        suffix=" h"
                                        min={0}
                                        max={24}
                                        decimalScale={2}
                                        disabled={!w.onDuty}
                                        aria-label={`Hours worked by ${w.name}`}
                                        {...form.getInputProps(`workers.${i}.hours`)}
                                    />
                                </Group>
                            ))}
                        </Stack>
                    )}
                </Panel>

                {/* ---------- Machinery ---------- */}
                <Panel
                    title="Machinery"
                    description="Machines in operation today"
                    action={
                        <Button size="xs" variant="light" onClick={addMachine}>
                            Add machine
                        </Button>
                    }
                >
                    {form.values.machineries.length === 0 ? (
                        <Text c="dimmed" size="sm">
                            No machinery added.
                        </Text>
                    ) : (
                        <Stack gap="md">
                            {form.values.machineries.map((row, i) => (
                                <Grid key={row.key} align="flex-end" gap="sm">
                                    <Grid.Col span={{ base: 12, sm: 5 }}>
                                        <Autocomplete
                                            label="Category"
                                            placeholder="e.g. Excavator"
                                            data={MACHINE_SUGGESTIONS}
                                            {...form.getInputProps(`machineries.${i}.category`)}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 6, sm: 3 }}>
                                        <NumberInput
                                            label="Number"
                                            min={1}
                                            max={1000}
                                            allowDecimal={false}
                                            {...form.getInputProps(`machineries.${i}.number`)}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 6, sm: 3 }}>
                                        <NumberInput
                                            label="Hours worked"
                                            min={0}
                                            max={24}
                                            decimalScale={2}
                                            {...form.getInputProps(`machineries.${i}.hours`)}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, sm: 1 }}>
                                        <ActionIcon
                                            variant="subtle"
                                            color="red"
                                            onClick={() => form.removeListItem("machineries", i)}
                                            aria-label="Remove machine"
                                        >
                                            ✕
                                        </ActionIcon>
                                    </Grid.Col>
                                </Grid>
                            ))}
                        </Stack>
                    )}
                </Panel>

                {/* ---------- Materials ---------- */}
                <Panel
                    title="Materials used"
                    description="Materials used today and what they cost"
                    action={
                        <Button size="xs" variant="light" onClick={addMaterial}>
                            Add material
                        </Button>
                    }
                >
                    {form.values.materials.length === 0 ? (
                        <Text c="dimmed" size="sm">
                            No materials added.
                        </Text>
                    ) : (
                        <Stack gap="md">
                            {form.values.materials.map((row, i) => (
                                <Grid key={row.key} align="flex-end" gap="sm">
                                    <Grid.Col span={{ base: 12, sm: 4 }}>
                                        <Autocomplete
                                            label="Material"
                                            placeholder="e.g. Cement"
                                            data={MATERIAL_SUGGESTIONS}
                                            {...form.getInputProps(`materials.${i}.name`)}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 6, sm: 2 }}>
                                        <NumberInput
                                            label="Quantity"
                                            min={0}
                                            decimalScale={2}
                                            {...form.getInputProps(`materials.${i}.quantity`)}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 6, sm: 2 }}>
                                        <Autocomplete
                                            label="Unit"
                                            placeholder="bags"
                                            data={UNIT_SUGGESTIONS}
                                            {...form.getInputProps(`materials.${i}.unit`)}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, sm: 3 }}>
                                        <NumberInput
                                            label="Unit cost"
                                            min={0}
                                            decimalScale={2}
                                            thousandSeparator=","
                                            {...form.getInputProps(`materials.${i}.unitCost`)}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, sm: 1 }}>
                                        <ActionIcon
                                            variant="subtle"
                                            color="red"
                                            onClick={() => form.removeListItem("materials", i)}
                                            aria-label="Remove material"
                                        >
                                            ✕
                                        </ActionIcon>
                                    </Grid.Col>
                                </Grid>
                            ))}
                        </Stack>
                    )}
                </Panel>

                {/* ---------- Notes ---------- */}
                <Panel title="Notes" description="Weather, delays, visitors, incidents">
                    <Textarea
                        aria-label="Notes"
                        placeholder="Anything the secretary and the engineer should know about today"
                        autosize
                        minRows={3}
                        maxLength={2000}
                        {...form.getInputProps("notes")}
                    />
                </Panel>

                {/* ---------- Summary and submit ---------- */}
                <Panel title="Summary">
                    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
                        <Stat label="Machines" value={String(totals.machines)} />
                        <Stat label="Workers on duty" value={String(totals.onDuty)} />
                        <Stat label="Worker hours" value={totals.workerHours.toFixed(1)} />
                        <Stat label="Materials cost" value={formatMoney(totals.materialsCost)} />
                    </SimpleGrid>
                    <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={() => router.back()} disabled={pending}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={pending}>
                            Submit report
                        </Button>
                    </Group>
                </Panel>
            </Stack>
        </form>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                {label}
            </Text>
            <Text fz="xl" fw={700}>
                {value}
            </Text>
        </div>
    );
}