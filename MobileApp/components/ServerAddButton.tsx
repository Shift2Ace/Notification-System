import {
  StyleSheet,
  View,
  Pressable,
  Animated,
  Dimensions,
  Text,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ToastAndroid,
  Platform,
  Easing, 
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useRef, useState } from "react";

import Space from "./Space";
import * as EventManager from "./EventManager";

import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

const { width, height } = Dimensions.get("window");
const serverListUri = FileSystem.documentDirectory + "serverList.json";

export default function ServerAddButton() {
  const padding = 30;
  const buttonSize = 60;
  const formHeight = height * 0.5;
  const formWidth = width - padding * 2;
  const formRight = width / 2 - formWidth / 2;
  const [isFormVisible, setIsFormVisible] = useState(false);

  const [formAlias, setFormAlias] = useState("");
  const [formHost, setFormHost] = useState("");
  const [formPort, setFormPort] = useState("");
  const [formKey, setFormKey] = useState("");

  const animation = useRef(new Animated.Value(0)).current;

  let keyboardVisible = false;

  // Listen to keyboard events
  Keyboard.addListener("keyboardDidShow", () => {
    keyboardVisible = true;
  });
  Keyboard.addListener("keyboardDidHide", () => {
    keyboardVisible = false;
  });

  const clearForm = () => {
    setFormAlias("");
    setFormHost("");
    setFormKey("");
  };

  const handlePress = () => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
    setIsFormVisible(true);
  };

  const handleCloseButtonPress = () => {
    clearForm();
    setIsFormVisible(false);
    Animated.timing(animation, {
      toValue: 0,
      duration: 1000,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  };

  const handleTouchableWithoutFeedback = () => {
    if (keyboardVisible) {
      Keyboard.dismiss();
    } else {
      handleCloseButtonPress();
    }
  };

  const handleUploadKeyFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pgp-keys",
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        console.log(result.assets[0].uri);
        const fileContent = await FileSystem.readAsStringAsync(
          result.assets[0].uri
        );
        setFormKey(fileContent);
      }
    } catch (error) {
      console.error(error);
      if (Platform.OS === "android") {
        ToastAndroid.show("Error: Failed to read the file", ToastAndroid.SHORT);
      } else {
        Alert.alert("Error", "Failed to read the file");
      }
    }
  };

  const isValidHost = (host: string) => {
    const ipRegex =
      /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
    const hostnameRegex =
      /^(?=.{1,253}$)(?!.*\.\.)(?!-)(?!.*-$)(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,}$/;
    return ipRegex.test(host) || hostnameRegex.test(host);
  };

  const handleSubmit = async () => {
    if (formAlias === "" || formAlias == null) {
      if (Platform.OS === "android") {
        ToastAndroid.show("Error: Alias cannot be empty", ToastAndroid.SHORT);
      } else {
        Alert.alert("Error", "Alias cannot be empty");
      }
      return;
    }
    if (!isValidHost(formHost)) {
      if (Platform.OS === "android") {
        ToastAndroid.show("Error: Invalid Host", ToastAndroid.SHORT);
      } else {
        Alert.alert("Error", "Invalid Host");
      }
      return;
    }

    const portNumber = parseInt(formPort, 10);

    if (isNaN(portNumber) || portNumber < 0 || portNumber > 65535) {
      if (Platform.OS === "android") {
        ToastAndroid.show("Error: Invalid Port", ToastAndroid.SHORT);
      } else {
        Alert.alert("Error", "Invalid Port");
      }
      return;
    }
    // Add to serverList.json
    const nowTime = Date.now();
    const newServer = {
      id: nowTime,
      alias: formAlias,
      host: formHost,
      port: portNumber,
      key: formKey,
      lastMortify: nowTime,
      status: 0,
      nonReadMessage: { 0: 0, 1: 0, 2: 0, 3: 0 },
    };

    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(serverListUri);
      let serverList = [];

      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(serverListUri);
        serverList = JSON.parse(content);
      }

      // Append new server
      serverList.push(newServer);

      // Save updated list
      await FileSystem.writeAsStringAsync(
        serverListUri,
        JSON.stringify(serverList, null, 2)
      );
      EventManager.notifyServerListChanged();
    } catch (error) {
      console.error("Error saving server:", error);
    }
  };

  const formAnimatedStyle = {
    right: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [padding, formRight],
    }),
    width: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [buttonSize, formWidth],
    }),
    borderRadius: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [buttonSize / 2, 10],
    }),
    backgroundColor: animation.interpolate({
      inputRange: [0, 1],
      outputRange: ["#007AFF", "white"],
    }),
    height: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [buttonSize, formHeight],
    }),
  };

  const styles = StyleSheet.create({
    button: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
    },
    form: {
      position: "absolute",
      bottom: padding,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    formInput: {
      borderWidth: 0.5,
      borderRadius: 10,
      borderTopLeftRadius: 0,
      padding: 10,
      height: 50,
      fontSize: 20,
    },
    formSubtitle: {
      textOverflow: "clip",
    },
  });

  return (
    <>
      {isFormVisible && (
        <TouchableWithoutFeedback onPress={handleTouchableWithoutFeedback}>
          <View
            style={{
              backgroundColor: "transparent",
              width: "100%",
              height: "100%",
              position: "absolute",
            }}
          />
        </TouchableWithoutFeedback>
      )}

      <Animated.View style={[styles.form, formAnimatedStyle]}>
        {!isFormVisible ? (
          <View style={{ flexDirection: "row-reverse" }}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: pressed
                    ? "rgba(0, 0, 0, 0.1)"
                    : "transparent",
                },
              ]}
              onPress={handlePress}
            >
              <AntDesign name="plus" size={24} color="white" />
            </Pressable>
          </View>
        ) : (
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View>
              {/* Close button */}
              <View style={{ flexDirection: "row-reverse" }}>
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    {
                      backgroundColor: pressed
                        ? "rgba(0, 0, 0, 0.1)"
                        : "transparent",
                    },
                  ]}
                  onPress={handleCloseButtonPress}
                >
                  <AntDesign name="closecircleo" size={24} color="black" />
                </Pressable>
              </View>
              {/* Form */}

              <View style={{ padding: 10 }}>
                <ScrollView>
                  <Text numberOfLines={1} style={styles.formSubtitle}>
                    Alias
                  </Text>
                  <TextInput
                    value={formAlias}
                    style={styles.formInput}
                    onChangeText={setFormAlias}
                  />
                  <Space height={5} />
                  <Text numberOfLines={1} style={styles.formSubtitle}>
                    Hostname / IP Address
                  </Text>
                  <TextInput
                    value={formHost}
                    style={styles.formInput}
                    onChangeText={setFormHost}
                  />
                  <Text numberOfLines={1} style={styles.formSubtitle}>
                    Port
                  </Text>
                  <TextInput
                    value={formPort}
                    style={styles.formInput}
                    onChangeText={setFormPort}
                    keyboardType="number-pad"
                  />
                  <Space height={5} />
                  <Text numberOfLines={1} style={styles.formSubtitle}>
                    Key
                  </Text>
                  <View style={{ flexDirection: "row-reverse", height: 51 }}>
                    <Pressable
                      onPress={handleUploadKeyFile}
                      style={({ pressed }) => [
                        styles.button,
                        {
                          borderWidth: 0.5,
                          borderRadius: 10,
                          marginLeft: 10,
                          height: 50,
                          width: 50,
                          backgroundColor: pressed ? "#E0E0E0" : "white",
                        },
                      ]}
                    >
                      <AntDesign name="upload" size={24} color="black" />
                    </Pressable>

                    <TextInput
                      value={formKey}
                      style={[styles.formInput, { flex: 1 }]}
                      onChangeText={setFormKey}
                    />
                  </View>
                  <Space height={50} />

                  <Pressable
                    onPress={handleSubmit}
                    style={({ pressed }) => [
                      styles.button,
                      {
                        width: "auto",
                        borderRadius: 10,
                        height: 50,
                        paddingHorizontal: 20,
                        backgroundColor: pressed ? "#005BBB" : "#007AFF",
                      },
                    ]}
                  >
                    <Text style={{ color: "white", fontSize: 15 }}>SUBMIT</Text>
                  </Pressable>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}
      </Animated.View>
    </>
  );
}
