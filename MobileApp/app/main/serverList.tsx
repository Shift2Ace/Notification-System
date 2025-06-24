import { Text, View } from 'react-native'
import { Link } from 'expo-router';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center"
      }}
    >
      <div>
        
      </div>
      <Text>Server List</Text>
      <Link href="/messages">message</Link>
    </View>
  );
}
