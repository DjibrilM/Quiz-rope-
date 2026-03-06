import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { Path, G } from "react-native-svg";
import i18n from "../../i18n";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function ErrorIllustration() {
  return (
    <View style={{ marginBottom: 20 }}>
      <Svg width={80} height={80} viewBox="0 0 80 80" fill="none">
        <G>
          <Path d="M15 50c5-20 15-30 25-32s20 8 25 32" fill="#231C2B" stroke="#9B59B6" strokeWidth="2" />
          <Path d="M32 55l6-10 6 10" stroke="#E85D75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d="M48 52l4-6" stroke="#FFD93D" strokeWidth="2" strokeLinecap="round" />
          <Path d="M20 55h40" stroke="#9B59B6" strokeWidth="2" strokeLinecap="round" />
        </G>
      </Svg>
    </View>
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "#0D0B14",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <ErrorIllustration />
          <Text
            style={{
              fontSize: 32,
              fontFamily: "LuckiestGuy_400Regular",
              color: "#FFFFFF",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            {i18n.t("common:errors.somethingWentWrong")}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Nunito_400Regular",
              color: "#B8A9C9",
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            {i18n.t("common:errors.tryAgainLater")}
          </Text>
          <Pressable
            onPress={this.handleRetry}
            style={{
              backgroundColor: "#9B59B6",
              paddingHorizontal: 32,
              paddingVertical: 16,
              borderRadius: 16,
            }}
          >
            <Text
              style={{ color: "#FFFFFF", fontSize: 18, fontFamily: "Nunito_700Bold" }}
            >
              {i18n.t("common:buttons.tryAgain")}
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
