# FixedAgent: Immobile agents permanently fixed to cells
from mesa.discrete_space import FixedAgent

class Cell(FixedAgent):
    """Represents a single ALIVE or DEAD cell in the simulation."""

    DEAD = 0
    ALIVE = 1

    @property
    def x(self):
        return self.cell.coordinate[0]

    @property
    def y(self):
        return self.cell.coordinate[1]

    @property
    def is_alive(self):
        return self.state == self.ALIVE

    @property
    def neighbors(self):
        return self.cell.neighborhood.agents
    
    def __init__(self, model, cell, init_state=DEAD):
        """Create a cell, in the given state, at the given x, y position."""
        super().__init__(model)
        self.cell = cell
        self.pos = cell.coordinate
        self.state = init_state
        self._next_state = None

    def determine_state(self):
        """Compute if the cell will be dead or alive at the next tick.  This is
        based on the number of alive or dead neighbors.  The state is not
        changed here, but is just computed and stored in self._nextState,
        because our current state may still be necessary for our neighbors
        to calculate their next state.
        """
        # Get the neighbors and apply the rules on whether to be alive or dead
        # at the next tick.
        # live_neighbors = sum(neighbor.is_alive for neighbor in self.neighbors)

        
        alive = ["110", "100", "011","001"] ### Creamos lista con todos los estados que determinan que la celula esta ALIVE
        
        info = [n.state for n in self.neighbors] ### Hacemos una lista de solo los 8 estados de los neighbors
        state = "" ## Inicializamos string vacio para crear el estado determinante

        state += str(info[2]) ## Sumamos el primer estado del string de la posición de la cordenada 2,2
        state += str(info[4]) ## Sumamos el primer estado del string de la posición de la cordenada 2,4
        state += str(info[7]) ## Sumamos el primer estado del string de la posición de la cordenada 2,7

        
        self._next_state = self.state

        ### Si la row es igual a la row que pasa el contador se añade en la fila
        
        if state in alive:
            self._next_state = self.ALIVE
            # print("Final state: 1")
        else:
            self._next_state = self.DEAD
            # print("Final state: 0")}



    def assume_state(self):
        """Set the state to the new computed state -- computed in step()."""
        self.state = self._next_state
