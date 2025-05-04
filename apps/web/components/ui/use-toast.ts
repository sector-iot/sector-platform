import { toast as sonnerToast } from "sonner";

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
};

export function useToast() {
  return {
    toast: (message: string | ToastOptions) => {
      if (typeof message === "string") {
        return sonnerToast(message);
      }

      const { title, description, variant = "default" } = message;
      return sonnerToast(title, {
        description,
        className:
          variant === "error"
            ? "bg-red-500 text-white"
            : variant === "success"
              ? "bg-green-500 text-white"
              : variant === "warning"
                ? "bg-yellow-500 text-white"
                : "",
      });
    },
  };
}
