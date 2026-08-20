import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  feldClass: string;
};

export function PasswordInput({ feldClass, className, ...props }: PasswordInputProps) {
  const [sichtbar, setSichtbar] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={sichtbar ? "text" : "password"}
        className={`${feldClass} pr-12 ${className ?? ""}`}
      />
      <button
        type="button"
        onClick={() => setSichtbar((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        tabIndex={-1}
        aria-label={sichtbar ? "Passwort verbergen" : "Passwort anzeigen"}
      >
        {sichtbar ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}
