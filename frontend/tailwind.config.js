/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            fontSize: {
                /* Production reading sizes. `xs` is reserved for supporting
                   metadata, while `sm` remains comfortably readable body copy. */
                xs: ['0.8125rem', { lineHeight: '1.25rem' }],
                sm: ['0.9375rem', { lineHeight: '1.5rem' }],
                base: ['1.0625rem', { lineHeight: '1.75rem' }],
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 4px)',
                sm: 'calc(var(--radius) - 8px)',
                xl: 'calc(var(--radius) + 4px)',
                '2xl': 'calc(var(--radius) + 8px)',
                '3xl': 'calc(var(--radius) + 16px)',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['"Playfair Display"', 'serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                    ink: 'hsl(var(--accent-ink))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                /* ── Combined brand palette (Combination of both.md §1) ── */
                navy: {
                    DEFAULT: '#0F1F3D', /* navy-deep: hero bands, footer, login, admin */
                    deep: '#0F1F3D',
                    mid: '#112240',     /* secondary dark sections */
                    card: '#1A2F50',    /* dark form cards / branded placeholders */
                },
                gold: {
                    DEFAULT: '#0F1F3D', /* legacy alias: resolves to navy */
                    italic: '#112240',
                    deep: '#0F1F3D',    /* active state */
                    light: '#FFFFFF',   /* disabled */
                },
                page: '#FFFFFF',        /* main content section bg — pure white */
                surface: '#FFFFFF',     /* alternate light section bg — pure white */
                ink: {
                    DEFAULT: '#0F1F3D', /* text-primary */
                    soft: '#374151',    /* legal body copy */
                    blue: '#586C8D',    /* text-secondary / meta — darkened to meet WCAG AA (≈5.3:1 on white) */
                    mute: '#9CA3AF',    /* placeholder / disabled */
                },
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                }
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
