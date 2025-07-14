import { ReactNode } from "react";

export const Cell = () => <rect />;
export const Tooltip = () => <div></div>;
export const Rect = () => <rect />;
export const Area = () => <path />;

export const AreaChart = ({ children }: { children: ReactNode }) => (
  <svg>{children}</svg>
);
export const ResponsiveContainer = ({
  children,
  width,
  height,
}: {
  children: ReactNode;
  width: string | number;
  height: string | number;
}) => <div style={{ width: width, height: height }}>{children}</div>;
export const XAxis = () => <g />;
export const YAxis = () => <g />;
export const Bar = () => <rect />;
export const BarChart = ({ children }: { children: ReactNode }) => (
  <svg>{children}</svg>
);
export const CartesianGrid = () => <g />;
export const Legend = () => <div></div>;
export const Pie = () => <path />;

export const PieChart = ({ children }: { children: ReactNode }) => (
  <svg>{children}</svg>
);
export const Line = () => <path />;
export const LineChart = ({ children }: { children: ReactNode }) => (
  <svg>{children}</svg>
);
