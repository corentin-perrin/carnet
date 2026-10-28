import type { ComponentType } from 'react'
import {
  IconBabyCarriage, IconBarbell, IconBeach, IconBeer, IconBolt, IconBook, IconBuildingBank, IconBus,
  IconCar, IconCoffee, IconDeviceGamepad2, IconDeviceMobile, IconDots, IconGasStation, IconGift, IconHome,
  IconMovie, IconMusic, IconPaw, IconPill, IconPlane, IconPlant, IconReceipt, IconRepeat, IconSchool,
  IconScissors, IconShirt, IconShoppingCart, IconStethoscope, IconToolsKitchen2, IconWifi, IconPizza,
} from '@tabler/icons-react'

type IconComponent = ComponentType<{ size?: number; stroke?: number }>

export const CATEGORY_ICONS: Record<string, IconComponent> = {
  cart: IconShoppingCart,
  kitchen: IconToolsKitchen2,
  pizza: IconPizza,
  coffee: IconCoffee,
  beer: IconBeer,
  bus: IconBus,
  car: IconCar,
  fuel: IconGasStation,
  plane: IconPlane,
  home: IconHome,
  bolt: IconBolt,
  wifi: IconWifi,
  phone: IconDeviceMobile,
  repeat: IconRepeat,
  gamepad: IconDeviceGamepad2,
  movie: IconMovie,
  music: IconMusic,
  book: IconBook,
  beach: IconBeach,
  gym: IconBarbell,
  stethoscope: IconStethoscope,
  pill: IconPill,
  scissors: IconScissors,
  shirt: IconShirt,
  gift: IconGift,
  paw: IconPaw,
  baby: IconBabyCarriage,
  school: IconSchool,
  plant: IconPlant,
  bank: IconBuildingBank,
  receipt: IconReceipt,
  dots: IconDots,
}

export function CatIcon({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = CATEGORY_ICONS[name] ?? IconDots
  return <Icon size={size} stroke={1.75} />
}
