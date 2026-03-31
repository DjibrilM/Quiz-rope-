declare module "@chamodanethra/react-native-fitted-text" {
  import { ViewStyle, TextStyle } from "react-native";
  import { ReactNode } from "react";

  interface FittedTextGroupProps {
    group: string[];
    groupStyles?: ViewStyle;
    cellStyles?: ViewStyle;
    textStyles?: TextStyle;
    textWrapperStyles?: ViewStyle;
    children?: ReactNode[];
  }

  export const FittedTextGroup: React.FC<FittedTextGroupProps>;
}
