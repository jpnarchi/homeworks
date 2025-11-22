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
        self.my_charging_station = cell  # Guardamos la posición inicial como nuestra estación
        self.known_charging_stations = [cell]  # Lista de estaciones descubiertas
        self.is_dead = False  # Estado para saber si el agente murió
        self.visited_cells = set()  # Memoria de celdas visitadas
        self.visited_cells.add(cell.coordinate)  # Agregamos la celda inicial

    def remove_agent(self, agent: CellAgent) -> None:
            """Usamos esto para quitar los agentes de las celdas si usamos la función se quita la cell de la lista dirty_cells
            """
            self._agents.remove(agent)
            self.empty = self.is_empty

    def explore_smart(self, neighborhood):
        """Explora el ambiente priorizando celdas no visitadas"""
        cells_list = list(neighborhood)

        if len(cells_list) == 0:
            return None

        # Filtrar celdas no visitadas
        unvisited = [cell for cell in cells_list if cell.coordinate not in self.visited_cells]

        if unvisited:
            # Priorizar celdas no visitadas
            chosen = random.choice(unvisited)
        else:
            # Si todas están visitadas, elegir aleatoriamente
            chosen = random.choice(cells_list)

        # Marcar la celda como visitada
        self.visited_cells.add(chosen.coordinate)
        return chosen

    def discover_charging_stations(self):
        """Detecta estaciones de carga en el vecindario y las añade a la memoria"""
        neighbors = list(self.cell.neighborhood)

        for n in neighbors:
            agents_in_cell = [type(agent).__name__ for agent in n.agents]
            if "ChargingStation" in agents_in_cell:
                # Si encontramos una estación y no la conocemos, la añadimos
                if n not in self.known_charging_stations:
                    self.known_charging_stations.append(n)
                    print(f"¡Agente descubrió nueva estación en {n.coordinate}!")


    def calculateChargingStationPath(self, neighborhood):
        """Calcula la ruta más rápida hacia la estación de carga más cercana que conozca"""
        cells_list = list(neighborhood)

        if len(cells_list) == 0:
            return None

        # Encontrar la estación conocida más cercana a nuestra posición actual
        closest_station = self.known_charging_stations[0]
        min_distance_to_station = math.sqrt(
            (self.cell.coordinate[0] - closest_station.coordinate[0])**2 +
            (self.cell.coordinate[1] - closest_station.coordinate[1])**2
        )

        for station in self.known_charging_stations:
            distance = math.sqrt(
                (self.cell.coordinate[0] - station.coordinate[0])**2 +
                (self.cell.coordinate[1] - station.coordinate[1])**2
            )
            if distance < min_distance_to_station:
                min_distance_to_station = distance
                closest_station = station

        # Ahora encontramos la celda en nuestro vecindario que nos acerque más a esa estación
        distancia_mas_corta = math.sqrt(
            (cells_list[0].coordinate[0] - closest_station.coordinate[0])**2 +
            (cells_list[0].coordinate[1] - closest_station.coordinate[1])**2
        )
        coordinate_to_move = cells_list[0]

        for cell_n in cells_list:
            distancia_medida = math.sqrt(
                (cell_n.coordinate[0] - closest_station.coordinate[0])**2 +
                (cell_n.coordinate[1] - closest_station.coordinate[1])**2
            )
            if distancia_medida < distancia_mas_corta:
                distancia_mas_corta = distancia_medida
                coordinate_to_move = cell_n

        return coordinate_to_move
    
    def move(self):
        """
        Determines the next empty cell in its neighborhood, and moves to it
        """
        neighbors = list(cell for cell in self.cell.neighborhood)
        dirty_cell = None
        dirty_agent_to_remove = None

        # Descubrir estaciones de carga en el vecindario
        self.discover_charging_stations()

        # Permitir moverse a celdas vacías O a cualquier estación de carga conocida
        def can_move_to(cell):
            if cell.is_empty:
                return True
            # Permitir moverse a cualquier estación de carga conocida
            for station in self.known_charging_stations:
                if cell.coordinate == station.coordinate:
                    return True
            return False

        next_moves = self.cell.neighborhood.select(can_move_to)  
        
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
        

        
        # Si el agente está muerto, no hacer nada
        if self.is_dead:
            return

        # Si la batería llega a 0, el agente muere
        if self.battery <= 0:
            print(f"¡Agente murió en posición {self.cell.coordinate}! :(")
            self.is_dead = True
            return

        # Si está en la estación de carga y batería < 100, seguir cargando
        if self.charging and self.battery < 100:
            self.battery = min(self.battery + 5, 100)  # No exceder 100
            
            # Si llega a 100 porciento desactivamos el modo de carga
            if self.battery >= 100:
                self.charging = False
            return  # ## hacemos nada si se esra cargandi
        
        # Si batería < 40 y no se esta cargando vamos a estacion
        elif self.battery < 40 and not self.charging:
            charging_cell = self.calculateChargingStationPath(next_moves)
            print(f"Agente con {self.battery}% batería moviéndose hacia una estación conocida")
            print(f"Posición actual: {self.cell.coordinate}, Próximo paso: {charging_cell.coordinate}")

            # Verificar si llegamos a cualquier estación conocida
            is_at_station = False
            for station in self.known_charging_stations:
                if charging_cell.coordinate == station.coordinate:
                    is_at_station = True
                    break

            if is_at_station:
                print(f"¡Llegó a una estación de carga con {self.battery}% batería!")
                self.move_to(charging_cell)
                self.charging = True  # Activamos el modo carga
                self.battery = min(self.battery + 5, 100)
            else:
                # Nos movemos hacia la estación más cercana conocida
                self.move_to(charging_cell)
                self.battery -= 1
        
        ##### Modo para buscar y limpiar dirty cells
        elif not self.charging:
            if dirty_cell is not None:
                # Si encontramos una celda sucia en el vecindario, la limpiamos
                self.move_to(dirty_cell)
                dirty_agent_to_remove.remove()
                if dirty_cell in dirty_agents:
                    dirty_agents.remove(dirty_cell)
                self.battery -= 1
            else:
                # Exploración aleatoria del ambiente
                if len(dirty_agents) == 0:
                    self.model.running = False
                else:
                    next_cell = self.explore_smart(next_moves)
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
        print(charging_station)
        

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