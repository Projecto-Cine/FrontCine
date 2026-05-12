import { workersService } from './workersService';

export const employeesService = {
  getAll:  workersService.getAll,
  getById: workersService.getById,
  create:  workersService.create,
  update:  workersService.update,
  remove:  workersService.remove,
};
