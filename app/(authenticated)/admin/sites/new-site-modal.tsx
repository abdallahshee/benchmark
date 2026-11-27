"use client";

import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useTransition } from "react";

import { createSite } from "./actions";

export function NewSiteModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const [pending, startTransition] = useTransition();

  const form = useForm({
    mode: "uncontrolled",
    initialValues: { name: "" },
    validate: {
      name: (v) => (v.trim() ? null : "Enter a site name"),
    },
  });

  const handleClose = () => {
    form.reset();
    close();
  };

  const onSubmit = form.onSubmit((values) =>
    startTransition(async () => {
      const result = await createSite(values);
      if (!result.ok) {
        form.setFieldError("name", result.error);
        return;
      }
      notifications.show({ color: "green", message: `Site "${values.name.trim()}" created` });
      handleClose();
    }),
  );

  return (
    <>
      <Button  onClick={open}>New site</Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title="New site"
        centered
        // Don't let a stray click or Escape dismiss it mid-save.
        closeOnClickOutside={!pending}
        closeOnEscape={!pending}
        withCloseButton={!pending}
      >
        <form onSubmit={onSubmit} noValidate>
          <Stack>
            <TextInput
              label="Site name"
              placeholder="e.g. Riverside Apartments"
              data-autofocus
              key={form.key("name")}
              {...form.getInputProps("name")}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={handleClose} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}