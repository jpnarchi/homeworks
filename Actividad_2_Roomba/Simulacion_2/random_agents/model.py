from mesa import Model
from mesa.discrete_space import OrthogonalMooreGrid

from .agent import RandomAgent, ObstacleAgent, DirtyAgent, ChargingStation, dirty_agents

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

        # Limpiamos la lista global de dirty_agents al iniciar el modelo para crear los nuevos random
        dirty_agents.clear()

        border = [(x,y) ## Reciclamos código pero lo adaptamos para la estación de carga de abajo a la izquierda
                  for y in range(3)
                  for x in range(3)
                  if y in [2, height] or x in [2, width]]

        border2 = [(x,y)
                  for y in range(2)
                  for x in range(2)
                  if y in [1, height] or x in [1, width]]

        border.append((0,0))  # Agregamos casilla faltante de ambas listas
        
        
        # Creamos la estación de carga
        for _, cell in enumerate(self.grid):
            if cell.coordinate in border+border2: ## Usamos ambas listas
                ChargingStation(self, cell=cell)
            

        estaciones_carga = self.random.choices(self.grid.empties.cells, k=self.num_agents)
        ## Generamos obstaculos apartir de num of obstacles
        for i in range(self.num_obstacles):
            ObstacleAgent(self, cell=self.random.choices(self.grid.empties.cells)[0])


        # Generamos agentes de limpieza
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
        
    
        self.running = True

    def step(self):
        '''Advance the model by one step.'''
        self.agents.shuffle_do("step")
