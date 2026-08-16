// Shared free-tile definitions used across every RAVA map.
// Satellite = Esri World Imagery (free), Dark = Carto dark (free).
export type MapStyle = "satellite" | "dark";

export const TILES: Record<MapStyle, { url: string; attr: string; maxZoom: number }> = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr: "Tiles &copy; Esri — Source: Esri, Earthstar Geographics",
    maxZoom: 19,
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attr: "&copy; OSM &copy; CARTO",
    maxZoom: 20,
  },
};
