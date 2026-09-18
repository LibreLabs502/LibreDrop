const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const StoreIcon = () => (
  <svg {...base}>
    <path d="M2 7l2.5 12.5A1.5 1.5 0 006 21h12a1.5 1.5 0 001.5-1.5L22 7H2z" />
    <path d="M2 7V5a2 2 0 012-2h16a2 2 0 012 2v2" />
    <path d="M9 11a3 3 0 006 0" />
  </svg>
)

export const CatalogIcon = () => (
  <svg {...base}>
    <path d="M16.5 9.4 7.55 4.24" />
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <path d="M3.27 6.96 12 12.01l8.73-5.05" />
    <path d="M12 22.08V12" />
  </svg>
)

export const DomainIcon = () => (
  <svg {...base}>
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
)

export const MembersIcon = () => (
  <svg {...base}>
    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
)

export const StoresIcon = () => (
  <svg {...base}>
    <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18Z" />
    <path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2" />
    <path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
)