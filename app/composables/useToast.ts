export type Toast = { id: number; kind: "success" | "error"; text: string };

export function useToast() {
  const toasts = useState<Toast[]>("toasts", () => []);

  function push(kind: Toast["kind"], text: string) {
    const id = Date.now() + Math.random();
    toasts.value.push({ id, kind, text });
    setTimeout(() => dismiss(id), 4000);
  }
  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return {
    toasts,
    dismiss,
    success: (text: string) => push("success", text),
    error: (text: string) => push("error", text),
  };
}
