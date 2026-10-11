import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosError } from 'axios';
import { of, throwError } from 'rxjs';
import { WeatherService } from './weather.service';

describe('WeatherService', () => {
  let service: WeatherService;
  let httpService: HttpService;

  const mockConfigService = {
    get: (key: string, defaultValue?: string) => {
      if (key === 'OPENWEATHER_API_KEY') return 'fake-key';
      if (key === 'OPENWEATHER_TIMEOUT_MS') return '5000';
      return defaultValue;
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: HttpService, useValue: { get: jest.fn() } },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('deve retornar dados normalizados em caso de sucesso', async () => {
    jest.spyOn(httpService, 'get').mockReturnValueOnce(
      of({
        data: {
          name: 'Fortaleza',
          weather: [{ main: 'Clear', description: 'céu limpo', icon: '01d' }],
          main: {
            temp: 30,
            feels_like: 32,
            temp_min: 28,
            temp_max: 31,
            humidity: 70,
          },
          wind: { speed: 5 },
          dt: 1710000000,
        },
      } as any),
    );

    const result = await service.getWeatherByCity('Fortaleza');

    expect(result.success).toBe(true);
    expect(result.data?.local).toBe('Fortaleza');
  });

  it('não deve lançar exceção e deve retornar success:false em caso de timeout', async () => {
    jest.spyOn(httpService, 'get').mockReturnValueOnce(
      // Simula uma chamada que nunca completa, forçando o timeout do RxJS
      new (require('rxjs').Observable)(() => {}),
    );

    // reduzir timeout para o teste não demorar
    (service as any).requestTimeoutMs = 50;

    const result = await service.getWeatherByCity('Cidade Qualquer');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Tempo limite');
  });

  it('não deve lançar exceção e deve retornar success:false em caso de erro 404', async () => {
    const axiosError = new AxiosError('Not Found');
    axiosError.response = { status: 404 } as any;

    jest
      .spyOn(httpService, 'get')
      .mockReturnValueOnce(throwError(() => axiosError));

    const result = await service.getWeatherByCity('Cidade Inexistente');

    expect(result.success).toBe(false);
    expect(result.error).toContain('não encontrado');
  });

  it('não deve lançar exceção e deve retornar success:false em caso de falha de conexão', async () => {
    const axiosError = new AxiosError('Connection refused');
    axiosError.code = 'ECONNREFUSED';

    jest
      .spyOn(httpService, 'get')
      .mockReturnValueOnce(throwError(() => axiosError));

    const result = await service.getWeatherByCity('Fortaleza');

    expect(result.success).toBe(false);
    expect(result.error).toContain('conectar');
  });
});
