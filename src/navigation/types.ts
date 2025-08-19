import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import type { CompositeScreenProps } from "@react-navigation/native"

export type AppStackParamList = {
  Login: undefined
  Main: undefined
}
export type AppStackScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>

export type DemoTabParamList = {
  DemoShowroom: undefined
  DemoActivity: undefined
  Scan: undefined
  DemoPodcastList: undefined
  DemoDebug: undefined
}

export type DemoTabScreenProps<T extends keyof DemoTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<DemoTabParamList, T>,
    AppStackScreenProps<keyof AppStackParamList>
  >
