import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  Pressable,
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as EventManager from "./EventManager";
import Space from "./Space";
import { useRouter } from "expo-router";
import colorTable from "@/assets/colorTable";

const serverListUri = FileSystem.documentDirectory + "serverList.json";

type serverListItem = {
  id: number;
  alias: string;
  host: string;
  port: number;
  key: string;
  lastMortify: number;
  status: number;
  nonReadMessage: {
    "0": number;
    "1": number;
    "2": number;
    "3": number;
  };
};

const ServerList = () => {
  const [serverList, setServerList] = useState([]);
  const [onSelect, setOnSelect] = useState(0);

  // Load server
  const loadServerList = async () => {
    const fileInfo = await FileSystem.getInfoAsync(serverListUri);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(serverListUri);
      setServerList(JSON.parse(content));
      console.log(content);
    }
  };

  useEffect(() => {
    loadServerList();

    const unsubscribe = EventManager.subscribeToServerListChange(() => {
      loadServerList();
    });

    return () => unsubscribe();
  }, []);

  const router = useRouter();

  // Route to /messages
  const handleListItemPress = () => {
    router.push("/messages");
  };

  // show to number of nonReadMessage
  const nonReadMessageNumber = (level: number, numberOfMessage: number) => {
    let levelColor = "";
    let backgroundColor = "";

    switch (level) {
      case 0:
        levelColor = colorTable.infoMessage;
        backgroundColor = colorTable.infoMessageDark;
        break;
      case 1:
        levelColor = colorTable.debugMessage;
        backgroundColor = colorTable.debugMessageDark;

        break;
      case 2:
        levelColor = colorTable.warningMessage;
        backgroundColor = colorTable.warningMessageDark;

        break;
      case 3:
        levelColor = colorTable.errorMessage;
        backgroundColor = colorTable.errorMessageDark;
    }
    return (
      <Text
        style={[
          styles.nonReadMessageNumber,
          { borderColor: levelColor, backgroundColor: backgroundColor },
        ]}
      >
        {numberOfMessage > 99 ? "99+" : numberOfMessage}
      </Text>
    );
  };

  // Layer of every message
  let renderItem = ({ item }: { item: serverListItem }) => (
    <View style={styles.itemContainer}>
      <View
        style={[
          styles.status,
          {
            backgroundColor:
              item.status === 1
                ? colorTable.debugMessage
                : colorTable.errorMessage,
          },
        ]}
      />
      <Pressable
        style={({ pressed }) => [
          styles.itemContent,
          {
            backgroundColor: pressed ? "rgb(234, 234, 234)" : "white",
            marginLeft: pressed ? 3 : 0,
            marginRight: pressed ? 3 : 0,
          },
        ]}
        onPress={handleListItemPress}
        onLongPress={() => setOnSelect(item.id)}
      >
        <Text style={styles.alias}>{item.alias}</Text>
        <Text style={styles.host}>
          {item.host}:{item.port}
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          {item.nonReadMessage[0] > 0 &&
            nonReadMessageNumber(0, item.nonReadMessage[0])}
          {item.nonReadMessage[1] > 0 &&
            nonReadMessageNumber(1, item.nonReadMessage[1])}
          {item.nonReadMessage[2] > 0 &&
            nonReadMessageNumber(2, item.nonReadMessage[2])}
          {item.nonReadMessage[3] > 0 &&
            nonReadMessageNumber(3, item.nonReadMessage[3])}
        </View>
        {onSelect !== 0 && (
          <TouchableWithoutFeedback onPress={() => setOnSelect(0)}>
            <View style={{ ...StyleSheet.absoluteFillObject }}></View>
          </TouchableWithoutFeedback>
        )}
        {onSelect === item.id && (
          //todo add animation
          <View style={{ flexDirection: "row" }}>
            <Pressable
              style={[styles.button, { backgroundColor: "rgb(59, 59, 59)" }]}
            >
              <Text style={{ color: "white" }}>Edit</Text>
            </Pressable>
            <Pressable style={[styles.button, { backgroundColor: "red" }]}>
              <Text style={{ color: "white" }}>Remove</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    </View>
  );

  // Final output
  return (
    <>
      <View style={styles.container}>
        <Pressable onPress={() => setOnSelect(0)}>
          <FlatList
            data={serverList}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            ListFooterComponent={<Space height={120} />}
            style={{ height: "100%" }}
          />
        </Pressable>
      </View>
    </>
  );
};

// Style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  itemContainer: {
    flexDirection: "row",
    padding: 6,
    paddingBottom: 0,
  },
  itemContent: {
    flex: 1,
    borderRadius: 4,
    padding: 8,
    backgroundColor: "white",
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    // Elevation for Android
    elevation: 5,
  },
  alias: {
    fontSize: 25,
    fontWeight: "400",
  },
  host: {
    fontSize: 10,
    color: "#555",
    marginBottom: 5,
  },
  status: {
    width: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  nonReadMessageNumber: {
    marginLeft: 5,
    width: "10%",
    borderRadius: 10,
    borderWidth: 3,
    color: "white",
    textAlign: "center",
  },
  button: {
    width: 80,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    marginRight: 5,
  },
});

export default ServerList;
