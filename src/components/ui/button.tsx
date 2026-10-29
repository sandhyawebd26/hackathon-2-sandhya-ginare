import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 border text-[11px] uppercase tracking-[0.22em] transition-colors disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        solid: "border-primary bg-primary text-primary-foreground hover:bg-accent hover:border-accent hover:text-accent-foreground",
        outline: "border-current bg-transparent hover:bg-primary hover:text-primary-foreground",
        ghost: "border-transparent hover:text-accent",
      },
      size: {
        default: "px-5 py-3",
        sm: "px-3 py-2",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
