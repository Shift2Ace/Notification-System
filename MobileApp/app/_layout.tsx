import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
        <Stack.Screen name="main" options={{ headerShown: true, title: "Notification System"}} />
        <Stack.Screen name="messages" options={{ headerShown: true}} />
    </Stack>
  );
}