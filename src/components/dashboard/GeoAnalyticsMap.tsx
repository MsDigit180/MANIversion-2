import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Layers,
  Building2,
  GraduationCap,
  Users,
  Compass,
  Maximize2,
  Info,
  Shield,
} from 'lucide-react';

interface GeoLocationItem {
  id: string;
  name: string;
  type: 'campus' | 'concours' | 'eleves_zone';
  lat: number;
  lng: number;
  quartier: string;
  details: string;
  count?: number;
  highlight?: string;
}

const NIAMEY_GEO_DATA: GeoLocationItem[] = [
  // 1. Campus Cab-Appuis
  {
    id: 'camp-1',
    name: 'Cab-Appuis · Campus Central Plateau',
    type: 'campus',
    lat: 13.5135,
    lng: 2.1098,
    quartier: 'Plateau I (Zone Ministères)',
    details: 'Siège administratif central, 12 salles de cours climatisées, laboratoire et secrétariat.',
    highlight: 'Siège Principal & Guichet Caisse',
    count: 148,
  },
  {
    id: 'camp-2',
    name: 'Cab-Appuis · Annexe Koira Kano',
    type: 'campus',
    lat: 13.5350,
    lng: 2.0950,
    quartier: 'Koira Kano (Nord-Ouest)',
    details: 'Pôle d\'excellence Primaire (CFEPD) et Collège, bibliothèque et espace prépa.',
    highlight: 'Pôle Primaire & Collège',
    count: 72,
  },
  {
    id: 'camp-3',
    name: 'Cab-Appuis · Antenne Pédagogique Yantala',
    type: 'campus',
    lat: 13.5220,
    lng: 2.0820,
    quartier: 'Yantala Haut',
    details: 'Centre de tutorat de proximité, cours du soir et études surveillées.',
    highlight: 'Études Surveillées',
    count: 36,
  },

  // 2. Centres de Concours Professionnels Partenaires (Niamey)
  {
    id: 'conc-1',
    name: 'ENA / ENAM Niger (École Nationale d\'Administration)',
    type: 'concours',
    lat: 13.5160,
    lng: 2.1120,
    quartier: 'Avenue du Général de Gaulle',
    details: 'Centre officiel de passage des épreuves de l\'ENA et concours directs de la Fonction Publique.',
    highlight: 'Concours ENA & Douanes',
    count: 42,
  },
  {
    id: 'conc-2',
    name: 'École Nationale de Police (ENP Niamey)',
    type: 'concours',
    lat: 13.4980,
    lng: 2.1420,
    quartier: 'Route Gamkallé / Zone Industrielle',
    details: 'Centre de formation et jury des concours de recrutement de la Police Nationale.',
    highlight: 'Police Nationale',
    count: 31,
  },
  {
    id: 'conc-3',
    name: 'Caserne État-Major Garde Nationale du Niger (GNN)',
    type: 'concours',
    lat: 13.5040,
    lng: 2.1380,
    quartier: 'Gamkallé Fleuve',
    details: 'Dépôt des dossiers et visites médicales pour les candidats à la Garde Nationale.',
    highlight: 'GNN Niger',
    count: 24,
  },
  {
    id: 'conc-4',
    name: 'Camp Gendarmerie Nationale (Koubia)',
    type: 'concours',
    lat: 13.5410,
    lng: 2.1460,
    quartier: 'Koubia / Niamey 2000',
    details: 'Centre des épreuves physiques et d\'aptitude pour la Gendarmerie Nationale.',
    highlight: 'Gendarmerie Nationale',
    count: 19,
  },
  {
    id: 'conc-5',
    name: 'Université Abdou Moumouni (Campus FST)',
    type: 'concours',
    lat: 13.5020,
    lng: 2.0850,
    quartier: 'Rive Droite / Nouveau Pont',
    details: 'Amphithéâtres retenus pour les concours de la Santé Publique (ENSP) et Éducation.',
    highlight: 'Santé Publique & Éducation',
    count: 15,
  },

  // 3. Zones de Provenance des Élèves (Quartiers de Niamey)
  {
    id: 'zone-1',
    name: 'Bassin d\'élèves · Yantala Haut & Bas',
    type: 'eleves_zone',
    lat: 13.5260,
    lng: 2.0790,
    quartier: 'Commune Niamey I',
    details: 'Forte concentration d\'élèves en Terminale C/D et Primaire CM2.',
    count: 54,
  },
  {
    id: 'zone-2',
    name: 'Bassin d\'élèves · Talladjé & Aéroport',
    type: 'eleves_zone',
    lat: 13.4890,
    lng: 2.1580,
    quartier: 'Commune Niamey IV',
    details: 'Élèves inscrits aux cours de renforcement en mathématiques et sciences physiques.',
    count: 38,
  },
  {
    id: 'zone-3',
    name: 'Bassin d\'élèves · Plateau & Nord',
    type: 'eleves_zone',
    lat: 13.5180,
    lng: 2.1020,
    quartier: 'Commune Niamey I',
    details: 'Proximité immédiate du Campus Central Cab-Appuis.',
    count: 68,
  },
  {
    id: 'zone-4',
    name: 'Bassin d\'élèves · Dar-Es-Salam & Lazaret',
    type: 'eleves_zone',
    lat: 13.5390,
    lng: 2.1280,
    quartier: 'Commune Niamey II',
    details: 'Candidats aux concours paramilitaires et collégiens en préparation BEPC.',
    count: 29,
  },
  {
    id: 'zone-5',
    name: 'Bassin d\'élèves · Bobiel & Francophonie',
    type: 'eleves_zone',
    lat: 13.5510,
    lng: 2.1150,
    quartier: 'Commune Niamey II',
    details: 'Élèves du cycle primaire et candidats préparant l\'entrée en 6ème.',
    count: 25,
  },
];

