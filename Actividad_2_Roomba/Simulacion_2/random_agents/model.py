from mesa import Model
from mesa.discrete_space import OrthogonalMooreGrid
from mesa.datacollection import DataCollector

from .agent import RandomAgent, ObstacleAgent, DirtyAgent, ChargingStation, dirty_agents, charging_station

class RandomModel(Model):
    """
    Creates a new model with random agents.
    Args:
        num_agents: Number of agents in the simulation
        height, width: The size of the grid to model
    """
    def __init__(self, num_agents=10, width=8, height=8, seed=42, dirty_cells=10, num_obstacles=10):

        super().__init__(seed=seed)
        self.num_agents = num_agents
        self.num_obstacles = num_obstacles
        self.seed = seed
        self.dirty_cells = dirty_cells
        self.width = width
        self.height = height

        self.grid = OrthogonalMooreGrid([width, height], torus=False)

        # Limpiamos las listas globales al iniciar el modelo
        dirty_agents.clear()
        charging_station.clear()

        # Seleccionamos posiciones aleatorias para cada agente
        estaciones_carga = self.random.choices(self.grid.empties.cells, k=self.num_agents)

        # Creamos una estación de carga en cada posición inicial
        for cell in estaciones_carga:
            ChargingStation(self, cell=cell)

        ## Generamos obstaculos apartir de num of obstacles
        for i in range(self.num_obstacles):
            ObstacleAgent(self, cell=self.random.choices(self.grid.empties.cells)[0])

        # Generamos agentes de limpieza - cada uno inicia en su estación correspondiente
        RandomAgent.create_agents(
            self,
            self.num_agents,
            cell=estaciones_carga
        )

        # estaciones_carga = self.random.choices(self.grid.empties.cells, k=self.num_agents)
        # for cell in estaciones_carga:
        #     ChargingStation(self, cell=cell)

        for i in range(self.dirty_cells):
            # Agregamos dirty cells
            DirtyAgent(self, cell=self.random.choices(self.grid.empties.cells)[0])

        # Guardamos el número inicial de celdas sucias para calcular porcentaje
        self.initial_dirty_cells = self.dirty_cells

        # DataCollector para estadísticas
        self.datacollector = DataCollector(
            model_reporters={
                "Dirty Cells %": lambda m: (len(dirty_agents) / m.initial_dirty_cells * 100) if m.initial_dirty_cells > 0 else 0,
                "Avg Battery %": lambda m: self._get_avg_battery(m),
                "Active Agents": lambda m: self._get_active_agents(m),
            }
        )

        self.running = True

    def _get_avg_battery(self, model):
        """Calcula la batería promedio de los agentes activos"""
        agents = [a for a in model.agents if isinstance(a, RandomAgent) and not a.is_dead]
        if len(agents) == 0:
            return 0
        return sum(a.battery for a in agents) / len(agents)

    def _get_active_agents(self, model):
        """Cuenta los agentes que siguen activos (no muertos)"""
        return len([a for a in model.agents if isinstance(a, RandomAgent) and not a.is_dead])

    def step(self):
        '''Advance the model by one step.'''
        self.datacollector.collect(self)
        self.agents.shuffle_do("step")
