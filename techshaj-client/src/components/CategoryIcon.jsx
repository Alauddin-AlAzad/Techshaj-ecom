import {
  AudioLines,
  BatteryCharging,
  Bluetooth,
  Boxes,
  Cable,
  Clock,
  Headphones,
  Keyboard,
  Lamp,
  Mouse,
  Package,
  Plug,
  Snowflake,
  Speaker,
  Watch,
  Zap,
} from 'lucide-react'

// Explicit map keeps the bundle small; add an entry when a category uses a new icon name.
const icons = { AudioLines, BatteryCharging, Bluetooth, Boxes, Cable, Clock, Headphones, Keyboard, Lamp, Mouse, Package, Plug, Snowflake, Speaker, Watch, Zap }

export default function CategoryIcon({ name, ...props }) {
  const Icon = icons[name] ?? Package
  return <Icon {...props} />
}
