export type CostosResumen = {
  fechaActualizacion: string;
  manoDeObraM2: number;
  materialesM2: number;
  costoTotalM2: number;
  variacionMensualPct: number;
};

export type ModeloVivienda = {
  id: string;
  nombre: string;
  superficieM2: number | null;
  dormitorios: number | null;
  banos: number | null;
  toilettes: number | null;
  imgUrl: string | null;
  planoUrl: string | null;
  costoM2: number;
  costoTotal: number;
};

export type MaterialMuestra = {
  id: string;
  codigo: string | null;
  nombre: string;
  categoria: string;
  unidad: string;
  precio: number;
};

export type TareaMuestra = {
  id: string;
  codigo: string | null;
  descripcion: string;
  etapa: string;
  unidad: string;
  precio: number;
};

export type RecursoUocra = {
  id: string;
  categoria: string;
  zona: string;
  especialidad: string;
  jornalHora: number;
  jornalDia: number;
};

export type Indice = {
  id: string;
  nombre: string;
  fuente: string;
  valor: number;
  variacionMensualPct: number | null;
  fechaVigencia: string;
};

export type Tutorial = {
  id: string;
  titulo: string;
  descripcion: string;
  youtubeId: string;
  orden: number;
};

export type ComputoItem = {
  id: string;
  codigo: string | null;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
};

export type ComputoEtapa = {
  id: string;
  nombre: string;
  orden: number;
  items: ComputoItem[];
  subtotal: number;
};

export type ComputoListItem = {
  id: string;
  nombre: string;
  superficieM2: number | null;
  etapasCount: number;
  total: number;
  updatedAt: string;
};

export type ItemDetalle = {
  id: string;
  codigo: string | null;
  descripcion: string;
  unidad: string;
  cantidad: number;
  orden: number;
  esPersonalizado: boolean;
  tareaId: string | null;
  precioUnitario: number;
  total: number;
  desglose: { material: number; mano_de_obra: number; equipo: number; subcontrato: number };
};

export type EtapaDetalle = {
  id: string;
  nombre: string;
  orden: number;
  items: ItemDetalle[];
  subtotal: number;
};

export type ComputoDetalle = {
  id: string;
  nombre: string;
  superficieM2: number | null;
  ggPct: number;
  beneficioPct: number;
  ivaPct: number;
  createdAt: string;
  updatedAt: string;
  etapas: EtapaDetalle[];
  resumen: {
    subtotal: number;
    ggPct: number;
    gg: number;
    beneficioPct: number;
    beneficio: number;
    ivaPct: number;
    iva: number;
    total: number;
  };
};

export type TareaBusqueda = {
  id: string;
  codigo: string | null;
  descripcion: string;
  etapa: string;
  unidad: string;
  precio: number;
};

export type TareaAPU = {
  id: string;
  codigo: string | null;
  descripcion: string;
  etapa: string;
  unidad: string;
  recursos: {
    id: string;
    tipo: string;
    materialId: string | null;
    nombre: string;
    unidad: string;
    rendimiento: number;
    precioUnitario: number;
    parcial: number;
  }[];
  subtotales: { material: number; mano_de_obra: number; equipo: number; subcontrato: number };
  precioUnitario: number;
};

export type IncidenciaData = {
  total: number;
  porEtapa: { etapa: string; subtotal: number; pct: number }[];
  porTipo: { tipo: string; subtotal: number; pct: number }[];
};

export type ComputoModeloDetalle = {
  id: string;
  nombre: string;
  superficieM2: number | null;
  dormitorios: number | null;
  banos: number | null;
  toilettes: number | null;
  imgUrl: string | null;
  planoUrl: string | null;
  memoria: string | null;
  etapas: ComputoEtapa[];
  resumen: {
    subtotal: number;
    ggPct: number;
    gg: number;
    beneficioPct: number;
    beneficio: number;
    ivaPct: number;
    iva: number;
    total: number;
  };
};
