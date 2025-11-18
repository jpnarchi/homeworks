from mesa.discrete_space import CellAgent, FixedAgent
import math
import random

dirty_agents = []
charging_station = []


class RandomAgent(CellAgent):
    """
    Agent that moves randomly.
    Attributes:
        unique_id: Agent's ID
    """
    def __init__(self, model, cell):
        """
        Creates a new random agent.
        Args:
            model: Model reference for the agent
            cell: Reference to its position within the grid
        """
        super().__init__(model)
        self.cell = cell
        self.battery = 100
        self.charging = False

    def remove_agent(self, agent: CellAgent) -> None:
            """Usamos esto para quitar los agentes de las celdas si usamos la función se quita la cell de la lista dirty_cells
            """
            self._agents.remove(agent)
            self.empty = self.is_empty

    def calculateShortestDistance(self, neighborhood):
         """usamos la lista global de dirty cells para identificar la ruta más rápida usando la current position de nuestra cell 
         esto regresa la mejor coordenada dentro del neighborhood para movernos"""
         cells_list = list(neighborhood)

        ## Esto calcula la distancia en un plano euclidiano es una formula que saque de internet
         distancia_mas_corta = math.sqrt(
            (cells_list[0].coordinate[0] - dirty_agents[0].coordinate[0])**2 +
            (cells_list[0].coordinate[1] - dirty_agents[0].coordinate[1])**2
        )
         coordinate_to_move = cells_list[0]

        ## iteramos sobre nuestro neighborhood para encontrar la distancia más cercana e iteramos sobre cada dirty_cell para poder ver cual es la más cercana y comparar ambas

        ## algortimo nearest neighbor search:
         for cell_n in cells_list:
            for cell in dirty_agents:
                distancia_medida = math.sqrt(
                    (cell_n.coordinate[0] - cell.coordinate[0])**2 +
                    (cell_n.coordinate[1] - cell.coordinate[1])**2
                )
                if distancia_medida < distancia_mas_corta:
                    distancia_mas_corta = distancia_medida
                    coordinate_to_move = cell_n

         return coordinate_to_move ## regresamos la coordenada más cercana a la dirty cell

    
    def calculateChargingStationPath(self, neighborhood):
        """Reciclamos funcion, usamos la lista global de charging stations cells para identificar la ruta más rápida usando la current position de nuestra cell"""
        cells_list = list(neighborhood)
        
        ## Esto calcula la distancia en un plano euclidiano 
        distancia_mas_corta = math.sqrt(
            (cells_list[0].coordinate[0] - charging_station[0].coordinate[0])**2 + 
            (cells_list[0].coordinate[1] - charging_station[0].coordinate[1])**2
        )
        coordinate_to_move = cells_list[0]
        
        
        ## iteramos sobre nuestro neighborhood para encontrar la distancia más cercana e iteramos sobre cada charging_station para poder ver cual es la más cercana y comparar ambas

        ## algortimo nearest neighbor search:
        for cell_n in cells_list:
            for cell in charging_station:
                distancia_medida = math.sqrt(
                    (cell_n.coordinate[0] - cell.coordinate[0])**2 + 
                    (cell_n.coordinate[1] - cell.coordinate[1])**2
                )
                if distancia_medida < distancia_mas_corta:
                    distancia_mas_corta = distancia_medida
                    coordinate_to_move = cell_n

        if distancia_mas_corta == 1:
            self.charging = True
            return charging_station[-1] ## Si la distancia es igual a 1 significa que estamos a una celda entonces ponemos por default la coordenada (2,2) esto yo lo decidi podrías hacer un random para que no siempre use la misma celda de carga pero para que?
        else:
            return coordinate_to_move # Regresamos siempre coordenadas
    
    def move(self):
        """
        Determines the next empty cell in its neighborhood, and moves to it
        """
        neighbors = list(cell for cell in self.cell.neighborhood)
        dirty_cell = None
        dirty_agent_to_remove = None
        next_moves = self.cell.neighborhood.select(lambda cell: cell.is_empty)  
        
        # Buscar dirty cells en los neighbors
        for n in neighbors:
            agents_in_cell = [type(agent).__name__ for agent in n.agents]
            if "DirtyAgent" in agents_in_cell:
                dirty_cell = n
                for agent in n.agents:
                    if type(agent).__name__ == "DirtyAgent":
                        dirty_agent_to_remove = agent
                        break
                break
        

        
        # Si está en la estación de carga y batería < 100, seguir cargando
        if self.battery <= 0:
            print("Murio agent :(")
            self.remove()
            self.model.running = False
        elif self.charging and self.battery < 100:
            self.battery = min(self.battery + 5, 100)  # No exceder 100
            
            # Si llega a 100 porciento desactivamos el modo de carga
            if self.battery >= 100:
                self.charging = False
            return  # ## hacemos nada si se esra cargandi
        
        # Si batería < 50 y no se esta cargando vamos a estacion
        if self.battery < 50 and not self.charging:
            charging_cell = self.calculateChargingStationPath(next_moves)
            
            if charging_cell.coordinate == (2, 2):  # ####Esta cordenada es ka cordenada default donde todos los agentes se cargan
                print(f"Llegó a estación de carga con {self.battery}% batería")
                self.move_to(charging_cell)
                self.charging = True  ##### Activamos el modo carga
                self.battery = min(self.battery + 5, 100)
            else:
                self.move_to(charging_cell)
                self.battery -= 1
        
        ##### Modo para buscar y limpiar dirty cells
        elif not self.charging:
            if dirty_cell is not None:
                self.move_to(dirty_cell)
                dirty_agent_to_remove.remove()
                if dirty_cell in dirty_agents:
                    dirty_agents.remove(dirty_cell)
                self.battery -= 1
            else:
                if len(dirty_agents) == 0:
                    self.model.running = False
                else:
                    next_cell = self.calculateShortestDistance(next_moves)
                    if next_cell is not None:
                        self.move_to(next_cell)
                        self.battery -= 1

        
    def step(self):
        """
        Determines the new direction it will take, and then moves
        """
        self.move()

class DirtyAgent(CellAgent):
    """
    Obstacle agent. Just to add obstacles to the grid.
    """
    def __init__(self, model, cell):
        super().__init__(model)
        self.cell=cell
        dirty_agents.append(self.cell) ## Agregamos cada dirty cell a la lista global

    def step(self):
        pass


class ChargingStation(CellAgent):
    """
    Obstacle agent. Just to add obstacles to the grid.
    """
    def __init__(self, model, cell):
        super().__init__(model)
        self.cell=cell
        charging_station.append(self.cell)
        

    def step(self):
        pass
        


class ObstacleAgent(FixedAgent):
    """
    Obstacle agent. Just to add obstacles to the grid.
    """
    def __init__(self, model, cell):
        super().__init__(model)
        self.cell=cell

    def step(self):
        pass