import { Text, StatusBar, View } from "react-native";

export default function HomeScreen() {
  // there should be nothing the top of the screen
  // the only content should be a text "Hello World"
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <StatusBar hidden={true} />
      <Text>Hello World</Text>
    </View>
  );
}
