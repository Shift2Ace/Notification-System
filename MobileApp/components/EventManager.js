import { EventEmitter } from 'expo-modules-core';

const eventManager = new EventEmitter();

export const notifyServerListChanged = () => {
  eventManager.emit("serverListChanged");
};

export const subscribeToServerListChange = (callback) => {
  const subscription = eventManager.addListener("serverListChanged", callback);
  return () => subscription.remove();
};
