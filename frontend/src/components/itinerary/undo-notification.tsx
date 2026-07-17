type UndoNotificationProps = {
  message: string;
};

export const UndoNotification = ({ message }: UndoNotificationProps) =>
  message ? (
    <p className="mt-3 rounded-2xl bg-coast-50 px-4 py-3 text-sm font-semibold text-coast-700" aria-live="polite">
      {message}
    </p>
  ) : null;
