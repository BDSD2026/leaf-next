import Image from 'next/image'

interface Props {
  name: string
  color?: string
  avatarUrl?: string | null
  size?: number
  onClick?: () => void
}

export default function Avatar({ name, color = '#7C6FCD', avatarUrl, size = 32, onClick }: Props) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      onClick={onClick}
      className="avatar"
      style={{ width: size, height: size, background: avatarUrl ? 'transparent' : color, fontSize: size * 0.34, cursor: onClick ? 'pointer' : 'default' }}
    >
      {avatarUrl
        ? <Image src={avatarUrl} alt={name} width={size} height={size} style={{ borderRadius: '50%', objectFit: 'cover' }} />
        : initials
      }
    </div>
  )
}
