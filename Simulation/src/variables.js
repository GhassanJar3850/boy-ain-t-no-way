export const WeightParachuter = window.prompt('Please enter the Parachuter Wight:');


// initial
export let initial_Humidity_ratio = 0; // between 0 and 1
export let initial_mass = WeightParachuter; 
export let initial_Altitude = 2200;
export let initial_Area_of_the_body_Phase1 = 0.5; // m^2
export let initial_Drag_Coefficient_Phase1 = 0.7; 
export let initial_Area_of_the_body_Phase2 = 3.5; // m^2
export let initial_Drag_Coefficient_Phase2 = 1.5;

// Simulation Speed:
export const SimulationSpeed = 0.00003