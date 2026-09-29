export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="status" data-testid="toast" className="toast">
      {message}
    </div>
  );
}
