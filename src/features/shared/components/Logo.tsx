import { useEffect } from "react"
import { Image, ImageStyle } from "react-native"

export function Logo({ width = 160, height = 100 }: { width?: number; height?: number }) {
  const style: ImageStyle = { width, height, resizeMode: "contain" }
  // Pastikan file ada di assets/images/dkn.png
  return <Image source={require("@/assets/images/dkn.png")} style={style} />
}