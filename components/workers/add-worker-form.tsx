"use client";

import { addWorker } from "@/app/(authenticated)/secretary/actions";
import { AddWorkerInput, AddWorkerSchema} from "@/forms/worker-form";
import { TRADE_SUGGESTIONS } from "@/types/enums";
import { Autocomplete, Button, Group, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useRouter } from "next/navigation";
import { useTransition } from "react";




export function AddWorkerForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<AddWorkerInput>({
    mode: "uncontrolled",
    initialValues: { firstName: "", lastName: "", idNumber: "", phone: "", email: "", trade: "" },
    validate: zod4Resolver(AddWorkerSchema),
    validateInputOnBlur:true
  });

  const onSubmit = form.onSubmit((values) =>
    startTransition(async () => {
      const result = await addWorker(values);
      if (!result.ok) {
        notifications.show({ color: "red", title: "Could not add worker", message: result.error });
        return;
      }
      notifications.show({ color: "green", message: result.message });
      router.push("/secretary/workers");
      router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="First name"
            autoComplete="off"
            key={form.key("firstName")}
            {...form.getInputProps("firstName")}
          />
          <TextInput
            label="Last name"
            autoComplete="off"
            key={form.key("lastName")}
            {...form.getInputProps("lastName")}
          />
          <TextInput
            label="ID number"
            description="National ID or passport number"
            autoComplete="off"
            key={form.key("idNumber")}
            {...form.getInputProps("idNumber")}
          />
          <Autocomplete
            label="Trade"
            description="Pick one or type your own"
            placeholder="e.g. Electrician"
            data={TRADE_SUGGESTIONS}
            key={form.key("trade")}
            {...form.getInputProps("trade")}
          />
          <TextInput
            label="Phone"
            type="tel"
            placeholder="+254 700 000000"
            autoComplete="off"
            key={form.key("phone")}
            {...form.getInputProps("phone")}
          />
          <TextInput
            label="Email (optional)"
            type="email"
            autoComplete="off"
            key={form.key("email")}
            {...form.getInputProps("email")}
          />
        </SimpleGrid>

        <Group justify="flex-end">
          <Button variant="default" onClick={() => router.back()} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            Add worker
          </Button>
        </Group>
      </Stack>
    </form>
  );
}