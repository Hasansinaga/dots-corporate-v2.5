import { Image, ImageStyle } from "react-native"

export function Logo({ width = 260, height = 200 }: { width?: number; height?: number }) {
  const style: ImageStyle = { width, height, resizeMode: "contain" }
  return <Image source={require("../../../../src/assets/images/dots_logo.png")} style={style} />
}