export const GeoAnalyticsMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupsRef = useRef<{
    campus: L.LayerGroup;
    concours: L.LayerGroup;
    eleves: L.LayerGroup;
  }>({
    campus: L.layerGroup(),
    concours: L.layerGroup(),
    eleves: L.layerGroup(),
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'campus' | 'concours' | 'eleves'>('all');
  const [selectedItem, setSelectedItem] = useState<GeoLocationItem | null>(null);

  // Initialize Leaflet Map (strictly once, totally independent of app theme)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Niamey coordinates
    const initialCenter: L.LatLngExpression = [13.518, 2.115];
    const initialZoom = 12;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
    });

    mapInstanceRef.current = map;

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 1. BASE LAYERS (Native Leaflet layer switcher)
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    });

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
      }
    );

    const cartoDarkLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap &copy; CARTO',
      }
    );

    // Add default base layer (OpenStreetMap Standard)
    osmLayer.addTo(map);

    // 2. LAYER GROUPS FOR OVERLAYS
    const campusGroup = L.layerGroup().addTo(map);
    const concoursGroup = L.layerGroup().addTo(map);
    const elevesGroup = L.layerGroup().addTo(map);

    layerGroupsRef.current = {
      campus: campusGroup,
      concours: concoursGroup,
      eleves: elevesGroup,
    };

    // 3. CREATE DIVICONS AND MARKERS
    NIAMEY_GEO_DATA.forEach((item) => {
      let iconHtml = '';
      let markerGroup = campusGroup;

      if (item.type === 'campus') {
        markerGroup = campusGroup;
        iconHtml = `
          <div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;background:#4f46e5;color:#fff;border-radius:10px;border:2px solid #ffffff;box-shadow:0 4px 10px rgba(0,0,0,0.35);font-size:16px;">
            🎓
          </div>
        `;
      } else if (item.type === 'concours') {
        markerGroup = concoursGroup;
        iconHtml = `
          <div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:#9333ea;color:#fff;border-radius:50%;border:2px solid #ffffff;box-shadow:0 4px 10px rgba(0,0,0,0.35);font-size:15px;">
            🏛️
          </div>
        `;
      } else {
        markerGroup = elevesGroup;
        const radius = Math.min(36, Math.max(26, Math.round(item.count! / 2)));
        iconHtml = `
          <div style="display:flex;align-items:center;justify-content:center;width:${radius}px;height:${radius}px;background:rgba(16,185,129,0.9);color:#ffffff;border-radius:50%;border:2px solid #ffffff;font-size:11px;font-weight:700;box-shadow:0 3px 8px rgba(0,0,0,0.3);font-family:sans-serif;">
            ${item.count}
          </div>
        `;
      }

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: iconHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([item.lat, item.lng], { icon: customIcon });

      // Rich popup
      const popupHtml = `
        <div style="font-family:'Plus Jakarta Sans',sans-serif;min-width:210px;color:#0f172a;padding:2px;">
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;text-transform:uppercase;color:${
            item.type === 'campus' ? '#4f46e5' : item.type === 'concours' ? '#9333ea' : '#059669'
          };">
            <span>${
              item.type === 'campus'
                ? '★ Campus Cab-Appuis'
                : item.type === 'concours'
                ? '🏛️ Centre de Concours'
                : '👥 Concentration Élèves'
            }</span>
          </div>
          <h4 style="font-size:13px;font-weight:700;margin:4px 0 2px;color:#020617;line-height:1.25;">
            ${item.name}
          </h4>
          <div style="font-size:11px;color:#64748b;margin-bottom:6px;">
            📍 ${item.quartier}
          </div>
          <p style="font-size:11px;color:#334155;line-height:1.4;margin:0 0 6px;">
            ${item.details}
          </p>
          ${
            item.count
              ? `<div style="background:#f1f5f9;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:600;color:#0f172a;display:inline-block;">
                  Effectif rattaché : <strong>${item.count} inscrits</strong>
                </div>`
              : ''
          }
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280 });
      marker.on('click', () => setSelectedItem(item));

      marker.addTo(markerGroup);
    });

    // 4. NATIVE LEAFLET LAYER CONTROL (Total Independence from Global App Theme)
    const baseMaps = {
      '🗺️ Plan OpenStreetMap': osmLayer,
      '🛰️ Vue Satellite (Esri)': satelliteLayer,
      '🌃 CartoDB Dark Matter': cartoDarkLayer,
    };

    const overlayMaps = {
      '🎓 Campus Cab-Appuis': campusGroup,
      '🏛️ Centres de Concours': concoursGroup,
      '👥 Zones Élèves (Niamey)': elevesGroup,
    };

    L.control
      .layers(baseMaps, overlayMaps, {
        position: 'topright',
        collapsed: false,
      })
      .addTo(map);

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run strictly once - completely isolated from app theme changes

  // Filter overlays interactively
  const handleFilterChange = (filter: 'all' | 'campus' | 'concours' | 'eleves') => {
    setActiveFilter(filter);
    const map = mapInstanceRef.current;
    if (!map) return;

    const { campus, concours, eleves } = layerGroupsRef.current;

    if (filter === 'all') {
      if (!map.hasLayer(campus)) map.addLayer(campus);
      if (!map.hasLayer(concours)) map.addLayer(concours);
      if (!map.hasLayer(eleves)) map.addLayer(eleves);
    } else if (filter === 'campus') {
      if (!map.hasLayer(campus)) map.addLayer(campus);
      if (map.hasLayer(concours)) map.removeLayer(concours);
      if (map.hasLayer(eleves)) map.removeLayer(eleves);
    } else if (filter === 'concours') {
      if (map.hasLayer(campus)) map.removeLayer(campus);
      if (!map.hasLayer(concours)) map.addLayer(concours);
      if (map.hasLayer(eleves)) map.removeLayer(eleves);
    } else if (filter === 'eleves') {
      if (map.hasLayer(campus)) map.removeLayer(campus);
      if (map.hasLayer(concours)) map.removeLayer(concours);
      if (!map.hasLayer(eleves)) map.addLayer(eleves);
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([13.518, 2.115], 12, { animate: true });
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden transition-colors">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Compass className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Cartographie Opérationnelle & Répartition Niamey
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Implantation des campus Cab-Appuis, centres officiels de concours et densité des élèves par quartier.
          </p>
        </div>

        {/* Quick Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 text-xs">
            <button
              onClick={() => handleFilterChange('all')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => handleFilterChange('campus')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeFilter === 'campus'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Campus (3)
            </button>
            <button
              onClick={() => handleFilterChange('concours')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeFilter === 'concours'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Concours (5)
            </button>
            <button
              onClick={() => handleFilterChange('eleves')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeFilter === 'eleves'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Quartiers Élèves
            </button>
          </div>

          <button
            onClick={handleRecenter}
            className="flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
            title="Recentrer sur Niamey"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Recentrer</span>
          </button>
        </div>
      </div>

      {/* Map Viewport Container */}
      <div className="relative w-full h-[380px] sm:h-[440px] bg-slate-100 dark:bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Autonomous Notice */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-[11px] text-slate-600 dark:text-slate-300 shadow-md max-w-xs pointer-events-none">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
            <Layers className="h-3.5 w-3.5 text-indigo-500" />
            <span>Contrôle Leaflet Indépendant</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            Calque autonome sélectionnable en haut à droite (Plan, Satellite, Dark Matter) sans dépendance du thème global de l'app.
          </p>
        </div>
      </div>

      {/* Footer Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 text-xs">
        <div className="p-3">
          <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block"></span>
            <span>Campus Cab-Appuis</span>
          </div>
          <div className="mt-1 font-mono font-bold text-slate-900 dark:text-white text-sm">
            3 sites à Niamey
          </div>
          <div className="text-[10px] text-slate-400">Plateau, Koira Kano, Yantala</div>
        </div>

        <div className="p-3">
          <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-500 inline-block"></span>
            <span>Centres Concours Liés</span>
          </div>
          <div className="mt-1 font-mono font-bold text-slate-900 dark:text-white text-sm">
            5 pôles officiels
          </div>
          <div className="text-[10px] text-slate-400">ENA, Police, Gendarmerie, GNN</div>
        </div>

        <div className="p-3">
          <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Élèves Géolocalisés</span>
          </div>
          <div className="mt-1 font-mono font-bold text-slate-900 dark:text-white text-sm">
            256 apprenants
          </div>
          <div className="text-[10px] text-slate-400">Ventilés sur 5 arrondissements</div>
        </div>

        <div className="p-3">
          <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-indigo-500" />
            <span>Zone Principale</span>
          </div>
          <div className="mt-1 font-bold text-slate-900 dark:text-white text-sm">
            Niamey Urbain (Niger)
          </div>
          <div className="text-[10px] text-slate-400">Rayon d'action opérationnel</div>
        </div>
      </div>
    </div>
  );
};
