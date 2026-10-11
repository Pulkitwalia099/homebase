import { ImageResponse } from "next/og";
export const alt = "GoLocal — Local services, ready for the agent era";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OGImage() { return new ImageResponse(<div style={{ background: "#193c32", color: "#f5f2e9", width: "100%", height: "100%", padding: "65px 80px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}><div style={{ fontSize: 40, fontWeight: 700, display: "flex" }}>GoLocal<span style={{ color: "#ed603c" }}>.</span></div><div style={{ display: "flex", flexDirection: "column", fontSize: 76, lineHeight: 1.1, letterSpacing: -3 }}><span>Local services,</span><span style={{ color: "#dde4d6" }}>ready for the agent era.</span></div><div style={{ fontSize: 22, color: "#c9d3c5", display: "flex", justifyContent: "space-between" }}><span>Businesses · Agents · Channel partners</span><span>getgolocal.com</span></div></div>, size); }
