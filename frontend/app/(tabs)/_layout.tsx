import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Platform, StyleSheet } from "react-native";
import { colors } from "@/src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.onSurfaceTertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Einsätze",
          tabBarIcon: ({ color, size }) => (
            <Feather name="list" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-einsaetze",
        }}
      />
      <Tabs.Screen
        name="neu"
        options={{
          title: "Neuer Einsatz",
          tabBarIcon: ({ color, size }) => (
            <Feather name="plus-square" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-neuer-einsatz",
        }}
      />
      <Tabs.Screen
        name="statistik"
        options={{
          title: "Statistik",
          tabBarIcon: ({ color, size }) => (
            <Feather name="bar-chart-2" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-statistik",
        }}
      />
      <Tabs.Screen
        name="einstellungen"
        options={{
          title: "Einstellungen",
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-einstellungen",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.OS === "ios" ? 84 : 64,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
});
