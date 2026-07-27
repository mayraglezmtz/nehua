import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 duration-300 interactive-hover interactive-press",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-nehua-primary to-nehua-secondary text-white hover:shadow-glow-pink hover:scale-105",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-white/10 backdrop-blur-sm text-white hover:bg-accent hover:text-accent-foreground hover:shadow-glass",
        secondary: "bg-gradient-to-r from-nehua-neutral2 to-nehua-neutral3 text-white hover:shadow-lg hover:scale-105",
        ghost: "text-gray-200 hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "glass-button text-gray-100 hover:shadow-glass",
        "glass-primary": "btn-glass-primary",
        "glass-secondary": "btn-glass-secondary",
        pulse: "bg-gradient-to-r from-nehua-primary to-nehua-secondary text-white pulse-glow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }