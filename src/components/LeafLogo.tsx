export default function LeafLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 22 24" fill="none">
      <path d="M11 23C11 23 2 16.5 2 10C2 5.58 5.58 2 10 2C12.76 2 15.2 3.4 16.6 5.6C16.6 5.6 20 7.6 20 11C20 15.8 15.8 20 11 23Z" fill="#5CD4A4" opacity="0.95"/>
      <path d="M11 23C11 13.5 16.5 7.5 16.5 7.5" stroke="#0C0C0E" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M7 17.5Q9.5 16 10.5 17" stroke="#0C0C0E" strokeWidth="0.9" strokeLinecap="round" opacity="0.4"/>
      <path d="M6 13Q9 11.5 10.5 13" stroke="#0C0C0E" strokeWidth="0.9" strokeLinecap="round" opacity="0.4"/>
    </svg>
  )
}
