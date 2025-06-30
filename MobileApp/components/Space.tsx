import {View } from "react-native";
type Props = {
  height: number;
};
export default function Space({ height }: Props) {
  return <View style={{height}} />;
}


