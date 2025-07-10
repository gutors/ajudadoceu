export interface LFCPeriod {
  inicio: string;
  fim: string;
}

export interface MercurioRetrogrado {
  status: boolean;
  periodo: string | null;
}

export interface Eclipse {
  tipo: string;
  horario: string;
  descricao: string;
}

export interface DailyData {
  fase_lua: string;
  lfc: LFCPeriod[];
  mercurio_retrogrado: MercurioRetrogrado;
  outros_retrogrados: string[];
  transitos: string[];
  eclipse: Eclipse | null;
}

export interface AstrologicalData {
  [date: string]: DailyData;
}


