import React, { useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  Pressable,
  TouchableWithoutFeedback,
  Animated,
  Easing,
} from "react-native";
import * as EventManager from "./EventManager";
import Space from "./Space";
import { useRouter } from "expo-router";
import colorTable from "@/assets/colorTable";
import { getDB } from "./database";


type serverListItem = {
  id: number;
  alias: string;
  host: string;
  port: number;
  key: string;
  lastMortify: number;
  status: number;
  nonReadMessage0: number;
  nonReadMessage1: number;
  nonReadMessage2: number;
  nonReadMessage3: number;
};

const ServerList = () => {
  const [serverList, setServerList] = useState([]);
  const [onSelect, setOnSelect] = useState(0);

  const animation = useRef(new Animated.Value(0)).current;

  const buttonAnimatedStyle = {
    opacity: animation,

    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0], // Slide up
        }),
      },
    ],
  };

  // Load server
  const loadServerList = async () => {
    try {
      const db = getDB();
      const databaseResult = await db.getAllAsync(
        "SELECT * FROM servers ORDER BY lastMortify DESC"
      );

      setServerList(databaseResult);
    } catch (error) {
      console.error("Failed to load servers from DB:", error);
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

  const handleLongPress = (id: number) => {
    setOnSelect(id);
    Animated.timing(animation, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  };

  const handleDeselect = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.in(Easing.ease),
    }).start(() => {
      setOnSelect(0);
    });
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
      {/* Status bar */}
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
      {/* Item content */}
      <Pressable
        style={({ pressed }) => [
          styles.itemContent,
          {
            backgroundColor:
              pressed || onSelect === item.id ? "rgb(234, 234, 234)" : "white",
            marginLeft: pressed ? 3 : 0,
            marginRight: pressed ? 3 : 0,
          },
        ]}
        onPress={handleListItemPress}
        onLongPress={() => handleLongPress(item.id)}
      >
        <Text style={styles.alias}>{item.alias}</Text>
        <Text style={styles.host}>
          {item.host}:{item.port}
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          {item.nonReadMessage0 > 0 &&
            nonReadMessageNumber(0, item.nonReadMessage0)}
          {item.nonReadMessage1 > 0 &&
            nonReadMessageNumber(1, item.nonReadMessage1)}
          {item.nonReadMessage2 > 0 &&
            nonReadMessageNumber(2, item.nonReadMessage2)}
          {item.nonReadMessage3 > 0 &&
            nonReadMessageNumber(3, item.nonReadMessage3)}
        </View>
        {onSelect !== 0 && (
          <TouchableWithoutFeedback onPress={handleDeselect}>
            <View style={{ ...StyleSheet.absoluteFillObject }}></View>
          </TouchableWithoutFeedback>
        )}

        {onSelect === item.id && (
          <Animated.View
            style={[styles.buttonSetContainer, buttonAnimatedStyle]}
          >
            <View style={[styles.buttonContainer]}>
              <Pressable
                style={[
                  styles.button,
                  { backgroundColor: "rgb(59, 59, 59)" },
                  ,
                ]}
              >
                <Text style={{ color: "white" }}>Edit</Text>
              </Pressable>
            </View>
            <View style={[styles.buttonContainer]}>
              <Pressable
                style={[styles.button, { backgroundColor: "rgb(255, 0, 0)" }]}
              >
                <Text style={{ color: "white" }}>Remove</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </Pressable>
    </View>
  );

  // Final output
  return (
    <>
      <View style={styles.container}>
        <Pressable onPress={handleDeselect}>
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
  },
  buttonSetContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    ...StyleSheet.absoluteFillObject,
    position: "absolute",
  },
  buttonContainer: {
    flex: 1,
    margin: 5,
  },
});

export default ServerList;
