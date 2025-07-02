import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { setupDatabase } from "../components/database"; // adjust path if needed

export default function Layout() {
  useEffect(() => {
    try{
      setupDatabase();
    }catch(error){
      console.error(error);
    }
    
  }, []);

  return (
    <Stack>
      <Stack.Screen
        name="main"
        options={{ headerShown: true, title: "Notification System" }}
      />
      <Stack.Screen
        name="messages"
        options={{ headerShown: true }}
      />
    </Stack>
  );
}
