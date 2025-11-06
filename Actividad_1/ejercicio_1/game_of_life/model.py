from mesa import Model
from mesa.discrete_space import OrthogonalMooreGrid
from .agent import Cell


class ConwaysGameOfLife(Model):
    """Represents the 2-dimensional array of cells in Conway's Game of Life."""

    def __init__(self, width=50, height=50, initial_fraction_alive=0.2, seed=None):
        """Create a new playing area of (width, height) cells."""
        super().__init__(seed=seed)

        """Grid where cells are connected to their 8 neighbors.

        Example for two dimensions:
        directions = [
            (-1, -1), (-1, 0), (-1, 1),
            ( 0, -1),          ( 0, 1),
            ( 1, -1), ( 1, 0), ( 1, 1),
        ]
        """
        self.counter_row = 49
        self.grid = OrthogonalMooreGrid((width, height), capacity=1, torus=True)
        
 

        # Place a cell at each location, with some initialized to
        # ALIVE and some to DEAD.

        for i, cell in enumerate(self.grid.all_cells):
            if (i + 1) % 50 == 0: ### Detectamos si la row es la primera para crear las celulas solo ahi
                Cell(
                    self,
                    cell,
                    init_state=(
                        Cell.ALIVE
                        if self.random.random() < initial_fraction_alive
                        else Cell.DEAD
                    ),
                )
            else: ## si no es la primera fila todas las celulas las ponemos DEAD
                Cell(
                    self,
                    cell,
                    init_state=(
                        Cell.DEAD
                    ),
                )

            

        self.running = True

    
    def step(self):
        """Perform the model step in two stages:

        - First, all cells assume their next state (whether they will be dead or alive)
        - Then, all cells change state to their next state.
        """
        self.counter_row -= 1
        self.agents.do("determine_state", self.counter_row) ## Creamos contador para ir cambiado de row al poner set element
        self.agents.do("assume_state")
        # print(next(iter(self.grid.all_cells)).agents[0].state)
