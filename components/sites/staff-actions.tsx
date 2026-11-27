
"use client";

import { Button, Group, Modal, Tooltip, Text } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { NewSiteUserForm } from "@/app/(authenticated)/admin/users/invite-user-form";

type SiteRole = "foreman" | "secretary";

type Props = {
  siteId: string;
  hasForeman: boolean;
  hasSecretary: boolean;
};

export function SiteStaffActions({
  siteId,
  hasForeman,
  hasSecretary,
}: Props) {
  const router = useRouter();
  const [role, setRole] = useState<SiteRole | null>(null);

  const closeModal = () => setRole(null);

  const handleSuccess = () => {
    closeModal();
    router.refresh();
  };

  return (
    <>
      <Group gap="sm">
        <Tooltip label="This site already has a foreman." disabled={!hasForeman}>
          <span>
            <Button
              type="button"
              color="blue"
              disabled={hasForeman}
              onClick={() => setRole("foreman")}
              styles={{
                root: {
                  cursor: hasForeman ? "not-allowed" : "pointer",
                },
              }}
            >
              Add foreman
            </Button>
          </span>
        </Tooltip>

        <Tooltip label="This site already has a secretary." disabled={!hasSecretary}>
          <span>
            <Button
              type="button"
              color="teal"
              disabled={hasSecretary}
              onClick={() => setRole("secretary")}
              styles={{
                root: {
                  cursor: hasSecretary ? "not-allowed" : "pointer",
                },
              }}
            >
              Add secretary
            </Button>
          </span>
        </Tooltip>
      </Group>

      <Modal
        opened={role !== null}
        onClose={closeModal}
        title={role === "foreman" ? "Add foreman" : "Add secretary"}
        centered
        size="lg"
      >
        {role ? (
          <NewSiteUserForm
            key={role}
            siteId={siteId}
            role={role}
            onSuccess={handleSuccess}
            onCancel={closeModal}
          />
        ) : null}
      </Modal>
    </>
  );
}
