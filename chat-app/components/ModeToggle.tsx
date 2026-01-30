"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";
import { Sun, Moon } from "lucide-react";

interface ModeToggleProps {
    className?: string;
}

const ModeToggle = ({ className }: ModeToggleProps) => {
    const { setTheme, theme } = useTheme();
    const ref = React.useRef<HTMLButtonElement>(null);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    async function themeToggle() {
        if (!ref.current) return;

        if (!document.startViewTransition) {
            setTheme(theme === "dark" ? "light" : "dark");
            return;
        }

        await document.startViewTransition(() => {
            flushSync(() => {
                setTheme(theme === "dark" ? "light" : "dark");
            });
        }).ready;

        const { top, left, width, height } = ref.current.getBoundingClientRect();
        const right = window.innerWidth - left;
        const bottom = window.innerHeight - top;
        const maxRadius = Math.hypot(Math.max(right, left), Math.max(bottom, top));

        document.documentElement.animate(
            {
                clipPath: [
                    `circle(0px at ${left + width / 2}px ${top + height / 2}px)`,
                    `circle(${maxRadius}px at ${left + width / 2}px ${top + height / 2}px)`,
                ],
            },
            {
                duration: 600,
                easing: "cubic-bezier(0.4, 0, 0.2, 1)",
                pseudoElement: "::view-transition-new(root)",
            }
        );
    }

    if (!mounted) {
        return (
            <button
                ref={ref}
                className={cn(
                    "relative h-12 w-12 rounded-full bg-secondary/50 border border-border flex items-center justify-center",
                    className
                )}
                disabled
            >
                <div className="h-5 w-5 animate-pulse bg-muted-foreground/20 rounded-full" />
            </button>
        );
    }

    return (
        <button
            ref={ref}
            onClick={themeToggle}
            className={cn(
                "relative h-12 w-12 rounded-full bg-background border border-border hover:border-foreground flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-lg group",
                className
            )}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            type="button"
        >
            <Sun
                className={cn(
                    "h-5 w-5 text-foreground absolute transition-all duration-500 rotate-0 scale-100 dark:-rotate-90 dark:scale-0",
                    "group-hover:rotate-12"
                )}
            />
            <Moon
                className={cn(
                    "h-5 w-5 text-foreground absolute transition-all duration-500 rotate-90 scale-0 dark:rotate-0 dark:scale-100",
                    "group-hover:-rotate-12"
                )}
            />

            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-full bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300" />
        </button>
    );
};

export default ModeToggle;