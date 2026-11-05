import api from './api';
import { API_ENDPOINTS } from '../constants/config';

export const machineService = {
  // Get all machines with optional filters (search, category, etc.)
  getAllMachines: async () => {
    return await api.get(API_ENDPOINTS.MACHINES_FETCH_ALL);
  },

  // Get machine details by ID
  getMachineById: async (id) => {
    return await api.get(API_ENDPOINTS.MACHINES_DETAIL(id));
  },

  // Get machines by category (tractor, harvester, drone, etc.)
  getMachinesByCategory: async (category) => {
    return await api.get(API_ENDPOINTS.MACHINES_BY_TYPE(category));
  },

  // Get logged-in user's fleet
  getMyFleet: async () => {
    return await api.get(API_ENDPOINTS.MACHINES_MY_FLEET);
  },

  // Add new machine
  addMachine: async (machineData) => {
    return await api.post(API_ENDPOINTS.MACHINES_ADD, machineData);
  },

  // Update existing machine
  updateMachine: async (id, machineData) => {
    return await api.put(API_ENDPOINTS.MACHINES_UPDATE(id), machineData);
  },

  // Delete machine
  deleteMachine: async (id) => {
    return await api.delete(API_ENDPOINTS.MACHINES_DELETE(id));
  },

  // Get machine tasks/services
  getServices: async (machineId) => {
    return await api.get(API_ENDPOINTS.MACHINE_SERVICES(machineId));
  },

  // Add a task/service to machine
  addService: async (machineId, serviceData) => {
    return await api.post(API_ENDPOINTS.MACHINE_SERVICES(machineId), serviceData);
  },

  // Update task/service
  updateService: async (machineId, serviceId, serviceData) => {
    return await api.put(`${API_ENDPOINTS.MACHINE_SERVICES(machineId)}/${serviceId}`, serviceData);
  },

  // Delete task/service
  deleteService: async (machineId, serviceId) => {
    return await api.delete(`${API_ENDPOINTS.MACHINE_SERVICES(machineId)}/${serviceId}`);
  },
};

export default machineService;

