import { View, StyleSheet } from "react-native";
import ServerAddButton from "@/components/ServerAddButton";
import ServerList from "@/components/ServerList";
export default function Index() {
  return (
    <View style={styles.mainView}>
      <ServerList />
      <ServerAddButton />
    </View>
  );
}

const styles = StyleSheet.create({
  mainView: {
    flex: 1,
  }
});
