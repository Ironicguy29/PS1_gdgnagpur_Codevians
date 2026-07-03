declare module 'leaflet-defaulticon-compatibility';

declare module 'supercluster' {
  export type BBox = [number, number, number, number];

  export interface PointFeature<P = Record<string, unknown>> {
    type: 'Feature';
    geometry: {
      type: 'Point';
      coordinates: [number, number];
    };
    properties: P;
    id?: string | number;
  }

  export default class Supercluster<P = Record<string, unknown>> {
    constructor(options?: {
      radius?: number;
      maxZoom?: number;
      minPoints?: number;
      extent?: number;
      nodeSize?: number;
      log?: boolean;
    });

    load(points: Array<PointFeature<P>>): this;
    getClusters(bbox: BBox, zoom: number): Array<PointFeature<P>>;
    getClusterExpansionZoom(clusterId: number): number;
  }
}
