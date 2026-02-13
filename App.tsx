
import React, { useState, useEffect } from 'react';
import { WorkshopData, Stage } from './types.ts';
import { fetchWorkshopData } from './services/trelloService.ts';
import Clock from './components/Clock.tsx';
import VehicleRow from './components/VehicleRow.tsx';

const STAGE_PRIORITY: Record<Stage, number> = {
  'Garantia': 1,
  'Aguardando Avaliação': 2,
  'Em Avaliação': 3,
  'Aguardando Aprovação': 4,
  'Aprovado': 5,
  'Aguardando Peças': 6,
  'Em Serviço': 7,
  'Fase de Teste': 8,
  'Finalizado': 9,
  'Orçamento Não Aprovado': 10
};

const App: React.FC = () => {
  const [data, setData] = useState<WorkshopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const CARS_PER_PAGE = 6;

  const loadData = async () => {
    try {
      const result = await fetchWorkshopData();
      
      const sortedVehicles = result.vehicles
        .filter(v => STAGE_PRIORITY[v.stage] !== undefined)
        .sort((a, b) => {
          const priorityA = STAGE_PRIORITY[a.stage] || 99;
          const priorityB = STAGE_PRIORITY[b.stage] || 99;
          return priorityA - priorityB;
        });

      setData({
        ...result,
        vehicles: sortedVehicles
      });
    } catch (error) {
      console.error("Failed to fetch workshop data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const refreshInterval = setInterval(loadData, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    if (!data || data.vehicles.length <= CARS_PER_PAGE) {
      setPage(0);
      return;
    }

    const pageInterval = setInterval(() => {
      setPage((prev) => {
        const totalPages = Math.ceil(data.vehicles.length / CARS_PER_PAGE);
        return (prev + 1) % totalPages;
      });
    }, 10000);

    return () => clearInterval(pageInterval);
  }, [data]);

  if (loading && !data) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-white/5 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-white font-black tracking-[0.3em] text-[8px] animate-pulse uppercase">Conectando ao Trello...</p>
        </div>
      </div>
    );
  }

  const startIndex = page * CARS_PER_PAGE;
  const visibleVehicles = data?.vehicles.slice(startIndex, startIndex + CARS_PER_PAGE) || [];
  const totalPages = data ? Math.ceil(data.vehicles.length / CARS_PER_PAGE) : 1;

  return (
    <div className="h-screen w-screen bg-black flex flex-col p-4 pb-6 overflow-hidden select-none">
      <header className="flex justify-between items-end mb-2 px-4 h-12">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center">
            <img 
              src="logo.png" 
              alt="Logo" 
              className="w-16 h-16 object-contain translate-y-3"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          <div className="flex flex-col justify-end">
            <h1 className="text-lg font-black tracking-tight text-white uppercase italic leading-none">
              Controle de <span className="text-zinc-600">Pátio</span>
            </h1>
            <p className="text-[8px] font-bold text-zinc-500 tracking-[0.2em] uppercase leading-none mt-1">
              {data?.boardName} • {page + 1}/{totalPages}
            </p>
          </div>
        </div>
        <Clock />
      </header>

      <div className="flex items-center w-full px-12 mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-700 italic">
        <div className="w-[22%]">Modelo / Placa</div>
        <div className="w-[16%] pl-6">Cliente</div>
        <div className="w-[34%] pl-6">Etapa Atual</div>
        <div className="w-[14%] pl-6">Entrega</div>
        <div className="w-[14%] pl-6">Mecânico</div>
      </div>

      <main className="flex-1 flex flex-col gap-3 min-h-0">
        {visibleVehicles.map((vehicle) => (
          <VehicleRow key={vehicle.id} vehicle={vehicle} />
        ))}
        
        {Array.from({ length: Math.max(0, CARS_PER_PAGE - visibleVehicles.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="flex-1 flex items-center justify-center rounded-[24px] border border-dashed border-white/5 opacity-5">
            <span className="text-[9px] font-black tracking-[1em] text-white uppercase italic">Box Livre</span>
          </div>
        ))}
      </main>
    </div>
  );
};

export default App;
