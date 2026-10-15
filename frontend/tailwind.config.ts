import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        page: 'var(--page)',
        tile: 'var(--tile)',
        sand: 'var(--sand)',
        'sand-light': 'var(--sand-light)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        'border-subtle': 'var(--border-subtle)',

        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        cream: 'var(--cream-text)',

        predict: 'var(--predict)',
        'predict-text': 'var(--predict-text)',
        'predict-light': 'var(--predict-light)',

        prove: 'var(--prove)',
        'prove-text': 'var(--prove-text)',
        'prove-light': 'var(--prove-light)',

        recover: 'var(--recover)',
        'recover-text': 'var(--recover-text)',
        'recover-light': 'var(--recover-light)',

        rewind: 'var(--rewind)',
        'rewind-text': 'var(--rewind-text)',
        'rewind-light': 'var(--rewind-light)',

        success: 'var(--status-success)',
        'success-text': 'var(--status-success-text)',
        warning: 'var(--status-warning)',
        'warning-text': 'var(--status-warning-text)',
        danger: 'var(--status-danger)',
        'danger-text': 'var(--status-danger-text)',
        info: 'var(--status-info)',
        'info-text': 'var(--status-info-text)',
      },
      fontFamily: {
        headline: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        body: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      borderRadius: {
        tile: 'var(--radius-tile)',
        card: 'var(--radius-card)',
        button: 'var(--radius-button)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        tile: 'var(--shadow-tile)',
        hover: 'var(--shadow-hover)',
        modal: 'var(--shadow-modal)',
      },
    },
  },
  plugins: [],
};

export default config;
