import { ReactNode } from "react"
import { View, Text, TextInput, TextInputProps } from "react-native"

interface Props extends TextInputProps {
  label?: string
  errorText?: string
  leftSlot?: ReactNode
  rightComponent?: ReactNode
}

export function CustomInput({ label, errorText, leftSlot, rightComponent, style, ...rest }: Props) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={{ marginBottom: 6, color: "#222", fontWeight: "600" }}>{label}</Text> : null}
      <View style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: errorText ? "#f33" : "#ddd",
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fafafa",
      }}>
        {leftSlot ? <View style={{ marginRight: 8 }}>{leftSlot}</View> : null}
        <TextInput
          placeholderTextColor="#9aa0a6"
          style={[{ flex: 1, paddingVertical: 12, color: "#111", fontSize: 16 }, style as any]}
          {...rest}
        />
        {rightComponent ? <View style={{ marginLeft: 8 }}>{rightComponent}</View> : null}
      </View>
      {errorText ? <Text style={{ marginTop: 6, color: "#c00", fontSize: 12 }}>{errorText}</Text> : null}
    </View>
  )
}