export function Toast({ visible, message }: { visible: boolean; message: string }) {
  return <div className="toast" role="status" aria-live="polite" aria-atomic="true" hidden={!visible}>{message}</div>;
}
