/**
 * Tipagem simplificada da resposta da API OpenWeatherMap
 * (endpoint /data/2.5/weather)
 */
export interface OpenWeatherMapResponse {
  name: string;
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  dt: number;
}

/**
 * Formato normalizado que o serviço devolve para o resto da aplicação,
 * independente do provedor externo usado por baixo dos panos.
 */
export interface WeatherForecast {
  local: string;
  temperatura: number;
  sensacaoTermica: number;
  temperaturaMin: number;
  temperaturaMax: number;
  umidade: number;
  vento: number;
  condicao: string;
  descricao: string;
  icone: string;
  atualizadoEm: Date;
}

/**
 * Retorno "seguro": nunca lança exceção não tratada para quem chama.
 * Quem consome o serviço decide o que fazer quando success = false.
 */
export interface WeatherResult {
  success: boolean;
  data?: WeatherForecast;
  error?: string;
}
