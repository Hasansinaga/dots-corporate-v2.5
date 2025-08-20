import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  onClear?: () => void;
};

export const SearchBar: React.FC<Props> = ({
  value,
  onChangeText,
  onSubmit,
  placeholder = "Cari berdasarkan nama atau CIF",
  onClear,
}) => {
  const showClear = !!value?.length;
  return (
    <View style={S.wrap}>
      <FontAwesome6 name="magnifying-glass" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        style={S.input}
        placeholderTextColor="#9CA3AF"
      />
      {showClear && (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <FontAwesome6 name="xmark" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const S = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 12, height: 44,
  },
  input: {
    flex: 1, height: 44, fontSize: 15, color: "#111827",
    ...Platform.select({ android: { paddingVertical: 0 } }),
  },
});
