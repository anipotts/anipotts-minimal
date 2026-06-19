"use client";

import {
  ButtondownEditForm,
  ButtondownEmailPanel,
  CreateDraftButton,
} from "./buttondown-card-ui";
import { useButtondownCard } from "./buttondown-card-state";

export default function ButtondownCard({
  contentId,
  initialEmailId,
}: {
  contentId: string;
  initialEmailId?: string;
}) {
  const card = useButtondownCard({ contentId, initialEmailId });

  if (!card.emailState.emailId) {
    return (
      <CreateDraftButton
        isPending={card.isPending}
        onCreateDraft={card.handleCreateDraft}
      />
    );
  }

  if (card.editing) {
    return (
      <ButtondownEditForm
        subject={card.editSubject}
        body={card.editBody}
        isPending={card.isPending}
        onSubjectChange={card.setEditSubject}
        onBodyChange={card.setEditBody}
        onSave={card.handleSave}
        onCancel={() => card.setEditing(false)}
      />
    );
  }

  return (
    <ButtondownEmailPanel
      feedback={card.feedback}
      emailState={card.emailState}
      isPending={card.isPending}
      scheduleDate={card.scheduleDate}
      onCheckStatus={card.handleCheckStatus}
      onStartEdit={card.startEdit}
      onScheduleDateChange={card.setScheduleDate}
      onSchedule={card.handleSchedule}
      onDelete={card.handleDelete}
    />
  );
}
