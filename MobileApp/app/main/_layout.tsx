import { Tabs } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";

export default function Layout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="serverList"
        options={{
          headerShown: false,
          title: "Server List",
          animation:"shift",
          tabBarIcon: ({ color, size }) => (
            <Entypo name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          headerShown: false,
          
          title: "Settings",
          animation:"shift",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="setting" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
