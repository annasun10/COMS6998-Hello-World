"use client";

import { useActionState } from "react";
import { changeFriendship } from "./actions";

const controls = {
  available: [["send", "Add friend"]],
  received: [["accept", "Accept"], ["decline", "Decline"]],
  sent: [["cancel", "Cancel request"]],
  friend: [["remove", "Remove friend"]],
} as const;

export type Relationship = keyof typeof controls;

export default function FriendControls({ id, relationship }: { id: string; relationship: Relationship }) {
  const [error, action, pending] = useActionState(changeFriendship, "");
  return <form action={action}>
    <input type="hidden" name="person" value={id} />
    <div className="flex flex-wrap gap-2">
      {controls[relationship].map(([operation, label]) =>
        <button className="vote-button disabled:opacity-50" type="submit" name="operation" value={operation}
          disabled={pending} key={operation}>{label}</button>
      )}
    </div>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </form>;
}
