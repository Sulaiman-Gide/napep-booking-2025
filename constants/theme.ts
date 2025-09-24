import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("screen");

export const COLORS = {
  white: "#ffffff",
  primary: "#f52d56",
  title: "#072F4A",
  lightGrey: "#D3D6D6",
  grey: "#C1C0C9",
  blue: "#087BB6",
  yellow: "#F4D03F",
  transparent: "transparent",
};

export const SIZES = {
  h1: 24,
  h2: 20,
  h3: 17,
  h4: 16,
  h5: 14,
  h6: 12,

  width,
  height,
};
