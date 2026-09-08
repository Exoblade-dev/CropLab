export function Toast({ visible, message }: { visible: boolean; message: string }) { if (!visible) return null; return <div className="toast" role="status">{message}</div>; }
