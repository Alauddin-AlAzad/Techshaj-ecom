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
export const categoryIcons = { AudioLines, BatteryCharging, Bluetooth, Boxes, Cable, Clock, Headphones, Keyboard, Lamp, Mouse, Package, Plug, Snowflake, Speaker, Watch, Zap }

export const ICON_NAMES = Object.keys(categoryIcons)
