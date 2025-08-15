import 'react-native-gesture-handler'
import { useEffect } from "react"
import { TouchableOpacity, Text, ViewStyle } from "react-native"
import { colors } from "../../shared/constants/colors"

interface Props {
  title: string
  onPress?: () => void
  disabled?: boolean
  style?: ViewStyle
}

export function CustomButton({ title, onPress, disabled, style }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      style={[{
        backgroundColor: disabled ? "#cbd5e1" : colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
      }, style]}
    >
      <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700", fontSize: 16 }}>{title}</Text>
    </TouchableOpacity>
  )
}